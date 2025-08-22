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

          // Read NextAuth's CSRF/nonce cookie (works in dev/https)
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
} satisfies NextAuthConfig;

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);