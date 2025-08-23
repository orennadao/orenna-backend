import { FastifyInstance } from "fastify";
import { SiweMessage, generateNonce } from "siwe";
import { getEnv } from "../types/env.js";

export default async function authRoutes(app: FastifyInstance) {
  const env = getEnv();

  // SIWE nonce endpoint
  app.get("/auth/siwe/nonce", async (_req, reply) => {
    const nonce = generateNonce();
    const token = await reply.jwtSign({ nonce }, { expiresIn: "5m" });
    reply.setCookie("nonce", token, {
      path: "/",
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax'
    });
    app.log.info({ nonce }, "Issued SIWE nonce");
    return { nonce };
  });

  // Legacy nonce endpoint (for backwards compatibility)
  app.get("/auth/nonce", async (_req, reply) => {
    const nonce = generateNonce();
    const token = await reply.jwtSign({ nonce }, { expiresIn: "10m" });
    reply.setCookie("nonce", token, { 
      path: "/", 
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax'
    });
    return { nonce };
  });

  // SIWE verify endpoint 
  app.post("/auth/siwe/verify", async (req, reply) => {
    // Basic validation
    const body = req.body as any;
    if (!body?.message || !body?.signature) {
      return reply.code(400).send({ error: "Missing message or signature" });
    }

    const { message, signature } = body;
    const nonceToken = req.cookies["nonce"];
    app.log.info(
      {
        hasNonceCookie: Boolean(nonceToken),
        signature: typeof signature === "string" ? signature.slice(0, 10) : undefined,
      },
      "Received SIWE verify request"
    );

    if (!nonceToken) {
      app.log.warn({ cookies: req.cookies }, "SIWE verify missing nonce");
      return reply.code(401).send({ error: "Missing nonce" });
    }

    let decoded: any;
    try {
      decoded = await app.jwt.verify<{ nonce: string }>(nonceToken);
    } catch (err) {
      app.log.warn({ err }, "Failed to verify nonce token");
      return reply.code(401).send({ error: "Invalid or expired nonce" });
    }

    const msg = new SiweMessage(message);
    app.log.info(
      {
        address: msg.address,
        chainId: msg.chainId,
        domain: msg.domain,
        uri: msg.uri,
        nonce: msg.nonce,
        issuedAt: msg.issuedAt,
        decodedNonce: decoded.nonce,
      },
      "Parsed SIWE message"
    );
    
    // Chain allowlist validation
    const allowedChains = [1, 11155111]; // Mainnet, Sepolia
    if (msg.chainId && !allowedChains.includes(msg.chainId)) {
      app.log.warn({ chainId: msg.chainId, allowedChains }, "SIWE chain not allowed");
      return reply.code(401).send({ error: "Chain not allowed" });
    }

    // Validate domain and origin
    if (msg.domain !== env.SIWE_DOMAIN) {
      app.log.warn({ expected: env.SIWE_DOMAIN, received: msg.domain }, "SIWE domain mismatch");
      return reply.code(401).send({ error: "Invalid domain" });
    }

    if (msg.uri !== env.SIWE_ORIGIN) {
      app.log.warn({ expected: env.SIWE_ORIGIN, received: msg.uri }, "SIWE origin mismatch");
      return reply.code(401).send({ error: "Invalid origin" });
    }

    // Validate nonce freshness (< 5 minutes)
    const messageTime = new Date(msg.issuedAt || Date.now()).getTime();
    const now = Date.now();
    if (now - messageTime > 5 * 60 * 1000) {
      app.log.warn({ issuedAt: msg.issuedAt, now }, "SIWE message too old");
      return reply.code(401).send({ error: "Message too old" });
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
    const existingUser = await app.prisma.user.findUnique({
      where: { address }
    });

    const user = await app.prisma.user.upsert({
      where: { address },
      update: { 
        // Update last seen
        updatedAt: new Date()
      },
      create: { address },
    });

    // Create session with httpOnly cookie
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
      sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: parseInt(env.SIWE_SESSION_TTL) * 1000
    });
    
    reply.clearCookie("nonce");

    app.log.info({ address: user.address, chainId: msg.chainId }, "User authenticated via SIWE");

    return { 
      success: true,
      user: {
        id: user.id,
        address: user.address,
        ensName: user.ensName,
        chainId: msg.chainId
      },
      isNewUser: !existingUser
    };
  });

  // Legacy verify endpoint (for backwards compatibility)
  app.post("/auth/verify", async (req, reply) => {
    // Basic validation
    const body = req.body as any;
    if (!body?.message || !body?.signature) {
      return reply.code(400).send({ error: "Missing message or signature" });
    }

    const { message, signature } = body; // Only declare these ONCE
    const nonceToken = req.cookies["nonce"];
    app.log.info(
      {
        hasNonceCookie: Boolean(nonceToken),
        signature: typeof signature === "string" ? signature.slice(0, 10) : undefined,
      },
      "Received legacy SIWE verify request",
    );

    if (!nonceToken) {
      app.log.warn({ cookies: req.cookies }, "Legacy SIWE verify missing nonce");
      return reply.code(401).send({ error: "Missing nonce" });
    }

    let decoded: any;
    try {
      decoded = await app.jwt.verify<{ nonce: string }>(nonceToken);
    } catch (err) {
      app.log.warn({ err }, "Failed to verify legacy nonce token");
      return reply.code(401).send({ error: "Invalid or expired nonce" });
    }

    const msg = new SiweMessage(message);
    app.log.info(
      {
        address: msg.address,
        domain: msg.domain,
        uri: msg.uri,
        nonce: msg.nonce,
        decodedNonce: decoded.nonce,
      },
      "Parsed legacy SIWE message",
    );
    
    // Validate domain and origin
    if (msg.domain !== env.SIWE_DOMAIN) {
      app.log.warn({ expected: env.SIWE_DOMAIN, received: msg.domain }, "Legacy SIWE domain mismatch");
      return reply.code(401).send({ error: "Invalid domain" });
    }

    if (msg.uri !== env.SIWE_ORIGIN) {
      app.log.warn({ expected: env.SIWE_ORIGIN, received: msg.uri }, "Legacy SIWE origin mismatch");
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
      sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax',
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

  // Session check endpoint
  app.get("/auth/session", async (req, reply) => {
    try {
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
        return reply.code(401).send({ error: "User not found" });
      }

      return { 
        address: user.address,
        id: user.id,
        ensName: user.ensName,
        chainId: payload.chainId
      };
    } catch {
      return reply.code(401).send({ error: "Not authenticated" });
    }
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