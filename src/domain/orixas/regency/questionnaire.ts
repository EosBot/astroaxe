import { z } from "zod";

export const REGENCY_QUESTIONNAIRE_VERSION = "regency-questionnaire-2.0.0";

/**
 * Instrumento de autorrelato da tríade.
 *
 * A versão 1 fazia sete perguntas, uma por lente, e obrigava a escolher entre
 * dois polos descritos em vocabulário simbólico ("sustentar e irradiar uma
 * direção" contra "recolher, ordenar e separar o que perdeu sentido"). Três
 * problemas, e nenhum deles é de redação:
 *
 * 1. **Um item por construto não mede nada.** Instrumentos de personalidade que
 *    funcionam usam de quatro a dez itens por traço, porque a resposta a uma
 *    frase isolada carrega mais ruído — humor do dia, leitura da palavra — do
 *    que sinal. Com sete construtos e uma chance cada, o resultado dependia de
 *    acaso mais do que de quem responde.
 *
 * 2. **Escolha forçada entre abstrações produz resposta bonita, não verdadeira.**
 *    Quem lê "irradiar uma direção" responde ao que a frase sugere sobre quem
 *    gostaria de ser. A prova de que o formato não fechava está no fato de a
 *    versão 1 ter precisado de uma saída "os dois aparecem com força
 *    semelhante": era o instrumento admitindo que a pergunta não cabia.
 *
 * 3. **Vocabulário de iniciado num público de entusiastas.** A maioria de quem
 *    usa isto não estuda o assunto — gosta dele.
 *
 * A versão 2 segue o desenho dos inventários que se sustentam: frases curtas
 * sobre comportamento concreto do dia a dia, primeira pessoa, escala de
 * concordância de cinco pontos, quatro itens por lente — dois por polo. O
 * equilíbrio entre polos não é simetria decorativa: é o que permite detectar
 * quem concorda com tudo. Essa pessoa pontua alto nos dois lados, a diferença
 * fica perto de zero, e o resultado se declara indeciso em vez de inventar uma
 * inclinação.
 *
 * Os itens aparecem intercalados entre lentes, nunca agrupados por tema. Quatro
 * frases seguidas sobre o mesmo assunto anunciam o que está sendo medido, e a
 * pessoa passa a responder ao tema em vez de a si mesma.
 */

const SCALE = [
  { value: "1", label: "Nada a ver comigo" },
  { value: "2", label: "Pouco a ver" },
  { value: "3", label: "Mais ou menos" },
  { value: "4", label: "Bastante a ver" },
  { value: "5", label: "É exatamente eu" },
  { value: "prefer_not_to_answer", label: "Prefiro não responder" },
] as const;

const answerValueSchema = z.enum(SCALE.map(({ value }) => value));

type LensId = "faith" | "love" | "knowledge" | "justice" | "law" | "evolution" | "generation";

type Pole = "first_pole" | "second_pole";

/**
 * Itens, na ordem em que são apresentados.
 *
 * A ordem é fixa e não sorteada: o método precisa ser reproduzível, e duas
 * pessoas com as mesmas respostas têm de receber o mesmo resultado.
 */
const items = [
  item(
    "faith",
    "first_pole",
    "Quando acredito em algo, as pessoas percebem sem eu ter que convencer ninguém.",
  ),
  item(
    "love",
    "first_pole",
    "Depois de uma briga, costumo ser eu quem procura a outra pessoa primeiro.",
  ),
  item(
    "knowledge",
    "first_pole",
    "Começo lendo sobre um assunto e termino em outro completamente diferente.",
  ),
  item(
    "justice",
    "second_pole",
    "Quando vejo um abuso, falo na hora, mesmo que fique um clima ruim.",
  ),
  item(
    "law",
    "first_pole",
    "Quando um plano trava, eu assumo e organizo até a coisa sair do lugar.",
  ),
  item(
    "evolution",
    "second_pole",
    "Preciso de um tempo quieto para digerir antes de decidir qualquer coisa.",
  ),
  item(
    "generation",
    "first_pole",
    "Cuidar de alguém, ou de algum projeto, me dá energia em vez de cansaço.",
  ),

  item(
    "faith",
    "second_pole",
    "Quando algo perde o sentido para mim, eu corto — mesmo tendo investido tempo.",
  ),
  item(
    "love",
    "second_pole",
    "Prefiro encerrar de vez a ficar remendando uma relação que não muda.",
  ),
  item("knowledge", "second_pole", "Não gosto de opinar sobre algo que eu não conferi direito."),
  item("justice", "first_pole", "Numa discussão, consigo enxergar o lado de quem discorda de mim."),
  item("law", "second_pole", "Me incomoda mais uma situação parada do que uma situação errada."),
  item("evolution", "first_pole", "Quando alguma coisa acaba, eu sigo em frente rápido."),
  item("generation", "second_pole", "Sei encerrar um ciclo sem drama quando ele chegou ao fim."),

  item("faith", "first_pole", "Em dia ruim, sou eu que seguro o ânimo de quem está por perto."),
  item(
    "love",
    "first_pole",
    "Percebo quando alguém está mal antes da pessoa dizer qualquer coisa.",
  ),
  item("knowledge", "first_pole", "Me interesso por muita coisa ao mesmo tempo."),
  item("justice", "first_pole", "Demoro para tomar partido porque quero ouvir todo mundo antes."),
  item("law", "first_pole", "Gosto de ter as etapas claras antes de começar."),
  item(
    "evolution",
    "first_pole",
    "Atravesso período difícil sem parar a minha vida por causa dele.",
  ),
  item("generation", "first_pole", "Costumo ser o porto seguro das pessoas próximas."),

  item(
    "faith",
    "second_pole",
    "De tempos em tempos faço uma limpeza na vida: hábitos, projetos, gente.",
  ),
  item(
    "love",
    "second_pole",
    "Já me reinventei dentro de uma relação: virei outra pessoa e não voltei.",
  ),
  item(
    "knowledge",
    "second_pole",
    "Prefiro saber muito de pouca coisa a saber pouco de muita coisa.",
  ),
  item("justice", "second_pole", "Tenho pouca paciência com quem passa dos limites."),
  item("law", "second_pole", "Costumo ser eu que sacode o ambiente quando ninguém se mexe."),
  item("evolution", "second_pole", "Mudança grande, para mim, pede um tempo de silêncio antes."),
  item("generation", "second_pole", "Guardo bem a lição do que passou, inclusive do que doeu."),
] as const;

