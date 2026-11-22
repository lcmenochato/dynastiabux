// ElevyPay webhook receiver. Payment confirmation remains based on check_status.php.
function send(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
}
function findId(value, depth = 0) {
  if (!value || typeof value !== "object" || depth > 4) return "";
  for (const key of ["transaction_id","transactionId","payment_id","paymentId","id"]) {
    if (value[key] !== undefined && value[key] !== null) return String(value[key]);
  }
  for (const key of ["data","transaction","payment","payload"]) {
    const found = findId(value[key], depth + 1);
    if (found) return found;
  }
  return "";
}
export default async function handler(req, res) {
  if (req.method !== "POST") return send(res, 405, { received: false, message: "Método não permitido." });
  let body = req.body || {};
  if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = {}; } }
  const id = findId(body);
  if (id) {
    const apiKey = process.env.ELEVYPAY_API_KEY || process.env.ELEVYPAY_SECRET_KEY;
    if (apiKey) {
      try {
        const response = await fetch("https://app.elevypay.com/api/v1/check_status.php?id=" + encodeURIComponent(id), { headers: { "X-API-Key": apiKey }, cache: "no-store" });
        const status = await response.json().catch(() => ({}));
        console.log("ElevyPay webhook received; status rechecked", { transactionId: id, httpStatus: response.status, status: status.status || status.payment_status || status.data?.status || "unknown" });
      } catch (error) {
        console.error("ElevyPay webhook status recheck failed", error);
      }
    }
  } else {
    console.log("ElevyPay webhook received without recognized transaction id; payload keys:", Object.keys(body || {}));
  }
  return send(res, 200, { received: true });
}
