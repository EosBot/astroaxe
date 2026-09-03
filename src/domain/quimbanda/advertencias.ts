import { z } from "zod";

export const QUIMBANDA_ADVERTENCIAS_VERSION = "quimbanda-advertencias-0.1.0-research";

/**
 * Passo III do caminho: o que o trabalho cobra, antes de ensinar como se faz.
 *
 * Não é aviso legal nem termo de isenção. É o que a própria tradição diz sobre
 * a natureza do que se está abrindo — e o acervo é explícito: os Exus atuam
 * como **agentes cármicos**, executores da Lei do Karma. Quando há causa
 * desequilibrada, são eles que fazem o efeito acontecer. Cobram o que é devido,
 * não por maldade, mas para reequilibrar a balança da Justiça Divina.
 *
 * A consequência prática também está no acervo com todas as letras: por serem
 * forças pouco conhecidas, não devem ser invocadas por qualquer coisa, e
 * fazê-lo é expor-se a perigos fortes, incontroláveis e desconhecidos.
 *
 * ## Por que isto existe separado da orientação
 *
 * O dono decidiu que o produto orienta e que o risco é de quem abre, perante a
 * lei divina. Uma advertência que aparece **antes** do procedimento, e que a
 * pessoa lê e decide, é o contrário de esconder: é dar a ela o que a tradição
 * dá a quem chega num terreiro pedindo trabalho. Omitir o preço para não
 * assustar seria o desrespeito, e não o cuidado.
 *
 * Não há exigência de consentimento de terceiro. Também foi decisão do dono: o
 * aviso é forte, a escolha é de quem opera, e a conta é dele.
 */

const advertenciaSchema = z
  .object({
    id: z.string().regex(/^advertencia:[a-z0-9-]+$/),
    /** A que Reino se aplica; nulo quando vale para toda a Quimbanda. */
    reinoId: z
      .string()
      .regex(/^reino:[a-z-]+$/)
      .nullable(),
    title: z.string().trim().min(1).max(120),
    /** O que se assume ao abrir aquele trabalho. */
    body: z.string().trim().min(40).max(900),
  })
  .strict();

export type QuimbandaAdvertencia = z.infer<typeof advertenciaSchema>;

/**
 * Advertências que valem para qualquer trabalho na Quimbanda.
 *
 * Saem do acervo, e não de prudência genérica. Cada uma responde a algo que a
 * tradição afirma sobre a natureza da força com que se trabalha.
 */
export const advertenciasGerais: readonly QuimbandaAdvertencia[] = [
  advertenciaSchema.parse({
    id: "advertencia:agentes-carmicos",
    reinoId: null,
    title: "Você está chamando quem executa a lei, não quem a suspende",
    body: "Os Exus atuam como agentes cármicos: quando existe causa desequilibrada, são eles que fazem o efeito acontecer. Cobram o que é devido para reequilibrar a balança, e não por maldade. Isso significa que a força chamada não distingue de que lado da causa você está — se houver dívida sua no assunto, ela também será cobrada. Quem pede justiça pede a lei inteira, e a lei olha para os dois lados.",
  }),
  advertenciaSchema.parse({
    id: "advertencia:nao-por-qualquer-coisa",
    reinoId: null,
    title: "Não se abre por qualquer coisa",
    body: "O acervo é direto: por serem forças pouco conhecidas, não devem ser invocadas por qualquer motivo, e fazê-lo é expor-se a perigos fortes, incontroláveis e desconhecidos. Trabalho aberto por impulso, por curiosidade ou por raiva do dia é o que mais produz consequência que ninguém previu. A pergunta que precede o procedimento não é como se faz, e sim se é para ser feito.",
  }),
  advertenciaSchema.parse({
    id: "advertencia:o-que-se-abre-se-fecha",
    reinoId: null,
    title: "O que se abre precisa ser fechado",
    body: "Todo trabalho tem começo, permanência e encerramento. A firmeza tem tempo, a oferenda tem destino e o que foi levantado precisa ser despachado. Deixar trabalho aberto — sem fechamento, sem descarte, sem o que foi combinado — é a origem de boa parte do que depois se chama de retorno. Quem não pretende cumprir a parte de encerrar não deveria começar.",
  }),
  advertenciaSchema.parse({
    id: "advertencia:conta-de-quem-abre",
    reinoId: null,
    title: "A conta é de quem abre",
    body: "O AstroAxe organiza fundamento, hora e procedimento. Não pede permissão a ninguém, não julga a sua intenção e não assume a sua responsabilidade. O que você faz com o que está aqui responde à lei divina, e essa conta não é transferível: nem para o terreiro, nem para quem escreveu, nem para o aplicativo.",
  }),
];

