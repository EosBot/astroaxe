"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

interface Trabalho {
  id: string;
  tradicaoId: string;
  tradicaoNome: string;
  name: string;
  purpose: string;
  planet: string | null;
  when: string;
  materials: string[];
  steps: string[];
  warnings: string[];
  disposal: string;
}

const PLANET_NAMES: Readonly<Record<string, string>> = {
  sun: "Sol",
  moon: "Lua",
  mercury: "Mercúrio",
  venus: "Vênus",
  mars: "Marte",
  jupiter: "Júpiter",
  saturn: "Saturno",
};

/**
 * Guia de trabalhos.
 *
 * A advertência aparece **antes** do procedimento, e não depois. Quem rolou até
 * o fim já leu os passos, e aviso no rodapé é aviso que chega tarde.
 *
 * O trabalho fica fechado até alguém abrir. Não é economia de espaço: é para
 * que a pessoa escolha o que vai ler, em vez de receber seis procedimentos
 * despejados de uma vez.
 */
export function WorksGuide(): React.JSX.Element {
  const [trabalhos, setTrabalhos] = useState<Trabalho[]>();
  const [message, setMessage] = useState("");
  const [aberto, setAberto] = useState<string>();
  const [tradicao, setTradicao] = useState("todas");

  useEffect(() => {
    void (async () => {
      try {
        const response = await fetch("/api/ceremonial/trabalhos");
        if (response.status === 401) return setMessage("Entre na sua conta para ver os trabalhos.");
        if (response.status === 402) return setMessage("O guia faz parte do plano pago.");
        if (!response.ok) throw new Error("works_failed");
        const data = (await response.json()) as { trabalhos: Trabalho[] };
        setTrabalhos(data.trabalhos);
      } catch {
        setMessage("O guia não pôde ser carregado agora.");
      }
    })();
  }, []);

  const tradicoesDisponiveis = useMemo(
    () => ["todas", ...new Set((trabalhos ?? []).map((item) => item.tradicaoNome))],
    [trabalhos],
  );

  const visiveis = (trabalhos ?? []).filter(
    (item) => tradicao === "todas" || item.tradicaoNome === tradicao,
  );

  if (message !== "") return <p className="timing-form-message">{message}</p>;
  if (trabalhos === undefined) return <p className="timing-form-hint">Carregando o guia…</p>;

  return (
    <>
      <form className="timing-form" onSubmit={(event) => event.preventDefault()}>
        <p className="eyebrow">Filtrar</p>
        <label htmlFor="works-tradition">Por tradição</label>
        <select
          id="works-tradition"
          value={tradicao}
          onChange={(event) => setTradicao(event.target.value)}
        >
          {tradicoesDisponiveis.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </form>

      <section className="methodology-section" aria-labelledby="works-list">
        <h2 id="works-list">
          {visiveis.length} trabalho{visiveis.length === 1 ? "" : "s"}.
        </h2>

        {visiveis.map((trabalho) => (
          <article key={trabalho.id} className="window-group">
            <h3>{trabalho.name}</h3>
            <p className="method-function-support">{trabalho.tradicaoNome}</p>
            <p>{trabalho.purpose}</p>

            <button
              type="button"
              className="quiet-button"
              onClick={() => setAberto(aberto === trabalho.id ? undefined : trabalho.id)}
            >
              {aberto === trabalho.id ? "Fechar o preparo" : "Ver o preparo completo"}
            </button>

            {aberto !== trabalho.id ? null : (
              <>
                <h4>Antes de começar</h4>
                <ul className="method-function-occupants">
                  {trabalho.warnings.map((aviso) => (
                    <li key={aviso}>
                      <span>{aviso}</span>
                    </li>
                  ))}
                </ul>
                <p className="method-emphasis method-limit">
                  Você leu o que este trabalho cobra. Daqui em diante a escolha é sua, e responde à
                  lei divina.
                </p>

                <h4>Quando</h4>
                <p>{trabalho.when}</p>
                {trabalho.planet === null ? (
                  <p className="method-function-support">
                    Este trabalho pede dia e hora do planeta da sua intenção.{" "}
                    <Link href="/magia-cerimonial/janelas">
                      Procure a janela em que os dois coincidem
                    </Link>
                    .
                  </p>
                ) : (
                  <p className="method-function-support">
                    Regido por {PLANET_NAMES[trabalho.planet] ?? trabalho.planet}.{" "}
                    <Link href="/magia-cerimonial/janelas">Ver quando o céu favorece</Link>.
                  </p>
                )}

                <h4>O que se usa</h4>
                <ul className="method-function-occupants">
                  {trabalho.materials.map((item) => (
                    <li key={item}>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>

                <h4>Como se faz</h4>
                <ol className="work-steps">
                  {trabalho.steps.map((passo, indice) => (
                    <li key={passo}>
                      <span aria-hidden="true">{indice + 1}</span>
                      <p>{passo}</p>
                    </li>
                  ))}
                </ol>

                <h4>O que se faz com o que sobra</h4>
                <p>{trabalho.disposal}</p>
              </>
            )}
          </article>
        ))}
      </section>
    </>
  );
}
