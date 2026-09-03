"use client";

import { useEffect, useMemo, useState } from "react";

interface Row {
  name: string;
  factorLabel: string;
  values: string[];
  supportLabel: string;
}

/**
 * Tábua operacional.
 *
 * Consulta rápida durante o preparo: dado um Orixá, que planeta, signo,
 * elemento, modalidade e casa o método associa a ele.
 *
 * O aviso de que isto é hipótese autoral fica fixo no topo, e não escondido no
 * rodapé. É a informação mais importante da tela: sem ela, a tábua pareceria
 * dizer que as tradições afirmam estas correspondências, quando quem as afirma
 * é o método.
 */
export function CorrespondenceTable(): React.JSX.Element {
  const [rows, setRows] = useState<Row[]>();
  const [note, setNote] = useState("");
  const [message, setMessage] = useState("");
  const [query, setQuery] = useState("");

  useEffect(() => {
    void (async () => {
      try {
        const response = await fetch("/api/ceremonial/correspondence-table");
        if (response.status === 401) return setMessage("Entre na sua conta para ver a tábua.");
        if (response.status === 402) return setMessage("A tábua faz parte do plano pago.");
        if (!response.ok) throw new Error("table_failed");
        const data = (await response.json()) as { rows: Row[]; note: string };
        setRows(data.rows);
        setNote(data.note);
      } catch {
        setMessage("A tábua não pôde ser carregada agora.");
      }
    })();
  }, []);

  const grouped = useMemo(() => {
    const byName = new Map<string, Row[]>();
    for (const row of rows ?? [])
      if (row.name.toLocaleLowerCase("pt-BR").includes(query.trim().toLocaleLowerCase("pt-BR")))
        byName.set(row.name, [...(byName.get(row.name) ?? []), row]);
    return [...byName.entries()];
  }, [rows, query]);

  if (message !== "") return <p className="timing-form-message">{message}</p>;
  if (rows === undefined) return <p className="timing-form-hint">Carregando a tábua…</p>;

  return (
    <>
      <p className="method-emphasis method-limit">{note}</p>

      <form className="timing-form" onSubmit={(event) => event.preventDefault()}>
        <p className="eyebrow">Procurar</p>
        <label htmlFor="table-query">Um nome</label>
        <input
          id="table-query"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Ex.: Oxum, Ogum, Iemanjá…"
        />
      </form>

      <section className="methodology-section" aria-labelledby="table-results">
        <h2 id="table-results">
          {grouped.length === 0 ? "Nenhum nome corresponde." : `${grouped.length} nome(s).`}
        </h2>

        {grouped.map(([name, items]) => (
          <article key={name} className="window-group">
            <h3>{name}</h3>
            <dl className="method-detail-list">
              {items.map((row) => (
                <div key={`${row.factorLabel}:${row.values.join(",")}`}>
                  <dt>{row.factorLabel}</dt>
                  <dd>
                    {row.values.join(", ")}
                    <span className="lunar-phase-note"> — {row.supportLabel}</span>
                  </dd>
                </div>
              ))}
            </dl>
          </article>
        ))}
      </section>
    </>
  );
}
