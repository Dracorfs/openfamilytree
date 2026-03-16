import { PrismaNeon } from '@prisma/adapter-neon';
import { PrismaClient } from '../generated/prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: InstanceType<typeof PrismaClient> | undefined;
};

export const getPrismaClient = (databaseUrl: string) => {
  if (!globalForPrisma.prisma) {
    const adapter = new PrismaNeon({ connectionString: databaseUrl });
    globalForPrisma.prisma = new PrismaClient({ adapter } as any);
  }
  return globalForPrisma.prisma;
};
