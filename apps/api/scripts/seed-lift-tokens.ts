import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const liftTokensData = [
  {
    externalId: 'LFT001',
    tokenId: 'LFT001', 
    contractAddress: '0x742d35Cc0C2e2F5C6Ca8C8F5CCC93a4C9C4C7B3A',
    chainId: 1,
    status: 'MINTED',
    quantity: 5000,
    unit: 'tonnes_co2',
    meta: {
      name: 'Amazon Rainforest Carbon Credits',
      description: 'Verified carbon credits from REDD+ forest conservation project in the Brazilian Amazon rainforest.',
      location: 'Acre, Brazil',
      projectType: 'carbon',
      price: 28.50,
      currency: 'USD',
      availableSupply: 2500,
      totalSupply: 5000,
      retiredAmount: 1200,
      priceChange24h: 3.2,
      issuanceDate: '2024-09-15',
      verification: {
        status: 'verified',
        methodology: 'VCS REDD+',
        verifier: 'SCS Global Services',
        confidence: 0.95,
        verificationDate: '2024-09-10'
      },
      project: {
        name: 'Amazon Conservation Initiative',
        developer: 'Rainforest Alliance Brazil',
        nftId: 101,
        impactMetrics: [
          { type: 'CO2 Sequestered', value: 50000, unit: 'tonnes' },
          { type: 'Forest Area Protected', value: 10000, unit: 'hectares' },
          { type: 'Biodiversity Species', value: 1250, unit: 'species' }
        ]
      },
      trading: {
        volume24h: 156000,
        holders: 89,
        avgPrice: 27.80,
        retirementRate: 24.0
      },
      rating: 4.8
    },
    verificationMethodId: 'vcs-redd-plus',
    verifiedAt: new Date('2024-09-10'),
    issuedAt: new Date('2024-09-15')
  },
  {
    externalId: 'LFT002',
    tokenId: 'LFT002',
    contractAddress: '0x742d35Cc0C2e2F5C6Ca8C8F5CCC93a4C9C4C7B3A',
    chainId: 1,
    status: 'MINTED',
    quantity: 3000,
    unit: 'cubic_meters',
    meta: {
      name: 'California Aquifer Restoration Credits',
      description: 'Water restoration credits from groundwater recharge and wetland restoration in Central Valley.',
      location: 'California, USA',
      projectType: 'water',
      price: 22.75,
      currency: 'USD',
      availableSupply: 1800,
      totalSupply: 3000,
      retiredAmount: 850,
      priceChange24h: -1.5,
      issuanceDate: '2024-10-01',
      verification: {
        status: 'verified',
        methodology: 'VWBA v2.1',
        verifier: 'Water Verification Bureau',
        confidence: 0.92,
        verificationDate: '2024-09-25'
      },
      project: {
        name: 'Central Valley Water Recovery',
        developer: 'AquaRestore California',
        nftId: 102,
        impactMetrics: [
          { type: 'Water Volume Restored', value: 75000, unit: 'cubic meters' },
          { type: 'Wetland Area', value: 450, unit: 'hectares' },
          { type: 'Species Habitat', value: 180, unit: 'species' }
        ]
      },
      trading: {
        volume24h: 89000,
        holders: 67,
        avgPrice: 23.10,
        retirementRate: 28.3
      },
      rating: 4.6
    },
    verificationMethodId: 'vwba-v2',
    verifiedAt: new Date('2024-09-25'),
    issuedAt: new Date('2024-10-01')
  },
  {
    externalId: 'LFT003',
    tokenId: 'LFT003',
    contractAddress: '0x742d35Cc0C2e2F5C6Ca8C8F5CCC93a4C9C4C7B3A',
    chainId: 1,
    status: 'MINTED',
    quantity: 4000,
    unit: 'mwh',
    meta: {
      name: 'Kenya Solar Microgrid Credits',
      description: 'Renewable energy credits from community solar installations providing clean energy access.',
      location: 'Nakuru County, Kenya',
      projectType: 'energy',
      price: 18.25,
      currency: 'USD',
      availableSupply: 3200,
      totalSupply: 4000,
      retiredAmount: 400,
      priceChange24h: 5.8,
      issuanceDate: '2024-11-05',
      verification: {
        status: 'verified',
        methodology: 'Gold Standard',
        verifier: 'TÜV SÜD',
        confidence: 0.89,
        verificationDate: '2024-10-30'
      },
      project: {
        name: 'Rural Solar Access Project',
        developer: 'SolarAfrica Collective',
        nftId: 103,
        impactMetrics: [
          { type: 'Clean Energy Generated', value: 2800, unit: 'MWh' },
          { type: 'Households Connected', value: 1200, unit: 'families' },
          { type: 'CO2 Avoided', value: 1800, unit: 'tonnes' }
        ]
      },
      trading: {
        volume24h: 124000,
        holders: 45,
        avgPrice: 17.50,
        retirementRate: 10.0
      },
      rating: 4.4
    },
    verificationMethodId: 'gold-standard',
    verifiedAt: new Date('2024-10-30'),
    issuedAt: new Date('2024-11-05')
  },
  {
    externalId: 'LFT004',
    tokenId: 'LFT004',
    contractAddress: '0x742d35Cc0C2e2F5C6Ca8C8F5CCC93a4C9C4C7B3A',
    chainId: 1,
    status: 'MINTED',
    quantity: 1500,
    unit: 'hectares',
    meta: {
      name: 'Coral Reef Restoration Credits',
      description: 'Marine biodiversity credits from coral reef restoration and protection in the Great Barrier Reef.',
      location: 'Queensland, Australia',
      projectType: 'biodiversity',
      price: 35.00,
      currency: 'USD',
      availableSupply: 750,
      totalSupply: 1500,
      retiredAmount: 600,
      priceChange24h: 1.2,
      issuanceDate: '2024-08-20',
      verification: {
        status: 'verified',
        methodology: 'Marine Stewardship Standard',
        verifier: 'Ocean Foundation',
        confidence: 0.88,
        verificationDate: '2024-08-15'
      },
      project: {
        name: 'Great Barrier Reef Recovery',
        developer: 'Reef Alliance Australia',
        nftId: 104,
        impactMetrics: [
          { type: 'Reef Area Restored', value: 125, unit: 'hectares' },
          { type: 'Coral Colonies', value: 15000, unit: 'colonies' },
          { type: 'Marine Species', value: 350, unit: 'species' }
        ]
      },
      trading: {
        volume24h: 67000,
        holders: 32,
        avgPrice: 34.50,
        retirementRate: 40.0
      },
      rating: 4.9
    },
    verificationMethodId: 'marine-stewardship',
    verifiedAt: new Date('2024-08-15'),
    issuedAt: new Date('2024-08-20')
  },
  {
    externalId: 'LFT005',
    tokenId: 'LFT005',
    contractAddress: '0x742d35Cc0C2e2F5C6Ca8C8F5CCC93a4C9C4C7B3A',
    chainId: 1,
    status: 'MINTED',
    quantity: 2000,
    unit: 'mixed_units',
    meta: {
      name: 'Integrated Ecosystem Restoration',
      description: 'Multi-benefit credits from integrated land management including carbon, water, and biodiversity.',
      location: 'Costa Rica',
      projectType: 'mixed',
      price: 42.80,
      currency: 'USD',
      availableSupply: 1200,
      totalSupply: 2000,
      retiredAmount: 350,
      priceChange24h: 2.1,
      issuanceDate: '2024-07-10',
      verification: {
        status: 'verified',
        methodology: 'Climate Community Biodiversity',
        verifier: 'Rainforest Alliance',
        confidence: 0.94,
        verificationDate: '2024-07-05'
      },
      project: {
        name: 'Costa Rica Ecosystem Recovery',
        developer: 'Tropical Conservation Alliance',
        nftId: 105,
        impactMetrics: [
          { type: 'CO2 Sequestered', value: 25000, unit: 'tonnes' },
          { type: 'Watershed Protected', value: 5000, unit: 'hectares' },
          { type: 'Species Corridors', value: 12, unit: 'corridors' }
        ]
      },
      trading: {
        volume24h: 198000,
        holders: 76,
        avgPrice: 41.20,
        retirementRate: 17.5
      },
      rating: 4.7
    },
    verificationMethodId: 'ccb-standard',
    verifiedAt: new Date('2024-07-05'),
    issuedAt: new Date('2024-07-10')
  }
];

