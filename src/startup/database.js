import { prisma } from '../providers/prisma.js';

export async function initializeDatabase() {
  await prisma.$connect();
}
