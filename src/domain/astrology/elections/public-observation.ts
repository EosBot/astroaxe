import { z } from "zod";

import { astrologicalBodyName } from "@/domain/astrology/labels";
import type { PlanetaryHourResolution } from "@/domain/astrology/planetary-hours";

import type { ElectionObservation } from "./contracts";

export const PUBLIC_TIMING_VERSION = "public-ceremonial-timing-1.0.0";

/**
 * Projeção pública de uma observação de eleição.
 *
 * A regra é publicada pelo **que ela pede**, e não pela obra de onde veio. Dizer
 * "uma regra exige Lua crescente e não combusta" entrega a informação inteira;
 * dizer de qual grimório ela saiu entrega o acervo de pesquisa e expõe a obra de
 * terceiro que o sustenta. O `BLUEPRINT` §5.0 já decide isso: publica-se a obra
 * derivada, nunca o insumo.
 *
 * Por isso o tipo não tem campo para nome de obra, edição, autor ou locator. As
 * regras se distinguem por rótulo descritivo — o que muda entre elas é o que
 * pedem, e é isso que o leitor precisa comparar.
 *
 * Não existe campo para nota, ranking ou recomendação. Eleger é decisão de quem
 * opera, e um número aqui viraria promessa de resultado.
 */
const publicObservationSchema = z
  .object({
    /** Identificador estável da regra, sem revelar de onde ela veio. */
    ruleId: z.string().regex(/^rule:[a-z0-9-]+$/),
    /** Rótulo descritivo: diz o que a regra pede, não quem a escreveu. */
    ruleLabel: z.string().trim().min(1).max(80),
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

/**
 * Rótulos das regras.
 *
 * Descrevem o critério, e não a origem. Uma pessoa que lê "regra do planeta da
 * operação" sabe exatamente o que está sendo verificado; saber de qual obra ela
 * veio não a ajudaria a decidir, e nos custaria o acervo.
 */
const ruleLabels: Readonly<
  Record<string, { ruleId: string; ruleLabel: string; ruleSummary: string }>
> = {
  "profile:agrippa-operation-planet": {
    ruleId: "rule:operation-planet",
    ruleLabel: "Planeta da operação",
    ruleSummary:
      "Pede que o planeta correspondente ao trabalho reja o dia e a hora, e esteja dignificado e poderoso na figura do céu. As duas últimas condições o motor ainda não calcula.",
  },
  "profile:arbatel-planetary-governance": {
    ruleId: "rule:planetary-day",
    ruleLabel: "Dia planetário do assunto",
    ruleSummary:
      "Pede o dia do planeta que governa o assunto, e prefere que também seja a hora dele.",
  },
  "profile:kabbala-teurgica-lua-visivel": {
    ruleId: "rule:waxing-moon-strict",
    ruleLabel: "Lua crescente, leitura estrita",
    ruleSummary:
      "Pede Lua entre a crescente inicial e o quarto crescente, e recusa Lua nova ou balsâmica.",
  },
  "profile:heptameron-lua-crescente-nao-combusta": {
    ruleId: "rule:waxing-moon-broad",
    ruleLabel: "Lua crescente, leitura ampla",
    ruleSummary: "Pede Lua crescente e não combusta, até a gibosa, e recusa Lua nova ou balsâmica.",
  },
};

const statusLabels: Readonly<Record<ElectionObservation["status"], string>> = {
  matched: "O momento atende ao que esta regra pede.",
  conflicted: "O momento contraria o que esta regra pede.",
  unavailable: "Não há dado suficiente para julgar por esta regra.",
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
 * Regras divergentes ficam lado a lado, na ordem em que o avaliador as devolveu,
 * sem conciliar e sem ordenar por preferência: a discordância entre tradições é o
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
      const rotulo = ruleLabels[observation.profileId];
      // Regra sem rótulo não é publicada: melhor faltar do que sair como
      // identificador interno — ou, pior, como nome de obra.
      if (rotulo === undefined) return [];
      return [
        {
          ruleId: rotulo.ruleId,
          ruleLabel: rotulo.ruleLabel,
          ruleSummary: rotulo.ruleSummary,
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
      "Estas regras vêm de tradições independentes e discordam entre si. O que você vê é a observação do que cada uma pede, não uma recomendação de momento nem promessa de resultado. Escolher é de quem opera.",
  });
}
