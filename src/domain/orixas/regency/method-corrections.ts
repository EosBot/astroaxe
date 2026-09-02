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
    id: "correction:lineage-attributed-to-declared-author",
    recordedOn: "2026-08-31",
    area: "proveniência",
    whatChanged:
      "Uma obra do acervo estava filiada a uma escola histórica por suposição, e passou a ser atribuída ao autor que ela própria declara.",
    why: "A filiação nunca esteve na obra. A bibliografia que ela declara é inteiramente de compiladores do século XX em diante, e a escola histórica a que fora atribuída não aparece em lugar nenhum. A conferência foi feita no texto, e não pelo que se supunha sobre ele.",
    consequence:
      "Nenhuma convergência mudou, porque a família de linhagem continua a mesma e a obra era a única nela. O que mudou é que a escola declarada passou a ser verificável na fonte, em vez de herdada de uma suposição.",
  },
  {
    id: "correction:gloss-is-not-source",
    recordedOn: "2026-08-31",
    area: "proveniência",
    whatChanged:
      "Cinco atribuições de uma tradição cerimonial passaram a citar a descrição original da obra, e não a glosa de quem a compilou. Uma delas saiu do método por não se sustentar.",
    why: "O material do acervo separa a glosa moderna do compilador da citação da obra original, e as cinco atribuições repousavam na glosa. Conferidas contra o original, quatro se sustentaram e uma não: a fonte descrevia um domínio geral, e não a função estrutural que lhe fora atribuída.",
    consequence:
      "Uma das funções perdeu uma linhagem de sustentação. O método mostra uma convergência a menos ali, e as que mostra estão ancoradas na fonte e não no comentário de quem a compilou.",
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
