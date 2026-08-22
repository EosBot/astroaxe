import type { PrismaClient } from "@/generated/prisma/client";
import { editorialActorSchema, type EditorialActor } from "@/lib/editorial/contracts";

export async function resolveEditorialActor(
  prisma: PrismaClient,
  userId: string,
): Promise<EditorialActor | null> {
  const contributor = await prisma.culturalContributor.findUnique({
    where: { userId },
    select: { id: true, userId: true, role: true },
  });
  if (contributor?.userId === null || contributor === null) return null;
  return editorialActorSchema.parse(contributor);
}

export function canReview(actor: EditorialActor): boolean {
  return actor.role === "REVIEWER" || actor.role === "ADMIN";
}
