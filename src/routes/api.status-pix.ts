import { createFileRoute } from "@tanstack/react-router";

type Env = { VELANI_PUBLIC_KEY?: string; VELANI_SECRET_KEY?: string; VELANI_API_URL?: string };

export const Route = createFileRoute("/api/status-pix")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const env = (process.env ?? {}) as Env;
          const apiKey = env.VELANI_PUBLIC_KEY || env.VELANI_SECRET_KEY;
          if (!apiKey) return Response.json({ success: false, message: "Configure VELANI_PUBLIC_KEY na Vercel para consultar transações." }, { status: 500 });
          const id = new URL(request.url).searchParams.get("paymentId");
          if (!id || !/^[a-zA-Z0-9_-]+$/.test(id)) return Response.json({ success: false, message: "Identificador de pagamento inválido." }, { status: 400 });
          const base = (env.VELANI_API_URL || "https://api.velanipagamentos.com.br/api/v1/api-gateway").replace(/\/$/, "");
          const response = await fetch(`${base}/v1/transactions/${encodeURIComponent(id)}`, {
            headers: { "x-api-key": apiKey, "Accept": "application/json" },
            cache: "no-store"
          });
          const payload = await response.json() as { data?: { status?: string }; status?: string; message?: string };
          if (!response.ok) return Response.json({ success: false, message: payload.message || "Não foi possível consultar o pagamento." }, { status: 502 });
          return Response.json({ success: true, status: payload.data?.status || payload.status || "pending" });
        } catch (error) {
          console.error("Pix status error:", error);
          return Response.json({ success: false, message: "Falha ao consultar o pagamento." }, { status: 500 });
        }
      }
    }
  }
});
