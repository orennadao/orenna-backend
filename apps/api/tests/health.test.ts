import { describe, it, expect } from 'vitest';
import Fastify from 'fastify';
import prismaPlugin from '../src/plugins/prisma.js';
import healthRoutes from '../src/routes/health.js';

describe('health', () => {
  it('liveness and readiness', async () => {
    process.env.DATABASE_URL = 'file:./dev.db';
    const app = Fastify();
    await app.register(prismaPlugin);
    await app.register(healthRoutes);

    const live = await app.inject({ method: 'GET', url: '/health/liveness' });
    expect(live.statusCode).toBe(200);

    let ready;
    for (let i = 0; i < 5; i++) {
      ready = await app.inject({ method: 'GET', url: '/health/readiness' });
      if (ready.statusCode === 200) break;
      await new Promise((r) => setTimeout(r, 100));
    }
    expect(ready.statusCode).toBe(200);
  });
});
