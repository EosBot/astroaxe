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
    ruleLabel: "O planeta do seu assunto",
    ruleSummary:
      "Quer que o planeta ligado ao que você pretende fazer governe tanto o dia quanto a hora. Pede ainda que ele esteja bem acomodado no céu — e isso aqui a gente ainda não sabe medir, então preferimos dizer a fingir que sabe.",
  },
  "profile:arbatel-planetary-governance": {
    ruleId: "rule:planetary-day",
    ruleLabel: "O dia certo da semana",
    ruleSummary:
      "Quer que o dia da semana pertença ao planeta do seu assunto. Se a hora também for dele, melhor ainda — mas o dia já basta.",
  },
  "profile:kabbala-teurgica-lua-visivel": {
    ruleId: "rule:waxing-moon-strict",
    ruleLabel: "Lua crescendo, do jeito mais rigoroso",
    ruleSummary:
      "Só aceita a Lua no comecinho do crescimento: do primeiro fio de luz até a metade iluminada. Lua nova e Lua minguando ficam de fora.",
  },
  "profile:heptameron-lua-crescente-nao-combusta": {
    ruleId: "rule:waxing-moon-broad",
    ruleLabel: "Lua crescendo, do jeito mais generoso",
    ruleSummary:
      "Aceita a Lua em qualquer ponto do crescimento, até quase cheia, desde que já tenha se afastado do brilho do Sol. Lua nova e Lua minguando ficam de fora.",
  },
};

const statusLabels: Readonly<Record<ElectionObservation["status"], string>> = {
  matched: "Este momento tem o que ela pede.",
  conflicted: "Este momento vai contra o que ela pede.",
  unavailable: "Falta dado para responder por aqui, e chutar seria pior que o silêncio.",
};

const limitationLabels: Readonly<Record<string, string>> = {
  solar_interval_unavailable: "O Sol não nasce nem se põe neste lugar e data.",
  planetary_hour_is_equinoctial_proxy:
    "A hora aqui é estimada, não observada — leia como aproximação.",
  lunar_longitudes_not_provided: "A posição da Lua não veio junto.",
};

const methodLabels: Readonly<Record<PlanetaryHourResolution["method"], string>> = {
  observed_solar: "A contagem das horas seguiu o nascer e o pôr do sol reais deste lugar.",
  equinoctial_local_solar_proxy:
    "Neste lugar e data o dia não começa nem termina do jeito de sempre, então as horas foram divididas por aproximação. É estimativa, não observação.",
  unavailable:
    "Aqui o Sol não nasce nem se põe nesta data — sem esse compasso, não há hora planetária para contar.",
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
      "Estas tradições nunca se falaram, e discordam mesmo. O que está aqui é só o que cada uma pede deste instante — não é conselho de hora marcada nem promessa de resultado. Quem conhece a sua intenção é você, e a escolha continua sua.",
  });
}