/**
 * Advertências específicas de cada Reino.
 *
 * Derivam do domínio que o próprio Reino declara — Almas executa lei cármica,
 * Kalunga Pequena lida com o que já morreu, Lira com prazer e dinheiro. Não são
 * fundamento novo: são o fundamento do Reino dito na forma de aviso.
 */
export const advertenciasPorReino: readonly QuimbandaAdvertencia[] = [
  advertenciaSchema.parse({
    id: "advertencia:almas-lei-executora",
    reinoId: "reino:almas",
    title: "Reino das Almas: a justiça aqui executa",
    body: "Este é o Reino da lei cármica, da demanda e da justiça executora — a força que corta o que é injusto. Ela não negocia e não mede consequência pelo tamanho da sua mágoa. Quem abre demanda aqui está pedindo que a balança seja acertada, e a balança acerta os dois pratos. É o Reino que mais cobra de quem chama sem ter a própria conta em dia.",
  }),
  advertenciaSchema.parse({
    id: "advertencia:kalunga-pequena-morte",
    reinoId: "reino:kalunga-pequena",
    title: "Reino da Kalunga Pequena: aqui se trata do que já morreu",
    body: "O cemitério é portal de ancestralidade, quebra de praga familiar e desapego do que já acabou. Não é lugar de pedir de volta o que ainda está vivo. Trabalhar aqui insistindo que algo encerrado retorne é ir contra a natureza do próprio Reino, e o que costuma vir dessa insistência é o apodrecimento daquilo que já devia ter sido entregue.",
  }),
  advertenciaSchema.parse({
    id: "advertencia:kalunga-grande-dissolucao",
    reinoId: "reino:kalunga-grande",
    title: "Reino da Kalunga Grande: o mar dissolve, e não devolve",
    body: "A Kalunga Grande é limpeza profunda e reintegração ao todo. O que se entrega ao mar se dissolve — e isso vale também para o que você não pretendia perder junto. Trabalho de dissolução feito com raiva costuma levar mais do que o alvo: leva o vínculo inteiro, inclusive a parte que ainda servia.",
  }),
  advertenciaSchema.parse({
    id: "advertencia:lira-excesso",
    reinoId: "reino:lira",
    title: "Reino da Lira: prazer e sorte cobram na mesma moeda",
    body: "Arte, prazer, sorte, dinheiro e sedução são o domínio deste Reino, e são também as áreas em que o excesso passa despercebido por mais tempo. O que se abre aqui tende a crescer rápido e a não avisar quando passou do ponto. Trabalho de Lira pede acompanhamento de perto e limite combinado antes, não depois.",
  }),
  advertenciaSchema.parse({
    id: "advertencia:encruzilhadas-portal",
    reinoId: "reino:encruzilhadas",
    title: "Reino das Encruzilhadas: portal aberto é porta nos dois sentidos",
    body: "A encruzilhada é o portal que permite a Exu estar em qualquer lugar, e é por onde se chama. Portal não escolhe direção: abrir caminho é também tornar-se alcançável. Por isso a encruzilhada pede firmeza e saudação, e não improviso — e por isso é o primeiro Reino que se aprende a respeitar.",
  }),
  advertenciaSchema.parse({
    id: "advertencia:matas-cura",
    reinoId: "reino:matas",
    title: "Reino das Matas: folha cura e folha faz mal",
    body: "Aqui se trabalha com erva, banho e defumação, e a mesma planta que cura numa dosagem faz mal em outra. Este é o Reino em que o erro é material, e não apenas espiritual: erva errada, quantidade errada e uso interno sem conhecimento fazem dano físico. Trabalho de mata não substitui tratamento de saúde, e quem tem condição clínica precisa cuidar dela também.",
  }),
  advertenciaSchema.parse({
    id: "advertencia:cruzeiros-lei",
    reinoId: "reino:cruzeiros",
    title: "Reino dos Cruzeiros: a lei firmada não se desfaz por arrependimento",
    body: "O cruzeiro é onde a lei se firma, e é a intersecção entre a vida e a morte. O que se firma aqui tem peso de compromisso: pedir proteção, ordem ou expansão neste Reino é assinar de um lado, e a outra parte também cobra a dela. Firmeza feita no impulso costuma ser descoberta como compromisso só quando chega a hora de cumprir.",
  }),
];

export function advertenciasFor(reinoId: string): QuimbandaAdvertencia[] {
  return [
    ...advertenciasGerais,
    ...advertenciasPorReino.filter((item) => item.reinoId === reinoId),
  ];
}
