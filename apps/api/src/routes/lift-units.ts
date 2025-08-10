import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';

const prisma =
  (global as any).__prisma__ ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });
if (process.env.NODE_ENV !== 'production') (global as any).__prisma__ = prisma;

import { issuePayloadSchema, retirePayloadSchema, parseMeta } from '../lib/schemas.ts';

export default async function liftUnitRoutes(app: FastifyInstance) {
  // (keep your list/get/put/delete if you had them)

  app.post('/:id/issue', async (req, reply) => {
    const { id } = req.params as { id: string };
    const body = issuePayloadSchema.parse(req.body);

    const liftUnitId = Number(id);
    const eventAt = body.at ? new Date(body.at) : new Date();
    const txId = body.txId;

    try {
      // create event (idempotent via unique [liftUnitId, type, txId])
      const event = await prisma.liftUnitEvent.create({
        data: {
          liftUnitId,
          type: 'ISSUED',
          txId,
          payload: JSON.stringify(body),               // SQLite stores TEXT
          meta: parseMeta(body.meta),
          eventAt
        }
      });

      // update unit status/issuedAt
      const unit = await prisma.liftUnit.update({
        where: { id: liftUnitId },
        data: { status: 'ISSUED', issuedAt: eventAt }
      });

      return reply.code(200).send({ ok: true, id: unit.id, status: unit.status, eventId: event.id });
    } catch (e: any) {
      // if unique constraint hit: fetch existing event and return 200
      if (e?.code === 'P2002') {
        const existing = await prisma.liftUnitEvent.findFirst({
          where: { liftUnitId, type: 'ISSUED', txId }
        });
        return reply.code(200).send({ ok: true, id: liftUnitId, status: 'ISSUED', eventId: existing?.id, idempotent: true });
      }
      app.log.error(e);
      return reply.code(500).send({ ok: false, error: 'ISSUE_FAILED' });
    }
  });

  app.post('/:id/retire', async (req, reply) => {
    const unit = await prisma.liftUnit.findUnique({ where: { id: liftUnitId } });
    if (!unit) return reply.code(404).send({ ok: false, error: 'NOT_FOUND' });
    if (unit.status !== 'ISSUED') {
    return reply.code(409).send({ ok: false, error: 'INVALID_TRANSITION', from: unit.status, to: 'RETIRED' });
}
    const { id } = req.params as { id: string };
    const body = retirePayloadSchema.parse(req.body);
    const liftUnitId = Number(id);
    const eventAt = body.at ? new Date(body.at) : new Date();
    const txId = body.txId;
    try {
  
      const event = await prisma.liftUnitEvent.create({
        data: {
          liftUnitId,
          type: 'RETIRED',
          txId,
          payload: JSON.stringify(body),
          meta: parseMeta(body.meta),
          eventAt
        }
      });

      const unit = await prisma.liftUnit.update({
        where: { id: liftUnitId },
        data: { status: 'RETIRED', retiredAt: eventAt }
      });

      return reply.code(200).send({ ok: true, id: unit.id, status: unit.status, eventId: event.id });
    } catch (e: any) {
      if (e?.code === 'P2002') {
        const existing = await prisma.liftUnitEvent.findFirst({
          where: { liftUnitId, type: 'RETIRED', txId }
        });
        return reply.code(200).send({ ok: true, id: liftUnitId, status: 'RETIRED', eventId: existing?.id, idempotent: true });
      }
      app.log.error(e);
      return reply.code(500).send({ ok: false, error: 'RETIRE_FAILED' });
    }
  });
}
