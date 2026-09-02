import type { PublicFunctionGraph } from "./public-function-graph";

export const FUNCTION_INDEX_VERSION = "public-function-index-1.0.0";

/**
 * Índice invertido do grafo de funções.
 *
 * A página de metodologia lista as funções e quem as ocupa. Serve para explicar
 * o método, e não para trabalhar com ele: quem opera não chega perguntando "o
 * que é a função de aflição e cura", chega com um nome na mão.
 *
 * Este índice responde à pergunta inversa — dada uma entidade, que funções ela
 * ocupa, e **quem mais** ocupa as mesmas. É a informação que o acervo torna
 * possível e que nenhuma tradição isolada oferece, porque nenhuma delas enxerga
 * as outras.
 *
 * O que ele afirma continua sendo posição análoga, nunca identidade. Por isso a
 * categoria acompanha cada nome em toda listagem: ver "Orixá" ao lado de "anjo"
 * na mesma linha é o que impede a leitura de que um seja o outro.
 */

export interface IndexedOccupant {
  name: string;
  categoryLabel: string;
}

export interface IndexedFunction {
  functionId: string;
  label: string;
  question: string;
  supportLabel: string;
  independentLineages: number;
  divergenceNote: string | null;
  /** Quem mais ocupa esta função, fora a entidade consultada. */
  others: IndexedOccupant[];
}

export interface IndexedEntity {
  name: string;
  categoryLabel: string;
  functions: IndexedFunction[];
}

export interface FunctionIndex {
  version: string;
  entities: IndexedEntity[];
}

/**
 * Inverte o grafo público, preservando tudo que ele já decidiu publicar.
 *
 * Trabalha sobre a projeção pública, e nunca sobre o grafo cru. O grafo cru
 * carrega obra, edição, locator e escola; a projeção já os removeu. Reinverter a
 * partir dele reabriria, por uma porta lateral, exatamente o que a projeção
 * fechou.
 */
export function buildFunctionIndex(graph: PublicFunctionGraph): FunctionIndex {
  const byEntity = new Map<string, IndexedEntity>();

  for (const fn of graph.functions) {
    for (const occupant of fn.occupants) {
      const key = `${occupant.categoryLabel}:${occupant.name}`;
      const entry = byEntity.get(key) ?? {
        name: occupant.name,
        categoryLabel: occupant.categoryLabel,
        functions: [],
      };
      entry.functions.push({
        functionId: fn.functionId,
        label: fn.label,
        question: fn.question,
        supportLabel: fn.supportLabel,
        independentLineages: fn.independentLineages,
        divergenceNote: fn.divergenceNote,
        others: fn.occupants
          .filter(
            (other) =>
              !(other.name === occupant.name && other.categoryLabel === occupant.categoryLabel),
          )
          .map(({ name, categoryLabel }) => ({ name, categoryLabel })),
      });
      byEntity.set(key, entry);
    }
  }

  return {
    version: FUNCTION_INDEX_VERSION,
    entities: [...byEntity.values()]
      .map((entity) => ({
        ...entity,
        functions: [...entity.functions].sort((left, right) =>
          left.label.localeCompare(right.label, "pt-BR"),
        ),
      }))
      // Ordem alfabética, e não por quantidade de funções: ordenar por
      // quantidade sugeriria que ocupar mais posições é ser mais importante,
      // quando o que existem são recortes diferentes de acervo.
      .sort((left, right) => left.name.localeCompare(right.name, "pt-BR")),
  };
}
