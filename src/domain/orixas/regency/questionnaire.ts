import { z } from "zod";

export const REGENCY_QUESTIONNAIRE_VERSION = "regency-questionnaire-1.0.0";

const answerValueSchema = z.enum(["first_pole", "second_pole", "both", "prefer_not_to_answer"]);

export const regencyQuestionnaire = [
  question(
    "faith",
    "Quando uma convicção importante é testada, qual movimento surge primeiro?",
    "Sustentar e irradiar uma direção",
    "Recolher, ordenar e separar o que perdeu sentido",
  ),
  question(
    "love",
    "Quando um vínculo importante entra em desgaste, o que mais descreve sua resposta?",
    "Aproximar, acolher e recompor o vínculo",
    "Dissolver o padrão antigo para permitir renovação",
  ),
  question(
    "knowledge",
    "Diante de algo desconhecido, como você costuma encontrar clareza?",
    "Explorando caminhos e ampliando possibilidades",
    "Concentrando, verificando e aprofundando um ponto",
  ),
  question(
    "justice",
    "Ao perceber um desequilíbrio, qual impulso tende a vir primeiro?",
    "Ponderar lados e restaurar proporção",
    "Interromper o excesso e corrigir com firmeza",
  ),
  question(
    "law",
    "Quando uma situação exige ação imediata, como sua força costuma operar?",
    "Abrindo caminho, ordenando e executando",
    "Mudando a direção, mobilizando e rompendo a inércia",
  ),
  question(
    "evolution",
    "Em uma mudança profunda, qual processo se parece mais com você?",
    "Atravessar a transformação e seguir adiante",
    "Decantar, amadurecer e só então recomeçar",
  ),
  question(
    "generation",
    "Ao cuidar de um ciclo de vida ou projeto, onde sua energia se concentra?",
    "Nutrir, gerar e sustentar continuidade",
    "Encerrar, estabilizar e preservar o aprendizado do ciclo",
  ),
] as const;

export const regencyQuestionnaireSubmissionSchema = z
  .object({
    version: z.literal(REGENCY_QUESTIONNAIRE_VERSION),
    answers: z
      .array(
        z
          .object({
            questionId: z.enum(regencyQuestionnaire.map(({ id }) => id)),
            value: answerValueSchema,
          })
          .strict(),
      )
      .length(regencyQuestionnaire.length),
  })
  .strict()
  .superRefine((submission, context) => {
    const ids = submission.answers.map(({ questionId }) => questionId);
    if (new Set(ids).size !== regencyQuestionnaire.length)
      context.addIssue({
        code: "custom",
        path: ["answers"],
        message: "Cada pergunta deve ter uma única resposta.",
      });
  });

export type RegencyQuestionnaireSubmission = z.infer<typeof regencyQuestionnaireSubmissionSchema>;

export interface RegencyQuestionnaireFeature {
  key: string;
  category: "self_report";
  value: "first_pole" | "second_pole";
  strength: number;
  lensId: string;
}

export function extractRegencyQuestionnaireFeatures(
  input: RegencyQuestionnaireSubmission,
): RegencyQuestionnaireFeature[] {
  const submission = regencyQuestionnaireSubmissionSchema.parse(input);
  return submission.answers.flatMap(({ questionId, value }) => {
    if (value === "prefer_not_to_answer") return [];
    if (value === "both")
      return [feature(questionId, "first_pole", 0.5), feature(questionId, "second_pole", 0.5)];
    return [feature(questionId, value, 1)];
  });
}

function question(
  id: "faith" | "love" | "knowledge" | "justice" | "law" | "evolution" | "generation",
  prompt: string,
  first: string,
  second: string,
) {
  return {
    id,
    prompt,
    options: [
      { value: "first_pole" as const, label: first },
      { value: "second_pole" as const, label: second },
      { value: "both" as const, label: "Os dois movimentos aparecem com força semelhante" },
      { value: "prefer_not_to_answer" as const, label: "Prefiro não responder" },
    ],
  };
}

function feature(
  lensId: string,
  value: "first_pole" | "second_pole",
  strength: number,
): RegencyQuestionnaireFeature {
  return {
    key: `self-report:${lensId}:${value}`,
    category: "self_report",
    value,
    strength,
    lensId,
  };
}
