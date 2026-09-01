import { z } from "zod";

import {
  condenseStructuralFunctions,
  type ConvergenceStrength,
  type FunctionAssignment,
} from "./function-graph";
import { findStructuralFunction } from "./structural-functions";

export const PUBLIC_FUNCTION_GRAPH_VERSION = "public-function-graph-1.0.0";

const publicOccupantSchema = z
  .object({
    name: z.string().trim().min(1).max(80),
    /** Categoria em rótulo de leitura. É ela que impede a leitura sincrética. */
    categoryLabel: z.string().trim().min(1).max(60),
  })
  .strict();

/**
 * Projeção pública do grafo de funções.
 *
 * O `BLUEPRINT` §5.0 decide que a proveniência por claim **sai da interface**: ela
 * continua registrada internamente, para permitir corrigir o método quando uma
 * fonte se mostrar errada, e não é aparato de citação exibido ao leitor.
 *
 * Por isso este tipo **não tem** campo para escola, obra, família, locator ou
 * confiança de extração. A garantia é do tipo, e não da disciplina de quem escreve
 * o componente: não existe caminho em que um deles atravesse por descuido, porque
 * não existe onde escrevê-lo.
 */
export const publicStructuralFunctionSchema = z
  .object({
    functionId: z.string().regex(/^function:[a-z0-9-]+$/),
    label: z.string().trim().min(1).max(120),
    question: z.string().trim().min(1).max(240),
    /**
     * Rótulo qualitativo, nunca percentual.
     *
     * Não existe amostra que calibre um número aqui, e um percentual seria lido
     * como certeza. O que se pode afirmar honestamente é quantas linhagens
     * distintas chegaram à mesma posição.
     */
    supportLabel: z.string().trim().min(1).max(160),
    independentLineages: z.number().int().positive(),
    occupants: z.array(publicOccupantSchema).min(1).max(24),
    /** O que a condensação afirma, e o teto do que ela pode afirmar. */
    relation: z.literal("ocupa a mesma função estrutural"),
    /**
     * Nota de divergência, quando existe.
     *
     * Divergência que derrube a função não pode ser publicada como se fosse
     * consenso: nesse caso a nota diz que as fontes discordam da própria função.
     */
    divergenceNote: z.string().trim().min(1).max(400).nullable(),
  })
  .strict();

export type PublicStructuralFunction = z.infer<typeof publicStructuralFunctionSchema>;

export const publicFunctionGraphSchema = z
  .object({
    version: z.literal(PUBLIC_FUNCTION_GRAPH_VERSION),
    functions: z.array(publicStructuralFunctionSchema).min(1).max(64),
  })
  .strict();

export type PublicFunctionGraph = z.infer<typeof publicFunctionGraphSchema>;

const supportLabels: Readonly<Record<ConvergenceStrength, string>> = {
  convergent: "três ou mais escolas independentes chegaram à mesma posição",
  corroborated: "duas escolas independentes chegaram à mesma posição",
  single_school: "uma escola sustenta esta posição",
};

const categoryLabels: Readonly<Record<FunctionAssignment["entityCategory"], string>> = {
  orisa: "Orixá",
  guide_entity: "entidade de guia",
  angel: "anjo",
  olympic_spirit: "espírito olímpico",
  goetic_spirit: "espírito goético",
  aerial_spirit: "espírito aéreo",
  planetary_intelligence: "inteligência planetária",
};

/**
 * Nomes de leitura das potências.
 *
 * Escrito à mão em vez de derivado do identificador: `espiritos-chefes` viraria
 * "Espiritos Chefes" e `esu` perderia a grafia que a tradição usa.
 *
 * Entidade sem nome aqui **derruba a construção**. Omiti-la em silêncio seria pior:
 * ela sumiria da página sem que ninguém notasse, e a função apareceria com um
 * ocupante a menos como se aquela tradição não a sustentasse. Como a página é
 * estática, a falha aparece no build — que é onde ela deve aparecer.
 */
const occupantNames: Readonly<Record<string, string>> = {
  "entity:agrippa:hagiel": "Hagiel",
  "entity:almadel:anjos-primeira-altitude": "Anjos da Primeira Altitude",
  "entity:ceremonial:bethor": "Bethor",
  "entity:ceremonial:gabriel": "Gabriel",
  "entity:ceremonial:hagith": "Hagith",
  "entity:ceremonial:haniel": "Haniel",
  "entity:ceremonial:khamael": "Khamael",
  "entity:ceremonial:michael": "Michael",
  "entity:ceremonial:och": "Och",
  "entity:ceremonial:phaleg": "Phaleg",
  "entity:ceremonial:raphael": "Raphael",
  "entity:ceremonial:sachiel": "Sachiel",
  "entity:ceremonial:uriel": "Uriel",
  "entity:goetia:beleth": "Beleth",
  "entity:goetia:bune": "Bune",
  "entity:goetia:gusion": "Gusion",
  "entity:goetia:leraie": "Leraie",
  "entity:goetia:marbas": "Marbas",
  "entity:ifa:esu": "Èṣù",
  "entity:ifa:orunmila": "Òrúnmìlà",
  "entity:quimbanda:exu": "Exu",
  "entity:theurgia:espiritos-chefes": "Espíritos Chefes",
  "entity:umbanda:iemanja": "Iemanjá",
  "entity:umbanda:obaluaie": "Obaluaiê",
  "entity:umbanda:ogum": "Ogum",
  "entity:umbanda:omolu": "Omolu",
  "entity:umbanda:oxala": "Oxalá",
  "entity:umbanda:oxum": "Oxum",
  "entity:umbanda:xango": "Xangô",
  "entity:yoruba:orishala": "Òrìṣàlá",
};

/**
 * Traduz o grafo condensado para o que a página publica.
 *
 * Falha alto diante de entidade sem nome de leitura, em vez de publicar a função
 * com um ocupante a menos — o que sugeriria que aquela tradição não a sustenta.
 */
export function buildPublicFunctionGraph(rawGraph: unknown): PublicFunctionGraph {
  const functions = condenseStructuralFunctions(rawGraph).flatMap((group) => {
    const structural = findStructuralFunction(group.functionId);
    if (structural === undefined) return [];

    const occupants = group.members.map((member) => {
      const name = occupantNames[member.entityId];
      if (name === undefined)
        throw new Error(`entidade sem nome público na projeção: ${member.entityId}`);
      return { name, categoryLabel: categoryLabels[member.entityCategory] };
    });

    const estavel = group.divergences.find(({ functionRemainsStable }) => functionRemainsStable);
    const instavel = group.divergences.find(({ functionRemainsStable }) => !functionRemainsStable);

    return [
      {
        functionId: group.functionId,
        label: structural.label,
        question: structural.question,
        supportLabel: supportLabels[group.strength],
        independentLineages: group.independentFamilyCount,
        occupants,
        relation: "ocupa a mesma função estrutural" as const,
        divergenceNote:
          instavel !== undefined
            ? "As fontes discordam da própria função, e por isso esta posição não é apresentada como consenso."
            : estavel === undefined
              ? null
              : "As fontes discordam sobre qual potência ocupa o posto, e concordam sobre a função.",
      },
    ];
  });

  return publicFunctionGraphSchema.parse({ version: PUBLIC_FUNCTION_GRAPH_VERSION, functions });
}
