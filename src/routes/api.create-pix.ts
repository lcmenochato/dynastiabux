import { createFileRoute } from "@tanstack/react-router";

type Env = { FLEVO_API_KEY?: string; FLEVO_API_URL?: string; FLEVO_CUSTOMER_DOCUMENT?: string; VERCEL_URL?: string };

export const Route = createFileRoute("/api/create-pix")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const env = (process.env ?? {}) as Env;
          const apiKey = env.FLEVO_API_KEY;
          if (!apiKey) return Response.json({ success: false, message: "Configure FLEVO_API_KEY na Vercel com sua chave secreta da FlevoPay." }, { status: 500 });

          const input = await request.json() as { email?: string; username?: string; amount?: number; product?: string };
          const amount = Number(input.amount);
          if (!Number.isFinite(amount) || amount < 1 || amount > 3000 || !input.email || !/\S+@\S+\.\S+/.test(input.email) || !input.username?.trim()) {
            return Response.json({ success: false, message: "Confira seu e-mail, usuário Roblox e valor do pedido." }, { status: 400 });
          }

          const document = String(env.FLEVO_CUSTOMER_DOCUMENT || "").replace(/\D/g, "");
          if (![11, 14].includes(document.length)) {
            return Response.json({ success: false, message: "Configure FLEVO_CUSTOMER_DOCUMENT na Vercel com o documento autorizado pela FlevoPay, somente números." }, { status: 500 });
          }

          const base = (env.FLEVO_API_URL || "https://pagamento-processador.org.ua").replace(/\/$/, "");
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
              customer: { name: input.username.trim(), email: input.email.trim(), document }
            })
          });

          const responseText = await response.text();
          let payload: { status?: string; message?: string; success?: boolean; transaction_id?: string | number; id?: string | number; qr_code?: string; qr_code_base64?: string; data?: { transaction_id?: string | number; id?: string | number; qr_code?: string; qr_code_base64?: string; pix_code?: string; copy_paste?: string } };
          try {
            payload = JSON.parse(responseText);
          } catch {
            console.error("FlevoPay returned non-JSON response:", response.status, responseText.slice(0, 1000));
            return Response.json({ success: false, message: `A API da FlevoPay respondeu em formato inválido (HTTP ${response.status}). Confira FLEVO_API_URL e os logs da Vercel.` }, { status: 502 });
          }

          const paymentId = payload.transaction_id ?? payload.id ?? payload.data?.transaction_id ?? payload.data?.id;
          const pixCode = payload.qr_code ?? payload.data?.qr_code ?? payload.data?.pix_code ?? payload.data?.copy_paste;
          const pixQr = payload.qr_code_base64 ?? payload.data?.qr_code_base64;
          if (!response.ok || payload.success === false || payload.status === "error" || !paymentId || (!pixCode && !pixQr)) {
            console.error("FlevoPay create transaction:", response.status, payload);
            return Response.json({ success: false, message: payload.message || `A FlevoPay recusou a cobrança (HTTP ${response.status}) ou retornou dados incompletos.` }, { status: 502 });
          }

          return Response.json({ success: true, paymentId: String(paymentId), transactionId: String(paymentId), pixCode: pixCode || "", copyPaste: pixCode || "", qrcodeUrl: pixQr || "", status: payload.status || "pending" });
        } catch (error) {
          console.error("Create Pix error:", error);
          return Response.json({ success: false, message: "Falha de conexão com a API da FlevoPay. Confira FLEVO_API_URL e os logs da Vercel." }, { status: 502 });
        }
      }
    }
  }
});