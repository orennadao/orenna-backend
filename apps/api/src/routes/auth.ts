import { FastifyInstance } from "fastify";
import { SiweMessage, generateNonce } from "siwe";
import { getEnv } from "../types/env.js";

export default async function authRoutes(app: FastifyInstance) {
  const env = getEnv();

  app.get("/auth/nonce", async (_req, reply) => {
    const nonce = generateNonce();
    const token = await reply.jwtSign({ nonce }, { expiresIn: "10m" });
    reply.setCookie("nonce", token, { 
      path: "/", 
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'strict'
    });
    return { nonce };
  });

  app.post("/auth/verify", async (req, reply) => {
    // Basic validation
    const body = req.body as any;
    if (!body?.message || !body?.signature) {
      return reply.code(400).send({ error: "Missing message or signature" });
    }
    
    const { message, signature } = body; // Only declare these ONCE
    const nonceToken = req.cookies["nonce"];
    
    if (!nonceToken) {
      return reply.code(401).send({ error: "Missing nonce" });
    }

    let decoded: any;
    try {
      decoded = await app.jwt.verify<{ nonce: string }>(nonceToken);
    } catch {
      return reply.code(401).send({ error: "Invalid or expired nonce" });
    }

    const msg = new SiweMessage(message);
    
    // Validate domain and origin
    if (msg.domain !== env.SIWE_DOMAIN) {
      return reply.code(401).send({ error: "Invalid domain" });
    }
    
    if (msg.uri !== env.SIWE_ORIGIN) {
      return reply.code(401).send({ error: "Invalid origin" });
    }

    try {
      await msg.verify({ 
        signature, 
        nonce: decoded.nonce,
        domain: env.SIWE_DOMAIN 
      });
    } catch (error: any) {
      app.log.warn({ error: error.message, address: msg.address }, "SIWE verification failed");
      return reply.code(401).send({ error: "Invalid SIWE signature" });
    }

    const address = msg.address.toLowerCase();
    
    // Create or update user
    const user = await app.prisma.user.upsert({
      where: { address },
      update: { 
        // Update last seen or other fields if needed
      },
      create: { address },
    });

    // Create session with longer duration
    const sessionDuration = `${env.SIWE_SESSION_TTL}s`;
    const session = await reply.jwtSign(
      { 
        address: user.address,
        userId: user.id,
        chainId: msg.chainId || 1
      }, 
      { expiresIn: sessionDuration }
    );

    reply.setCookie("session", session, { 
      path: "/", 
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: parseInt(env.SIWE_SESSION_TTL) * 1000
    });
    
    reply.clearCookie("nonce");

    app.log.info({ address: user.address, chainId: msg.chainId }, "User authenticated via SIWE");

    return { 
      success: true,
      user: {
        id: user.id,
        address: user.address,
        ensName: user.ensName
      }
    };
  });

  app.post("/auth/logout", async (_req, reply) => {
    reply.clearCookie("session");
    reply.clearCookie("nonce");
    return { success: true };
  });

  app.get("/auth/profile", { preHandler: (app as any).authenticate }, async (req) => {
    const payload = await req.jwtVerify<{ address: string; userId: string; chainId?: number }>();
    const user = await app.prisma.user.findUnique({ 
      where: { address: payload.address },
      select: {
        id: true,
        address: true,
        ensName: true,
        createdAt: true,
        updatedAt: true
      }
    });
    
    if (!user) {
      throw app.httpErrors.notFound("User not found");
    }

    return { 
      user: {
        ...user,
        chainId: payload.chainId
      }
    };
  });

  // Legacy endpoint for backward compatibility
  app.get("/me", { preHandler: (app as any).authenticate }, async (req) => {
    const payload = await req.jwtVerify<{ address: string }>();
    const user = await app.prisma.user.findUnique({ where: { address: payload.address } });
    return { address: user?.address };
  });
}