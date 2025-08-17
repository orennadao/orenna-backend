import { FastifyInstance } from "fastify";
import { z } from "zod";
import {
  ProjectCreate,
  ProjectUpdate,
  parseMeta,
} from "../lib/schemas.ts";

// --- Zod helpers for route docs/validation ---
const IdParams = z.object({ id: z.coerce.number().int().positive() });

const ListQuery = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
  search: z.string().max(100).optional(),
  sort: z.enum(["createdAt:desc", "createdAt:asc"]).default("createdAt:desc"),
});

// Minimal output shape; `meta` will be an object in responses
const ProjectOut = ProjectCreate.extend({
  id: z.number().int().positive(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
}).passthrough();

const NotFound = z.object({ error: z.string() });
const Ok = z.object({ ok: z.literal(true) });

// Parse TEXT->JSON for meta on reads
const parseMaybeJSON = (v: unknown) => {
  if (typeof v !== "string") return v as any;
  try { return JSON.parse(v); } catch { return v as any; }
};

export default async function routes(app: FastifyInstance) {
  // Guard: prisma must be attached
  if (!("prisma" in app) || !app.prisma) {
    app.log.error("Prisma not attached to Fastify instance");
    throw new Error("Prisma plugin not registered");
  }

  // GET /projects
  app.get(
    "/projects",
    {
      schema: {
        tags: ["Projects"],
        querystring: {
          type: 'object',
          properties: {
            limit: { type: 'number', minimum: 1, maximum: 100, default: 20 },
            offset: { type: 'number', minimum: 0, default: 0 },
            search: { type: 'string', maxLength: 100 },
            sort: { type: 'string', enum: ["createdAt:desc", "createdAt:asc"], default: "createdAt:desc" }
          }
        },
        response: { 
          200: { 
            type: 'object',
            properties: {
              data: {
                type: 'object',
                properties: {
                  data: {
                    type: 'array',
                    items: { type: 'object' }
                  },
                  pagination: {
                    type: 'object',
                    properties: {
                      page: { type: 'number' },
                      limit: { type: 'number' },
                      total: { type: 'number' },
                      totalPages: { type: 'number' }
                    }
                  }
                }
              }
            }
          } 
        },
      },
    },
    async (req, reply) => {
      const parsed = ListQuery.safeParse(req.query);
      if (!parsed.success) return reply.code(400).send(parsed.error.flatten());

      const { limit, offset, search, sort } = parsed.data;
      const orderBy = { createdAt: sort === "createdAt:asc" ? "asc" : "desc" } as const;

      const where = search?.trim()
        ? {
            OR: [
              { name: { contains: search } },
              { slug: { contains: search } },
            ],
          }
        : undefined;

      const [rows, total] = await Promise.all([
        app.prisma.project.findMany({ where, orderBy, take: limit, skip: offset }),
        app.prisma.project.count({ where })
      ]);
      
      const projects = rows.map(r => ({ ...r, meta: parseMaybeJSON(r.meta) }));
      
      return {
        data: {
          data: projects,
          pagination: {
            page: Math.floor(offset / limit) + 1,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
          }
        }
      };
    }
  );

  // POST /projects
  app.post(
    "/projects",
    {
      schema: {
        tags: ["Projects"],
        body: { type: 'object' },
        response: {
          201: { type: 'object' },
          400: { type: 'object' },
          409: { type: 'object', properties: { error: { type: 'string' } } },
        },
      },
    },
    async (req, reply) => {
      const parsed = ProjectCreate.safeParse(req.body);
      if (!parsed.success) return reply.code(400).send(parsed.error.flatten());

      const metaStr =
        parsed.data.meta !== undefined ? JSON.stringify(parseMeta(parsed.data.meta)) : undefined;

      try {
        const created = await app.prisma.project.create({
          data: { ...parsed.data, ...(metaStr ? { meta: metaStr } : {}) },
        });
        reply.header("Location", `/projects/${created.id}`);
        return reply.code(201).send({ ...created, meta: parseMaybeJSON(created.meta) });
      } catch (err: any) {
        if (err?.code === "P2002") {
          return reply.code(409).send({ error: "Slug already exists" });
        }
        throw err;
      }
    }
  );

  // GET /projects/:id
  app.get(
    "/projects/:id",
    {
      schema: {
        tags: ["Projects"],
        params: { type: 'object', properties: { id: { type: 'number' } }, required: ['id'] },
        response: { 
          200: { type: 'object' }, 
          400: { type: 'object', properties: { error: { type: 'string' } } }, 
          404: { type: 'object', properties: { error: { type: 'string' } } }
        },
      },
    },
    async (req, reply) => {
      const params = IdParams.safeParse(req.params);
      if (!params.success) return reply.code(400).send({ error: "Invalid id" });

      const project = await app.prisma.project.findUnique({ where: { id: params.data.id } });
      if (!project) return reply.code(404).send({ error: "Not found" });
      return { ...project, meta: parseMaybeJSON(project.meta) };
    }
  );

  // PUT /projects/:id
  app.put(
    "/projects/:id",
    {
      schema: {
        tags: ["Projects"],
        params: { type: 'object', properties: { id: { type: 'number' } }, required: ['id'] },
        body: { type: 'object' },
        response: { 
          200: { type: 'object' }, 
          400: { type: 'object' }, 
          404: { type: 'object', properties: { error: { type: 'string' } } }
        },
      },
    },
    async (req, reply) => {
      const params = IdParams.safeParse(req.params);
      if (!params.success) return reply.code(400).send({ error: "Invalid id" });

      const body = ProjectUpdate.safeParse(req.body);
      if (!body.success) return reply.code(400).send(body.error.flatten());

      // Ignore any `id` in body if your ProjectUpdate includes it
      const { id: _ignore, ...rest } = body.data as any;

      const metaStr =
        rest.meta !== undefined ? JSON.stringify(parseMeta(rest.meta)) : undefined;

      const data = { ...rest, ...(metaStr !== undefined ? { meta: metaStr } : {}) };

      try {
        const updated = await app.prisma.project.update({
          where: { id: params.data.id },
          data,
        });
        return { ...updated, meta: parseMaybeJSON(updated.meta) };
      } catch {
        return reply.code(404).send({ error: "Not found" });
      }
    }
  );

  // DELETE /projects/:id
  app.delete(
    "/projects/:id",
    {
      schema: {
        tags: ["Projects"],
        params: { type: 'object', properties: { id: { type: 'number' } }, required: ['id'] },
        response: { 
          200: { type: 'object', properties: { ok: { type: 'boolean' } } }, 
          404: { type: 'object', properties: { error: { type: 'string' } } }
        },
      },
    },
    async (req, reply) => {
      const params = IdParams.safeParse(req.params);
      if (!params.success) return reply.code(400).send({ error: "Invalid id" });

      try {
        await app.prisma.project.delete({ where: { id: params.data.id } });
        return { ok: true };
      } catch {
        return reply.code(404).send({ error: "Not found" });
      }
    }
  );
}
