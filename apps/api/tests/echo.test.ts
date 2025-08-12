import { beforeAll, afterAll, describe, it, expect } from "vitest";
import Fastify from "fastify";
import cors from "@fastify/cors";
import echo from "../src/routes/echo";
import { ZodTypeProvider, validatorCompiler, serializerCompiler } from "fastify-type-provider-zod";
import supertest from "supertest";

describe("echo", () => {
  const app = Fastify().withTypeProvider<ZodTypeProvider>();

  beforeAll(async () => {
    app.setValidatorCompiler(validatorCompiler);
    app.setSerializerCompiler(serializerCompiler);
    await app.register(cors);
    await app.register(echo);
    await app.ready();
  });

  afterAll(() => app.close());

  it("POST /echo echoes message", async () => {
    const res = await supertest(app.server)
      .post("/echo")
      .send({ message: "hi" });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: "hi" });
  });
});
