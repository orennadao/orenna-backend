import { describe, it, expect } from 'vitest';
import Fastify from 'fastify';
import healthRoutes from '../src/routes/health.ts';
import readiness from '../src/plugins/readiness.ts';

describe('health', () => {
  it('liveness returns ok', async () => {
    const app = Fastify();
    await app.register(healthRoutes);
    const res = await app.inject({ method: 'GET', url: '/health/liveness' });
    expect(res.statusCode).toBe(200);
    expect(res.json().ok).toBe(true);
  });

  it('readiness retries until db ready', async () => {
    const app = Fastify();
    let tries = 0;
    app.decorate('prisma', {
      $queryRaw: async () => {
        tries++;
        if (tries < 3) throw new Error('not ready');
        return 1;
      }
    });
    await app.register(readiness);
    const res = await app.inject({ method: 'GET', url: '/health/readiness' });
    expect(res.statusCode).toBe(200);
    expect(tries).toBeGreaterThan(1);
  });
});
