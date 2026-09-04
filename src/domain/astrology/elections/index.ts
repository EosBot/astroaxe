import { phaseFromLongitudes } from "@/domain/astrology/lunar";
import { compareStrings } from "@/domain/sort-strings";
import {
  resolvePlanetaryHourAt,
  type ClassicalPlanet,
  type PlanetaryHourReading,
  type PlanetaryHourResolution,
} from "@/domain/astrology/planetary-hours";

import {
  electionProfileSchema,
  type ElectionCondition,
  type ElectionConditionObservation,
  type ElectionObservation,
  type ElectionProfile,
} from "./contracts";

export * from "./contracts";

export const ELECTION_ENGINE_VERSION = "election-engine-0.2.0-research";

export interface ElectionMoment {
  jdUt: number;
  latitude: number;
  longitude: number;
  polarFallback?: "strict" | "equinoctial_local_solar";
  /** Necessárias apenas quando o perfil tiver condição lunar. */
  sunLongitude?: number;
  moonLongitude?: number;
  /** Planeta correspondente ao trabalho, quando a fonte formula a regra genericamente. */
  operationPlanet?: ClassicalPlanet;
}

/**
 * Observa um momento sob a regra de um perfil.
 *
 * Devolve o que a regra pede e o que o céu daquele instante satisfaz. Não
 * devolve nota, ranking nem recomendação: eleger é decisão de quem opera, e um
 * número aqui viraria promessa de resultado.
 *
 * Dado ausente vira `indeterminate` com motivo declarado, nunca um palpite. Um
 * horário inventado é pior que a ausência de horário, porque parece informação.
 */
export function evaluateElection(input: {
  profile: ElectionProfile;
  moment: ElectionMoment;
  /**
   * Hora planetária já resolvida, quando quem chama a possui.
   *
   * Descobrir onde o Sol nasce e se põe é a parte cara desta função, e avaliar
   * quatro critérios no mesmo instante repetia esse trabalho quatro vezes. Quem
   * varre um período longo já calculou a hora uma vez e a passa adiante; quem
   * julga um instante avulso continua omitindo o campo e nada muda.
   */
  resolution?: PlanetaryHourResolution;
}): ElectionObservation {
  const profile = electionProfileSchema.parse(input.profile);
  const limitations: string[] = [];

  const resolution =
    input.resolution ??
    resolvePlanetaryHourAt({
      jdUt: input.moment.jdUt,
      latitude: input.moment.latitude,
      longitude: input.moment.longitude,
      ...(input.moment.polarFallback === undefined
        ? {}
        : { polarFallback: input.moment.polarFallback }),
    });
  if (resolution.limitation !== undefined) limitations.push(resolution.limitation);
  if (resolution.method === "equinoctial_local_solar_proxy")
    limitations.push("planetary_hour_is_equinoctial_proxy");

  const lunarPhase =
    input.moment.sunLongitude === undefined || input.moment.moonLongitude === undefined
      ? undefined
      : phaseFromLongitudes(input.moment.sunLongitude, input.moment.moonLongitude).id;
  if (lunarPhase === undefined) limitations.push("lunar_longitudes_not_provided");

  const observe = (
    condition: ElectionCondition,
    role: ElectionConditionObservation["role"],
  ): ElectionConditionObservation => {
    const outcome = evaluateCondition(
      condition,
      resolution.reading,
      lunarPhase,
      input.moment.operationPlanet,
    );
    return outcome.reason === undefined
      ? { condition, role, outcome: outcome.outcome }
      : { condition, role, outcome: outcome.outcome, reason: outcome.reason };
  };

  const observations = [
    ...profile.conditions.required.map((c) => observe(c, "required")),
    ...profile.conditions.forbidden.map((c) => observe(c, "forbidden")),
    ...profile.conditions.preferred.map((c) => observe(c, "preferred")),
  ];

  return {
    engineVersion: ELECTION_ENGINE_VERSION,
    profileId: profile.id,
    profileVersion: profile.version,
    sourceSystemId: profile.sourceSystemId,
    locator: profile.locator,
    status: statusOf(observations),
    observations,
    declaredUncertainty: profile.declaredUncertainty,
    limitations: [...new Set(limitations)].sort(compareStrings),
  };
}

/**
 * Observa o mesmo momento sob vários perfis, preservando a divergência.
 *
 * Perfis de sistemas diferentes discordam, e a discordância é o dado. Nada aqui
 * concilia, ordena por preferência ou escolhe um vencedor.
 */
