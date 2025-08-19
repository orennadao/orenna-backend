// apps/api/src/server.ts
import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import cookie from "@fastify/cookie";
import jwt from "@fastify/jwt";
import websocket from "@fastify/websocket";
import swagger from "./plugins/swagger";
import prismaPlugin from "./plugins/prisma";
import readiness from "./plugins/readiness";
import securityPlugin from "./plugins/security";
import validationPlugin from "./plugins/validation";
import healthRoutes from "./routes/health";
import echoRoutes from "./routes/echo";
import authRoutes from "./routes/auth";
import projectsRoutes from "./routes/projects";
import liftTokenRoutes from "./routes/lift-tokens";
import blockchainRoutes from "./routes/blockchain";
import { getEnv } from "./types/env";
import mintRequestRoutes from './routes/mint-requests';
import paymentRoutes from './routes/payments';
import indexerRoutes from './routes/indexer';
import websocketRoutes from './routes/websocket';
import analyticsRoutes from './routes/analytics';
import rolesRoutes from './routes/roles';
import { vendorRoutes } from './routes/vendors';
import { contractRoutes } from './routes/contracts';
import { invoiceRoutes } from './routes/invoices';
import { financePaymentRoutes } from './routes/finance-payments';
import { reconciliationRoutes } from './routes/reconciliation';
import { governanceRoutes } from './routes/governance';
import { financeLoopRoutes } from './routes/finance-loop';
import { financeIntegrityRoutes } from './routes/finance-integrity';


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

// Security plugins (register first)
await app.register(securityPlugin);
await app.register(validationPlugin);

// Core plugins
// Configure CORS to support multiple domains
const corsOrigins = env.API_CORS_ORIGIN.includes(',') 
  ? env.API_CORS_ORIGIN.split(',').map(origin => origin.trim())
  : [env.API_CORS_ORIGIN];

app.log.info({ corsOrigins }, 'Configuring CORS with origins');

await app.register(cors, { 
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true);
    
    // Check if origin is in allowed list
    if (corsOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // Log rejected origins for debugging
    app.log.warn({ origin, allowedOrigins: corsOrigins }, 'CORS request rejected');
    return callback(new Error('Not allowed by CORS'), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
});
await app.register(cookie);
await app.register(jwt, {
  secret: env.JWT_SECRET,
  cookie: { cookieName: "session", signed: false },
});
await app.register(websocket);

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
await app.register(projectsRoutes, { prefix: '/api' });
await app.register(liftTokenRoutes, { prefix: '/api' });
await app.register(blockchainRoutes, { prefix: '/api' });
await app.register(mintRequestRoutes, { prefix: '/api' });
await app.register(paymentRoutes, { prefix: '/api' });
await app.register(indexerRoutes, { prefix: '/api' });
await app.register(websocketRoutes, { prefix: '/api' });
await app.register(analyticsRoutes, { prefix: '/api' });
await app.register(rolesRoutes, { prefix: '/api' });
await app.register(vendorRoutes, { prefix: '/api/vendors' });
await app.register(contractRoutes, { prefix: '/api/contracts' });
await app.register(invoiceRoutes, { prefix: '/api/invoices' });
await app.register(financePaymentRoutes, { prefix: '/api/finance' });
await app.register(reconciliationRoutes, { prefix: '/api/reconciliation' });
await app.register(governanceRoutes, { prefix: '/api' });
await app.register(financeLoopRoutes, { prefix: '/api/finance' });
await app.register(financeIntegrityRoutes, { prefix: '/api/finance' });

// Cost tracking routes
import costTrackingRoutes from './routes/cost-tracking.js';
await app.register(costTrackingRoutes, { prefix: '/api' });

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