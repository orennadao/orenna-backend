import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { SiweMessage } from "siwe";

const handler = NextAuth({
  session: { strategy: "jwt" },
  providers: [
    CredentialsProvider({
      id: "siwe",
      name: "Ethereum",
      credentials: {
        message: { label: "Message", type: "text" },
        signature: { label: "Signature", type: "text" }
      },
      async authorize(credentials, req) {
        try {
          const message = new SiweMessage(
            JSON.parse(String(credentials?.message ?? "{}"))
          );
          const signature = String(credentials?.signature ?? "");

          // Get domain from request headers
          const host = req.headers?.["x-forwarded-host"] ?? req.headers?.host ?? "";
          const expectedDomain = Array.isArray(host) ? host[0] : host.split(",")[0]?.trim();
          if (!expectedDomain) return null;

          // Get nonce from NextAuth CSRF cookie
          const csrfToken = req.headers?.cookie
            ?.split(";")
            ?.find(c => c.trim().startsWith("next-auth.csrf-token=") || c.trim().startsWith("__Host-next-auth.csrf-token="))
            ?.split("=")[1];
          const expectedNonce = csrfToken?.split("%7C")[0] ?? csrfToken?.split("|")[0] ?? "";

          // SIWE verification (EIP-4361)
          const result = await message.verify({
            signature,
            domain: expectedDomain,
            nonce: expectedNonce,
          });

          if (!result.success) return null;

          // Return a "user" object
          return { 
            id: message.address, 
            address: message.address,
            name: message.address 
          };
        } catch (error) {
          console.error("SIWE verification error:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user && 'address' in user) {
        token.address = user.address;
        token.sub = user.address;
      }
      return token;
    },
    async session({ session, token }) {
      if (token?.address) {
        (session as any).address = token.address;
        if (session.user) {
          (session.user as any).id = token.address;
        }
      }
      return session;
    },
  },
});

export { handler as GET, handler as POST };