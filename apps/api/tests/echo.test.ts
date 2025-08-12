import { describe, it, expect } from 'vitest';
import Fastify from 'fastify';
import echoRoutes from '../src/routes/echo.ts';
import { ZodTypeProvider, validatorCompiler, serializerCompiler } from 'fastify-type-provider-zod';

describe('echo', () => {
  it('echoes message', async () => {
    const app = Fastify().withTypeProvider<ZodTypeProvider>();
    app.setValidatorCompiler(validatorCompiler);
    app.setSerializerCompiler(serializerCompiler);
    await app.register(echoRoutes);
    const res = await app.inject({ method: 'POST', url: '/echo', payload: { message: 'hi' } });
    expect(res.statusCode).toBe(200);
    expect(res.json().echoed).toBe('hi');
  });

  it('validates payload', async () => {
    const app = Fastify().withTypeProvider<ZodTypeProvider>();
    app.setValidatorCompiler(validatorCompiler);
    app.setSerializerCompiler(serializerCompiler);
    await app.register(echoRoutes);
    const res = await app.inject({ method: 'POST', url: '/echo', payload: {} });
    expect(res.statusCode).toBe(400);
  });
});
