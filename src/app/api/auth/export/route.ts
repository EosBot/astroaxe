import { NextRequest } from "next/server";

import { accountExportSchema, sanitizeChartResult } from "@/lib/auth/account-export";
import { parseServerEnv } from "@/lib/env";
import { logger } from "@/lib/logger";
import { getPrisma } from "@/lib/prisma";
import { resolveAccount } from "@/lib/security/account";
import { API_SECURITY_HEADERS, apiJson } from "@/lib/security/headers";

export async function GET(request: NextRequest): Promise<Response> {
  const env = parseServerEnv();
  const account = await resolveAccount(request, env.AUTH_SESSION_SECRET);
  if (account === null)
    return apiJson({ error: "Entre para exportar os dados da sua conta." }, { status: 401 });

  try {
    return await createAccountExport(account.id);
  } catch (error) {
    logger.error(
      { errorType: error instanceof Error ? error.name : "UnknownError" },
      "account export failed",
    );
    return apiJson({ error: "Não foi possível exportar a conta agora." }, { status: 503 });
  }
}

async function createAccountExport(accountId: string): Promise<Response> {
  const user = await getPrisma().user.findUnique({
    where: { id: accountId },
    select: {
      email: true,
      createdAt: true,
      profiles: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          displayName: true,
          birthDate: true,
          birthTime: true,
          timePrecision: true,
          latitude: true,
          longitude: true,
          timezone: true,
          location: true,
          createdAt: true,
          chart: {
            select: {
              engineVersion: true,
              configVersion: true,
              calculationMode: true,
              result: true,
              createdAt: true,
              revisions: {
                orderBy: { supersededAt: "asc" },
                select: {
                  engineVersion: true,
                  configVersion: true,
                  calculationMode: true,
                  result: true,
                  reason: true,
                  supersededAt: true,
                },
              },
            },
          },
          journalEntries: {
            orderBy: { entryDate: "asc" },
            select: {
              id: true,
              entryDate: true,
              content: true,
              createdAt: true,
              updatedAt: true,
              revisions: {
                orderBy: { supersededAt: "asc" },
                select: { content: true, supersededAt: true },
              },
            },
          },
        },
      },
    },
  });
  if (user === null) return apiJson({ error: "Conta não encontrada." }, { status: 401 });

  const payload = accountExportSchema.parse({
    format: "astroaxe-account-export",
    version: 1,
    exportedAt: new Date().toISOString(),
    account: { email: user.email, createdAt: user.createdAt.toISOString() },
    profiles: user.profiles.map((profile) => ({
      id: profile.id,
      displayName: profile.displayName,
      birthDate: profile.birthDate.toISOString().slice(0, 10),
      birthTime: profile.birthTime,
      timePrecision: profile.timePrecision,
      latitude: Number(profile.latitude),
      longitude: Number(profile.longitude),
      timezone: profile.timezone,
      location: profile.location,
      createdAt: profile.createdAt.toISOString(),
      chart:
        profile.chart === null
          ? null
          : {
              engineVersion: profile.chart.engineVersion,
              configVersion: profile.chart.configVersion,
              calculationMode: profile.chart.calculationMode,
              result: sanitizeChartResult(profile.chart.result),
              recordedAt: profile.chart.createdAt.toISOString(),
            },
      chartRevisions:
        profile.chart?.revisions.map((revision) => ({
          engineVersion: revision.engineVersion,
          configVersion: revision.configVersion,
          calculationMode: revision.calculationMode,
          result: sanitizeChartResult(revision.result),
          recordedAt: revision.supersededAt.toISOString(),
          reason: revision.reason,
        })) ?? [],
      journal: profile.journalEntries.map((entry) => ({
        id: entry.id,
        date: entry.entryDate.toISOString().slice(0, 10),
        content: entry.content,
        createdAt: entry.createdAt.toISOString(),
        updatedAt: entry.updatedAt.toISOString(),
        revisions: entry.revisions.map((revision) => ({
          content: revision.content,
          supersededAt: revision.supersededAt.toISOString(),
        })),
      })),
    })),
  });

  return new Response(JSON.stringify(payload, null, 2), {
    headers: {
      ...API_SECURITY_HEADERS,
      "Cache-Control": "no-store",
      "Content-Disposition": 'attachment; filename="astroaxe-conta.json"',
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}
