import { FastifyInstance } from "fastify";
import { SiweMessage, generateNonce } from "siwe";
import { SiweVerifySchema } from "@orenna/shared/src/schemas";

export default async function authRoutes(app: FastifyInstance) {
  app.post("/auth/nonce", async (_req, reply) => {
    const nonce = generateNonce();
    const token = await reply.jwtSign({ nonce }, { expiresIn: "5m" });
    reply.setCookie("nonce", token, { path: "/", httpOnly: true });
    return { nonce };
  });

  app.post(
    "/auth/verify",
    { schema: { body: SiweVerifySchema } },
    async (req, reply) => {
      const { message, signature } = SiweVerifySchema.parse(req.body);
      const nonceToken = req.cookies["nonce"];
      if (!nonceToken) return reply.code(401).send({ error: "Missing nonce" });
      let decoded: any;
      try {
        decoded = await app.jwt.verify<{ nonce: string }>(nonceToken);
      } catch {
        return reply.code(401).send({ error: "Invalid nonce" });
      }
      const msg = new SiweMessage(message);
      try {
        await msg.verify({ signature, nonce: decoded.nonce, domain: req.headers.host ?? "" });
      } catch {
        return reply.code(401).send({ error: "Invalid SIWE message" });
      }
      const address = msg.address.toLowerCase();
      await app.prisma.user.upsert({
        where: { address },
        update: {},
        create: { address },
      });
      const session = await reply.jwtSign({ address }, { expiresIn: "1h" });
      reply.setCookie("session", session, { path: "/", httpOnly: true });
      reply.clearCookie("nonce");
      return { ok: true };
    }
  );

  app.post("/auth/logout", async (_req, reply) => {
    reply.clearCookie("session");
    return { ok: true };
  });

  app.get("/me", { preHandler: (app as any).authenticate }, async (req) => {
    const payload = await req.jwtVerify<{ address: string }>();
    const user = await app.prisma.user.findUnique({ where: { address: payload.address } });
    return { address: user?.address };
  });
}
