import fp from "fastify-plugin";
import swagger from "@fastify/swagger";
import swaggerUI from "@fastify/swagger-ui";
import { jsonSchemaTransform } from "fastify-type-provider-zod";
import type { FastifyPluginAsync } from "fastify";

const swaggerPlugin: FastifyPluginAsync = async (app) => {
  const host = process.env.API_HOST ?? "localhost";
  const port = Number(process.env.API_PORT ?? 3000);

  await app.register(swagger, {
    transform: jsonSchemaTransform,
    openapi: {
      info: {
        title: "Orenna API",
        version: "0.1.0",
        description:
          "MVP API for Orenna. Health, Projects CRUD, and Lift Unit issue/retire.",
      },
      servers: [{ url: `http://${host}:${port}`, description: "Local dev" }],
      tags: [
        { name: "Health", description: "Liveness and readiness" },
        { name: "Projects", description: "Projects CRUD and metadata" },
        { name: "Lift Units", description: "Issue and retire flows" },
        { name: "Utilities", description: "Debug helpers" },
      ],
      components: {
        schemas: {
          ErrorResponse: {
            type: "object",
            properties: {
              statusCode: { type: "integer" },
              error: { type: "string" },
              message: { type: "string" },
            },
            required: ["statusCode", "error", "message"],
          },
        },
      },
    },
  });

  await app.register(swaggerUI, {
    routePrefix: "/docs",
    uiConfig: { docExpansion: "list", deepLinking: false },
    staticCSP: true,
    transformSpecification: (spec) => spec,
    transformSpecificationClone: true,
  });
};

export default fp(swaggerPlugin);
