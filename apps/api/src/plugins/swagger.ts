import fp from "fastify-plugin";
import swagger from "@fastify/swagger";
import swaggerUI from "@fastify/swagger-ui";
import type { FastifyPluginAsync } from "fastify";

const swaggerPlugin: FastifyPluginAsync = async (app) => {
  const host = process.env.API_HOST ?? "localhost";
  const port = Number(process.env.API_PORT ?? 3000);

  await app.register(swagger, {
    openapi: {
      info: {
        title: "Orenna API",
        version: "0.1.0",
        description: "Regenerative finance API for OrennaDAO",
      },
      servers: [{ url: `http://${host}:${port}`, description: "Local dev" }],
    },
  });

  await app.register(swaggerUI, {
    routePrefix: "/docs",
  });
};

export default fp(swaggerPlugin);