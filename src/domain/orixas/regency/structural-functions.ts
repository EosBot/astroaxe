import { z } from "zod";

/**
 * Camada 2 de `docs/BLUEPRINT.md` §5.0.1: a posição estrutural, independente do
 * nome que cada tradição lhe dá.
 *
 * Cada função carrega a pergunta que responde, e não é decoração: é o que
 * autoriza comparar tradições. Duas tradições só se encontram numa função
 * quando de fato respondem à mesma pergunta — sem isso a aproximação vira
 * sincretismo por semelhança de vocabulário.
 */
export const STRUCTURAL_FUNCTION_VOCABULARY_VERSION = "structural-functions-0.1.0-research";

export const structuralFunctionSchema = z
  .object({
    id: z.string().regex(/^function:[a-z0-9-]+$/),
    label: z.string().trim().min(1).max(120),
    question: z.string().trim().min(1).max(240),
  })
  .strict();

export type StructuralFunction = z.infer<typeof structuralFunctionSchema>;

export const structuralFunctions: readonly StructuralFunction[] = [
  {
    id: "function:path-opening",
    label: "Abertura de caminho e passagem",
    question: "Que potência abre, fecha e ordena a passagem entre os planos?",
  },
  {
    id: "function:iron-and-war-craft",
    label: "Ferro, forja e ofício da guerra",
    question: "Que potência detém o metal, a forja e a resolução pela força?",
  },
  {
    id: "function:solar-vitality",
    label: "Vitalidade solar e evidência",
    question: "Que potência dá vida, luz e torna as coisas manifestas?",
  },
  {
    id: "function:expansion-and-judgment",
    label: "Expansão e sentença",
    question: "Que potência amplia, concede e julga?",
  },
  {
    id: "function:attraction-and-concord",
    label: "Atração e concórdia",
    question: "Que potência atrai, harmoniza e faz florescer o afeto?",
  },
  {
    id: "function:generative-waters",
    label: "Águas geradoras",
    question: "Que potência gera e sustenta a vida que nasce?",
  },
  {
    id: "function:affliction-and-cure",
    label: "Aflição e cura",
    question: "Que potência impõe o limite do corpo e nele opera a cura?",
  },
  {
    id: "function:divination-and-counsel",
    label: "Adivinhação e conselho",
    question: "Que potência revela o que está velado e orienta a decisão?",
  },
  {
    id: "function:passage-between-planes",
    label: "Passagem entre planos",
    question: "Que potência governa a passagem de um plano ou estágio a outro?",
  },
].map((item) => structuralFunctionSchema.parse(item));

export const structuralFunctionIds = new Set(structuralFunctions.map(({ id }) => id));

export function findStructuralFunction(id: string): StructuralFunction | undefined {
  return structuralFunctions.find((item) => item.id === id);
}
