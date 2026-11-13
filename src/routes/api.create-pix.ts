import { createFileRoute } from "@tanstack/react-router";

type Env = { FLEVO_API_KEY?: string; FLEVO_API_URL?: string; VERCEL_URL?: string };

export const Route = createFileRoute("/api/create-pix")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const env = (process.env ?? {}) as Env;
          const apiKey = env.FLEVO_API_KEY;
          if (!apiKey) return Response.json({ success: false, message: "Configure FLEVO_API_KEY na Vercel com sua chave secreta da FlevoPay." }, { status: 500 });
          const input = await request.json() as { email?: string; username?: string; amount?: number; product?: string; document?: string; phone?: string };
          const amount = Number(input.amount);
          const document = String(input.document || "").replace(/\D/g, "");
          const phone = String(input.phone || "").replace(/\D/g, "");
          if (!Number.isFinite(amount) || amount < 1 || amount > 3000 || !input.email || !input.username || document.length !== 11 || phone.length < 10 || phone.length > 11) {
            return Response.json({ success: false, message: "Confira e-mail, usuário Roblox, CPF, telefone e valor do pedido." }, { status: 400 });
          }
          const base = (env.FLEVO_API_URL || "https://app.flevopay.com.br").replace(/\/$/, "");
          const origin = request.headers.get("origin") || (env.VERCEL_URL ? `https://${env.VERCEL_URL}` : new URL(request.url).origin);
          const reference = `dynastia-${crypto.randomUUID()}`;
          const response = await fetch(`${base}/api/v1/transaction`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "X-API-Key": apiKey },
            body: JSON.stringify({
              amount: Math.round(amount * 100),
              description: input.product || "Robux - Dynastia Bux",
              reference,
              postback_url: `${origin}/api/webhooks/flevo`,
              source: "api_externa",
              customer: { name: input.username.trim(), email: input.email.trim(), document, phone }
            })
          });
          const payload = await response.json() as { status?: string; message?: string; success?: boolean; transaction_id?: string | number; id?: string | number; qr_code?: string; qr_code_base64?: string };
          const paymentId = payload.transaction_id ?? payload.id;
          if (!response.ok || payload.success === false || !paymentId || (!payload.qr_code && !payload.qr_code_base64)) {
            console.error("FlevoPay create transaction:", response.status, payload);
            return Response.json({ success: false, message: payload.message || "A FlevoPay não conseguiu criar a cobrança Pix." }, { status: 502 });
          }
          return Response.json({ success: true, paymentId: String(paymentId), transactionId: String(paymentId), pixCode: payload.qr_code || "", copyPaste: payload.qr_code || "", qrcodeUrl: payload.qr_code_base64 || "", status: payload.status || "pending" });
        } catch (error) {
          console.error("Create Pix error:", error);
          return Response.json({ success: false, message: "Erro interno ao gerar Pix. Tente novamente." }, { status: 500 });
        }
      }
    }
  }
});
