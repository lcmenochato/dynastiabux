import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "node:crypto";

type Env = { VELANI_WEBHOOK_SECRET?: string };

export const Route = createFileRoute("/api/webhooks/velani")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = (process.env as Env).VELANI_WEBHOOK_SECRET;
        if (!secret) return new Response("Webhook secret not configured", { status: 500 });
        const raw = await request.text();
        const signature = request.headers.get("x-webhook-signature") || "";
        const expected = "sha256=" + createHmac("sha256", secret).update(raw).digest("hex");
        const a = Buffer.from(signature);
        const b = Buffer.from(expected);
        if (a.length !== b.length || !timingSafeEqual(a, b)) return new Response("Invalid signature", { status: 401 });
        // A confirmação definitiva também é consultada pelo endpoint de status no checkout.
        return Response.json({ received: true });
      }
    }
  }
});