export const regencyQuestionnaire = items;

export const regencyQuestionnaireSubmissionSchema = z
  .object({
    version: z.literal(REGENCY_QUESTIONNAIRE_VERSION),
    answers: z
      .array(
        z
          .object({
            questionId: z.enum(items.map(({ id }) => id)),
            value: answerValueSchema,
          })
          .strict(),
      )
      .length(items.length),
  })
  .strict()
  .superRefine((submission, context) => {
    const ids = submission.answers.map(({ questionId }) => questionId);
    if (new Set(ids).size !== items.length)
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
  value: Pole;
  strength: number;
  lensId: string;
}

/**
 * Diferença mínima, em pontos da escala, para declarar uma inclinação.
 *
 * Abaixo disso a pessoa concordou de modo parecido com os dois polos — seja por
 * ser mesmo equilibrada nessa função, seja por concordar com tudo. Os dois casos
 * pedem a mesma resposta honesta: não há inclinação a afirmar.
 */
const MINIMUM_TILT = 0.5;

/**
 * Diferença que já vale confiança total.
 *
 * Dois pontos de distância numa escala de cinco é um contraste que não sai de
 * ruído. Acima disso, mais distância não deveria pesar mais: o excesso costuma
 * ser estilo de resposta, e não intensidade do traço.
 */
const FULL_CONFIDENCE_TILT = 2;

export function extractRegencyQuestionnaireFeatures(
  input: RegencyQuestionnaireSubmission,
): RegencyQuestionnaireFeature[] {
  const submission = regencyQuestionnaireSubmissionSchema.parse(input);
  const scores = new Map(submission.answers.map(({ questionId, value }) => [questionId, value]));

  const lenses = [...new Set(items.map(({ lensId }) => lensId))];

  return lenses.flatMap((lensId) => {
    const first = poleMean(lensId, "first_pole", scores);
    const second = poleMean(lensId, "second_pole", scores);

    // Um polo sem nenhuma resposta não tem contra o que ser comparado. Estimar a
    // partir de metade do instrumento seria inventar a metade que falta.
    if (first === null || second === null) return [];

    const tilt = first - second;
    if (Math.abs(tilt) < MINIMUM_TILT)
      return [feature(lensId, "first_pole", 0.5), feature(lensId, "second_pole", 0.5)];

    const strength = Math.min(1, Math.abs(tilt) / FULL_CONFIDENCE_TILT);
    return [feature(lensId, tilt > 0 ? "first_pole" : "second_pole", round(strength))];
  });
}

/** Média das respostas de um polo, ou `null` se a pessoa não respondeu nenhuma. */
function poleMean(lensId: LensId, pole: Pole, scores: ReadonlyMap<string, string>): number | null {
  const answered = items
    .filter((candidate) => candidate.lensId === lensId && candidate.pole === pole)
    .map(({ id }) => scores.get(id))
    .filter((value): value is string => value !== undefined && value !== "prefer_not_to_answer")
    .map(Number);

  if (answered.length === 0) return null;
  return answered.reduce((total, value) => total + value, 0) / answered.length;
}

function item(lensId: LensId, pole: Pole, prompt: string) {
  const slug = prompt
    .slice(0, 14)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[^a-z]+/g, "");
  return {
    id: `${lensId}:${pole === "first_pole" ? "a" : "b"}:${slug}`,
    lensId,
    pole,
    prompt,
    options: SCALE,
  };
}

function feature(lensId: string, value: Pole, strength: number): RegencyQuestionnaireFeature {
  return {
    key: `self-report:${lensId}:${value}`,
    category: "self_report",
    value,
    strength,
    lensId,
  };
}

function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}
