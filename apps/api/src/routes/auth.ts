import { FastifyInstance } from "fastify";
import { randomBytes } from "crypto";
import { SiweMessage } from "siwe";

interface NonceInfo { expiresAt: number; used: boolean }
const NONCE_TTL_MS = 1000; // short TTL for tests
const nonces = new Map<string, NonceInfo>();

export default async function authRoutes(app: FastifyInstance) {
  const domain = process.env.DOMAIN ?? "localhost";

  app.post("/auth/nonce", async () => {
    const nonce = randomBytes(16).toString("hex");
    nonces.set(nonce, { expiresAt: Date.now() + NONCE_TTL_MS, used: false });
    return { nonce };
  });

  app.post("/auth/verify", async (req, reply) => {
    try {
      const { message, signature } = req.body as { message: string; signature: string };
      const siweMessage = new SiweMessage(message);
      const stored = nonces.get(siweMessage.nonce);
      if (!stored || stored.used || Date.now() > stored.expiresAt) {
        throw new Error("Invalid nonce");
      }
      if (req.headers.host !== domain || (req.headers.origin && !req.headers.origin.includes(domain))) {
        throw new Error("Bad origin");
      }
      await siweMessage.verify({ signature, domain, nonce: siweMessage.nonce });
      stored.used = true;
      const address = siweMessage.address.toLowerCase();
      const token = await reply.jwtSign({ address });
      reply.setCookie("token", token, { path: "/", httpOnly: true });
      return { ok: true };
    } catch {
      return reply.code(401).send({ ok: false });
    }
  });

  app.get(
    "/me",
    { preValidation: [(req, reply) => req.jwtVerify().catch(() => reply.code(401).send({ ok: false }))] },
    async (req) => {
      const user = req.user as { address: string };
      return { address: user.address };
    }
  );
}

export { nonces };
