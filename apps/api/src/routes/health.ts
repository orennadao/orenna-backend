import { FastifyInstance } from "fastify";

export default async function healthRoutes(app: FastifyInstance) {
  app.get("/health/liveness", async () => ({ ok: true }));

  app.get("/health/readiness", async (_req, reply) => {
    try {
      if ((app as any).prisma) {
        await (app as any).prisma.$queryRaw`SELECT 1`;
      }
      return { ok: true };
    } catch {
      return reply.code(503).send({ ok: false });
    }
  });
}
