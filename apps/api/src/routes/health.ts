import { FastifyInstance } from "fastify";

export default async function healthRoutes(app: FastifyInstance) {
  app.get("/health/liveness", async () => ({ ok: true, service: "api" }));
}
