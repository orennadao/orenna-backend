import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { SiweMessage } from "siwe";

export const runtime = "nodejs";     // ensure Node runtime (not Edge)
export const dynamic = "force-dynamic";
export const revalidate = 0;

export const authOptions = {
  trustHost: true,                   // Vercel behind proxy
  session: { strategy: "jwt" as const },
  providers: [
    Credentials({
      name: "siwe",
      credentials: {
        message: { label: "Message", type: "text" },
        signature: { label: "Signature", type: "text" },
      },
      async authorize(credentials, req) {
        const { message, signature } = credentials as { message: string; signature: string };
        const siwe = new SiweMessage(JSON.parse(message));

        // CSRF nonce from NextAuth (must match your client's /api/auth/csrf)
        const nonce = (req.headers.get("x-nextauth-csrf-token") ?? "").split("|")[0];

        // Keep domain/origin single-sourced (same as your /api/siwe/config)
        const res = await fetch(new URL("/api/siwe/config", process.env.NEXTAUTH_URL));
        const { domain } = await res.json();

        const result = await siwe.verify({ signature, domain, nonce });
        if (!result.success) return null;

        return { id: siwe.address, address: siwe.address };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user?.address) token.address = (user as any).address;
      return token;
    },
    async session({ session, token }) {
      (session as any).address = token.address;
      return session;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };   // CSRF uses GET