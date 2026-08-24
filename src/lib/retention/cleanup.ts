import { getPrisma } from "@/lib/prisma";

export async function deleteExpiredSessions(now = new Date()): Promise<{
  guestSessions: number;
  accountSessions: number;
  accountTokens: number;
}> {
  const prisma = getPrisma();
  const [guestSessions, accountSessions, accountTokens] = await prisma.$transaction([
    prisma.guestSession.deleteMany({ where: { expiresAt: { lte: now } } }),
    prisma.accountSession.deleteMany({ where: { expiresAt: { lte: now } } }),
    prisma.accountToken.deleteMany({ where: { expiresAt: { lte: now } } }),
  ]);
  return {
    guestSessions: guestSessions.count,
    accountSessions: accountSessions.count,
    accountTokens: accountTokens.count,
  };
}
