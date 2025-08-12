import { FastifyInstance } from "fastify";
import { ExampleEchoSchema } from "@orenna/shared/src/schemas";
import { z } from "zod";

export default async function echoRoutes(app: FastifyInstance) {
  app.post(
    "/echo",
    {
      schema: {
        body: ExampleEchoSchema,
        response: { 200: z.object({ echoed: z.string() }) }
      }
    },
    async (req) => {
      const body = req.body as z.infer<typeof ExampleEchoSchema>;
      return { echoed: body.message };
    }
  );
}
