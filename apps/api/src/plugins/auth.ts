import fp from "fastify-plugin";
import { z } from "zod";
import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

export interface SessionUser {
  id: string;
  address: string;
  isAdmin: boolean;
}

declare module "fastify" {
  interface FastifyRequest {
    user?: SessionUser;
  }
  interface FastifyInstance {
    authenticate: (
      request: FastifyRequest,
      reply: FastifyReply,
    ) => Promise<void>;
  }
}

const bodySchema = z.object({
  address: z.string(),
  isAdmin: z.boolean().optional(),
});

export default fp(async function auth(app: FastifyInstance) {
  app.decorate(
    "authenticate",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const raw = request.headers.cookie;
      const id = raw
        ?.split(";")
        .map((c) => c.trim())
        .find((c) => c.startsWith("session="))
        ?.split("=")[1];
      if (!id) {
        return reply.code(401).send({ error: "Unauthorized" });
      }
      const user = await app.prisma.user.findUnique({ where: { id } });
      if (!user) {
        return reply.code(401).send({ error: "Unauthorized" });
      }
      request.user = user as SessionUser;
    },
  );

  app.post("/siwe", { schema: { body: bodySchema } }, async (req, reply) => {
    const parsed = bodySchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send(parsed.error.flatten());
    const { address, isAdmin } = parsed.data;
    const user = await app.prisma.user.upsert({
      where: { address },
      update: {
        lastLoginAt: new Date(),
        ...(isAdmin !== undefined ? { isAdmin } : {}),
      },
      create: { address, isAdmin: isAdmin ?? false },
    });
    reply.header("set-cookie", `session=${user.id}; Path=/; HttpOnly`);
    return { ok: true };
  });
});
