import { prisma } from "../src/index";

async function main() {
  await prisma.project.upsert({
    where: { slug: "demo" },
    update: {},
    create: { name: "Demo Project", slug: "demo" },
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