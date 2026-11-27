// Vercel Serverless Function — ElevyPay payment status + TikTok Events API
import { createHash } from "node:crypto";

const TIKTOK_PIXEL_ID = "DBKG3UJC77U24SKT8ADG";
const sentPurchaseEvents = new Set();
const pendingPurchaseEvents = new Map();

function send(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(body));
}

function firstValueDeep(value, keys, depth = 0) {
  if (!value || typeof value !== "object" || depth > 8) return "";
  for (const key of keys) {
    const candidate = value[key];
    if (candidate !== undefined && candidate !== null && candidate !== "") {
      if (typeof candidate !== "object") return candidate;
    }
  }
  for (const child of Object.values(value)) {
    const found = firstValueDeep(child, keys, depth + 1);
    if (found !== "") return found;
  }
  return "";
}

function normalizeAmount(value) {
  if (typeof value === "string") value = value.replace(",", ".");
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) return 0;
  // Values above 500 are treated as cents, as used by the ElevyPay API.
  return amount > 500 ? amount / 100 : amount;
}

function sha256(value) {
  return createHash("sha256").update(String(value).trim().toLowerCase()).digest("hex");
}

function getCookie(req, name) {
  const cookieHeader = String(req.headers?.cookie || "");
  const pair = cookieHeader.split(";").map((part) => part.trim()).find((part) => part.startsWith(name + "="));
  if (!pair) return "";
  try { return decodeURIComponent(pair.slice(name.length + 1)); } catch { return pair.slice(name.length + 1); }
}

export async function reportTikTokPurchase({ req, paymentId, email, amount }) {
  const accessToken = process.env.TIKTOK_ACCESS_TOKEN;
  if (!accessToken) {
    console.error("TikTok Purchase not sent: TIKTOK_ACCESS_TOKEN is missing.");
    return false;
  }

  const normalizedEmail = String(email || "").trim().toLowerCase();
  const numericAmount = normalizeAmount(amount);
  if (!paymentId || !/^\S+@\S+\.\S+$/.test(normalizedEmail) || !Number.isFinite(numericAmount) || numericAmount <= 0) {
    console.error("TikTok Purchase not sent: invalid payment data.", {
      hasPaymentId: Boolean(paymentId), hasEmail: Boolean(normalizedEmail), amountValid: numericAmount > 0
    });
    return false;
  }

  const eventId = "dynastia_purchase_" + String(paymentId);
  if (sentPurchaseEvents.has(eventId)) return true;
  if (pendingPurchaseEvents.has(eventId)) return pendingPurchaseEvents.get(eventId);

  const task = (async () => {
    const forwardedFor = String(req.headers?.["x-forwarded-for"] || "");
    const ip = forwardedFor.split(",")[0].trim() || String(req.headers?.["x-real-ip"] || "");
    const userAgent = String(req.headers?.["user-agent"] || "");
    const ttp = getCookie(req, "_ttp");
    const ttclid = String(req.query?.ttclid || req.body?.ttclid || "");
    const pageUrl = String(req.headers?.referer || "https://kingdombuxs.shop/");

    const payload = {
      event_source: "web",
      event_source_id: TIKTOK_PIXEL_ID,
      data: [{
        event: "Purchase",
        event_time: Math.floor(Date.now() / 1000),
        event_id: eventId,
        user: {
          email: sha256(normalizedEmail),
          ...(ip ? { ip } : {}),
          ...(userAgent ? { user_agent: userAgent } : {}),
          ...(ttp ? { ttp } : {}),
          ...(ttclid ? { ttclid } : {})
        },
        properties: {
          currency: "BRL",
          value: Number(numericAmount.toFixed(2)),
          order_id: String(paymentId)
        },
        page: { url: pageUrl }
      }]
    };

    let response;
    let result = {};
    try {
      response = await fetch("https://business-api.tiktok.com/open_api/v1.3/event/track/", {
        method: "POST",
        headers: { "Access-Token": accessToken, "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      result = await response.json().catch(() => ({}));
    } catch (error) {
      console.error("TikTok Events API Purchase network error.", {
        paymentId, message: error instanceof Error ? error.message : String(error)
      });
      return false;
    }

    if (!response.ok || result.code !== 0) {
      console.error("TikTok Events API Purchase rejected.", {
        httpStatus: response.status, code: result.code, message: result.message, paymentId
      });
      return false;
    }

    sentPurchaseEvents.add(eventId);
    console.log("TikTok Purchase accepted.", {
      paymentId, eventId, value: Number(numericAmount.toFixed(2)), pixelId: TIKTOK_PIXEL_ID,
      requestId: result.request_id
    });
    return true;
  })();

  pendingPurchaseEvents.set(eventId, task);
  try { return await task; }
  finally { pendingPurchaseEvents.delete(eventId); }
}

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") {
    return send(res, 405, { success: false, message: "Método não permitido." });
  }

  let body = req.body || {};
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) body = {};

  const apiKey = process.env.ELEVYPAY_API_KEY || process.env.ELEVYPAY_SECRET_KEY;
  const id = String(req.method === "POST"
    ? (body.paymentId || body.payment_id || body.transactionId || body.transaction_id || body.id || "")
    : (req.query?.paymentId || req.query?.payment_id || req.query?.id || "")).trim();

  if (!apiKey) return send(res, 500, { success: false, message: "Configure ELEVYPAY_API_KEY na Vercel." });
  if (!id) return send(res, 400, { success: false, message: "Identificador da transação ausente." });

  try {
    const upstream = await fetch("https://app.elevypay.com/api/v1/check_status.php?id=" + encodeURIComponent(id), {
      headers: { "X-API-Key": apiKey }, cache: "no-store"
    });
    const data = await upstream.json().catch(() => ({}));
    if (!upstream.ok) {
      console.error("ElevyPay status lookup failed.", { paymentId: id, httpStatus: upstream.status });
      return send(res, upstream.status, { success: false, message: data.message || "Não foi possível consultar o pagamento." });
    }

    const rawStatus = String(firstValueDeep(data, ["status", "payment_status", "paymentStatus"]) || "").toUpperCase();
    const paidValue = firstValueDeep(data, ["paid", "is_paid", "isPaid"]);
    const paid = paidValue === true || String(paidValue).toLowerCase() === "true" ||
      ["PAID", "APPROVED", "COMPLETED", "CONFIRMED", "SUCCESS", "SUCCEEDED"].includes(rawStatus);

    let purchaseEventSent = false;
    if (paid && req.method === "POST") {
      const email = String(body.email || firstValueDeep(data, ["email", "customer_email", "customerEmail"]) || "").trim().toLowerCase();
      const amountInput = body.amount ?? firstValueDeep(data, ["amount", "total", "value", "amount_cents", "amountCents"]);
      const amount = normalizeAmount(amountInput);
      purchaseEventSent = await reportTikTokPurchase({
        req: { headers: req.headers, query: req.query || {}, body },
        paymentId: id, email, amount
      });
      if (!purchaseEventSent) {
        console.error("Approved payment did not produce a TikTok Purchase.", {
          paymentId: id, hasEmail: Boolean(email), normalizedAmount: amount
        });
      }
    }

    return send(res, 200, { ...data, status: rawStatus, paid, purchaseEventSent });
  } catch (error) {
    console.error("ElevyPay status request error.", error);
    return send(res, 502, { success: false, message: "Falha ao consultar a ElevyPay." });
  }
}
