import fp from "fastify-plugin";
import type { FastifyPluginAsync } from "fastify";

const readinessPlugin: FastifyPluginAsync = async (app) => {
  app.get("/ready", async (_req, reply) => {
    try {
      if ((app as any).prisma) await (app as any).prisma.$queryRaw`SELECT 1`;
      return { ready: true };
    } catch {
      return reply.code(503).send({ ready: false, message: "Database not ready" });
    }
  });
};

export default fp(readinessPlugin);
