import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

import { parseServerEnv } from "./env";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

function createPrismaClient(): PrismaClient {
  const { DATABASE_URL } = parseServerEnv();
  return new PrismaClient({ adapter: new PrismaPg({ connectionString: DATABASE_URL }) });
}

export function getPrisma(): PrismaClient {
  globalForPrisma.prisma ??= createPrismaClient();
  return globalForPrisma.prisma;
}

export async function disconnectPrisma(): Promise<void> {
  const client = globalForPrisma.prisma;
  if (!client) return;

  globalForPrisma.prisma = undefined;
  await client.$disconnect();
}
