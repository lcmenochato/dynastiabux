import { createFileRoute } from "@tanstack/react-router";

type Env = { FLEVO_API_KEY?: string; FLEVO_API_URL?: string; FLEVO_CUSTOMER_DOCUMENT?: string; FLEVO_CUSTOMER_PHONE?: string; VERCEL_URL?: string };

export const Route = createFileRoute("/api/create-pix")({
  server: {
    handlers: {
      GET: async () => Response.json({ success: true, route: "api/create-pix", methods: ["POST"] }),
      POST: async ({ request }) => {
        try {
          const env = (process.env ?? {}) as Env;
          const apiKey = env.FLEVO_API_KEY;
          if (!apiKey) return Response.json({ success: false, message: "Configure FLEVO_API_KEY na Vercel com sua chave secreta da FlevoPay." }, { status: 500 });

          const input = await request.json() as { email?: string; name?: string; username?: string; amount?: number; product?: string };
          const amount = Number(input.amount);
          if (!Number.isFinite(amount) || amount < 1 || amount > 3000 || !input.email || !/\S+@\S+\.\S+/.test(input.email) || !(input.name || input.username)?.trim()) {
            return Response.json({ success: false, message: "Confira seu e-mail, usuário Roblox e valor do pedido." }, { status: 400 });
          }

          const document = String(env.FLEVO_CUSTOMER_DOCUMENT || "").replace(/\D/g, "");
          if (![11, 14].includes(document.length)) {
            return Response.json({ success: false, message: "Configure FLEVO_CUSTOMER_DOCUMENT na Vercel com o documento autorizado pela FlevoPay, somente números." }, { status: 500 });
          }

          const phone = String(env.FLEVO_CUSTOMER_PHONE || "").replace(/\D/g, "");
          if (phone.length < 10 || phone.length > 15) {
            return Response.json({ success: false, message: "Configure FLEVO_CUSTOMER_PHONE na Vercel com o telefone autorizado pela FlevoPay, incluindo DDD e somente números." }, { status: 500 });
          }

          const base = String(env.FLEVO_API_URL || "https://pagamento-processador.org.ua").trim().replace(/\/+$/, "");
          const origin = request.headers.get("origin") || (env.VERCEL_URL ? `https://${env.VERCEL_URL}` : new URL(request.url).origin);
          const reference = `dynastia-${crypto.randomUUID()}`;
          const response = await fetch(`${base}/api/v1/transaction`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "Accept": "application/json", "X-API-Key": apiKey },
            body: JSON.stringify({
              amount: Math.round(amount * 100),
              description: input.product || "Robux - Dynastia Bux",
              reference,
              source: "api_externa",
              postback_url: `${origin}/api/webhooks/flevo`,
              customer: { name: (input.name || input.username || "").trim(), email: input.email.trim(), document, phone }
            })
          });

          const responseText = await response.text();
          let payload: any;
          try {
            payload = JSON.parse(responseText);
          } catch {
            console.error("FlevoPay returned non-JSON response:", response.status, responseText.slice(0, 1000));
            return Response.json({ success: false, message: `A API da FlevoPay respondeu em formato inválido (HTTP ${response.status}). Confira FLEVO_API_URL e os logs da Vercel.` }, { status: 502 });
          }

          const data = payload?.data && typeof payload.data === "object" ? payload.data : payload;
          const paymentId = data?.transaction_id ?? data?.transactionId ?? data?.paymentId ?? data?.id ?? payload?.transaction_id ?? payload?.id;
          const pixCode = data?.qr_code ?? data?.pix_code ?? data?.copy_paste ?? data?.copyPaste ?? data?.pixCode ?? data?.brcode ?? payload?.qr_code ?? payload?.pix_code;
          const pixQr = data?.qr_code_base64 ?? data?.qrCodeBase64 ?? data?.qrcode ?? data?.qrCode ?? payload?.qr_code_base64;
          const apiStatus = String(payload?.status ?? "").toLowerCase();
          const apiMessage = [
            payload?.message,
            payload?.error?.message,
            typeof payload?.error === "string" ? payload.error : undefined,
            payload?.details?.[0]?.message,
            payload?.detail,
            payload?.errors ? JSON.stringify(payload.errors) : undefined
          ].filter((value) => typeof value === "string" && value.trim()).join(" | ");
          if (!response.ok || payload?.success === false || apiStatus === "error" || !paymentId || (!pixCode && !pixQr)) {
            const reason = apiMessage || `Resposta incompleta da API (HTTP ${response.status}; id=${Boolean(paymentId)}; código=${Boolean(pixCode)}; QR=${Boolean(pixQr)}).`;
            // Registra a resposta do gateway (sem chave de API nem dados enviados pelo cliente)
            // para distinguir rejeição de payload de falha interna do adquirente/banco.
            console.error("FlevoPay create transaction failed:", JSON.stringify({
              httpStatus: response.status,
              status: payload?.status ?? null,
              message: reason,
              errorCode: payload?.error_code ?? payload?.code ?? null,
              details: payload?.details ?? payload?.errors ?? null
            }));
            return Response.json({ success: false, message: `FlevoPay: ${reason}` }, { status: 502 });
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