"use client";

import { useState } from "react";

import { calculateBiorhythm, calculateBiorhythmCompatibility } from "@/domain/cycles/biorhythm";

export function BiorhythmPanel({
  birthDate,
  comparisonOptions = [],
}: Readonly<{
  birthDate: string;
  comparisonOptions?: Array<{ id: string; label: string; birthDate: string }>;
}>): React.JSX.Element {
  const [referenceDate, setReferenceDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [comparisonId, setComparisonId] = useState("");
  const result = calculateBiorhythm(birthDate, referenceDate);
  const comparison = comparisonOptions.find(({ id }) => id === comparisonId);
  const compatibility =
    comparison === undefined
      ? undefined
      : calculateBiorhythmCompatibility(birthDate, comparison.birthDate, referenceDate);
  return (
    <section className="cycle-panel" id="biorritmo" aria-labelledby="biorhythm-title">
      <header>
        <div>
          <p className="eyebrow">Ciclos clássicos</p>
          <h3 id="biorhythm-title">Biorritmo</h3>
        </div>
        <label>
          <span>Data observada</span>
          <input
            type="date"
            min={birthDate}
            value={referenceDate}
            onChange={(event) => setReferenceDate(event.target.value)}
          />
        </label>
      </header>
      <BiorhythmChart timeline={result.timeline} />
      <div className="critical-day-alerts">
        <p className="eyebrow">Próximas transições</p>
        <h4>Dias críticos não são dias ruins.</h4>
        <p>
          São cruzamentos pelo ponto zero, quando uma curva muda de direção. Reduza automatismos e
          observe qual ciclo está virando.
        </p>
        <ul>
          {result.criticalDays.slice(0, 8).map((day) => (
            <li key={`${day.offset}-${day.cycles.join("-")}`}>
              <strong>{criticalDayLabel(day.offset)}</strong>
              <span>{day.cycles.join(" · ")}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="biorhythm-chapter">
        <p className="eyebrow">Ciclos primários</p>
        <h4>As três correntes fundamentais</h4>
        <p>
          O modelo clássico acompanha três ondas contadas desde o nascimento. Elas não descrevem
          acontecimentos inevitáveis: representam ritmos distintos de disponibilidade, elaboração e
          passagem. Quando duas curvas se encontram, a experiência tende a parecer mais unificada;
          quando divergem, corpo, emoção e mente podem pedir respostas diferentes.
        </p>
      </div>
      <div className="cycle-grid">
        {result.cycles.map((cycle) => (
          <article key={cycle.id}>
            <div
              className="cycle-dial"
              style={{ "--cycle-value": (cycle.value + 1) * 50 + "%" } as React.CSSProperties}
              aria-label={cycle.label + ": " + Math.round(cycle.value * 100) + " por cento"}
            >
              <span>{Math.round(cycle.value * 100)}%</span>
            </div>
            <h4>{cycle.label}</h4>
            <p>
              Fase {cycle.phase} · ciclo de {cycle.period} dias
            </p>
            <p className="cycle-meaning">{cycleMeaning(cycle.id, cycle.phase)}</p>
          </article>
        ))}
      </div>
      <div className="biorhythm-chapter">
        <p className="eyebrow">Ciclos secundários</p>
        <h4>O encontro entre duas forças</h4>
        <p>
          Os ciclos secundários são médias entre pares primários. Domínio combina corpo e mente;
          Paixão reúne corpo e emoção; Sabedoria aproxima emoção e intelecto. Eles ajudam a perceber
          por que uma fase pode ser produtiva sem estar afetivamente aberta — ou sensível sem ter a
          mesma energia para agir.
        </p>
      </div>
      <div className="secondary-cycle-grid">
        {result.secondaryCycles.map((cycle) => (
          <article key={cycle.id}>
            <span>{Math.round(cycle.value * 100)}%</span>
            <div>
              <h4>{cycle.label}</h4>
              <p>{secondaryMeaning(cycle.id, cycle.phase)}</p>
            </div>
          </article>
        ))}
      </div>
      <div className="cycle-guide" aria-label="Como interpretar o biorritmo">
        <h4>Como ler este movimento</h4>
        <p>
          Valores positivos indicam uma fase de expressão e disponibilidade; valores negativos, uma
          fase de recolhimento e recomposição. Próximo de zero, o ciclo atravessa uma virada e
          merece um ritmo mais consciente.
        </p>
      </div>
      <section className="biorhythm-compatibility" aria-labelledby="biorhythm-compatibility-title">
        <p className="eyebrow">Compatibilidade de ritmos</p>
        <h4 id="biorhythm-compatibility-title">Compare disponibilidade, não destino.</h4>
        <label>
          <span>Segundo mapa</span>
          <select value={comparisonId} onChange={(event) => setComparisonId(event.target.value)}>
            <option value="">Escolha um mapa</option>
            {comparisonOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        {compatibility === undefined ? (
          <p>Adicione ou escolha outro mapa para comparar corpo, emoção e mente nesta data.</p>
        ) : (
          <div>
            <strong>{compatibility.score}% de convergência hoje</strong>
            <ul>
              {compatibility.cycles.map((cycle) => (
                <li key={cycle.label}>
                  {cycle.label}: {cycle.score}%
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
      <p className="module-disclaimer">
        Biorritmos são uma tradição popular sem comprovação científica. Use este gráfico apenas como
        convite de observação, nunca para decisões médicas ou diagnóstico.
      </p>
    </section>
  );
}

function criticalDayLabel(offset: number): string {
  if (offset === 0) return "Hoje";
  const unit = offset === 1 ? "dia" : "dias";
  return `Em ${offset} ${unit}`;
}

function BiorhythmChart({
  timeline,
}: Readonly<{
  timeline: Array<{ offset: number; physical: number; emotional: number; intellectual: number }>;
}>): React.JSX.Element {
  const lines = [
    ["physical", "Físico", "var(--copper)"],
    ["emotional", "Emocional", "var(--aqua)"],
    ["intellectual", "Intelectual", "#c8b6e8"],
  ] as const;
  return (
    <figure className="biorhythm-chart">
      <figcaption>
        <span>30 dias atrás</span>
        <strong>Hoje</strong>
        <span>30 dias à frente</span>
      </figcaption>
      <svg viewBox="0 0 900 280" role="img" aria-label="Curvas dos três ciclos primários">
        <line x1="0" y1="140" x2="900" y2="140" />
        <line className="biorhythm-today" x1="450" y1="0" x2="450" y2="280" />
        {lines.map(([key, label, color]) => (
          <polyline
            key={key}
            aria-label={label}
            fill="none"
            stroke={color}
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={timeline
              .map((point, index) => `${index * 15},${140 - point[key] * 112}`)
              .join(" ")}
          />
        ))}
      </svg>
      <ul aria-label="Legenda do gráfico">
        {lines.map(([, label, color]) => (
          <li key={label} style={{ "--legend-color": color } as React.CSSProperties}>
            {label}
          </li>
        ))}
      </ul>
    </figure>
  );
}

function cycleMeaning(id: string, phase: "alta" | "transição" | "baixa"): string {
  const meanings = {
    physical: {
      alta: "A vitalidade tende a buscar movimento, iniciativa e presença corporal. É uma fase favorável para agir, respeitando os limites reais do corpo.",
      transição:
        "O impulso físico muda de direção. Observe sono, tensão e disposição antes de exigir desempenho constante.",
      baixa:
        "A energia corporal pede conservação e recuperação. Simplificar o ritmo pode devolver consistência para o próximo ciclo.",
    },
    emotional: {
      alta: "Afetos e percepções ficam mais disponíveis para troca, criação e proximidade. Expresse o que sente sem transformar intensidade em certeza absoluta.",
      transição:
        "A sensibilidade atravessa uma virada. Dê nome às emoções antes de reagir e permita que o humor encontre um novo equilíbrio.",
      baixa:
        "O mundo emocional tende ao recolhimento e à elaboração. Procure intimidade segura, descanso sensorial e conversas sem cobrança.",
    },
    intellectual: {
      alta: "A mente tende a organizar, associar e comunicar com mais fluidez. Aproveite para estudar, planejar e tornar ideias compreensíveis.",
      transição:
        "O foco muda de frequência. Revise decisões importantes, reduza a pressa e dê espaço para uma compreensão amadurecer.",
      baixa:
        "A atividade mental pede integração, não excesso de estímulo. Tarefas simples, pausas e revisão podem render mais que insistência.",
    },
  } as const;
  if (id === "physical" || id === "emotional" || id === "intellectual") return meanings[id][phase];
  return "Este ciclo atravessa uma fase que pede observação consciente.";
}

function secondaryMeaning(id: string, phase: "alta" | "transição" | "baixa"): string {
  const areas: Readonly<Record<string, string>> = {
    mastery: "coordenação entre ação e estratégia",
    passion: "integração entre vitalidade e sentimento",
    wisdom: "diálogo entre sensibilidade e compreensão",
  };
  const movements = {
    alta: "está disponível e pode ser expressa com naturalidade",
    baixa: "pede recolhimento, revisão e menos cobrança",
    transição: "atravessa uma virada; decisões ganham clareza quando não são apressadas",
  } as const;
  const area = areas[id] ?? areas.wisdom;
  const movement = movements[phase];
  return `A ${area} ${movement}.`;
}
