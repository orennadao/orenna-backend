import { describe, it, expect } from 'vitest';
import Fastify from 'fastify';
import echoRoutes from '../src/routes/echo.js';
import { ZodTypeProvider, validatorCompiler, serializerCompiler } from 'fastify-type-provider-zod';

describe('echo', () => {
  const build = async () => {
    const app = Fastify().withTypeProvider<ZodTypeProvider>();
    app.setValidatorCompiler(validatorCompiler);
    app.setSerializerCompiler(serializerCompiler);
    await app.register(echoRoutes);
    return app;
  };

  it('happy path', async () => {
    const app = await build();
    const res = await app.inject({ method: 'POST', url: '/echo', payload: { message: 'hi' } });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ echoed: 'hi' });
  });

  it('bad payload', async () => {
    const app = await build();
    const res = await app.inject({ method: 'POST', url: '/echo', payload: {} });
    expect(res.statusCode).toBe(400);
    const body = res.json();
    expect(body.error).toBe('Bad Request');
  });
});
