import { prisma } from '../src/index';

async function main() {
  await prisma.user.upsert({
    where: { address: '0x0000000000000000000000000000000000000000' },
    update: {},
    create: { address: '0x0000000000000000000000000000000000000000', username: 'seed' }
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });