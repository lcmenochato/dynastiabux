// Vercel Serverless Function — ElevyPay PIX creation
const API_BASE = "https://app.elevypay.com";

function send(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(body));
}

export default async function handler(req, res) {
  if (req.method !== "POST") return send(res, 405, { success: false, message: "Método não permitido." });
  const apiKey = process.env.ELEVYPAY_API_KEY || process.env.ELEVYPAY_SECRET_KEY;
  const combinedCustomerData = process.env.ELEVYPAY_CUSTOMER_DATA || "";
  const combinedFields = Object.fromEntries(
    combinedCustomerData.split(";").map((part) => {
      const separator = part.indexOf("=");
      if (separator < 0) return ["", ""];
      return [part.slice(0, separator).trim().toUpperCase(), part.slice(separator + 1).trim()];
    }).filter(([key]) => key)
  );
  const document = process.env.ELEVYPAY_DOCUMENT || process.env.ELEVYPAY_CUSTOMER_DOCUMENT || combinedFields.CPF;
  const phone = process.env.ELEVYPAY_PHONE || process.env.ELEVYPAY_CUSTOMER_PHONE || combinedFields.PHONE;
  if (!apiKey || !document || !phone) {
    return send(res, 500, { success: false, message: "Configure ELEVYPAY_API_KEY e os dados ELEVYPAY_CUSTOMER_DATA (CPF e PHONE) na Vercel." });
  }
  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
    const amount = Math.round(Number(body.amount) * 100);
    const email = String(body.email || "").trim().toLowerCase();
    const username = String(body.username || "").trim();
    if (!Number.isFinite(amount) || amount < 100 || !/^\S+@\S+\.\S+$/.test(email) || !username) {
      return send(res, 400, { success: false, message: "Confira o e-mail, usuário Roblox e valor do pedido." });
    }
    const description = String(body.product || "Compra de Robux - DynastiaBux").slice(0, 180);
    const productHashes = {
      1200: "prod_35e3015e29f54a12",
      1700: "prod_d6b8393d47779af0",
      2100: "prod_8fcd4ea5c019905e",
      3600: "prod_f63d99019f056ba4",
      4500: "prod_b8244baa5acd2879",
      7000: "prod_afff9f0438d886dd",
      10000: "prod_94c12e1ebb4501fe"
    };
    const upsellHash = "prod_820357a578c9177f";
    const requestedHash = String(body.productHash || "");
    const selectedAmounts = [...String(body.product || "").matchAll(/(\d+)\s*Robux/gi)]
      .map((match) => Number(match[1]))
      .filter((value, index, values) => values.indexOf(value) === index);
    const selectedHash = requestedHash === upsellHash ? upsellHash : (selectedAmounts.length === 1 ? productHashes[selectedAmounts[0]] : null);
    if (!selectedHash) {
      return send(res, 400, {
        success: false,
        message: selectedAmounts.length > 1
          ? "A ElevyPay exige um productHash por transação. Gere um Pix por pacote, sem misturar produtos no carrinho."
          : "Não foi possível identificar um pacote com productHash cadastrado."
      });
    }
    const payload = {
      amount,
      payment_method: "pix",
      productHash: selectedHash,
      description,
      customer: {
        name: username,
        email,
        document: String(document).replace(/\D/g, ""),
        phone: String(phone).replace(/\D/g, "")
      }
    };
    const upstream = await fetch(API_BASE + "/api/v1/transaction.php", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-API-Key": apiKey },
      body: JSON.stringify(payload)
    });
    const data = await upstream.json().catch(() => ({}));
    if (!upstream.ok || data.success === false) {
      console.error("ElevyPay transaction error", upstream.status, data);
      return send(res, upstream.status >= 400 && upstream.status < 600 ? upstream.status : 502, {
        success: false,
        message: data.message || data.error || "A ElevyPay não conseguiu criar o Pix."
      });
    }
    const root = data.data || data.transaction || data;
    const id = root.transaction_id ?? root.transactionId ?? root.id ?? data.transaction_id ?? data.transactionId ?? data.id;
    const code = root.pix_copy_paste ?? root.copy_paste ?? root.pix_code ?? root.pixCode ?? root.qr_code ?? root.qrCode ?? data.pix_copy_paste ?? data.copy_paste ?? data.pix_code ?? data.pixCode ?? "";
    const qr = root.qr_code_url ?? root.qrcode_url ?? root.qrCodeUrl ?? root.qr_url ?? data.qr_code_url ?? data.qrcode_url ?? data.qrCodeUrl ?? "";
    if (!id) {
      console.error("ElevyPay response without transaction id", data);
      return send(res, 502, { success: false, message: "A ElevyPay respondeu sem o identificador da transação. Verifique a documentação/resposta no painel." });
    }
    return send(res, 200, { success: true, paymentId: String(id), transaction_id: String(id), copyPaste: String(code || ""), qrcodeUrl: String(qr || ""), raw: data });
  } catch (error) {
    console.error("ElevyPay create error", error);
    return send(res, 502, { success: false, message: "Falha de comunicação com a ElevyPay." });
  }
}
