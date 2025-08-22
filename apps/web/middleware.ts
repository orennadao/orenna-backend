import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 🚫 Never proxy NextAuth - let Next.js handle these routes locally
  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  // Continue with any other middleware logic
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|images|api/auth|api/siwe|api/webhooks|.*\\.(?:js|css|map|json|png|jpg|jpeg|svg|gif|ico)$).*)',
  ],
};