import { julianDay } from "caelus";
import { NextRequest } from "next/server";
import { z } from "zod";

import { seededElectionProfiles } from "@/domain/astrology/elections/profiles";
import { publicRuleLabel } from "@/domain/astrology/elections/public-observation";
import { scanCeremonialWindows } from "@/domain/astrology/elections/window-scan";
import { astrologicalBodyName } from "@/domain/astrology/labels";
import { authorizeCeremonialAccess } from "@/lib/ceremonial/access";
import { apiJson } from "@/lib/security/headers";
import { checkJsonRequest } from "@/lib/security/json-body";

/** Teto de dias por consulta. Acima disso a varredura deixa de caber num pedido web. */
const MAXIMUM_DAYS = 60;

const requestSchema = z
  .object({
    /** Primeiro dia do período, em `AAAA-MM-DD`. */
    date: z.iso.date(),
    days: z.number().int().min(1).max(MAXIMUM_DAYS),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    limit: z.number().int().min(1).max(200).default(60),
  })
  .strict();

/**
 * Janelas cerimoniais de um período.
 *
 * Ferramenta paga, então a porta é a de sempre: `authorizeCeremonialAccess`
 * decide, e esta rota não conhece regra de acesso própria.
 *
 * A resposta publica as regras pelo que elas **pedem**, e nunca pela obra de
 * onde vieram — a mesma decisão da página de tempo, pelo mesmo motivo: dizer de
 * qual grimório saiu o critério entrega o acervo de pesquisa. Também não há
 * nota, ordenação por preferência nem sugestão do que fazer na hora encontrada.
 */
export async function POST(request: NextRequest): Promise<Response> {
  const body = checkJsonRequest(request, 4_096);
  if (!body.ok) return apiJson({ error: "Pedido inválido." }, { status: body.status });

  const guard = await authorizeCeremonialAccess(request, { requireSameOrigin: true });
  if (guard instanceof Response) return guard;

  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiJson({ error: "Período ou lugar inválidos." }, { status: 400 });

  const [year, month, day] = parsed.data.date.split("-").map(Number);
  const from = julianDay(year ?? 1970, month ?? 1, day ?? 1, 0, 0, 0);

  const result = scanCeremonialWindows({
    scan: {
      fromJdUt: from,
      toJdUt: from + parsed.data.days,
      latitude: parsed.data.latitude,
      longitude: parsed.data.longitude,
      limit: parsed.data.limit,
    },
    profiles: seededElectionProfiles,
  });

  return apiJson({
    version: result.version,
    hoursScanned: result.hoursScanned,
    truncated: result.truncated,
    windows: result.windows.flatMap((window) => {
      const rule = publicRuleLabel(window.profileId);
      // Regra sem rótulo público não é publicada: melhor faltar do que sair como
      // identificador interno — ou, pior, como nome de obra.
      if (rule === undefined) return [];
      return [
        {
          ruleId: rule.ruleId,
          ruleLabel: rule.ruleLabel,
          ruleSummary: rule.ruleSummary,
          startIso: isoFromJulianDay(window.startJdUt),
          endIso: isoFromJulianDay(window.endJdUt),
          dayRuler: astrologicalBodyName(window.dayRuler),
          hourRuler: astrologicalBodyName(window.hourRuler),
          hourNumber: window.hourNumber,
          segmentLabel: window.segment === "day" ? "hora do dia" : "hora da noite",
        },
      ];
    }),
  });
}

/** Dia juliano para instante ISO em UTC. */
function isoFromJulianDay(jdUt: number): string {
  return new Date((jdUt - 2_440_587.5) * 86_400_000).toISOString();
}
