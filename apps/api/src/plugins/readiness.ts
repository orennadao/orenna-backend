import fp from 'fastify-plugin';
import { prisma } from '@orenna/db';

export default fp(async (app) => {
  app.get('/ready', async () => {
    await prisma.$queryRaw`SELECT 1`;
    return { ok: true };
  });
});