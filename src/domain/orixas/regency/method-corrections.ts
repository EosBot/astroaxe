import { z } from "zod";

/**
 * Registro de correções do método.
 *
 * `docs/BLUEPRINT.md` §5.0 e o P1.6 pedem que uma leitura errada gere nova
 * versão registrando o que mudou e por quê — e é por isso que a proveniência
 * interna permanece. Um princípio declarado sem registro é promessa; este
 * módulo é o registro, e a página de metodologia o publica.
 *
 * Só entra aqui correção que já aconteceu e é verificável na documentação do
 * projeto. Não é roadmap.
 */
export const REGENCY_METHOD_CORRECTION_LOG_VERSION = "regency-method-corrections-0.1.0";

export const methodCorrectionSchema = z
  .object({
    id: z.string().regex(/^correction:[a-z0-9-]+$/),
    recordedOn: z.iso.date(),
    area: z.enum(["escopo", "proveniência", "vocabulário", "cálculo"]),
    whatChanged: z.string().trim().min(1).max(400),
    why: z.string().trim().min(1).max(600),
    consequence: z.string().trim().min(1).max(400),
  })
  .strict();

export type MethodCorrection = z.infer<typeof methodCorrectionSchema>;

export const regencyMethodCorrections: readonly MethodCorrection[] = [
  {
    id: "correction:traditions-may-be-condensed",
    recordedOn: "2026-08-26",
    area: "escopo",
    whatChanged:
      "A regra que proibia agrupar tradições diferentes foi substituída pela condensação por função estrutural, em três camadas.",
    why: "A proibição estava errada na prática: muitas tradições se complementam, os fundamentos se cruzam, e mantê-las separadas por princípio impedia justamente o cruzamento que dá robustez ao método.",
    consequence:
      "Passou a existir uma camada de funções comum às tradições, com a ressalva de que o que se afirma é posição análoga e nunca identidade entre entidades.",
  },
  {
    id: "correction:lineage-not-edition",
    recordedOn: "2026-08-27",
    area: "proveniência",
    whatChanged:
      "A sustentação passou a ser contada por linhagem de fonte, e não por obra. Quatro livros de um mesmo autor deixaram de valer como quatro confirmações.",
    why: "A conferência de autoria mostrou que quatro das obras mais presentes no acervo são do mesmo autor. Contá-las separadamente inflava a convergência exatamente onde o material é mais denso, fazendo passar por consenso entre escolas o que era a exposição de uma voz só.",
    consequence:
      "Funções antes sustentadas por várias obras passaram a aparecer como sustentadas por uma escola só. O método mostra menos convergência do que mostrava, e a que mostra é real.",
  },
  {
    id: "correction:angelical-school-not-trithemius",
    recordedOn: "2026-08-31",
    area: "proveniência",
    whatChanged:
      "A obra angélica do corpus deixou de ser atribuída à escola de Trithemius e passou a ser atribuída ao autor que ela própria declara, Frater Dalton R.F.",
    why: "A filiação nunca esteve na obra. Sua bibliografia declara Vacchiano, Goddard, Mathers, Vitor Sanches, Sistemagia e Ordem Lótus Negro; Trithemius não aparece, e Agrippa surge uma vez só, de passagem, numa lista de autores que tratam do círculo mágico — não como fonte das correspondências.",
    consequence:
      "Nenhuma convergência mudou, porque a família de linhagem continua a mesma e a obra era a única nela. O que mudou é que a escola declarada passou a ser verificável na fonte, em vez de herdada de uma suposição.",
  },
  {
    id: "correction:arbatel-gloss-not-source",
    recordedOn: "2026-08-31",
    area: "proveniência",
    whatChanged:
      "As cinco atribuições dos espíritos olímpicos passaram a citar a descrição original do grimório de Arbatel, e não a glosa do compilador. Ophiel saiu da função de abertura de caminho.",
    why: "O texto do acervo separa a glosa moderna (“atua em todos os assuntos planetários de X”) da citação do grimório, e as cinco atribuições repousavam na glosa. Conferidas contra o original, quatro se sustentaram e uma não: o Arbatel diz que Ophiel governa as coisas de Mercúrio, dá espíritos familiares e ensina todas as artes, e não diz nada sobre abrir, fechar ou ordenar passagem.",
    consequence:
      "A função de abertura de caminho perdeu uma linhagem e continua sustentada por três. O método mostra uma convergência a menos ali, e as que mostra estão ancoradas na fonte e não no comentário de quem a compilou.",
  },
].map((item) => methodCorrectionSchema.parse(item));

/**
 * Correções da mais recente para a mais antiga.
 *
 * A ordem de leitura é essa: quem chega quer saber o que mudou por último. O
 * registro nunca é reescrito — corrigir uma correção gera uma entrada nova.
 */
export function listMethodCorrections(): MethodCorrection[] {
  return [...regencyMethodCorrections].sort((left, right) =>
    right.recordedOn.localeCompare(left.recordedOn),
  );
}
