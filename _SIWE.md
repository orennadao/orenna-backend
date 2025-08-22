
## 0) Install + align versions

```bash
pnpm add next-auth @rainbow-me/rainbowkit \
  @rainbow-me/rainbowkit-siwe-next-auth wagmi viem \
  @tanstack/react-query siwe jose
```

* RainbowKit SIWE provider docs & package: first-class NextAuth integration. ([rainbowkit.com][1], [npm][2])
* Use Auth.js v5 naming (`AUTH_*` envs). ([Auth.js][3])

## 1) Env vars (add to all envs)

```
AUTH_SECRET= # pnpm dlx auth secret  (or openssl rand -base64 32)
AUTH_TRUST_HOST=true           # reverse proxy / previews
WALLETCONNECT_PROJECT_ID=...   # for RainbowKit default connectors
```

* `AUTH_SECRET` is the only mandatory one in v5; `AUTH_TRUST_HOST` makes host inference work behind proxies. ([Auth.js][4])

## 2) Create root auth config (App Router, v5 style)

**/auth.ts**

````ts
import NextAuth, { type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { SiweMessage } from "siwe";
import { cookies, headers } from "next/headers";

export const authConfig = {
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      id: "siwe",
      name: "Ethereum",
      credentials: {
        message: { label: "Message", type: "text" },
        signature: { label: "Signature", type: "text" }
      },
      async authorize(creds) {
        try {
          const message = new SiweMessage(
            JSON.parse(String(creds?.message ?? "{}"))
          );
          const signature = String(creds?.signature ?? "");

          // Expect the message domain to match the request host
          const h = headers();
          const host = h.get("x-forwarded-host") ?? h.get("host") ?? "";
          const expectedDomain = host.split(",")[0]?.trim();
          if (!expectedDomain) return null;

          // Read NextAuth’s CSRF/nonce cookie (works in dev/https)
          const csrf =
            cookies().get("__Host-next-auth.csrf-token")?.value ??
            cookies().get("next-auth.csrf-token")?.value ?? "";
          const expectedNonce = csrf.split("|")[0] ?? "";

          // SIWE verification (EIP-4361)
          const result = await message.verify({
            signature,
            domain: expectedDomain,
            nonce: expectedNonce,
          });

          if (!result.success) return null;

          // Return a "user" object for JWT subject
          return { id: message.address, address: message.address };
        } catch {
          return null;
        }
      },
    }),
  ],
  // Make the wallet address accessible on the JWT/session
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) token.sub = user.id;
      return token;
    },
    async session({ session, token }) {
      // surface the address on session.user
      (session as any).address = token.sub;
      return session;
    },
  },
  // Helpful cookie hardening defaults are already in NextAuth;
  // keep defaults and serve over HTTPS in prod.   
- Using SIWE spec fields (`domain`, `nonce`) straight from EIP-4361; nonce ties to NextAuth CSRF cookie. :contentReference[oaicite:5]{index=5}

**/app/api/auth/[...nextauth]/route.ts**
```ts
export { handlers as GET, handlers as POST } from "@/auth";
````

* Minimal route handler per v5. ([next-auth.js.org][5])

## 3) Providers & RainbowKit SIWE wiring

**/app/providers.tsx** (client)

```tsx
"use client";

import "@rainbow-me/rainbowkit/styles.css";
import {
  RainbowKitProvider,
} from "@rainbow-me/rainbowkit";
import {
  RainbowKitSiweNextAuthProvider,
} from "@rainbow-me/rainbowkit-siwe-next-auth";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SessionProvider } from "next-auth/react";
import { config } from "@/lib/wagmi";

const queryClient = new QueryClient();

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <SessionProvider refetchInterval={0}>
        <QueryClientProvider client={queryClient}>
          <RainbowKitSiweNextAuthProvider>
            <RainbowKitProvider>{children}</RainbowKitProvider>
          </RainbowKitSiweNextAuthProvider>
        </QueryClientProvider>
      </SessionProvider>
    </WagmiProvider>
  );
}
```

* RainbowKit’s SIWE provider expects to be inside NextAuth’s `SessionProvider`. ([rainbowkit.com][1])

**/app/layout.tsx**

```tsx
import Providers from "./providers";
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en"><body><Providers>{children}</Providers></body></html>
  );
}
```

## 4) Wagmi/RainbowKit config (WC v2, SSR-safe)

**/lib/wagmi.ts**

```ts
import { http } from "viem";
import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { mainnet, base, polygon, arbitrum, optimism, sepolia } from "wagmi/chains";

