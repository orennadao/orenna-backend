import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // In a real implementation, these would come from your database
    const featured = [
      {
        id: 'prairie-restoration',
        kind: 'lift-token',
        title: 'Prairie Restoration Initiative',
        blurb: 'Converting 500 acres of degraded farmland back to native prairie ecosystem',
        img: '/images/prairie-restoration.svg',
        metricLabel: 'LT Retired',
        metricValue: '12,450'
      },
      {
        id: 'california-watershed-forward',
        kind: 'forward',
        title: 'California Watershed Forward',
        blurb: 'Large-scale watershed restoration project in Northern California focusing on groundwater recharge',
        img: '/images/california-watershed.svg',
        metricLabel: 'Funding Goal',
        metricValue: '$750k'
      },
      {
        id: 'soil-carbon-pilot',
        kind: 'project',
        title: 'Soil Carbon Pilot',
        blurb: 'Testing regenerative practices on 1,200 acres with real-time monitoring',
        img: '/images/soil-carbon.svg',
        metricLabel: 'Allocated',
        metricValue: '$285k'
      },
      {
        id: 'wetland-restoration',
        kind: 'lift-token',
        title: 'Wetland Restoration Project',
        blurb: 'Restoring 200 acres of wetlands for biodiversity and water quality',
        img: '/images/wetland-restoration.jpg',
        metricLabel: 'LT Available',
        metricValue: '8,750'
      },
      {
        id: 'regenerative-grazing',
        kind: 'project',
        title: 'Regenerative Grazing Initiative',
        blurb: 'Implementing rotational grazing across 1,500 acres',
        img: '/images/regenerative-grazing.jpg',
        metricLabel: 'Acres Managed',
        metricValue: '1,500'
      },
      {
        id: 'rural-solar-forward',
        kind: 'forward',
        title: 'Rural Solar Microgrid Forward',
        blurb: 'Community solar microgrid project providing clean energy access to rural communities in Kenya',
        img: '/images/rural-solar.jpg',
        metricLabel: 'Funding Goal',
        metricValue: '$250k'
      }
    ];

    return NextResponse.json(featured);
  } catch (error) {
    console.error('Error fetching featured projects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch featured projects' },
      { status: 500 }
    );
  }
}