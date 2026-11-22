// Vercel Serverless Function — ElevyPay payment status
function send(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(body));
}
export default async function handler(req, res) {
  if (req.method !== "GET") return send(res, 405, { success: false, message: "Método não permitido." });
  const apiKey = process.env.ELEVYPAY_API_KEY || process.env.ELEVYPAY_SECRET_KEY;
  const id = String(req.query?.paymentId || req.query?.id || "").trim();
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
    return send(res, 200, { ...data, status: rawStatus, paid });
  } catch (error) {
    console.error("ElevyPay status request error", error);
    return send(res, 502, { success: false, message: "Falha ao consultar a ElevyPay." });
  }
}
