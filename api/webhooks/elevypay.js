// ElevyPay webhook receiver. A confirmed status is rechecked against ElevyPay
// before sending TikTok Purchase, using the same event_id as the browser flow.
import { reportTikTokPurchase } from "../status-pix.js";

function send(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(body));
}

function findValue(value, keys, depth = 0) {
  if (!value || typeof value !== "object" || depth > 5) return "";
  for (const key of keys) {
    if (value[key] !== undefined && value[key] !== null && value[key] !== "") return value[key];
  }
  for (const key of ["data", "transaction", "payment", "payload", "customer"]) {
    const found = findValue(value[key], keys, depth + 1);
    if (found !== "") return found;
  }
  return "";
}

function normalizeAmount(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) return 0;
  // ElevyPay may return the amount in cents; checkout amounts are in BRL.
  return amount > 500 ? amount / 100 : amount;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return send(res, 405, { received: false, message: "Método não permitido." });
  }

  let body = req.body || {};
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) body = {};

  const id = String(findValue(body, [
    "transaction_id", "transactionId", "payment_id", "paymentId", "external_id", "externalId", "id"
  ]) || "").trim();

  if (!id) {
    console.warn("ElevyPay webhook received without transaction identifier.");
    return send(res, 400, { received: false, message: "Identificador da transação ausente." });
  }

  const apiKey = process.env.ELEVYPAY_API_KEY || process.env.ELEVYPAY_SECRET_KEY;
  if (!apiKey) {
    console.error("ElevyPay webhook cannot verify payment: ELEVYPAY_API_KEY is missing.");
    return send(res, 500, { received: false, message: "Webhook sem configuração da API ElevyPay." });
  }

  try {
    const response = await fetch(
      "https://app.elevypay.com/api/v1/check_status.php?id=" + encodeURIComponent(id),
      { headers: { "X-API-Key": apiKey }, cache: "no-store" }
    );
    const statusData = await response.json().catch(() => ({}));
    if (!response.ok) {
      console.error("ElevyPay webhook status verification failed", {
        transactionId: id, httpStatus: response.status
      });
      return send(res, 502, { received: false, message: "Não foi possível validar a transação na ElevyPay." });
    }

    const root = statusData.data || statusData.transaction || statusData.payment || statusData;
    const rawStatus = String(
      root.status || root.payment_status || root.paymentStatus ||
      statusData.status || statusData.payment_status || ""
    ).toUpperCase();
    const approved = root.paid === true || statusData.paid === true ||
      ["APPROVED", "PAID", "COMPLETED", "CONFIRMED", "SUCCESS", "SUCCEEDED"].includes(rawStatus);

    if (!approved) {
      console.log("ElevyPay webhook received; payment not approved.", { transactionId: id, status: rawStatus || "unknown" });
      return send(res, 200, { received: true, approved: false, status: rawStatus || "unknown" });
    }

    const email = String(
      findValue(body, ["email"]) || findValue(statusData, ["email"]) || ""
    ).trim().toLowerCase();
    const amountValue =
      findValue(statusData, ["amount", "total", "value"]) ||
      findValue(body, ["amount", "total", "value"]);
    const amount = normalizeAmount(amountValue);

    if (!email || !amount) {
      console.error("ElevyPay payment approved, but Purchase data is incomplete.", {
        transactionId: id, hasEmail: Boolean(email), hasAmount: Boolean(amount)
      });
      return send(res, 200, { received: true, approved: true, purchaseSent: false, reason: "Dados de email/valor ausentes." });
    }

    const purchaseSent = await reportTikTokPurchase({
      req: { headers: req.headers, query: {}, body: { ttclid: findValue(body, ["ttclid"]) } },
      paymentId: id,
      email,
      amount
    });

    console.log("ElevyPay approved payment processed.", {
      transactionId: id, purchaseSent
    });
    return send(res, 200, { received: true, approved: true, purchaseSent });
  } catch (error) {
    console.error("ElevyPay webhook processing failed", error);
    return send(res, 500, { received: false, message: "Falha ao processar webhook." });
  }
}
