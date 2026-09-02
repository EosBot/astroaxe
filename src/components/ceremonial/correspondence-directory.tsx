"use client";

import { useEffect, useMemo, useState } from "react";

interface Occupant {
  name: string;
  categoryLabel: string;
}

interface IndexedFunction {
  functionId: string;
  label: string;
  question: string;
  supportLabel: string;
  independentLineages: number;
  divergenceNote: string | null;
  others: Occupant[];
}

interface IndexedEntity {
  name: string;
  categoryLabel: string;
  functions: IndexedFunction[];
}

/**
 * Diretório de correspondências.
 *
 * A página de metodologia lista as funções e quem as ocupa — serve para
 * explicar o método. Quem opera chega ao contrário: com um nome na mão,
 * querendo saber que posição ele ocupa e quem mais ocupa a mesma.
 *
 * Cada nome vem sempre acompanhado da categoria. Isso não é enfeite: é o que
 * sustenta "posição análoga, nunca identidade". Um Orixá e um anjo aparecendo
 * juntos numa linha, sem categoria, convidariam exatamente à leitura sincrética
 * que o método recusa.
 */
export function CorrespondenceDirectory(): React.JSX.Element {
  const [entities, setEntities] = useState<IndexedEntity[]>();
  const [message, setMessage] = useState("");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("todas");

  useEffect(() => {
    void (async () => {
      try {
        const response = await fetch("/api/ceremonial/correspondences");
        if (response.status === 401) {
          setMessage("Entre na sua conta para consultar o diretório.");
          return;
        }
        if (response.status === 402) {
          setMessage("O diretório de correspondências faz parte do plano pago.");
          return;
        }
        if (!response.ok) throw new Error("index_failed");
        const data = (await response.json()) as { entities: IndexedEntity[] };
        setEntities(data.entities);
      } catch {
        setMessage("O diretório não pôde ser carregado agora.");
      }
    })();
  }, []);

  const categories = useMemo(
    () => ["todas", ...new Set((entities ?? []).map((entity) => entity.categoryLabel)).values()],
    [entities],
  );

  const visible = useMemo(
    () =>
      (entities ?? []).filter(
        (entity) =>
          (category === "todas" || entity.categoryLabel === category) &&
          entity.name.toLocaleLowerCase("pt-BR").includes(query.trim().toLocaleLowerCase("pt-BR")),
      ),
    [entities, query, category],
  );

  if (message !== "") return <p className="timing-form-message">{message}</p>;
  if (entities === undefined) return <p className="timing-form-hint">Carregando o diretório…</p>;

  return (
    <>
      <form className="timing-form" onSubmit={(event) => event.preventDefault()}>
        <p className="eyebrow">Procurar</p>
        <label htmlFor="entity-query">Um nome</label>
        <input
          id="entity-query"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Ex.: Oxum, Ogum, Bune…"
        />
        <label htmlFor="entity-category">De que tradição</label>
        <select
          id="entity-category"
          value={category}
          onChange={(event) => setCategory(event.target.value)}
        >
          {categories.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </form>

      <section className="methodology-section" aria-labelledby="directory-results">
        <h2 id="directory-results">
          {visible.length === 0
            ? "Nenhum nome corresponde a essa busca."
            : `${visible.length} de ${entities.length} nomes.`}
        </h2>

        {visible.map((entity) => (
          <article key={`${entity.categoryLabel}:${entity.name}`} className="window-group">
            <h3>
              {entity.name} <small>· {entity.categoryLabel}</small>
            </h3>
            <ol className="method-function-list">
              {entity.functions.map((fn) => (
                <li key={fn.functionId}>
                  <h4>{fn.label}</h4>
                  <p className="method-function-question">{fn.question}</p>
                  <p className="method-function-support">
                    {fn.supportLabel} · {fn.independentLineages} linhagens independentes
                  </p>
                  {fn.others.length === 0 ? (
                    <p className="method-function-support">
                      Nenhum outro nome do acervo ocupa esta posição.
                    </p>
                  ) : (
                    <ul className="method-function-occupants">
                      {fn.others.map((other) => (
                        <li key={`${other.categoryLabel}:${other.name}`}>
                          <span>
                            {other.name} · {other.categoryLabel}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {fn.divergenceNote === null ? null : (
                    <p className="method-limit">{fn.divergenceNote}</p>
                  )}
                </li>
              ))}
            </ol>
          </article>
        ))}

        <p className="method-emphasis method-limit">
          O que se afirma aqui é que estes nomes ocupam a mesma posição estrutural — nunca que um
          seja o outro. As categorias ao lado de cada nome existem para manter essa diferença à
          vista, e as tradições permanecem distintas.
        </p>
      </section>
    </>
  );
}
