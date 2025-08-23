'use client';

import { SiweMessage } from 'siwe';
import { signMessage } from 'wagmi/actions';
import { signIn } from 'next-auth/react';
import { config } from '@/lib/wagmi';

async function getCsrfToken(): Promise<string> {
  // Same-origin call; ensures the CSRF cookie is set and we get the nonce value
  const res = await fetch('/api/auth/csrf', {
    method: 'GET',
    cache: 'no-store',
    credentials: 'same-origin', // explicit
  });
  const { csrfToken } = await res.json();
  return csrfToken; // <- use this as the SIWE nonce
}

async function getSiweConfig(): Promise<{ domain: string; origin: string }> {
  const res = await fetch('/api/siwe/config', {
    method: 'GET',
    cache: 'no-store',
    credentials: 'same-origin',
  });
  return res.json();
}

export async function siweLogin(address: `0x${string}`, chainId: number) {
  const nonce = await getCsrfToken();
  const { domain, origin } = await getSiweConfig();

  const message = new SiweMessage({
    domain,
    address,
    statement: 'Sign in with Ethereum to Orenna.',
    uri: origin,
    version: '1',
    chainId,
    nonce,
  });

  const signature = await signMessage(config, { message: message.prepareMessage() });

  const res = await signIn('siwe', {
    redirect: false,
    message: JSON.stringify(message),
    signature,
  });

  if (res?.error) throw new Error(res.error);
  return res;
}