const projectsData = [
  {
    name: 'Amazon Conservation Initiative',
    slug: 'amazon-conservation-initiative',
    description: 'Large-scale forest conservation project protecting primary rainforest in the Brazilian Amazon while supporting indigenous communities.',
    ownerAddress: '0x742d35Cc0C2e2F5C6Ca8C8F5CCC93a4C9C4C7B3A',
    chainId: 1,
    projectNftId: 101,
    projectNftChainId: 1,
    contractAddress: '0x742d35Cc0C2e2F5C6Ca8C8F5CCC93a4C9C4C7B3A',
    meta: {
      location: 'Acre, Brazil',
      projectType: 'carbon',
      developer: 'Rainforest Alliance Brazil'
    }
  },
  {
    name: 'Central Valley Water Recovery',
    slug: 'central-valley-water-recovery',
    description: 'Groundwater recharge and wetland restoration project in California Central Valley.',
    ownerAddress: '0x742d35Cc0C2e2F5C6Ca8C8F5CCC93a4C9C4C7B3A',
    chainId: 1,
    projectNftId: 102,
    projectNftChainId: 1,
    contractAddress: '0x742d35Cc0C2e2F5C6Ca8C8F5CCC93a4C9C4C7B3A',
    meta: {
      location: 'California, USA',
      projectType: 'water',
      developer: 'AquaRestore California'
    }
  },
  {
    name: 'Rural Solar Access Project',
    slug: 'rural-solar-access-project',
    description: 'Community solar microgrid installations providing clean energy access to rural communities in Kenya.',
    ownerAddress: '0x742d35Cc0C2e2F5C6Ca8C8F5CCC93a4C9C4C7B3A',
    chainId: 1,
    projectNftId: 103,
    projectNftChainId: 1,
    contractAddress: '0x742d35Cc0C2e2F5C6Ca8C8F5CCC93a4C9C4C7B3A',
    meta: {
      location: 'Nakuru County, Kenya',
      projectType: 'energy',
      developer: 'SolarAfrica Collective'
    }
  },
  {
    name: 'Great Barrier Reef Recovery',
    slug: 'great-barrier-reef-recovery',
    description: 'Marine biodiversity restoration through coral reef rehabilitation and protection programs.',
    ownerAddress: '0x742d35Cc0C2e2F5C6Ca8C8F5CCC93a4C9C4C7B3A',
    chainId: 1,
    projectNftId: 104,
    projectNftChainId: 1,
    contractAddress: '0x742d35Cc0C2e2F5C6Ca8C8F5CCC93a4C9C4C7B3A',
    meta: {
      location: 'Queensland, Australia',
      projectType: 'biodiversity',
      developer: 'Reef Alliance Australia'
    }
  },
  {
    name: 'Costa Rica Ecosystem Recovery',
    slug: 'costa-rica-ecosystem-recovery',
    description: 'Integrated ecosystem restoration combining carbon sequestration, water protection, and biodiversity conservation.',
    ownerAddress: '0x742d35Cc0C2e2F5C6Ca8C8F5CCC93a4C9C4C7B3A',
    chainId: 1,
    projectNftId: 105,
    projectNftChainId: 1,
    contractAddress: '0x742d35Cc0C2e2F5C6Ca8C8F5CCC93a4C9C4C7B3A',
    meta: {
      location: 'Costa Rica',
      projectType: 'mixed',
      developer: 'Tropical Conservation Alliance'
    }
  }
];

