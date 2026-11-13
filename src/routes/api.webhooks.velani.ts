import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/webhooks/flevo")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const event = await request.json() as { transaction_id?: string; external_id?: string; status?: string };
          console.info("FlevoPay webhook received:", { transactionId: event.transaction_id, reference: event.external_id, status: event.status });
          // A confirmação definitiva é feita pela consulta autenticada da transação no checkout.
          return Response.json({ received: true });
        } catch {
          return Response.json({ received: false, message: "Payload inválido." }, { status: 400 });
        }
      }
    }
  }
});
