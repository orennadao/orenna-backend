import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // In a real implementation, these would come from your database
    // For now, using static data that matches the landing page
    const stats = {
      fundingDeployed: 2850000,
      projects: 42,
      liftTokensIssued: 156789,
      liftTokensRetired: 123456,
      members: 2341
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}