const verificationMethodsData = [
  {
    methodId: 'vcs-redd-plus',
    name: 'VCS REDD+',
    description: 'Verified Carbon Standard for Reducing Emissions from Deforestation and forest Degradation',
    methodologyType: 'carbon',
    version: '4.0',
    criteria: {
      requirements: ['satellite monitoring', 'field verification', 'third-party audit'],
      minimumProject: '1000 hectares',
      verificationPeriod: 'annual'
    }
  },
  {
    methodId: 'vwba-v2',
    name: 'VWBA v2.1',
    description: 'Verified Water Benefits Accounting methodology version 2.1',
    methodologyType: 'water',
    version: '2.1',
    criteria: {
      requirements: ['water quality testing', 'flow measurement', 'ecosystem impact'],
      minimumProject: '10,000 m³ annual savings',
      verificationPeriod: 'quarterly'
    }
  },
  {
    methodId: 'gold-standard',
    name: 'Gold Standard',
    description: 'Gold Standard for the Global Goals renewable energy methodology',
    methodologyType: 'energy',
    version: '2.0',
    criteria: {
      requirements: ['energy output verification', 'grid impact assessment', 'sustainability audit'],
      minimumProject: '100 MWh annual generation',
      verificationPeriod: 'monthly'
    }
  },
  {
    methodId: 'marine-stewardship',
    name: 'Marine Stewardship Standard',
    description: 'Marine biodiversity and ecosystem restoration verification standard',
    methodologyType: 'biodiversity',
    version: '1.0',
    criteria: {
      requirements: ['species monitoring', 'habitat assessment', 'restoration verification'],
      minimumProject: '50 hectares marine area',
      verificationPeriod: 'semi-annual'
    }
  },
  {
    methodId: 'ccb-standard',
    name: 'Climate Community Biodiversity',
    description: 'Integrated climate, community, and biodiversity benefits verification',
    methodologyType: 'mixed',
    version: '3.0',
    criteria: {
      requirements: ['integrated impact assessment', 'community benefit verification', 'biodiversity monitoring'],
      minimumProject: 'multi-criteria threshold',
      verificationPeriod: 'annual'
    }
  }
];

