// apps/api/src/server.ts
import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import swagger from "./plugins/swagger.ts";
import prismaPlugin from "./plugins/prisma.ts";
import health from "./plugins/health.ts";
import echoRoutes from "./routes/echo.ts";
import projectsRoutes from "./routes/projects.ts";
import { getEnv } from "./types/env.ts";
import { ZodTypeProvider, validatorCompiler, serializerCompiler } from "fastify-type-provider-zod";

const app = Fastify({
  logger: { level: "info", redact: ["req.headers.authorization"] },
}).withTypeProvider<ZodTypeProvider>();

// Zod compilers first
app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

const env = getEnv();
app.log.info({ DATABASE_URL: process.env.DATABASE_URL, cwd: process.cwd() }, "Booting API");



// Global error handler (great for surfacing Prisma/Zod issues)
app.setErrorHandler((err, _req, reply) => {
  app.log.error({ err }, "Unhandled error");
  const status = (err as { statusCode?: number }).statusCode ?? 500;
  reply.status(status).send({
    statusCode: status,
    error: err.name ?? "Error",
    message: err.message,
  });
});

// Core plugins
await app.register(cors, { origin: env.API_CORS_ORIGIN, credentials: true });
await app.register(prismaPlugin);
await app.register(swagger);

// Routes/plugins
await app.register(health, { prefix: "/health" });
if (env.NODE_ENV !== "production") {
  await app.register(echoRoutes);
}
await app.register(projectsRoutes);

// Debug helpers (hidden in prod)
app.get(
  "/__routes",
  { schema: { hide: process.env.NODE_ENV === "production" } },
  async () => app.printRoutes()
);



// Print routes once fully ready
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
