import { z } from "zod";

export const TRADICOES_CATALOGO_VERSION = "tradicoes-catalogo-0.1.0-research";

/**
 * Catálogo de tradições.
 *
 * O guia cobre **todas** as tradições que o acervo sustenta, e não uma de cada
 * vez até acabar. A versão anterior deste trabalho foi fundo na Quimbanda e
 * deixou o resto sem nada — o que produziu um produto que parecia especializado
 * quando na verdade estava incompleto.
 *
 * Cada tradição declara quanto acervo tem por trás. O número não é enfeite: diz
 * onde dá para escrever com fundamento e onde escrever seria inventar. Uma
 * tradição com setenta trechos não recebe o mesmo tratamento de uma com mil e
 * setecentos, e é melhor declarar isso do que fingir profundidade igual.
 *
 * ## Profundidade declarada
 *
 * - `orientacao`: o acervo sustenta orientar procedimento
 * - `fundamento`: sustenta explicar o que é, o que faz e com quem se trabalha
 * - `panorama`: sustenta apresentar e situar, não instruir
 */

const profundidadeSchema = z.enum(["orientacao", "fundamento", "panorama"]);

const tradicaoSchema = z
  .object({
    id: z.string().regex(/^tradicao:[a-z0-9-]+$/),
    name: z.string().trim().min(1).max(80),
    /** O que a tradição é, para quem chega sem conhecer. */
    summary: z.string().trim().min(60).max(700),
    /** Que tipo de trabalho ela faz. */
    works: z.array(z.string().trim().min(1).max(80)).min(1).max(12),
    /** Com quem se trabalha nela. Vazio quando a tradição não opera por entidade. */
    entities: z.array(z.string().trim().min(1).max(80)).max(12),
    /** Trechos do acervo, medidos e não estimados. */
    corpusChunks: z.number().int().nonnegative(),
    depth: profundidadeSchema,
  })
  .strict();

export type Tradicao = z.infer<typeof tradicaoSchema>;

/**
 * As tradições, em ordem de acervo.
 *
 * As contagens foram medidas no banco em 3 de setembro de 2026, e mudam quando
 * o acervo cresce.
 */