async function main() {
  console.log('🌱 Seeding Lift Token marketplace data...');

  // Create verification methods first
  console.log('Creating verification methods...');
  for (const method of verificationMethodsData) {
    await prisma.verificationMethod.upsert({
      where: { methodId: method.methodId },
      update: method,
      create: method,
    });
  }

  // Create projects
  console.log('Creating projects...');
  const createdProjects = [];
  for (const project of projectsData) {
    const createdProject = await prisma.project.upsert({
      where: { slug: project.slug },
      update: project,
      create: project,
    });
    createdProjects.push(createdProject);
  }

  // Create Lift Tokens
  console.log('Creating Lift Tokens...');
  for (let i = 0; i < liftTokensData.length; i++) {
    const tokenData = liftTokensData[i];
    const project = createdProjects[i];
    
    await prisma.liftToken.upsert({
      where: { tokenId: tokenData.tokenId },
      update: {
        ...tokenData,
        projectId: project.id,
      },
      create: {
        ...tokenData,
        projectId: project.id,
      },
    });
  }

  // Create some events for the tokens
  console.log('Creating token events...');
  const tokens = await prisma.liftToken.findMany();
  
  for (const token of tokens) {
    // Mint event
    await prisma.liftTokenEvent.create({
      data: {
        liftTokenId: token.id,
        type: 'MINTED',
        payload: {
          quantity: token.quantity,
          recipient: '0x742d35Cc0C2e2F5C6Ca8C8F5CCC93a4C9C4C7B3A'
        },
        txHash: `0x${Math.random().toString(16).substr(2, 64)}`,
        blockNumber: Math.floor(Math.random() * 1000000) + 18000000,
        logIndex: 0,
        eventAt: token.issuedAt || new Date()
      }
    });

    // If some tokens are retired, create retirement events
    const meta = token.meta as any;
    if (meta?.retiredAmount && meta.retiredAmount > 0) {
      await prisma.liftTokenEvent.create({
        data: {
          liftTokenId: token.id,
          type: 'RETIRED',
          payload: {
            quantity: meta.retiredAmount,
            retiree: '0x' + Math.random().toString(16).substr(2, 40),
            reason: 'Corporate carbon offsetting'
          },
          txHash: `0x${Math.random().toString(16).substr(2, 64)}`,
          blockNumber: Math.floor(Math.random() * 1000000) + 18000000,
          logIndex: 0,
          eventAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) // Random date in last 30 days
        }
      });
    }
  }

  console.log('✅ Lift Token marketplace data seeded successfully!');
  console.log(`📊 Created ${tokens.length} Lift Tokens across ${createdProjects.length} projects`);
  console.log(`🔬 Created ${verificationMethodsData.length} verification methods`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });