import { createFileRoute } from "@tanstack/react-router";

const MAX_BODY_BYTES = 256_000;

export const Route = createFileRoute("/api/public/webhooks/kiwify")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const contentType = request.headers.get("content-type") ?? "";
        if (!contentType.toLowerCase().includes("application/json")) {
          return Response.json({ error: "content_type_not_supported" }, { status: 415 });
        }

        const declaredLength = Number(request.headers.get("content-length") ?? 0);
        if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
          return Response.json({ error: "payload_too_large" }, { status: 413 });
        }

        const rawBody = await request.text();
        if (new TextEncoder().encode(rawBody).byteLength > MAX_BODY_BYTES) {
          return Response.json({ error: "payload_too_large" }, { status: 413 });
        }

        try {
          JSON.parse(rawBody);
        } catch {
          return Response.json({ error: "invalid_json" }, { status: 400 });
        }

        const configuredSecret = process.env["KIWIFY_WEBHOOK_SECRET"];
        if (!configuredSecret) {
          return Response.json({ error: "webhook_not_configured" }, { status: 503 });
        }

        return Response.json(
          {
            error: "webhook_contract_pending",
            message: "A autenticação e o payload oficial do webhook comercial ainda precisam ser confirmados.",
          },
          { status: 503 },
        );
      },
    },
  },
});