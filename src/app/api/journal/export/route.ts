import { NextRequest } from "next/server";

import { parseServerEnv } from "@/lib/env";
import { getPrisma } from "@/lib/prisma";
import { resolveAccount } from "@/lib/security/account";
import { API_SECURITY_HEADERS, apiJson } from "@/lib/security/headers";

export async function GET(request: NextRequest): Promise<Response> {
  const env = parseServerEnv();
  const account = await resolveAccount(request, env.AUTH_SESSION_SECRET);
  if (account === null)
    return apiJson({ error: "Entre para exportar seu diário." }, { status: 401 });
  const profiles = await getPrisma().birthProfile.findMany({
    where: { userId: account.id },
    select: {
      id: true,
      displayName: true,
      journalEntries: { orderBy: { entryDate: "asc" } },
    },
    orderBy: { createdAt: "asc" },
  });
  const body = JSON.stringify(
    {
      format: "astroaxe-private-journal",
      version: 1,
      exportedAt: new Date().toISOString(),
      profiles: profiles.map((profile) => ({
        id: profile.id,
        displayName: profile.displayName,
        entries: profile.journalEntries.map((entry) => ({
          id: entry.id,
          date: entry.entryDate.toISOString().slice(0, 10),
          content: entry.content,
          createdAt: entry.createdAt.toISOString(),
          updatedAt: entry.updatedAt.toISOString(),
        })),
      })),
    },
    null,
    2,
  );
  return new Response(body, {
    headers: {
      ...API_SECURITY_HEADERS,
      "Cache-Control": "no-store",
      "Content-Disposition": 'attachment; filename="astroaxe-diario.json"',
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}
