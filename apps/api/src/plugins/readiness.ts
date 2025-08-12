import fp from "fastify-plugin";
import type { FastifyPluginAsync } from "fastify";

const readinessPlugin: FastifyPluginAsync = async (app) => {
  app.get("/health/readiness", async (_req, reply) => {
    const max = 5;
    for (let i = 0; i < max; i++) {
      try {
        if ((app as any).prisma) await (app as any).prisma.$queryRaw`SELECT 1`;
        return { ready: true };
      } catch {
        if (i === max - 1) break;
        await new Promise((r) => setTimeout(r, 1000));
      }
    }
    return reply.code(503).send({ ready: false, message: "Database not ready" });
  });
};

export default fp(readinessPlugin);
