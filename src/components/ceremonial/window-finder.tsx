"use client";

import { useState } from "react";

import { CitySearch } from "@/components/site/city-search";
import type { PlaceCandidate } from "@/lib/maps/contracts";

interface CeremonialWindowView {
  ruleId: string;
  ruleLabel: string;
  ruleSummary: string;
  startIso: string;
  endIso: string;
  dayRuler: string;
  hourRuler: string;
  hourNumber: number;
  segmentLabel: string;
}

interface ScanResult {
  hoursScanned: number;
  truncated: boolean;
  windows: CeremonialWindowView[];
}

/**
 * Buscador de janelas.
 *
 * A página de tempo confere uma hora que alguém já escolheu. Esta procura as
 * horas — que é o que se precisa antes de escolher.
 *
 * As janelas são agrupadas por critério, e não misturadas numa lista só
 * ordenada por data. Tradições diferentes pedem coisas diferentes e discordam
 * entre si; uma lista única daria a impressão de um calendário com respostas,
 * quando o que existe são leituras convivendo.
 */
export function WindowFinder(): React.JSX.Element {
  const [place, setPlace] = useState<PlaceCandidate>();
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [days, setDays] = useState(30);
  const [result, setResult] = useState<ScanResult>();
  const [status, setStatus] = useState<"idle" | "searching">("idle");
  const [message, setMessage] = useState("");

  async function search(): Promise<void> {
    if (place === undefined) return;
    setStatus("searching");
    setMessage("");
    try {
      const response = await fetch("/api/ceremonial/windows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, days, latitude: place.latitude, longitude: place.longitude }),
      });
      if (response.status === 401) {
        setMessage("Entre na sua conta para usar as ferramentas cerimoniais.");
        return;
      }
      if (response.status === 402) {
        setMessage("As ferramentas cerimoniais fazem parte do plano pago.");
        return;
      }
      if (response.status === 403) {
        setMessage("Este recurso é restrito a maiores de 18 anos que declararam a idade.");
        return;
      }
      if (!response.ok) throw new Error("scan_failed");
      setResult((await response.json()) as ScanResult);
    } catch {
      setMessage("A busca não pôde ser concluída agora. Tente de novo daqui a pouco.");
    } finally {
      setStatus("idle");
    }
  }

  const timeZone = place?.timezone ?? "UTC";
  const byRule = new Map<string, CeremonialWindowView[]>();
  for (const window of result?.windows ?? [])
    byRule.set(window.ruleLabel, [...(byRule.get(window.ruleLabel) ?? []), window]);

  return (
    <>
      <form
        className="timing-form"
        onSubmit={(event) => {
          event.preventDefault();
          void search();
        }}
      >
        <p className="eyebrow">Onde e quando procurar</p>

        <CitySearch id="window-place" label="Em que cidade?" onSelect={setPlace} />

        <label htmlFor="window-date">A partir de que dia?</label>
        <input
          id="window-date"
          type="date"
          value={date}
          onChange={(event) => setDate(event.target.value)}
          required
        />

        <label htmlFor="window-days">Procurar por quantos dias? (até 60)</label>
        <input
          id="window-days"
          type="number"
          min={1}
          max={60}
          value={days}
          onChange={(event) => setDays(Number(event.target.value))}
          required
        />

        {message === "" ? null : <p className="timing-form-message">{message}</p>}

        <button type="submit" disabled={place === undefined || status === "searching"}>
          {status === "searching" ? "Procurando…" : "Procurar janelas"}
        </button>
        {place === undefined ? (
          <p className="timing-form-hint">Escolha uma cidade da lista para liberar a busca.</p>
        ) : null}
      </form>

      {result === undefined ? null : (
        <section className="methodology-section" aria-labelledby="window-results">
          <p className="eyebrow">O que foi encontrado</p>
          <h2 id="window-results">
            {result.windows.length === 0
              ? "Nenhuma hora atendeu, neste período."
              : `${result.windows.length} horas atenderam a algum critério.`}
          </h2>
          <p>
            Foram examinadas {result.hoursScanned} horas planetárias.
            {result.truncated
              ? " A lista parou antes do fim do período: havia mais horas do que cabe numa resposta."
              : ""}
          </p>

          {result.windows.length === 0 ? (
            <p>
              Nenhum critério encontrou hora que atendesse ao que pede neste intervalo. Isso é
              resposta, e não falha: alargar o período costuma revelar janelas, e continuar sem
              nenhuma também diz algo sobre o período.
            </p>
          ) : (
            [...byRule.entries()].map(([ruleLabel, windows]) => (
              <article key={ruleLabel} className="window-group">
                <h3>{ruleLabel}</h3>
                <p className="method-function-question">{windows[0]?.ruleSummary}</p>
                <ol className="window-list">
                  {windows.map((window) => (
                    <li key={`${window.ruleId}:${window.startIso}`}>
                      <strong>{formatRange(window.startIso, window.endIso, timeZone)}</strong>
                      <span>
                        {window.hourNumber}ª {window.segmentLabel} · dia de {window.dayRuler} · hora
                        de {window.hourRuler}
                      </span>
                    </li>
                  ))}
                </ol>
              </article>
            ))
          )}

          <p className="method-emphasis method-limit">
            Isto é um catálogo do que cada critério pede, e não uma recomendação. Não há nota, não
            há ordem de preferência e não há promessa de resultado. O que fazer — e se fazer — é de
            quem opera.
          </p>
        </section>
      )}
    </>
  );
}

/** Mostra a janela no relógio da cidade escolhida, que é o relógio de quem lê. */
function formatRange(startIso: string, endIso: string, timeZone: string): string {
  const dia = new Intl.DateTimeFormat("pt-BR", {
    timeZone,
    day: "2-digit",
    month: "2-digit",
    weekday: "short",
  }).format(new Date(startIso));
  const hora = (iso: string) =>
    new Intl.DateTimeFormat("pt-BR", { timeZone, hour: "2-digit", minute: "2-digit" }).format(
      new Date(iso),
    );
  return `${dia}, ${hora(startIso)}–${hora(endIso)}`;
}