export const config = getDefaultConfig({
  appName: "Orenna",
  projectId: process.env.NEXT_PUBLIC_WC_PROJECT_ID ?? process.env.WALLETCONNECT_PROJECT_ID!,
  chains: [mainnet, base, polygon, arbitrum, optimism, sepolia],
  ssr: true,
  transports: {
    [mainnet.id]: http(),
    [base.id]: http(),
    [polygon.id]: http(),
    [arbitrum.id]: http(),
    [optimism.id]: http(),
    [sepolia.id]: http(),
  },
});
```

* RainbowKit quick-start shows `getDefaultConfig` + `ssr: true` + WalletConnect `projectId`. ([rainbowkit.com][6])

## 5) UI hook-up (any page)

Render a Connect button anywhere:

```tsx
"use client";
import { ConnectButton } from "@rainbow-me/rainbowkit";
export default function HeaderWallet() { return <ConnectButton />; }
```

* Connect button per docs. ([rainbowkit.com][6])

## 6) Route protection (optional now, easy later)

**/middleware.ts** (if you want auth-gated sections)

```ts
export { auth as middleware } from "@/auth";
export const config = {
  matcher: ["/app/:path*"], // protect everything under /app
};
```

* v5 middleware export pattern. ([Stack Overflow][7])

## 7) Using the session server-side / in API calls

* In the **Next.js app**, call `auth()` in server components or route handlers to read the session (the `sub` is the wallet address):

```ts
import { auth } from "@/auth";
export async function GET() {
  const session = await auth();
  // session?.user, session?.address (from callback)
  ...
}
```

* For your **separate API service** (Fastify), pass the Auth.js JWT in `Authorization: Bearer <token>` and verify with `jose` + `AUTH_SECRET`. The token has `sub = <wallet address>`. (Auth.js v5 JWT guidance & envs). ([Auth.js][4])

## 8) Smart contract wallets (1271 / 6492)

The RainbowKit SIWE package now supports ERC-1271 & ERC-6492 signature verification for SCWs — no extra code on your side. Good for Safe, Passkeys, etc. ([GitHub][8])

---

# Common SIWE failure points this fixes

* **Domain/origin mismatch**: We compare `message.domain` with the actual `Host` header before verifying. (Required by EIP-4361). ([Ethereum Improvement Proposals][9])
* **Nonce replay**: We bind the SIWE `nonce` to NextAuth’s CSRF cookie value that RainbowKit uses; single-use per login. ([next-auth.js.org][10], [rainbowkit.com][1])
* **Proxy/preview deploys**: `AUTH_TRUST_HOST=true` so Auth.js trusts `X-Forwarded-*` and infers the right host. ([Auth.js][4])
* **Edge vs Node**: Keep verification on Node runtime (route handlers as above) so SIWE crypto works reliably. (Auth.js App Router route handlers). ([next-auth.js.org][5])

---

# Minimal e2e to keep it stable

1. **Round-trip test**: nonce → sign → verify → session exists (address matches).
2. **Bad nonce**: mutate the nonce; expect 401.
3. **Wrong domain**: spoof `domain` in message; expect 401.
4. **SCW**: run a test wallet that signs via 1271 (OK to smoke-test later; supported upstream). ([GitHub][8])

---

## Notes on Prisma

* You can keep **JWT sessions** (no DB writes) per Credentials provider guidance. If you prefer DB sessions later, swap to an adapter for your user profiles, but for SIWE-only login JWT is simplest. ([next-auth.js.org][11])

---

If you want, I can also drop in a **Fastify `verifyAuth`** util (using `jose`) so your API service accepts the Auth.js JWT and populates `request.user = { address }`.

[1]: https://rainbowkit.com/en-US/docs/authentication "Authentication — RainbowKit"
[2]: https://www.npmjs.com/package/%40rainbow-me%2Frainbowkit-siwe-next-auth?utm_source=chatgpt.com "rainbow-me/rainbowkit-siwe-next-auth"
[3]: https://authjs.dev/getting-started/migrating-to-v5?utm_source=chatgpt.com "Migrate to NextAuth.js v5"
[4]: https://authjs.dev/getting-started/deployment?utm_source=chatgpt.com "Deployment"
[5]: https://next-auth.js.org/configuration/initialization?utm_source=chatgpt.com "Initialization | NextAuth.js"
[6]: https://rainbowkit.com/en-US/docs/installation?utm_source=chatgpt.com "Installation"
[7]: https://stackoverflow.com/questions/78162684/how-to-implement-next-auth-v-5-for-external-api-login-in-next-js-14-and-app-rout?utm_source=chatgpt.com "How to implement Next Auth v.5 for external API login in ..."
[8]: https://github.com/rainbow-me/rainbowkit/blob/main/packages/rainbowkit-siwe-next-auth/CHANGELOG.md?utm_source=chatgpt.com "CHANGELOG.md - rainbow-me/rainbowkit-siwe-next-auth"
[9]: https://eips.ethereum.org/EIPS/eip-4361?utm_source=chatgpt.com "ERC-4361: Sign-In with Ethereum"
[10]: https://next-auth.js.org/configuration/options?utm_source=chatgpt.com "Options | NextAuth.js"
[11]: https://next-auth.js.org/providers/credentials?utm_source=chatgpt.com "Credentials"
