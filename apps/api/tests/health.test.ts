import { describe, it, expect } from 'vitest';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import swagger from '../src/plugins/swagger.js';
import healthRoutes from '../src/routes/health.js';

describe('health', () => {
  it('GET /health returns ok without DB', async () => {
    const app = Fastify();
    await app.register(cors);
    await app.register(swagger);
    await app.register(healthRoutes);

    const res = await app.inject({ method: 'GET', url: '/health' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.ok).toBe(true);
  });
});