import { describe, it, expect } from 'vitest';
import Fastify from 'fastify';
import cookie from '@fastify/cookie';
import jwt from '@fastify/jwt';
import authRoutes from '../src/routes/auth.js';
import { Wallet } from 'ethers';
import { SiweMessage } from 'siwe';

const DOMAIN = 'localhost';

async function build() {
  const app = Fastify();
  await app.register(cookie);
  await app.register(jwt, { secret: 'test', cookie: { cookieName: 'token', signed: false } });
  await app.register(authRoutes);
  return app;
}

function createMessage(nonce: string, address: string, domain = DOMAIN) {
  return new SiweMessage({
    domain,
    address,
    statement: 'Sign in',
    uri: `http://${DOMAIN}`,
    version: '1',
    chainId: 1,
    nonce,
    issuedAt: new Date().toISOString()
  });
}

describe('siwe', () => {
  it('auth flow', async () => {
    process.env.DOMAIN = DOMAIN;
    const app = await build();
    const nonceRes = await app.inject({ method: 'POST', url: '/auth/nonce' });
    const { nonce } = nonceRes.json();
    const wallet = Wallet.createRandom();
    const msg = createMessage(nonce, wallet.address);
    const signature = await wallet.signMessage(msg.toMessage());
    const verifyRes = await app.inject({
      method: 'POST',
      url: '/auth/verify',
      payload: { message: msg.toMessage(), signature },
      headers: { host: DOMAIN, origin: `http://${DOMAIN}` }
    });
    expect(verifyRes.statusCode).toBe(200);
    const cookieHeader = verifyRes.headers['set-cookie'] as string;
    const meRes = await app.inject({ method: 'GET', url: '/me', headers: { cookie: cookieHeader } });
    expect(meRes.statusCode).toBe(200);
    expect(meRes.json().address).toBe(wallet.address.toLowerCase());
  });

  it('bad signature', async () => {
    process.env.DOMAIN = DOMAIN;
    const app = await build();
    const nonce = (await app.inject({ method: 'POST', url: '/auth/nonce' })).json().nonce;
    const wallet = Wallet.createRandom();
    const other = Wallet.createRandom();
    const msg = createMessage(nonce, wallet.address);
    const signature = await other.signMessage(msg.toMessage());
    const res = await app.inject({
      method: 'POST',
      url: '/auth/verify',
      payload: { message: msg.toMessage(), signature },
      headers: { host: DOMAIN, origin: `http://${DOMAIN}` }
    });
    expect(res.statusCode).toBe(401);
  });

  it('wrong domain/origin', async () => {
    process.env.DOMAIN = DOMAIN;
    const app = await build();
    const nonce = (await app.inject({ method: 'POST', url: '/auth/nonce' })).json().nonce;
    const wallet = Wallet.createRandom();
    const msg = createMessage(nonce, wallet.address, 'evil.com');
    const signature = await wallet.signMessage(msg.toMessage());
    const res = await app.inject({
      method: 'POST',
      url: '/auth/verify',
      payload: { message: msg.toMessage(), signature },
      headers: { host: 'evil.com', origin: 'http://evil.com' }
    });
    expect(res.statusCode).toBe(401);
  });

  it('expired nonce', async () => {
    process.env.DOMAIN = DOMAIN;
    const app = await build();
    const nonceRes = await app.inject({ method: 'POST', url: '/auth/nonce' });
    const { nonce } = nonceRes.json();
    await new Promise((r) => setTimeout(r, 1100));
    const wallet = Wallet.createRandom();
    const msg = createMessage(nonce, wallet.address);
    const signature = await wallet.signMessage(msg.toMessage());
    const res = await app.inject({
      method: 'POST',
      url: '/auth/verify',
      payload: { message: msg.toMessage(), signature },
      headers: { host: DOMAIN, origin: `http://${DOMAIN}` }
    });
    expect(res.statusCode).toBe(401);
  });

  it('reused nonce', async () => {
    process.env.DOMAIN = DOMAIN;
    const app = await build();
    const nonce = (await app.inject({ method: 'POST', url: '/auth/nonce' })).json().nonce;
    const wallet = Wallet.createRandom();
    const msg = createMessage(nonce, wallet.address);
    const signature = await wallet.signMessage(msg.toMessage());
    const ok = await app.inject({
      method: 'POST',
      url: '/auth/verify',
      payload: { message: msg.toMessage(), signature },
      headers: { host: DOMAIN, origin: `http://${DOMAIN}` }
    });
    expect(ok.statusCode).toBe(200);
    const res = await app.inject({
      method: 'POST',
      url: '/auth/verify',
      payload: { message: msg.toMessage(), signature },
      headers: { host: DOMAIN, origin: `http://${DOMAIN}` }
    });
    expect(res.statusCode).toBe(401);
  });
});
