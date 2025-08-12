import { describe, it, expect, beforeAll, afterAll } from "vitest";
import Fastify from "fastify";
import cors from "@fastify/cors";
import request from "supertest";
import {
  ZodTypeProvider,
  validatorCompiler,
  serializerCompiler,
} from "fastify-type-provider-zod";
import prismaPlugin from "../src/plugins/prisma.js";
import auth from "../src/plugins/auth.js";
import mintRoutes from "../src/routes/mint-requests.js";
import path from "path";

describe("mint requests flow", () => {
  const dbPath = path.resolve(__dirname, "../../../packages/db/prisma/dev.db");
  process.env.DATABASE_URL = `file:${dbPath}`;
  process.env.ALLOW_EXECUTE = "true";

  const app = Fastify().withTypeProvider<ZodTypeProvider>();
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  beforeAll(async () => {
    await app.register(cors);
    await app.register(prismaPlugin);
    await app.register(auth);
    await app.register(mintRoutes);
    await app.ready();
    await app.prisma.mintRequest.deleteMany();
    await app.prisma.user.deleteMany();
  });

  afterAll(() => app.close());

  const siwe = async (address: string, isAdmin = false) => {
    const res = await request(app.server)
      .post("/siwe")
      .send({ address, isAdmin });
    expect(res.status).toBe(200);
    return res.headers["set-cookie"][0];
  };

  it("create → list (mine) → approve (admin) → execute", async () => {
    const userCookie = await siwe("0x1111111111111111111111111111111111111111");
    const adminCookie = await siwe(
      "0x2222222222222222222222222222222222222222",
      true,
    );

    const created = await request(app.server)
      .post("/mint-requests")
      .set("Cookie", userCookie)
      .send({ tokenId: 1, amount: 5 });
    expect(created.status).toBe(201);
    const id = created.body.id;

    const list = await request(app.server)
      .get("/mint-requests?mine=1")
      .set("Cookie", userCookie);
    expect(list.status).toBe(200);
    expect(list.body.length).toBe(1);
    expect(list.body[0].status).toBe("PENDING");

    const approved = await request(app.server)
      .post(`/mint-requests/${id}/approve`)
      .set("Cookie", adminCookie);
    expect(approved.status).toBe(200);
    expect(approved.body.status).toBe("APPROVED");

    const executed = await request(app.server)
      .post(`/mint-requests/${id}/execute`)
      .set("Cookie", adminCookie);
    expect(executed.status).toBe(200);
    expect(executed.body.status).toBe("EXECUTED");
    expect(executed.body.txHash).toMatch(/^0x[0-9a-fA-F]{64}$/);
  });

  it("reject unauth and non-admin approve/execute wrong status", async () => {
    const cookie = await siwe("0x3333333333333333333333333333333333333333");
    const created = await request(app.server)
      .post("/mint-requests")
      .set("Cookie", cookie)
      .send({ tokenId: 2, amount: 3 });
    const id = created.body.id;

    const unauth = await request(app.server).post("/mint-requests");
    expect(unauth.status).toBe(401);

    const notAdmin = await request(app.server)
      .post(`/mint-requests/${id}/approve`)
      .set("Cookie", cookie);
    expect(notAdmin.status).toBe(403);

    const wrongStatus = await request(app.server)
      .post(`/mint-requests/${id}/execute`)
      .set("Cookie", cookie);
    expect(wrongStatus.status).toBe(403); // forbidden for non-admin

    const adminCookie = await siwe(
      "0x4444444444444444444444444444444444444444",
      true,
    );
    const badExec = await request(app.server)
      .post(`/mint-requests/${id}/execute`)
      .set("Cookie", adminCookie);
    expect(badExec.status).toBe(400);
  });
});
