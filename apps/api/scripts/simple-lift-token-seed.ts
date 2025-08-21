import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Creating simple Lift Token test data...');

  try {
    // First check if we have any existing projects
    const existingProjects = await prisma.project.findMany();
    let projectId: bigint;

    if (existingProjects.length > 0) {
      projectId = existingProjects[0].id;
      console.log('Using existing Project NFT:', projectId);
    } else {
      // Create a simple project with the current schema structure
      // This represents a Project NFT on the blockchain
      const project = await prisma.project.create({
        data: {
          chainId: 1,
          tokenId: BigInt(101), // Project NFT token ID
          ownerAddress: '0x742d35Cc0C2e2F5C6Ca8C8F5CCC93a4C9C4C7B3A',
          state: 'ACTIVE' as any,
          tokenUri: 'https://ipfs.io/ipfs/QmTest',
          registryDataUri: 'https://registry.example.com/test',
          dataHash: '0x123abc',
          name: 'Amazon Conservation Initiative',
          slug: 'amazon-conservation-test',
          description: 'Test carbon credit project for marketplace backed by Project NFT #101',
          contractAddress: '0x742d35Cc0C2e2F5C6Ca8C8F5CCC93a4C9C4C7B3A',
          meta: {
            location: 'Brazil',
            projectType: 'carbon',
            projectNftId: 101,
            projectNftContract: '0x742d35Cc0C2e2F5C6Ca8C8F5CCC93a4C9C4C7B3A'
          }
        }
      });
      projectId = project.id;
      console.log('Created Project NFT #101 with ID:', projectId);
    }

    // Create some Lift Tokens backed by the Project NFT
    const liftToken1 = await prisma.liftToken.create({
      data: {
        tokenId: 'LFT001',
        contractAddress: '0x742d35Cc0C2e2F5C6Ca8C8F5CCC93a4C9C4C7B3A',
        chainId: 1,
        status: 'MINTED',
        quantity: '5000',
        unit: 'tonnes_co2',
        projectId: Number(projectId),
        meta: {
          name: 'Amazon Carbon Credits',
          description: 'Carbon credits from rainforest conservation backed by Project NFT #101',
          projectType: 'carbon',
          price: 28.50,
          currency: 'USD',
          availableSupply: 2500,
          totalSupply: 5000,
          retiredAmount: 1200,
          priceChange24h: 3.2,
          rating: 4.8,
          projectNftId: 101
        }
      }
    });

    const liftToken2 = await prisma.liftToken.create({
      data: {
        tokenId: 'LFT002', 
        contractAddress: '0x742d35Cc0C2e2F5C6Ca8C8F5CCC93a4C9C4C7B3A',
        chainId: 1,
        status: 'MINTED',
        quantity: '3000',
        unit: 'cubic_meters',
        projectId: Number(projectId),
        meta: {
          name: 'Clean Water Credits',
          description: 'Water conservation and purification credits backed by Project NFT #101',
          projectType: 'water',
          price: 15.75,
          currency: 'USD',
          availableSupply: 1800,
          totalSupply: 3000,
          retiredAmount: 800,
          priceChange24h: -1.2,
          rating: 4.6,
          projectNftId: 101
        }
      }
    });

    const liftToken3 = await prisma.liftToken.create({
      data: {
        tokenId: 'LFT003', 
        contractAddress: '0x742d35Cc0C2e2F5C6Ca8C8F5CCC93a4C9C4C7B3A',
        chainId: 1,
        status: 'MINTED',
        quantity: '2500',
        unit: 'mwh',
        projectId: Number(projectId),
        meta: {
          name: 'Renewable Energy Credits',
          description: 'Solar and wind energy generation credits backed by Project NFT #101',
          projectType: 'energy',
          price: 22.30,
          currency: 'USD',
          availableSupply: 1500,
          totalSupply: 2500,
          retiredAmount: 600,
          priceChange24h: 5.8,
          rating: 4.9,
          projectNftId: 101
        }
      }
    });

    console.log('✅ Created Lift Tokens backed by Project NFT #101:', liftToken1.id, liftToken2.id, liftToken3.id);
    console.log('🎉 Seeding completed successfully!');

  } catch (error) {
    console.error('❌ Error seeding data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});