export const tradicoes: readonly Tradicao[] = [
  tradicaoSchema.parse({
    id: "tradicao:umbanda",
    name: "Umbanda",
    summary:
      "Religião brasileira que organiza o trabalho espiritual em linhas e falanges, com Orixás, caboclos, pretos-velhos, erês, boiadeiros e marinheiros. Trabalha por incorporação, ponto cantado, ponto riscado, banho, defumação e passe, e mantém uma doutrina de caridade que orienta o que se faz e o que não se faz.",
    works: ["passe", "descarrego", "banho", "defumação", "firmeza", "consulta", "oferenda"],
    entities: [
      "Orixás",
      "caboclos",
      "pretos-velhos",
      "erês",
      "boiadeiros",
      "marinheiros",
      "exus de lei",
    ],
    corpusChunks: 1722,
    depth: "orientacao",
  }),
  tradicaoSchema.parse({
    id: "tradicao:quimbanda",
    name: "Quimbanda",
    summary:
      "Culto organizado em Sete Reinos, cada um governado por um Exu Rei e uma Pombagira Rainha, com legiões abaixo. Os Reinos correspondem às sete sephirot inferiores e aos sete planetas sagrados, o que dá a chave da função de cada um. Trabalha demanda, abertura de caminho, proteção, prosperidade, justiça e encerramento de ciclo.",
    works: ["oferenda", "firmeza", "demanda", "abertura de caminho", "descarrego", "assentamento"],
    entities: ["Exus", "Pombagiras", "chefes de legião", "Exu Rei", "Pombagira Rainha"],
    corpusChunks: 1026,
    depth: "orientacao",
  }),
  tradicaoSchema.parse({
    id: "tradicao:hermetismo",
    name: "Hermetismo",
    summary:
      "Corpo de doutrina que sustenta boa parte da magia ocidental: os princípios de correspondência, ritmo, polaridade e mentalismo, a leitura do universo em sete planos e a ideia de que o que está embaixo espelha o que está em cima. Não é um culto com entidades próprias, e sim a gramática que várias tradições usam.",
    works: ["meditação", "estudo", "correspondência", "trabalho com os princípios"],
    entities: [],
    corpusChunks: 995,
    depth: "fundamento",
  }),
  tradicaoSchema.parse({
    id: "tradicao:sigilos",
    name: "Selos, sigilos e talismãs",
    summary:
      "A arte de condensar intenção em forma: o selo que representa um espírito, o sigilo construído a partir de uma frase, o talismã feito na hora planetária certa e carregado para uma finalidade. Atravessa a magia angelical, a goética e a cerimonial clássica, e é onde a hora planetária mais importa.",
    works: ["confecção de selo", "sigilo de intenção", "talismã", "consagração", "carga"],
    entities: ["anjos", "espíritos olímpicos", "inteligências planetárias", "espíritos goéticos"],
    corpusChunks: 937,
    depth: "orientacao",
  }),
  tradicaoSchema.parse({
    id: "tradicao:evocacao",
    name: "Círculo e evocação",
    summary:
      "A prática cerimonial de traçar o círculo, abrir o trabalho, chamar, tratar e licenciar. Reúne o instrumental clássico — círculo, triângulo, nomes de poder, incenso, tempo e direção — e é a moldura dentro da qual a magia angelical, olímpica e goética acontece.",
    works: ["traçado do círculo", "abertura", "evocação", "tratativa", "licença e fechamento"],
    entities: ["anjos", "espíritos olímpicos", "espíritos goéticos", "espíritos aéreos"],
    corpusChunks: 802,
    depth: "orientacao",
  }),
  tradicaoSchema.parse({
    id: "tradicao:alquimia",
    name: "Alquimia",
    summary:
      "Trabalho de transmutação operado sobre a matéria e sobre quem a opera. Calcinação, dissolução, separação, conjunção e as demais operações, lidas ao mesmo tempo como química e como processo interior. Fornece boa parte do vocabulário que a magia usa para falar de mudança.",
    works: ["operações alquímicas", "espagiria", "elixires", "leitura simbólica do processo"],
    entities: [],
    corpusChunks: 669,
    depth: "fundamento",
  }),
  tradicaoSchema.parse({
    id: "tradicao:cabala",
    name: "Cabala",
    summary:
      "A Árvore da Vida com suas dez sephirot e os caminhos entre elas, os nomes divinos e as hierarquias angélicas. É o mapa que a magia cerimonial usa para localizar força, e é por ele que os Reinos da Quimbanda encontram planeta e sephirah correspondentes.",
    works: ["meditação nos caminhos", "nomes divinos", "correspondência", "trabalho sephirótico"],
    entities: ["arcanjos", "coros angélicos", "inteligências"],
    corpusChunks: 657,
    depth: "fundamento",
  }),
  tradicaoSchema.parse({
    id: "tradicao:tarot",
    name: "Tarot",
    summary:
      "Vinte e dois arcanos maiores e cinquenta e seis menores, usados tanto para consulta quanto como suporte de meditação e de trabalho mágico. Cada arcano carrega correspondência planetária, elemental e cabalística, o que o liga ao mesmo mapa que a magia cerimonial usa.",
    works: ["consulta", "meditação em arcano", "suporte de trabalho", "estudo de correspondência"],
    entities: [],
    corpusChunks: 600,
    depth: "fundamento",
  }),
  tradicaoSchema.parse({
    id: "tradicao:fitoterapia",
    name: "Ervas, banhos e defumação",
    summary:
      "O trabalho com folha: banho de descarrego e de atração, defumação de ambiente e de pessoa, chá, macerado e amaci. Atravessa Umbanda, Quimbanda e bruxaria, e é onde o erro deixa de ser espiritual e passa a ser material — erva errada faz dano no corpo.",
    works: ["banho", "defumação", "amaci", "chá", "macerado", "sachê"],
    entities: [],
    corpusChunks: 445,
    depth: "orientacao",
  }),
  tradicaoSchema.parse({
    id: "tradicao:candomble",
    name: "Candomblé",
    summary:
      "Religião de nação, africana em origem e preservada no Brasil, organizada em nações como Ketu, Jeje e Angola. Trabalha por assentamento, obrigação, iniciação e oferenda, com fundamento transmitido dentro da casa e sob autoridade de quem tem o direito de transmiti-lo.",
    works: ["assentamento", "obrigação", "oferenda", "iniciação", "consulta ao oráculo"],
    entities: ["Orixás"],
    corpusChunks: 430,
    depth: "panorama",
  }),
  tradicaoSchema.parse({
    id: "tradicao:bruxaria",
    name: "Bruxaria e Wicca",
    summary:
      "Práticas de tradição europeia reorganizadas no século vinte: roda do ano, quatro elementos, círculo lançado, trabalho com lua e com erva. Compartilha instrumental com a magia cerimonial, mas opera com menos hierarquia e mais relação direta com a natureza.",
    works: ["círculo", "feitiço", "trabalho lunar", "roda do ano", "erva e vela"],
    entities: ["deusa e deus", "elementais", "ancestrais"],
    corpusChunks: 403,
    depth: "fundamento",
  }),
  tradicaoSchema.parse({
    id: "tradicao:angelical",
    name: "Magia angelical",
    summary:
      "Trabalho com anjos e arcanjos por nome, selo e hora planetária. Inclui a tradição dos setenta e dois nomes, as hierarquias cabalísticas e a prática de petição por escrito. É a face luminosa do mesmo instrumental que a goética usa.",
    works: ["petição", "selo angélico", "invocação", "salmo", "consagração"],
    entities: ["anjos", "arcanjos", "inteligências planetárias"],
    corpusChunks: 315,
    depth: "orientacao",
  }),
  tradicaoSchema.parse({
    id: "tradicao:runas",
    name: "Runas e tradição nórdica",
    summary:
      "O futhark usado como oráculo e como operação: cada runa é letra, som, força e conceito. Trabalha por traçado, entalhe, galdr e bindrune, e carrega um panteão e uma cosmologia próprios.",
    works: ["tiragem", "entalhe", "bindrune", "galdr"],
    entities: ["Æsir", "Vanir", "ancestrais"],
    corpusChunks: 242,
    depth: "panorama",
  }),
  tradicaoSchema.parse({
    id: "tradicao:goetia",
    name: "Goétia",
    summary:
      "Setenta e dois espíritos com nome, selo, hierarquia e ofício declarado, evocados dentro de círculo e tratados por licença antes de se ir embora. Cada um tem título — rei, duque, marquês, presidente — e uma competência que a tradição descreve com precisão incomum. O acervo cobre o suficiente para situar e nomear, e não para instruir procedimento completo: a lacuna fica declarada.",
    works: ["evocação", "selo", "tratativa", "licença"],
    entities: ["os setenta e dois espíritos", "reis", "duques", "marqueses", "presidentes"],
    corpusChunks: 155,
    depth: "panorama",
  }),
  tradicaoSchema.parse({
    id: "tradicao:apometria",
    name: "Apometria",
    summary:
      "Técnica brasileira de desdobramento e desobsessão, operada em equipe, com comando por pulsos e trabalho sobre corpos sutis. Nasce no espiritismo e dialoga com a Umbanda, e é usada em tratamento espiritual e em resgate.",
    works: ["desdobramento", "desobsessão", "tratamento", "resgate"],
    entities: ["equipe espiritual", "mentores"],
    corpusChunks: 115,
    depth: "panorama",
  }),
  tradicaoSchema.parse({
    id: "tradicao:olimpicos",
    name: "Espíritos olímpicos",
    summary:
      "Sete governadores planetários — Aratron, Bethor, Phaleg, Och, Hagith, Ophiel e Phul —, cada um regendo um planeta e um período de anos dentro de um grande ciclo. Trabalho por hora planetária, selo e petição, e é a tradição que mais depende do cálculo de tempo que este produto já faz.",
    works: ["petição", "selo", "trabalho por hora planetária"],
    entities: ["Aratron", "Bethor", "Phaleg", "Och", "Hagith", "Ophiel", "Phul"],
    corpusChunks: 73,
    depth: "panorama",
  }),
  tradicaoSchema.parse({
    id: "tradicao:cigana",
    name: "Magia cigana",
    summary:
      "Trabalho com o povo cigano dentro da religiosidade brasileira: baralho, vela, fita, moeda e oferenda, com forte presença de música e de festa. Aparece cruzada com Umbanda e com Quimbanda, e tem legião própria no Reino da Lira.",
    works: ["baralho", "oferenda", "vela", "amarração de fita"],
    entities: ["povo cigano", "Exu Cigano", "Pombagira Cigana"],
    corpusChunks: 38,
    depth: "panorama",
  }),
];

export function tradicaoById(id: string): Tradicao | undefined {
  return tradicoes.find((tradicao) => tradicao.id === id);
}

/** Tradições em que o acervo sustenta orientar procedimento. */
export function tradicoesComOrientacao(): Tradicao[] {
  return tradicoes.filter((tradicao) => tradicao.depth === "orientacao");
}

/** Tradições que operam por entidade nomeada. */
export function tradicoesComEntidades(): Tradicao[] {
  return tradicoes.filter((tradicao) => tradicao.entities.length > 0);
}
