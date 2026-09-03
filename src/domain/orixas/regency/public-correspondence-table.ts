import { regencyMatrix } from "./matrix";
import { generatedSymbolicCorrespondences } from "./symbolic-catalog";

export const PUBLIC_CORRESPONDENCE_TABLE_VERSION = "public-correspondence-table-1.0.0";

/**
 * Tábua operacional, em projeção pública.
 *
 * Duas coisas precisam sair antes de isto virar tela.
 *
 * A primeira é o acervo. O catálogo cru carrega `culturalSourceIds`,
 * `structuralSourceIds`, id de regra e id de atributo — publicar qualquer um
 * entrega a pesquisa que sustenta o produto. O tipo aqui não tem campo onde eles
 * caibam, que é a única forma de garantir que não escapem por descuido de quem
 * escrever o handler.
 *
 * A segunda é o número. O catálogo guarda uma força de convergência entre 0 e 1,
 * e ninguém lê `0.35` como "hipótese fraca, de um atributo só" — lê como medida.
 * Sai rótulo qualitativo, pela mesma razão que o grafo de funções nunca publica
 * percentual.
 *
 * E o mais importante: **isto é hipótese autoral, não tradição.** A tábua traduz
 * atributos de Orixá para a linguagem da astrologia ocidental, e essa tradução é
 * do AstroAxe. Publicá-la sem esse aviso faria o produto atribuir às tradições
 * uma correspondência que elas não afirmam.
 */

export const AUTHORIAL_NOTE =
  "Estas correspondências são hipótese do AstroAxe, e não afirmação das tradições: elas traduzem atributos para a linguagem da astrologia ocidental. As tradições não dizem isto — quem diz é o método, e o método pode estar errado.";

const factorLabels: Readonly<Record<string, string>> = {
  planet: "Planeta",
  zodiac_sign: "Signo",
  element: "Elemento",
  modality: "Modalidade",
  house: "Casa",
};

const valueLabels: Readonly<Record<string, string>> = {
  sun: "Sol",
  moon: "Lua",
  mercury: "Mercúrio",
  venus: "Vênus",
  mars: "Marte",
  jupiter: "Júpiter",
  saturn: "Saturno",
  uranus: "Urano",
  neptune: "Netuno",
  pluto: "Plutão",
  fire: "Fogo",
  earth: "Terra",
  air: "Ar",
  water: "Água",
  cardinal: "Cardinal",
  fixed: "Fixo",
  mutable: "Mutável",
};

export interface CorrespondenceRow {
  name: string;
  factorLabel: string;
  values: string[];
  /** Rótulo qualitativo. Nunca número, nunca percentual. */
  supportLabel: string;
}

export interface PublicCorrespondenceTable {
  version: string;
  note: string;
  rows: CorrespondenceRow[];
}

/**
 * Rótulo de apoio.
 *
 * Uma correspondência que nasce do encontro de vários atributos é mais forte que
 * a que nasce de um só. Dizer isso em palavras é honesto; dizer em número seria
 * afirmar uma precisão que a derivação não tem.
 */
function supportLabelFor(kind: string): string {
  return kind === "composite_convergence"
    ? "vários atributos convergem para esta leitura"
    : "deriva de um único atributo";
}

export function buildPublicCorrespondenceTable(): PublicCorrespondenceTable {
  const names = new Map(regencyMatrix.entities.map((entity) => [entity.id, entity.canonicalName]));

  const rows = generatedSymbolicCorrespondences.flatMap((item) => {
    const name = names.get(item.targetId);
    const factorLabel = factorLabels[item.factor];
    // Sem nome de leitura ou sem rótulo de fator, a linha sairia como
    // identificador interno. Melhor faltar.
    if (name === undefined || factorLabel === undefined) return [];
    return [
      {
        name,
        factorLabel,
        values: item.values.map((value) => valueLabels[value] ?? value),
        supportLabel: supportLabelFor(item.derivationKind),
      },
    ];
  });

  return {
    version: PUBLIC_CORRESPONDENCE_TABLE_VERSION,
    note: AUTHORIAL_NOTE,
    rows: rows.sort(
      (left, right) =>
        left.name.localeCompare(right.name, "pt-BR") ||
        left.factorLabel.localeCompare(right.factorLabel, "pt-BR"),
    ),
  };
}
