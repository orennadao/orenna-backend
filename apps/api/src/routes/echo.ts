import type { FastifyInstance } from "fastify";
import { ExampleEchoSchema } from "@orenna/shared/src/schemas";

export default async function echoRoutes(app: FastifyInstance) {
  app.post(
    "/echo",
    {
      schema: {
        tags: ["Utilities"],
        body: ExampleEchoSchema,
        response: { 200: ExampleEchoSchema },
      },
    },
    async (req) => req.body
  );
}
