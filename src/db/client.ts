import { PrismaClient } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const getPrismaClient = (databaseUrl: string) => {
  if (!globalForPrisma.prisma) {
    const adapter = new PrismaNeon({ connectionString: databaseUrl });
    globalForPrisma.prisma = new PrismaClient({ adapter });
  }
  return globalForPrisma.prisma;
};
