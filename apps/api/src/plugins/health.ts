import fp from "fastify-plugin";
import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import pkg from "../../package.json" assert { type: "json" };

const Liveness = z.object({ ok: z.literal(true) });
const Readiness = z.union([
  z.object({ ok: z.literal(true) }),
  z.object({ ok: z.literal(false), message: z.string() }),
]);
const Info = z.object({ service: z.literal("api"), version: z.string() });

const healthPlugin: FastifyPluginAsync = async (app) => {
  app.get(
    "/liveness",
    {
      schema: {
        tags: ["Health"],
        response: { 200: Liveness },
      },
    },
    async () => ({ ok: true })
  );

  app.get(
    "/readiness",
    {
      schema: {
        tags: ["Health"],
        response: { 200: Liveness, 503: Readiness },
      },
    },
    async (_req, reply) => {
      try {
        await app.prisma.$queryRaw`SELECT 1`;
        return { ok: true };
      } catch {
        return reply.code(503).send({ ok: false, message: "Database not ready" });
      }
    }
  );

  app.get(
    "/info",
    {
      schema: {
        tags: ["Health"],
        response: { 200: Info },
      },
    },
    async () => ({ service: "api", version: pkg.version })
  );

  app.get(
    "/__db",
    { schema: { hide: true } },
    async () => {
      const rows = await app.prisma.$queryRaw<
        Array<{ table_name: string }>
      >`SELECT table_name FROM information_schema.tables WHERE table_schema='public'`;
      return { tables: rows.map((r) => r.table_name) };
    }
  );
};

export default fp(healthPlugin);
