import { FastifyInstance } from "fastify";

export default async function echoRoutes(app: FastifyInstance) {
  app.post("/echo", async (req) => {
    const body = req.body as any;
    return { echoed: body?.message || "No message provided" };
  });
}