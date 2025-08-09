import { FastifyInstance } from "fastify";
import { LiftUnitCreate, LiftUnitUpdate } from "../lib/schemas.js";

// small helper so we always return meta as an object (when valid JSON)
function parseMeta<T extends { meta: any }>(row: T) {
  if (!row?.meta) return row;
  try {
    return { ...row, meta: JSON.parse(row.meta as unknown as string) };
  } catch {
    return row; // if it wasn't valid JSON, just return the string as-is
  }
}

export default async function routes(app: FastifyInstance) {
  // LIST with simple filters
  app.get("/lift-units", async (req) => {
    const q = (req.query as any) ?? {};
    const where: any = {};
    if (q.projectId) where.projectId = Number(q.projectId);
    if (q.status) where.status = String(q.status);

    const items = await app.prisma.liftUnit.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return items.map(parseMeta);
  });

  // CREATE
  app.post("/lift-units", async (req, reply) => {
    const parsed = LiftUnitCreate.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send(parsed.error.flatten());

    const data: any = parsed.data;
    if (data.meta && typeof data.meta !== "string") {
      data.meta = JSON.stringify(data.meta);
    }

    const created = await app.prisma.liftUnit.create({ data });
    return parseMeta(created);
  });

  // READ ONE
  app.get("/lift-units/:id", async (req, reply) => {
    const id = Number((req.params as any).id);
    if (!Number.isFinite(id)) return reply.code(400).send({ error: "Invalid id" });

    const item = await app.prisma.liftUnit.findUnique({ where: { id } });
    if (!item) return reply.code(404).send({ error: "Not found" });

    return parseMeta(item);
  });

  // UPDATE
  app.put("/lift-units/:id", async (req, reply) => {
    const id = Number((req.params as any).id);
    if (!Number.isFinite(id)) return reply.code(400).send({ error: "Invalid id" });

    const parsed = LiftUnitUpdate.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send(parsed.error.flatten());

    const data: any = parsed.data;
    if (data.meta && typeof data.meta !== "string") {
      data.meta = JSON.stringify(data.meta);
    }

    try {
      const updated = await app.prisma.liftUnit.update({ where: { id }, data });
      return parseMeta(updated);
    } catch {
      return reply.code(404).send({ error: "Not found" });
    }
  });

  // DELETE
  app.delete("/lift-units/:id", async (req, reply) => {
    const id = Number((req.params as any).id);
    if (!Number.isFinite(id)) return reply.code(400).send({ error: "Invalid id" });

    try {
      await app.prisma.liftUnit.delete({ where: { id } });
      return { ok: true };
    } catch {
      return reply.code(404).send({ error: "Not found" });
    }
  });
}