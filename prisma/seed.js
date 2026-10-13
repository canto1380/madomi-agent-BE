import { PrismaClient } from '@prisma/client';
import { ejecutarSeeds } from '../src/seeds/index.js';

const prisma = new PrismaClient();

async function main() {
  await ejecutarSeeds(prisma);
}

main()
  .catch((error) => {
    console.error('Error en seed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
