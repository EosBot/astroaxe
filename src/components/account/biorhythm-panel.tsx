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

/**
 * O que cada ciclo diz, na fase em que está.
 *
 * Escrito para quem chegou aqui com uma pergunta, e não com vocabulário técnico.
 * Cada leitura abre com uma imagem, diz o que está acontecendo e termina com algo
 * que cabe num dia comum — sem prometer resultado e sem transformar um gráfico em
 * destino.
 */
function cycleMeaning(id: string, phase: "alta" | "transição" | "baixa"): string {
  const meanings = {
    physical: {
      alta: "O corpo está com a maré cheia. Há disposição de sobra, e ela costuma pedir uso — movimento, iniciativa, presença. Este é um bom momento para começar o que exige fôlego, desde que você lembre que maré alta também baixa. Aproveitar não é forçar: é ir junto com a corrente enquanto ela está a favor.",
      transição:
        "O corpo está virando de lado, como quem troca de posição no sono. Sono irregular, tensão que aparece do nada, disposição que oscila no mesmo dia — nada disso é sinal de que algo deu errado. É a virada acontecendo. Repare no que o corpo pede antes de cobrar dele um desempenho constante.",
      baixa:
        "A maré baixou, e o que fica exposto é o que estava submerso: cansaço acumulado, necessidade de silêncio, vontade de fazer menos. Baixa não é fraqueza — é a parte do ciclo em que o corpo repõe o que gastou. Simplificar agora costuma devolver consistência quando a maré subir de novo.",
    },
    emotional: {
      alta: "O coração está aberto e alcança longe. Afeto, criação e proximidade ficam mais fáceis, e o que você sente encontra caminho para fora com menos esforço. Aproveite para dizer o que costuma ficar preso. Só cuidado com uma coisa: sentir muito não é o mesmo que ter certeza. A intensidade convence, e nem sempre acerta.",
      transição:
        "A sensibilidade está atravessando uma virada, e viradas confundem. O humor muda sem motivo aparente, e algo que ontem não incomodava hoje pesa. Dar nome à emoção antes de reagir é quase tudo o que se pode fazer — e é bastante. O equilíbrio novo chega, mas chega no tempo dele.",
      baixa:
        "O mundo emocional se recolheu para dentro, e isso tem função: é onde o que foi vivido vira compreensão. Você pode se sentir menos disponível, e está tudo certo. Procure intimidade que não cobre, descanso dos estímulos, conversa sem urgência. Não é hora de resolver relações — é hora de sentir com calma o que elas andam sendo.",
    },
    intellectual: {
      alta: "A mente está afiada e conecta o que antes parecia solto. Estudar rende, planejar rende, explicar para alguém rende ainda mais. Este é o momento de colocar no papel aquela ideia que você vem carregando de cabeça — enquanto ela está clara, e antes que a clareza vire outra coisa.",
      transição:
        "O pensamento mudou de frequência e ainda não sintonizou. Decisões importantes ganham se esperarem um ou dois dias; o que hoje parece óbvio pode não parecer amanhã, e o contrário também. Reduza a pressa e deixe a compreensão amadurecer sozinha, que ela amadurece.",
      baixa:
        "A mente pede integração, e não mais entrada. Cada estímulo novo agora custa mais do que rende. Tarefas simples, pausas de verdade e revisão do que já existe costumam produzir mais do que insistir em algo grande. Baixa intelectual não é burrice: é a fase em que o que você aprendeu se acomoda.",
    },
  } as const;
  if (id === "physical" || id === "emotional" || id === "intellectual") return meanings[id][phase];
  return "Este ciclo atravessa uma fase que pede observação tranquila, sem pressa de concluir.";
}

function secondaryMeaning(id: string, phase: "alta" | "transição" | "baixa"): string {
  const areas: Readonly<Record<string, string>> = {
    mastery: "a conversa entre o que você quer fazer e o que você consegue sustentar",
    passion: "o encontro entre o corpo disposto e o coração aberto",
    wisdom: "o diálogo entre o que você sente e o que você entende",
  };
  const movements = {
    alta: "está fluindo, e pode ser usada sem que você precise forçar nada",
    baixa: "pede recolhimento e menos cobrança — vai voltar, sempre volta",
    transição:
      "está mudando de lugar. Decisões tomadas com pressa aqui costumam ser refeitas depois",
  } as const;
  const area = areas[id] ?? areas.wisdom;
  const movement = movements[phase];
  return `Neste ciclo, ${area} ${movement}.`;
}
