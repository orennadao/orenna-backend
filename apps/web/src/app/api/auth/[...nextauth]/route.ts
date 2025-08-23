import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { SiweMessage } from "siwe";

// Force NextAuth to run on Node.js runtime (important for SIWE)
export const runtime = 'nodejs';
// Prevent caching of auth routes
export const dynamic = "force-dynamic";
export const revalidate = 0;

const handler = NextAuth({
  session: { strategy: "jwt" },
  cookies: {
    csrfToken: {
      name: '__Host-authjs.csrf-token',
      options: { path: '/', sameSite: 'lax', secure: true }, // no domain for host-only
    },
    sessionToken: {
      name: '__Host-authjs.session-token',
      options: { path: '/', sameSite: 'lax', secure: true }, // no domain for host-only
    },
  },
  providers: [
    CredentialsProvider({
      id: "siwe",
      name: "Ethereum",
      credentials: {
        message: { label: "Message", type: "text" },
        signature: { label: "Signature", type: "text" },
        csrfToken: { label: "CSRF Token", type: "text" }
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

          // Helper function to read CSRF token from cookies or body
          function readCsrf(req: any) {
            const cookieNames = [
              "__Host-authjs.csrf-token", // Our configured name (highest priority)
              "next-auth.csrf-token",
              "__Host-next-auth.csrf-token", 
              "authjs.csrf-token",
            ];
            
            // Try to read from cookies first
            const cookieToken = cookieNames
              .map(name => req.headers?.cookie
                ?.split(";")
                ?.find(c => c.trim().startsWith(`${name}=`))
                ?.split("=")[1]
              )
              .find(Boolean);
            
            if (cookieToken) {
              return cookieToken.split("%7C")[0] ?? cookieToken.split("|")[0] ?? "";
            }
            
            // Fallback to body parameter
            return String(credentials?.csrfToken ?? "");
          }

          const expectedNonce = readCsrf(req);
          if (!expectedNonce) {
            console.error("No CSRF token found in cookies or body");
            return null;
          }

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