import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const domain = process.env.NEXTAUTH_URL 
    ? new URL(process.env.NEXTAUTH_URL).host 
    : 'localhost:3000';
    
  const origin = process.env.NEXTAUTH_URL || 'http://localhost:3000';

  return NextResponse.json({
    domain,
    origin,
  });
}