import { FastifyInstance } from "fastify";
import { z } from "zod";
import { parseMeta } from "../lib/schemas.ts";
import { randomBytes } from "crypto";

const CreateBody = z.object({
  tokenId: z.number().int(),
  amount: z.number().int().positive(),
  projectId: z.string().optional(),
  meta: z.record(z.any()).optional(),
});

const IdParams = z.object({ id: z.string().min(1) });

const ListQuery = z.object({
  status: z
    .enum(["PENDING", "APPROVED", "REJECTED", "EXECUTED", "CANCELED"])
    .optional(),
  mine: z.coerce.number().int().optional(),
});

const parseMaybeJSON = (v: unknown) => {
  if (typeof v !== "string") return v as any;
  try {
    return JSON.parse(v);
  } catch {
    return v as any;
  }
};

export default async function routes(app: FastifyInstance) {
  if (!("prisma" in app) || !app.prisma) {
    throw new Error("Prisma plugin not registered");
  }

  // create
  app.post(
    "/mint-requests",
    { preHandler: app.authenticate, schema: { body: CreateBody } },
    async (req, reply) => {
      const parsed = CreateBody.safeParse(req.body);
      if (!parsed.success) return reply.code(400).send(parsed.error.flatten());
      const metaStr =
        parsed.data.meta !== undefined
          ? JSON.stringify(parseMeta(parsed.data.meta))
          : undefined;
      const created = await app.prisma.mintRequest.create({
        data: {
          requesterId: req.user!.id,
          tokenId: parsed.data.tokenId,
          amount: parsed.data.amount,
          projectId: parsed.data.projectId,
          ...(metaStr ? { meta: metaStr } : {}),
        },
      });
      reply.header("Location", `/mint-requests/${created.id}`);
      return reply
        .code(201)
        .send({ ...created, meta: parseMaybeJSON(created.meta) });
    },
  );

  // get by id
  app.get(
    "/mint-requests/:id",
    { preHandler: app.authenticate, schema: { params: IdParams } },
    async (req, reply) => {
      const params = IdParams.safeParse(req.params);
      if (!params.success) return reply.code(400).send({ error: "Invalid id" });
      const row = await app.prisma.mintRequest.findUnique({
        where: { id: params.data.id },
      });
      if (!row) return reply.code(404).send({ error: "Not found" });
      return { ...row, meta: parseMaybeJSON(row.meta) };
    },
  );

  // list
  app.get(
    "/mint-requests",
    { preHandler: app.authenticate, schema: { querystring: ListQuery } },
    async (req, reply) => {
      const query = ListQuery.safeParse(req.query);
      if (!query.success) return reply.code(400).send(query.error.flatten());
      const where: any = {};
      if (query.data.status) where.status = query.data.status;
      if (query.data.mine === 1) where.requesterId = req.user!.id;
      const rows = await app.prisma.mintRequest.findMany({
        where,
        orderBy: { createdAt: "desc" },
      });
      return rows.map((r) => ({ ...r, meta: parseMaybeJSON(r.meta) }));
    },
  );

  // approve
  app.post(
    "/mint-requests/:id/approve",
    { preHandler: app.authenticate, schema: { params: IdParams } },
    async (req, reply) => {
      if (!req.user?.isAdmin)
        return reply.code(403).send({ error: "Forbidden" });
      const params = IdParams.safeParse(req.params);
      if (!params.success) return reply.code(400).send({ error: "Invalid id" });
      const mr = await app.prisma.mintRequest.findUnique({
        where: { id: params.data.id },
      });
      if (!mr) return reply.code(404).send({ error: "Not found" });
      if (mr.status !== "PENDING")
        return reply.code(400).send({ error: "Invalid status" });
      const updated = await app.prisma.mintRequest.update({
        where: { id: params.data.id },
        data: {
          status: "APPROVED",
          approvedById: req.user.id,
          approvedAt: new Date(),
        },
      });
      return { ...updated, meta: parseMaybeJSON(updated.meta) };
    },
  );

  // reject
  app.post(
    "/mint-requests/:id/reject",
    { preHandler: app.authenticate, schema: { params: IdParams } },
    async (req, reply) => {
      const params = IdParams.safeParse(req.params);
      if (!params.success) return reply.code(400).send({ error: "Invalid id" });
      const mr = await app.prisma.mintRequest.findUnique({
        where: { id: params.data.id },
      });
      if (!mr) return reply.code(404).send({ error: "Not found" });
      if (mr.status !== "PENDING")
        return reply.code(400).send({ error: "Invalid status" });
      if (!req.user?.isAdmin && mr.requesterId !== req.user?.id)
        return reply.code(403).send({ error: "Forbidden" });
      const updated = await app.prisma.mintRequest.update({
        where: { id: params.data.id },
        data: { status: "REJECTED" },
      });
      return { ...updated, meta: parseMaybeJSON(updated.meta) };
    },
  );

  // execute
  app.post(
    "/mint-requests/:id/execute",
    { preHandler: app.authenticate, schema: { params: IdParams } },
    async (req, reply) => {
      if (process.env.ALLOW_EXECUTE !== "true")
        return reply.code(403).send({ error: "Execution disabled" });
      if (!req.user?.isAdmin)
        return reply.code(403).send({ error: "Forbidden" });
      const params = IdParams.safeParse(req.params);
      if (!params.success) return reply.code(400).send({ error: "Invalid id" });
      const mr = await app.prisma.mintRequest.findUnique({
        where: { id: params.data.id },
      });
      if (!mr) return reply.code(404).send({ error: "Not found" });
      if (mr.status !== "APPROVED")
        return reply.code(400).send({ error: "Invalid status" });
      const txHash = "0x" + randomBytes(32).toString("hex");
      const updated = await app.prisma.mintRequest.update({
        where: { id: params.data.id },
        data: { status: "EXECUTED", executedAt: new Date(), txHash },
      });
      return { ...updated, meta: parseMaybeJSON(updated.meta) };
    },
  );
}