export function evaluateElections(input: {
  profiles: ElectionProfile[];
  moment: ElectionMoment;
  /** Resolvida uma vez e reaproveitada por todos os critérios do instante. */
  resolution?: PlanetaryHourResolution;
}): ElectionObservation[] {
  const resolution =
    input.resolution ??
    resolvePlanetaryHourAt({
      jdUt: input.moment.jdUt,
      latitude: input.moment.latitude,
      longitude: input.moment.longitude,
      ...(input.moment.polarFallback === undefined
        ? {}
        : { polarFallback: input.moment.polarFallback }),
    });
  return input.profiles
    .map((profile) => evaluateElection({ profile, moment: input.moment, resolution }))
    .sort((left, right) => left.profileId.localeCompare(right.profileId));
}

function evaluateCondition(
  condition: ElectionCondition,
  reading: PlanetaryHourReading | undefined,
  lunarPhase: string | undefined,
  operationPlanet: ClassicalPlanet | undefined,
): {
  outcome: ElectionConditionObservation["outcome"];
  reason?: ElectionConditionObservation["reason"];
} {
  if (condition.kind === "lunar_phase") {
    if (lunarPhase === undefined)
      return { outcome: "indeterminate", reason: "lunar_longitudes_missing" };
    return {
      outcome: (condition.phases as readonly string[]).includes(lunarPhase)
        ? "satisfied"
        : "violated",
    };
  }
  if (condition.kind === "source_requirement")
    return { outcome: "indeterminate", reason: "condition_not_computable" };
  if (reading === undefined) return { outcome: "indeterminate", reason: "moment_unavailable" };
  return evaluateAgainstReading(condition, reading, operationPlanet);
}

/**
 * Condições que só se julgam com a hora planetária em mãos.
 *
 * Sai de `evaluateCondition` porque lá o que importa é a ordem das recusas —
 * falta de fase lunar, condição incomputável, ausência de hora — e aqui o que
 * importa é comparar regente e segmento. Misturar as duas coisas na mesma
 * função é o que fazia a leitura custar caro.
 */
function evaluateAgainstReading(
  // A união chega estreitada: fase lunar e requisito de fonte já foram tratados
  // por quem chama, e listá-los aqui obrigaria a um ramo morto.
  condition: Exclude<ElectionCondition, { kind: "lunar_phase" } | { kind: "source_requirement" }>,
  reading: PlanetaryHourReading,
  operationPlanet: ClassicalPlanet | undefined,
): {
  outcome: ElectionConditionObservation["outcome"];
  reason?: ElectionConditionObservation["reason"];
} {
  const veredito = (satisfeito: boolean) =>
    ({ outcome: satisfeito ? "satisfied" : "violated" }) as const;

  switch (condition.kind) {
    case "operation_planetary_day":
    case "operation_planetary_hour": {
      // O planeta da operação vem de fora da regra; sem ele não há o que
      // comparar, e responder "violado" acusaria o momento por uma falta que é
      // de quem perguntou.
      if (operationPlanet === undefined)
        return { outcome: "indeterminate", reason: "operation_planet_missing" };
      const regente =
        condition.kind === "operation_planetary_day" ? reading.dayRuler : reading.hourRuler;
      return veredito(regente === operationPlanet);
    }
    case "planetary_day":
      return veredito(reading.dayRuler === condition.planet);
    case "planetary_hour":
      return veredito(reading.hourRuler === condition.planet);
    default:
      return veredito(reading.segment === condition.segment);
  }
}

/**
 * `unavailable` quando falta dado para julgar o que a regra exige; `conflicted`
 * quando a regra é observável e o momento a contraria; `matched` quando as
 * exigidas foram satisfeitas e nenhuma proibida ocorreu. Preferências não mudam
 * o estado — elas informam, não aprovam nem reprovam.
 */
function statusOf(observations: ElectionConditionObservation[]): ElectionObservation["status"] {
  const decisivas = observations.filter(({ role }) => role !== "preferred");
  if (decisivas.some(({ outcome }) => outcome === "indeterminate")) return "unavailable";
  const exigidaFalhou = decisivas.some(
    ({ role, outcome }) => role === "required" && outcome === "violated",
  );
  const proibidaOcorreu = decisivas.some(
    ({ role, outcome }) => role === "forbidden" && outcome === "satisfied",
  );
  return exigidaFalhou || proibidaOcorreu ? "conflicted" : "matched";
}
