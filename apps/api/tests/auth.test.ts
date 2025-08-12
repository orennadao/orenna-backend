import { describe, it, expect } from 'vitest';
import Fastify from 'fastify';
import cookie from '@fastify/cookie';
import jwt from '@fastify/jwt';
import authRoutes from '../src/routes/auth.ts';
import { ZodTypeProvider, validatorCompiler, serializerCompiler } from 'fastify-type-provider-zod';
import { privateKeyToAccount } from 'viem/accounts';
import { SiweMessage } from 'siwe';

describe('auth', () => {
  const buildApp = async () => {
    const app = Fastify().withTypeProvider<ZodTypeProvider>();
    app.setValidatorCompiler(validatorCompiler);
    app.setSerializerCompiler(serializerCompiler);
    await app.register(cookie);
    await app.register(jwt, { secret: 'test', cookie: { cookieName: 'session', signed: false } });
    const users = new Map<string, any>();
    app.decorate('prisma', {
      user: {
        upsert: async ({ where, create }: any) => {
          users.set(where.address, { address: where.address });
          return create;
        },
        findUnique: async ({ where }: any) => users.get(where.address) ?? null
      }
    });
    await app.register(authRoutes);
    return app;
  };

  it('nonce and verify', async () => {
    const app = await buildApp();
    const nonceRes = await app.inject({ method: 'POST', url: '/auth/nonce' });
    expect(nonceRes.statusCode).toBe(200);
    const nonce = nonceRes.json().nonce;
    const nonceCookie = nonceRes.cookies.find(c => c.name === 'nonce')!.value;
    const account = privateKeyToAccount('0x'.padEnd(66, '1'));
    const message = new SiweMessage({
      domain: 'localhost',
      address: account.address,
      statement: 'Sign in',
      uri: 'http://localhost',
      version: '1',
      chainId: 1,
      nonce
    });
    const signature = await account.signMessage({ message: message.prepareMessage() });
    const verifyRes = await app.inject({
      method: 'POST',
      url: '/auth/verify',
      payload: { message: message.prepareMessage(), signature },
      cookies: { nonce: nonceCookie }
    });
    expect(verifyRes.statusCode).toBe(200);
    const sessionCookie = verifyRes.cookies.find(c => c.name === 'session')!.value;
    const meRes = await app.inject({ method: 'GET', url: '/me', cookies: { session: sessionCookie } });
    expect(meRes.statusCode).toBe(200);
    expect(meRes.json().address).toBe(account.address.toLowerCase());
  });

  it('rejects bad signature', async () => {
    const app = await buildApp();
    const nonceRes = await app.inject({ method: 'POST', url: '/auth/nonce' });
    const nonce = nonceRes.json().nonce;
    const nonceCookie = nonceRes.cookies.find(c => c.name === 'nonce')!.value;
    const account = privateKeyToAccount('0x'.padEnd(66, '1'));
    const message = new SiweMessage({
      domain: 'localhost',
      address: account.address,
      statement: 'Sign in',
      uri: 'http://localhost',
      version: '1',
      chainId: 1,
      nonce
    });
    const signature = '0x' + '0'.repeat(130);
    const verifyRes = await app.inject({
      method: 'POST',
      url: '/auth/verify',
      payload: { message: message.prepareMessage(), signature },
      cookies: { nonce: nonceCookie }
    });
    expect(verifyRes.statusCode).toBe(401);
  });

  it('protects /me', async () => {
    const app = await buildApp();
    const res = await app.inject({ method: 'GET', url: '/me' });
    expect(res.statusCode).toBe(401);
  });
});
