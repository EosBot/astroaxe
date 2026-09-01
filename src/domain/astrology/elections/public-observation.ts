import { z } from "zod";

import { astrologicalBodyName } from "@/domain/astrology/labels";
import type { PlanetaryHourResolution } from "@/domain/astrology/planetary-hours";

import type { ElectionObservation } from "./contracts";

export const PUBLIC_TIMING_VERSION = "public-ceremonial-timing-1.0.0";

/**
 * Projeção pública de uma observação de eleição.
 *
 * Nomear a obra é necessário e é diferente de expor proveniência: "o Heptameron
 * exige" é a informação, e sem ela a comparação lado a lado não significa nada. O
 * que **não** atravessa é o `locator` — a referência ao nosso corpus —, e o tipo
 * não tem onde escrevê-lo.
 *
 * Não existe campo para nota, ranking ou recomendação. Eleger é decisão de quem
 * opera, e um número aqui viraria promessa de resultado.
 */
const publicObservationSchema = z
  .object({
    profileId: z.string().regex(/^profile:[a-z0-9-]+$/),
    /** A obra que dá a regra. Conhecimento histórico público, não nosso acervo. */
    sourceName: z.string().trim().min(1).max(80),
    ruleSummary: z.string().trim().min(1).max(300),
    status: z.enum(["matched", "conflicted", "unavailable"]),
    statusLabel: z.string().trim().min(1).max(160),
    /** Por que não deu para julgar, quando for o caso. */
    limitations: z.array(z.string().trim().min(1).max(200)).max(6),
  })
  .strict();

export type PublicElectionObservation = z.infer<typeof publicObservationSchema>;

export const publicTimingReadingSchema = z
  .object({
    version: z.literal(PUBLIC_TIMING_VERSION),
    moment: z
      .object({
        dayRuler: z.string().trim().min(1).max(40),
        hourRuler: z.string().trim().min(1).max(40),
        hourNumber: z.number().int().min(1).max(12),
        segmentLabel: z.enum(["hora do dia", "hora da noite"]),
      })
      .strict()
      .nullable(),
    /** Como o intervalo solar foi obtido — o resultado declara a própria origem. */
    methodLabel: z.string().trim().min(1).max(200),
    observations: z.array(publicObservationSchema).max(24),
    disclaimer: z.string().trim().min(1).max(400),
  })
  .strict();

export type PublicTimingReading = z.infer<typeof publicTimingReadingSchema>;

const sourceNames: Readonly<Record<string, { sourceName: string; ruleSummary: string }>> = {
  "profile:agrippa-operation-planet": {
    sourceName: "Agrippa",
    ruleSummary:
      "Pede que o planeta da operação reja o dia e a hora e esteja dignificado e poderoso na figura do céu. As duas últimas condições o motor ainda não calcula.",
  },
  "profile:arbatel-planetary-governance": {
    sourceName: "Arbatel",
    ruleSummary: "Pede o dia do planeta que governa o assunto, e prefere também a hora dele.",
  },
  "profile:kabbala-teurgica-lua-visivel": {
    sourceName: "Kabbala Teúrgica",
    ruleSummary: "Pede Lua crescente até o quarto crescente, e recusa Lua nova ou balsâmica.",
  },
  "profile:heptameron-lua-crescente-nao-combusta": {
    sourceName: "Heptameron",
    ruleSummary: "Pede Lua crescente e não combusta, e recusa Lua nova ou balsâmica.",
  },
};

const statusLabels: Readonly<Record<ElectionObservation["status"], string>> = {
  matched: "O momento atende ao que esta obra pede.",
  conflicted: "O momento contraria o que esta obra pede.",
  unavailable: "Não há dado suficiente para julgar por esta obra.",
};

const limitationLabels: Readonly<Record<string, string>> = {
  solar_interval_unavailable: "O Sol não nasce nem se põe neste lugar e data.",
  planetary_hour_is_equinoctial_proxy: "A hora planetária é aproximação, não observação.",
  lunar_longitudes_not_provided: "A posição da Lua não foi informada.",
};

const methodLabels: Readonly<Record<PlanetaryHourResolution["method"], string>> = {
  observed_solar: "Hora planetária calculada pelo nascer e pôr do sol observados.",
  equinoctial_local_solar_proxy:
    "Hora planetária por aproximação equinocial, porque o intervalo solar não existe aqui. É estimativa, não observação.",
  unavailable: "Não há intervalo solar neste lugar e data, então não há hora planetária.",
};

/**
 * Traduz o que o motor observou para o que a página publica.
 *
 * Perfis divergentes ficam lado a lado, na ordem em que o avaliador os devolveu,
 * sem conciliar e sem ordenar por preferência: a discordância entre obras é o
 * dado, não ruído a ser resolvido antes de mostrar.
 */
export function buildPublicTimingReading(input: {
  resolution: PlanetaryHourResolution;
  observations: readonly ElectionObservation[];
}): PublicTimingReading {
  const reading = input.resolution.reading;

  return publicTimingReadingSchema.parse({
    version: PUBLIC_TIMING_VERSION,
    moment:
      reading === undefined
        ? null
        : {
            dayRuler: astrologicalBodyName(reading.dayRuler),
            hourRuler: astrologicalBodyName(reading.hourRuler),
            hourNumber: reading.hourNumber,
            segmentLabel: reading.segment === "day" ? "hora do dia" : "hora da noite",
          },
    methodLabel: methodLabels[input.resolution.method],
    observations: input.observations.flatMap((observation) => {
      const nomes = sourceNames[observation.profileId];
      // Perfil sem nome de leitura não é publicado: melhor faltar do que sair
      // como identificador interno na tela.
      if (nomes === undefined) return [];
      return [
        {
          profileId: observation.profileId,
          sourceName: nomes.sourceName,
          ruleSummary: nomes.ruleSummary,
          status: observation.status,
          statusLabel: statusLabels[observation.status],
          limitations: observation.limitations.flatMap((limitation) => {
            const rotulo = limitationLabels[limitation];
            return rotulo === undefined ? [] : [rotulo];
          }),
        },
      ];
    }),
    disclaimer:
      "Cada obra dá a própria regra, e elas discordam entre si. Isto é observação do que cada uma pede, não recomendação de momento nem promessa de resultado.",
  });
}
