// apps/api/src/server.ts
import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import swagger from "./plugins/swagger.ts";
import prismaPlugin from "./plugins/prisma.ts";
import readiness from "./plugins/readiness.ts";
import healthRoutes from "./routes/health.ts";
// import exampleRoutes from "./routes/example.ts"; // keep commented for now
import projectsRoutes from "./routes/projects.ts";
import devToolsRoutes from "./routes/dev-tools.ts";
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
  const status = (err as any).statusCode ?? 500;
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
await app.register(readiness);
await app.register(healthRoutes);
// if (process.env.NODE_ENV !== "production") {
//   await app.register(exampleRoutes, { prefix: "/example" });
// }
// await app.register(liftUnitRoutes, { prefix: "/lift-units" }); // re-enable later
await app.register(projectsRoutes);

// Register dev/diagnostic routes only in non-production environments
if (process.env.NODE_ENV !== "production") {
  await app.register(devToolsRoutes);
}



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
