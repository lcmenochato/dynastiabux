import { createFileRoute } from "@tanstack/react-router";

type Env = {
  FLEVO_API_KEY?: string;
  FLEVO_API_URL?: string;
  TIKTOK_ACCESS_TOKEN?: string;
  TIKTOK_PIXEL_ID?: string;
};

type FlevoTransaction = {
  id?: string | number;
  external_id?: string;
  status?: string;
  amount?: number | string;
  customer_data?: { email?: string };
  data?: FlevoTransaction;
};

async function sha256(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value.trim().toLowerCase());
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

export const Route = createFileRoute("/api/webhooks/flevo")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const env = (process.env ?? {}) as Env;
          if (!env.FLEVO_API_KEY) {
            return Response.json({ received: false, message: "FLEVO_API_KEY não configurada." }, { status: 500 });
          }

          const event = await request.json() as {
            transaction_id?: string | number;
            external_id?: string;
            store_reference?: string;
            status?: string;
          };
          const transactionId = String(event.transaction_id ?? "").trim();
          const reference = String(event.external_id || event.store_reference || "").trim();
          if (!transactionId || !reference.startsWith("dynastia-")) {
            return Response.json({ received: false, message: "Identificadores inválidos." }, { status: 400 });
          }

          // Confirma o pagamento consultando a FlevoPay com a chave secreta; não confia apenas no webhook.
          const base = (env.FLEVO_API_URL || "https://pagamento-processador.org.ua").replace(/\/$/, "");
          const verifyResponse = await fetch(
            `${base}/api/v1/query?action=get_transaction&id=${encodeURIComponent(transactionId)}`,
            { headers: { "X-API-Key": env.FLEVO_API_KEY, "Accept": "application/json" }, cache: "no-store" }
          );
          const verified = await verifyResponse.json() as FlevoTransaction;
          if (!verifyResponse.ok) {
            console.error("FlevoPay verification failed:", verifyResponse.status);
            return Response.json({ received: false, message: "Falha ao validar transação na FlevoPay." }, { status: 502 });
          }

          const tx = verified.data || verified;
          if (String(tx.external_id || "").trim() !== reference) {
            return Response.json({ received: false, message: "Referência da transação não confere." }, { status: 403 });
          }
          if (String(tx.status || "").trim().toLowerCase() !== "approved") {
            return Response.json({ received: true, ignored: true, status: tx.status || "unknown" });
          }

          const accessToken = env.TIKTOK_ACCESS_TOKEN;
          if (!accessToken) {
            console.error("TIKTOK_ACCESS_TOKEN não configurado.");
            return Response.json({ received: true, purchaseSent: false, message: "Token da TikTok ausente." }, { status: 500 });
          }
          const amountInCents = Number(tx.amount);
          if (!Number.isFinite(amountInCents) || amountInCents <= 0) {
            return Response.json({ received: false, message: "Valor da transação inválido." }, { status: 422 });
          }

          const email = String(tx.customer_data?.email || "").trim();
          const user = email ? { email: await sha256(email) } : {};
          const pixelId = env.TIKTOK_PIXEL_ID || "DBR3M4BC77U657ENNMGG";
          const tiktokResponse = await fetch("https://business-api.tiktok.com/open_api/v1.3/event/track/", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Access-Token": accessToken },
            body: JSON.stringify({
              event_source: "web",
              event_source_id: pixelId,
              data: [{
                event: "Purchase",
                event_time: Math.floor(Date.now() / 1000),
                event_id: reference,
                user,
                properties: {
                  value: amountInCents / 100,
                  currency: "BRL",
                  content_type: "product",
                  content_id: "dynastia-robux"
                },
                page: { url: new URL("/", request.url).toString() }
              }]
            })
          });
          const result = await tiktokResponse.json().catch(() => null) as { code?: number; message?: string } | null;
          if (!tiktokResponse.ok || (result?.code !== undefined && result.code !== 0)) {
            console.error("TikTok Events API rejected Purchase:", tiktokResponse.status, result?.code, result?.message);
            return Response.json({ received: true, purchaseSent: false, message: "TikTok recusou o evento." }, { status: 502 });
          }

          console.info("TikTok Purchase sent for approved FlevoPay payment:", reference);
          return Response.json({ received: true, purchaseSent: true });
        } catch (error) {
          console.error("FlevoPay webhook error:", error);
          return Response.json({ received: false, message: "Falha ao processar webhook." }, { status: 500 });
        }
      }
    }
  }
});
