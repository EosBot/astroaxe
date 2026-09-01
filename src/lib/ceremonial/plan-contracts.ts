import { z } from "zod";

export const CEREMONIAL_PLAN_CONTRACT_VERSION = "ceremonial-plan-contracts-1.0.0";

/**
 * O que o dono envia ao criar ou atualizar um plano.
 *
 * Tudo aqui é texto livre da pessoa e vai cifrado para o banco. A categoria de
 * objetivo é o que a política da task 20 examina, e ela é fechada: prompt livre
 * não pode virar categoria, senão a política vira decoração.
 */
export const ceremonialPlanInputSchema = z
  .object({
    title: z.string().trim().min(1).max(160),
    intention: z.string().trim().min(1).max(4_000),
    goalCategory: z.enum([
      "study",
      "reflection",
      "remembrance",
      "personal_routine",
      "coercion",
      "violence",
      "self_harm",
      "sacrifice",
      "illegal_activity",
      "medical_promise",
      "financial_promise",
    ]),
    target: z.enum(["none", "self", "consenting_adult", "non_consenting_person"]),
    /** Entidades que a pessoa escolheu observar. Opcional e cifrado. */
    selection: z.array(z.string().trim().min(1).max(120)).max(24).optional(),
    /** Instante planejado, com fuso declarado. Sem fuso não há hora do dia. */
    scheduledFor: z.iso.datetime({ offset: true }).optional(),
  })
  .strict();

export type CeremonialPlanInput = z.infer<typeof ceremonialPlanInputSchema>;

export const ceremonialSessionInputSchema = z
  .object({
    occurredAt: z.iso.datetime({ offset: true }),
    notes: z.string().trim().max(8_000).optional(),
    observation: z.string().trim().max(4_000).optional(),
    outcome: z.string().trim().max(2_000).optional(),
  })
  .strict();

export type CeremonialSessionInput = z.infer<typeof ceremonialSessionInputSchema>;

/**
 * O que sai para o dono, já decifrado.
 *
 * O tipo **não tem** campo para envelope, versão de chave, caminho de acervo ou
 * corpo de fonte. Um DTO que pudesse expressá-los deixaria a proteção dependendo
 * de quem escreve o handler; sem os campos, não existe o descuido.
 */
export const ceremonialPlanViewSchema = z
  .object({
    id: z.uuid(),
    title: z.string(),
    intention: z.string(),
    selection: z.array(z.string()),
    scheduledFor: z.iso.datetime({ offset: true }).nullable(),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
  })
  .strict();

export type CeremonialPlanView = z.infer<typeof ceremonialPlanViewSchema>;

export const ceremonialSessionViewSchema = z
  .object({
    id: z.uuid(),
    planId: z.uuid(),
    occurredAt: z.iso.datetime(),
    notes: z.string().nullable(),
    observation: z.string().nullable(),
    outcome: z.string().nullable(),
  })
  .strict();

export type CeremonialSessionView = z.infer<typeof ceremonialSessionViewSchema>;
