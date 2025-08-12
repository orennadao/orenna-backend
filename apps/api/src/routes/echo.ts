import { FastifyInstance } from "fastify";
import { z } from "zod";

export default async function echoRoutes(app: FastifyInstance) {
  app.post(
    "/echo",
    {
      schema: {
        body: z.object({ message: z.string() }),
        response: {
          200: z.object({ echoed: z.string() }),
        },
      },
    },
    async (req) => {
      const { message } = req.body as any;
      return { echoed: message };
    }
  );
}
