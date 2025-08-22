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
  matcher: ["/api/:path*"], // Apply to all API routes, but early return skips /api/auth/*
};