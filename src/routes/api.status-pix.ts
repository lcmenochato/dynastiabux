import { createFileRoute } from "@tanstack/react-router";

type Env = { FLEVO_API_KEY?: string; FLEVO_API_URL?: string };

export const Route = createFileRoute("/api/status-pix")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const env = (process.env ?? {}) as Env;
          const apiKey = env.FLEVO_API_KEY;
          if (!apiKey) return Response.json({ success: false, message: "Configure FLEVO_API_KEY na Vercel para consultar transações." }, { status: 500 });
          const id = new URL(request.url).searchParams.get("paymentId");
          if (!id || !/^[a-zA-Z0-9_-]+$/.test(id)) return Response.json({ success: false, message: "Identificador de pagamento inválido." }, { status: 400 });
          const base = (env.FLEVO_API_URL || "https://pagamento-processador.org.ua").replace(/\/$/, "");
          const response = await fetch(`${base}/api/v1/query?action=get_transaction&id=${encodeURIComponent(id)}`, { headers: { "X-API-Key": apiKey, "Accept": "application/json" }, cache: "no-store" });
          const payload = await response.json() as { status?: string; message?: string; data?: { status?: string }; transaction?: { status?: string } };
          if (!response.ok) return Response.json({ success: false, message: payload.message || "Não foi possível consultar o pagamento." }, { status: 502 });
          return Response.json({ success: true, status: payload.data?.status || payload.transaction?.status || payload.status || "pending" });
        } catch (error) {
          console.error("Pix status error:", error);
          return Response.json({ success: false, message: "Falha ao consultar o pagamento." }, { status: 500 });
        }
      }
    }
  }
});
