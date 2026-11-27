// ElevyPay webhook receiver — verifies approved payments before sending TikTok Purchase.
import { reportTikTokPurchase } from "../status-pix.js";

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

  const id = String(firstValueDeep(body, [
    "transaction_id", "transactionId", "payment_id", "paymentId",
    "external_id", "externalId", "id"
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
      console.error("ElevyPay webhook verification failed.", { transactionId: id, httpStatus: response.status });
      return send(res, 502, { received: false, message: "Não foi possível validar a transação na ElevyPay." });
    }

    const rawStatus = String(firstValueDeep(statusData, ["status", "payment_status", "paymentStatus"]) || "").toUpperCase();
    const paidValue = firstValueDeep(statusData, ["paid", "is_paid", "isPaid"]);
    const approved = paidValue === true || String(paidValue).toLowerCase() === "true" ||
      ["APPROVED", "PAID", "COMPLETED", "CONFIRMED", "SUCCESS", "SUCCEEDED"].includes(rawStatus);

    if (!approved) {
      console.log("ElevyPay webhook received; payment not approved.", { transactionId: id, status: rawStatus || "unknown" });
      return send(res, 200, { received: true, approved: false, status: rawStatus || "unknown" });
    }

    const email = String(
      firstValueDeep(body, ["email", "customer_email", "customerEmail"]) ||
      firstValueDeep(statusData, ["email", "customer_email", "customerEmail"]) || ""
    ).trim().toLowerCase();
    const amountInput =
      firstValueDeep(statusData, ["amount", "total", "value", "amount_cents", "amountCents"]) ||
      firstValueDeep(body, ["amount", "total", "value", "amount_cents", "amountCents"]);
    const amount = normalizeAmount(amountInput);

    if (!email || !amount) {
      console.error("ElevyPay approved payment has incomplete Purchase data.", {
        transactionId: id, hasEmail: Boolean(email), normalizedAmount: amount
      });
      return send(res, 200, {
        received: true, approved: true, purchaseSent: false,
        reason: "Dados de e-mail ou valor ausentes na consulta da transação."
      });
    }

    const purchaseSent = await reportTikTokPurchase({
      req: {
        headers: req.headers,
        query: {},
        body: { ttclid: firstValueDeep(body, ["ttclid"]) }
      },
      paymentId: id, email, amount
    });

    console.log("ElevyPay approved payment processed.", {
      transactionId: id, purchaseSent, amount
    });
    return send(res, 200, { received: true, approved: true, purchaseSent });
  } catch (error) {
    console.error("ElevyPay webhook processing failed.", error);
    return send(res, 500, { received: false, message: "Falha ao processar webhook." });
  }
}
