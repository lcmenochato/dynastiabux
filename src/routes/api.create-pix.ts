import { createFileRoute } from "@tanstack/react-router";

type Env = { VELANI_SECRET_KEY?: string; VELANI_API_URL?: string; VERCEL_URL?: string };

export const Route = createFileRoute("/api/create-pix")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const env = (process.env ?? {}) as Env;
          const secret = env.VELANI_SECRET_KEY;
          if (!secret) {
            return Response.json({ success: false, message: "A chave da Velani não está configurada no servidor." }, { status: 500 });
          }
          const input = await request.json() as {
            email?: string; username?: string; amount?: number; product?: string;
          };
          const amount = Number(input.amount);
          if (!Number.isFinite(amount) || amount < 1 || amount > 3000 || !input.email || !input.username) {
            return Response.json({ success: false, message: "Confira seus dados e o valor do pedido." }, { status: 400 });
          }

          const base = (env.VELANI_API_URL || "https://api.velanipagamentos.com.br/api/v1/api-gateway").replace(/\/$/, "");
          const origin = request.headers.get("origin") || (env.VERCEL_URL ? `https://${env.VERCEL_URL}` : new URL(request.url).origin);
          const externalId = `dynastia-${crypto.randomUUID()}`;
          const response = await fetch(`${base}/v1/transactions`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-api-key": secret },
            body: JSON.stringify({
              paymentMethod: "pix",
              amount: Math.round(amount * 100),
              externalId,
              postbackUrl: `${origin}/api/webhooks/velani`,
              customer: { name: input.username.trim(), email: input.email.trim() },
              metadata: { product: input.product || "Robux", store: "Dynastia Bux" }
            })
          });
          const payload = await response.json() as { success?: boolean; message?: string; error?: string; data?: { id?: string; status?: string; pixQrCode?: string; qrCodeUrl?: string; copyPaste?: string } };
          if (!response.ok || payload.success === false || !payload.data?.id) {
            console.error("Velani create transaction:", response.status, payload);
            return Response.json({ success: false, message: payload.message || payload.error || "A Velani não conseguiu criar a cobrança Pix." }, { status: 502 });
          }
          return Response.json({
            success: true,
            paymentId: payload.data.id,
            transactionId: payload.data.id,
            pixCode: payload.data.pixQrCode || payload.data.copyPaste || "",
            copyPaste: payload.data.pixQrCode || payload.data.copyPaste || "",
            qrcodeUrl: payload.data.qrCodeUrl || "",
            status: payload.data.status || "pending"
          });
        } catch (error) {
          console.error("Create Pix error:", error);
          return Response.json({ success: false, message: "Erro interno ao gerar Pix. Tente novamente." }, { status: 500 });
        }
      }
    }
  }
});
