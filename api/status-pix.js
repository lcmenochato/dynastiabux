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

function sha256(value) {
  return createHash("sha256").update(String(value).trim().toLowerCase()).digest("hex");
}

function getCookie(req, name) {
  const cookieHeader = String(req.headers?.cookie || "");
  const pair = cookieHeader.split(";").map((part) => part.trim()).find((part) => part.startsWith(name + "="));
  return pair ? decodeURIComponent(pair.slice(name.length + 1)) : "";
}

async function reportTikTokPurchase({ req, paymentId, email, amount }) {
  const accessToken = process.env.TIKTOK_ACCESS_TOKEN;
  if (!accessToken) {
    console.warn("TikTok Purchase not sent: configure TIKTOK_ACCESS_TOKEN in Vercel.");
    return false;
  }
  const numericAmount = Number(amount);
  if (!email || !/^\S+@\S+\.\S+$/.test(email) || !Number.isFinite(numericAmount) || numericAmount <= 0) {
    console.warn("TikTok Purchase not sent: invalid email or amount.", { paymentId });
    return false;
  }

  const eventId = "dynastia_purchase_" + paymentId;
  if (sentPurchaseEvents.has(eventId)) return true;
  if (pendingPurchaseEvents.has(eventId)) return pendingPurchaseEvents.get(eventId);

  const task = (async () => {
    const forwardedFor = String(req.headers?.["x-forwarded-for"] || "");
    const ip = forwardedFor.split(",")[0].trim() || String(req.headers?.["x-real-ip"] || "");
    const userAgent = String(req.headers?.["user-agent"] || "");
    const ttp = getCookie(req, "_ttp");
    const ttclid = String(req.query?.ttclid || req.body?.ttclid || "");
    const pageUrl = String(req.headers?.referer || "https://dynastiabux.vercel.app/");

    const payload = {
      event_source: "web",
      event_source_id: TIKTOK_PIXEL_ID,
      data: [{
        event: "Purchase",
        event_time: Math.floor(Date.now() / 1000),
        event_id: eventId,
        user: {
          email: sha256(email),
          ...(ip ? { ip } : {}),
          ...(userAgent ? { user_agent: userAgent } : {}),
          ...(ttp ? { ttp } : {}),
          ...(ttclid ? { ttclid } : {})
        },
        properties: {
          currency: "BRL",
          value: Number(numericAmount.toFixed(2)),
          order_id: paymentId
        },
        page: { url: pageUrl }
      }]
    };

    const response = await fetch("https://business-api.tiktok.com/open_api/v1.3/event/track/", {
      method: "POST",
      headers: {
        "Access-Token": accessToken,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || result.code !== 0) {
      console.error("TikTok Events API Purchase failed", {
        httpStatus: response.status,
        code: result.code,
        message: result.message,
        paymentId
      });
      return false;
    }
    sentPurchaseEvents.add(eventId);
    console.log("TikTok Purchase accepted", { paymentId, eventId, requestId: result.request_id });
    return true;
  })();

  pendingPurchaseEvents.set(eventId, task);
  try {
    return await task;
  } finally {
    pendingPurchaseEvents.delete(eventId);
  }
}

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") return send(res, 405, { success: false, message: "Método não permitido." });

  const body = typeof req.body === "string" ? (() => { try { return JSON.parse(req.body); } catch { return {}; } })() : (req.body || {});
  const apiKey = process.env.ELEVYPAY_API_KEY || process.env.ELEVYPAY_SECRET_KEY;
  const id = String(req.method === "POST" ? (body.paymentId || body.id || "") : (req.query?.paymentId || req.query?.id || "")).trim();
  if (!apiKey) return send(res, 500, { success: false, message: "Configure ELEVYPAY_API_KEY na Vercel." });
  if (!id) return send(res, 400, { success: false, message: "Identificador da transação ausente." });

  try {
    const upstream = await fetch("https://app.elevypay.com/api/v1/check_status.php?id=" + encodeURIComponent(id), {
      headers: { "X-API-Key": apiKey },
      cache: "no-store"
    });
    const data = await upstream.json().catch(() => ({}));
    if (!upstream.ok) {
      console.error("ElevyPay status error", upstream.status, data);
      return send(res, upstream.status, { success: false, message: data.message || "Não foi possível consultar o pagamento." });
    }

    const root = data.data || data.transaction || data;
    const rawStatus = String(root.status || root.payment_status || root.paymentStatus || data.status || data.payment_status || "").toUpperCase();
    const paid = root.paid === true || data.paid === true || ["PAID","APPROVED","COMPLETED","CONFIRMED","SUCCESS","SUCCEEDED"].includes(rawStatus);

    let purchaseEventSent = false;
    if (paid && req.method === "POST") {
      const email = String(body.email || root.customer?.email || root.email || "").trim().toLowerCase();
      const amount = Number(body.amount ?? root.amount ?? root.total ?? data.amount);
      purchaseEventSent = await reportTikTokPurchase({ req, paymentId: id, email, amount });
    }

    return send(res, 200, { ...data, status: rawStatus, paid, purchaseEventSent });
  } catch (error) {
    console.error("ElevyPay status request error", error);
    return send(res, 502, { success: false, message: "Falha ao consultar a ElevyPay." });
  }
}
