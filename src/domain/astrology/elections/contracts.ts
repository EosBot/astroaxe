import { z } from "zod";

import { classicalPlanetSchema } from "@/domain/astrology/planetary-hours";

/**
 * Perfis de eleição ligados à fonte.
 *
 * Um perfil é a regra que **uma obra específica** dá para escolher o momento de
 * um trabalho. Não existe pontuação universal de "bom momento": o Heptameron e o
 * Arbatel discordam, e discordar é informação. Cada perfil carrega escola, obra
 * e locator, e o avaliador devolve observações de perfis lado a lado em vez de
 * uma média que apagaria a divergência.
 *
 * O que o tipo **não** oferece, deliberadamente: nenhum campo de "sucesso",
 * "garantia" ou "recomendação". A saída descreve o que a regra pede e o que o
 * céu daquele instante satisfaz — a decisão é de quem lê.
 */
export const ELECTION_PROFILE_SCHEMA_VERSION = "election-profiles-0.2.0-research";

/** Condições que uma regra de eleição pode exigir, proibir ou preferir. */
export const electionConditionSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("planetary_day"), planet: classicalPlanetSchema }).strict(),
  z.object({ kind: z.literal("planetary_hour"), planet: classicalPlanetSchema }).strict(),
  z.object({ kind: z.literal("solar_segment"), segment: z.enum(["day", "night"]) }).strict(),
  z.object({ kind: z.literal("operation_planetary_day") }).strict(),
  z.object({ kind: z.literal("operation_planetary_hour") }).strict(),
  z
    .object({
      kind: z.literal("source_requirement"),
      requirement: z.string().trim().min(1).max(200),
    })
    .strict(),
  z
    .object({
      kind: z.literal("lunar_phase"),
      /**
       * Conjunto de fases, não uma só. As fontes falam em "Lua crescente" ou
       * "depois da combustão", que abrangem várias das oito fases do motor
       * lunar; forçar uma fase única distorceria a regra para caber no tipo.
       */
      phases: z
        .array(
          z.enum([
            "new",
            "crescent",
            "first_quarter",
            "gibbous",
            "full",
            "disseminating",
            "last_quarter",
            "balsamic",
          ]),
        )
        .min(1)
        .max(8),
    })
    .strict(),
]);

export type ElectionCondition = z.infer<typeof electionConditionSchema>;

export const electionProfileSchema = z
  .object({
    id: z.string().regex(/^profile:[a-z0-9-]+$/),
    title: z.string().trim().min(1).max(200),
    version: z.string().trim().min(1).max(80),
    /**
     * Sistema de origem. Perfis de sistemas diferentes nunca se fundem, mesmo
     * quando pedem a mesma coisa — a coincidência é observável, a identidade não
     * é afirmada.
     */
    sourceSystemId: z.string().regex(/^source-system:[a-z0-9-]+$/),
    /** Posição citável dentro da obra. Sem ela a regra não entra. */
    locator: z.string().trim().min(1).max(240),
    conditions: z
      .object({
        required: z.array(electionConditionSchema).max(12),
        forbidden: z.array(electionConditionSchema).max(12),
        preferred: z.array(electionConditionSchema).max(12),
      })
      .strict(),
    /** O que a própria obra deixa em aberto, dito em texto. */
    declaredUncertainty: z.string().trim().min(1).max(400),
  })
  .strict()
  .superRefine((profile, context) => {
    const total =
      profile.conditions.required.length +
      profile.conditions.forbidden.length +
      profile.conditions.preferred.length;
    if (total === 0)
      context.addIssue({
        code: "custom",
        path: ["conditions"],
        message: "Um perfil sem nenhuma condição não descreve regra alguma.",
      });
    const chaves = (lista: ElectionCondition[]) => lista.map((c) => JSON.stringify(c));
    const exigidas = new Set(chaves(profile.conditions.required));
    if (chaves(profile.conditions.forbidden).some((c) => exigidas.has(c)))
      context.addIssue({
        code: "custom",
        path: ["conditions", "forbidden"],
        message: "A mesma condição não pode ser exigida e proibida pelo mesmo perfil.",
      });
  });

export type ElectionProfile = z.infer<typeof electionProfileSchema>;

/** Estado de uma condição diante do céu observado. */
export type ConditionOutcome = "satisfied" | "violated" | "indeterminate";

export interface ElectionConditionObservation {
  condition: ElectionCondition;
  role: "required" | "forbidden" | "preferred";
  outcome: ConditionOutcome;
  /** Por que ficou indeterminada, quando for o caso. */
  reason?:
    | "moment_unavailable"
    | "lunar_longitudes_missing"
    | "operation_planet_missing"
    | "condition_not_computable";
}

/**
 * O que o avaliador devolve.
 *
 * `matched` significa que todas as exigidas foram satisfeitas e nenhuma proibida
 * ocorreu — não significa que o trabalho dará certo, e o vocabulário evita
 * sugerir isso. `conflicted` é o caso em que a regra é observável e o momento a
 * contraria. `unavailable` é quando não há dado para julgar, e nunca é
 * substituído por um palpite.
 */
export interface ElectionObservation {
  engineVersion: string;
  profileId: string;
  profileVersion: string;
  sourceSystemId: string;
  locator: string;
  status: "matched" | "conflicted" | "unavailable";
  observations: ElectionConditionObservation[];
  declaredUncertainty: string;
  limitations: string[];
}
