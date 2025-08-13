// apps/api/src/server.ts
import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import cookie from "@fastify/cookie";
import jwt from "@fastify/jwt";
import swagger from "./plugins/swagger.ts";
import prismaPlugin from "./plugins/prisma.ts";
import readiness from "./plugins/readiness.ts";
import healthRoutes from "./routes/health.ts";
import echoRoutes from "./routes/echo.ts";
import authRoutes from "./routes/auth.ts";
import projectsRoutes from "./routes/projects.ts";
import liftUnitRoutes from "./routes/lift-units.ts";
import blockchainRoutes from "./routes/blockchain.ts";
import { getEnv } from "./types/env.ts";

// Simple Fastify instance without Zod type provider
const app = Fastify({
  logger: { level: "info", redact: ["req.headers.authorization"] },
});

const env = getEnv();
app.log.info({ DATABASE_URL: process.env.DATABASE_URL, cwd: process.cwd() }, "Booting API");

// Global error handler
app.setErrorHandler((err, _req, reply) => {
  app.log.error({ err }, "Unhandled error");
  const status = (err as any).statusCode ?? 500;
  reply.status(status).send({
    statusCode: status,
    error: err.name ?? "Error",
    message: err.message,
  });
});

// Core plugins
await app.register(cors, { origin: env.API_CORS_ORIGIN, credentials: true });
await app.register(cookie);
await app.register(jwt, {
  secret: env.JWT_SECRET,
  cookie: { cookieName: "session", signed: false },
});

app.decorate("authenticate", async function (req, reply) {
  try {
    await req.jwtVerify();
  } catch (err) {
    return reply.send(err);
  }
});

await app.register(prismaPlugin);

// Use minimal swagger without Zod transform
await app.register(swagger);

// Routes
await app.register(readiness);
await app.register(healthRoutes);
//await app.register(echoRoutes);
await app.register(authRoutes);
//await app.register(projectsRoutes);
await app.register(liftUnitRoutes, { prefix: '/api' });
await app.register(blockchainRoutes, { prefix: '/api' });

// Debug helpers
app.get(
  "/__routes",
  { schema: { hide: process.env.NODE_ENV === "production" } },
  async () => app.printRoutes()
);

// Print routes once ready
app.ready().then(() => app.log.info("\n" + app.printRoutes()));

// Graceful shutdown
const close = async (sig?: NodeJS.Signals) => {
  try {
    app.log.info({ sig }, "Shutting down");
    await app.close();
    process.exit(0);
  } catch (e) {
    app.log.error(e);
    process.exit(1);
  }
};

process.on("SIGINT", () => close("SIGINT"));
process.on("SIGTERM", () => close("SIGTERM"));

// Start
await app.listen({ port: env.API_PORT, host: env.API_HOST });
app.log.info(`Docs at http://${env.API_HOST}:${env.API_PORT}/docs`);