import { NextRequest } from "next/server";
import { z } from "zod";

import { parseServerEnv } from "@/lib/env";
import { journalEntryInputSchema } from "@/lib/journal/contracts";
import { logger } from "@/lib/logger";
import { getPrisma } from "@/lib/prisma";
import { isSameOrigin, resolveAccount } from "@/lib/security/account";
import { apiJson } from "@/lib/security/headers";

const paramsSchema = z.object({ profileId: z.uuid() });

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ profileId: string }> },
): Promise<Response> {
  const access = await resolveAccess(request, context);
  if (access instanceof Response) return access;
  const entries = await getPrisma().journalEntry.findMany({
    where: { birthProfileId: access.profileId, birthProfile: { userId: access.userId } },
    orderBy: { entryDate: "desc" },
  });
  return apiJson({ entries: entries.map(toPublicEntry) });
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ profileId: string }> },
): Promise<Response> {
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    return apiJson({ error: "Envie a reflexão como JSON." }, { status: 415 });
  const env = parseServerEnv();
  if (!isSameOrigin(request, env.SITE_URL))
    return apiJson({ error: "Origem inválida." }, { status: 403 });
  const access = await resolveAccess(request, context);
  if (access instanceof Response) return access;
  try {
    const payload = journalEntryInputSchema.parse(await request.json());
    const entryDate = new Date(`${payload.date}T00:00:00.000Z`);
    const entry = await getPrisma().$transaction(async (tx) => {
      const current = await tx.journalEntry.findUnique({
        where: {
          birthProfileId_entryDate: { birthProfileId: access.profileId, entryDate },
        },
      });
      if (current === null)
        return tx.journalEntry.create({
          data: { birthProfileId: access.profileId, entryDate, content: payload.content },
        });
      if (current.content === payload.content) return current;
      await tx.journalEntryRevision.create({
        data: { journalEntryId: current.id, content: current.content },
      });
      return tx.journalEntry.update({
        where: { id: current.id },
        data: { content: payload.content },
      });
    });
    return apiJson({ entry: toPublicEntry(entry) });
  } catch (error) {
    if (error instanceof z.ZodError)
      return apiJson({ error: "A reflexão deve ter entre 1 e 4.000 caracteres." }, { status: 400 });
    logger.error(
      { errorType: error instanceof Error ? error.name : "UnknownError" },
      "journal upsert failed",
    );
    return apiJson({ error: "Não foi possível guardar esta reflexão agora." }, { status: 503 });
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ profileId: string }> },
): Promise<Response> {
  const env = parseServerEnv();
  if (!isSameOrigin(request, env.SITE_URL))
    return apiJson({ error: "Origem inválida." }, { status: 403 });
  const access = await resolveAccess(request, context);
  if (access instanceof Response) return access;
  const result = await getPrisma().journalEntry.deleteMany({
    where: { birthProfileId: access.profileId, birthProfile: { userId: access.userId } },
  });
  return apiJson({ deleted: result.count });
}

async function resolveAccess(
  request: NextRequest,
  context: { params: Promise<{ profileId: string }> },
): Promise<{ profileId: string; userId: string } | Response> {
  const env = parseServerEnv();
  const account = await resolveAccount(request, env.AUTH_SESSION_SECRET);
  if (account === null)
    return apiJson({ error: "Entre para acessar seu diário." }, { status: 401 });
  const parsed = paramsSchema.safeParse(await context.params);
  if (!parsed.success) return apiJson({ error: "Perfil inválido." }, { status: 400 });
  const profile = await getPrisma().birthProfile.findFirst({
    where: { id: parsed.data.profileId, userId: account.id },
    select: { id: true },
  });
  if (profile === null) return apiJson({ error: "Mapa não encontrado." }, { status: 404 });
  return { profileId: profile.id, userId: account.id };
}

function toPublicEntry(entry: {
  id: string;
  birthProfileId: string;
  entryDate: Date;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: entry.id,
    profileId: entry.birthProfileId,
    date: entry.entryDate.toISOString().slice(0, 10),
    content: entry.content,
    createdAt: entry.createdAt.toISOString(),
    updatedAt: entry.updatedAt.toISOString(),
  };
}
