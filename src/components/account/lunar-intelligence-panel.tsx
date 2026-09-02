"use client";

import { useEffect, useState } from "react";

import {
  astrologicalAspectName,
  astrologicalAspectWithArticle,
  astrologicalBodyName,
} from "@/domain/astrology/labels";
import { zodiacPlacement } from "@/domain/astrology/western/zodiac";
import {
  EDITORIAL_REPORT_VERSION,
  houseForLongitude as editorialHouseForLongitude,
  interpretPlacement,
  type EditorialReading,
} from "@/domain/astrology/editorial-report";
import { lunarModuleResponseSchema, type LunarModuleResponse } from "@/lib/lunar/contracts";
import { geocodingResponseSchema, type PlaceCandidate } from "@/lib/maps/contracts";
import type { ProfileRecord } from "@/lib/profiles/contracts";
import { ImmersiveReport } from "./immersive-report";

export function LunarIntelligencePanel({
  profile,
  profiles,
}: Readonly<{ profile: ProfileRecord; profiles: ProfileRecord[] }>): React.JSX.Element {
  const [placeQuery, setPlaceQuery] = useState("");
  const [places, setPlaces] = useState<PlaceCandidate[]>([]);
  const [place, setPlace] = useState<PlaceCandidate>();
  const [reading, setReading] = useState<LunarModuleResponse>();
  const [status, setStatus] = useState<"awaiting" | "searching" | "loading" | "ready" | "error">(
    "awaiting",
  );
  const [comparisonId, setComparisonId] = useState("");
  const [referenceInstant] = useState(() => new Date().toISOString());

  useEffect(() => {
    if (place === undefined) return;
    const controller = new AbortController();
    const query = new URLSearchParams({
      instant: referenceInstant,
      latitude: String(place.latitude),
      longitude: String(place.longitude),
      timezone: place.timezone,
    });
    void fetch(`/api/profiles/${profile.id}/lunar?${query.toString()}`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        const parsed = lunarModuleResponseSchema.safeParse(await response.json());
        if (!response.ok || !parsed.success) throw new Error("lunar_module_failed");
        setReading(parsed.data);
        setStatus("ready");
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setStatus("error");
      });
    return () => controller.abort();
  }, [place, profile.id, referenceInstant]);

  async function searchPlace(): Promise<void> {
    setStatus("searching");
    try {
      const response = await fetch(`/api/geocoding?q=${encodeURIComponent(placeQuery)}`);
      const parsed = geocodingResponseSchema.safeParse(await response.json());
      if (!response.ok || !parsed.success) throw new Error("geocoding_failed");
      setPlaces(parsed.data.places);
      setStatus("awaiting");
    } catch {
      setStatus("error");
    }
  }

  const comparison = profiles.find(({ id }) => id === comparisonId);
  return (
    <section className="editorial-module lunar-intelligence" aria-labelledby="lunar-area-title">
      <header>
        <p className="eyebrow">Área Lua · relógios emocionais</p>
        <h1 id="lunar-area-title">Da memória natal ao mês que começa agora.</h1>
        <p>
          Esta área reúne camadas que não são equivalentes: a Lua natal permanece por toda a vida; a
          Lua progredida descreve uma fase lenta; o Retorno Lunar ergue um mapa mensal; os trânsitos
          mostram ativações de poucas horas.
        </p>
      </header>

      <section className="solar-return-location" aria-labelledby="lunar-location-title">
        <div>
          <p className="eyebrow">Local do ciclo mensal</p>
          <h2 id="lunar-location-title">Onde você está vivendo este retorno?</h2>
          <p>
            O local altera Ascendente e casas do Retorno Lunar. Ele não muda sua Lua natal nem a
            progressão secundária.
          </p>
        </div>
        <div>
          <label htmlFor="lunar-location">Cidade atual</label>
          <div className="search-row">
            <input
              id="lunar-location"
              value={placeQuery}
              onChange={(event) => setPlaceQuery(event.target.value)}
            />
            <button
              type="button"
              className="quiet-button"
              disabled={placeQuery.trim().length < 2 || status === "searching"}
              onClick={() => void searchPlace()}
            >
              {status === "searching" ? "Buscando…" : "Buscar cidade"}
            </button>
          </div>
          {places.length === 0 ? null : (
            <ul className="place-results">
              {places.map((candidate) => (
                <li key={`${candidate.latitude}-${candidate.longitude}`}>
                  <button
                    type="button"
                    onClick={() => {
                      setStatus("loading");
                      setPlace(candidate);
                      setPlaceQuery(candidate.label);
                      setPlaces([]);
                    }}
                  >
                    {candidate.label}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <LunarStatus status={status} reading={reading} />
      {reading === undefined ? null : (
        <>
          <LunarAnatomy reading={reading} profile={profile} />
          <ProgressedMoon reading={reading} />
          <LunarReturn reading={reading} timezone={place?.timezone ?? profile.timezone} />
          <LunarTransits reading={reading} />
          <LunarSynastry
            profile={profile}
            profiles={profiles}
            comparison={comparison}
            comparisonId={comparisonId}
            onComparisonChange={setComparisonId}
          />
          <LunarElection reading={reading} />
          <ImmersiveReport
            title="Atlas lunar · suas fases, ritmos e necessidades"
            intro="Este caderno começa na sua Lua natal e percorre as oito fases do ciclo para que você reconheça início, construção, crise, culminação, partilha, revisão e encerramento. A fase natal destacada é a sua assinatura; as demais formam o vocabulário do ciclo mensal."
            readings={lunarEditorialReadings(reading, profile)}
          />
        </>
      )}
    </section>
  );
}

function LunarStatus({
  status,
  reading,
}: Readonly<{
  status: "awaiting" | "searching" | "loading" | "ready" | "error";
  reading: LunarModuleResponse | undefined;
}>): React.JSX.Element {
  if (status === "error")
    return (
      <p className="module-empty">A leitura lunar não abriu. Revise a cidade e tente novamente.</p>
    );
  if (status === "loading" || status === "searching")
    return <p className="module-empty">Calculando os relógios lunares…</p>;
  if (reading === undefined)
    return <p className="module-empty">Escolha a cidade atual para erguer seu Retorno Lunar.</p>;
  return <p className="module-empty">Leitura calculada com efemérides e referência explícita.</p>;
}

function LunarAnatomy({
  reading,
  profile,
}: Readonly<{ reading: LunarModuleResponse; profile: ProfileRecord }>): React.JSX.Element {
  const moon = placement(profile, "moon");
  const northNode = placement(profile, "true_node");
  const lilith = placement(profile, "mean_lilith");
  return (
    <section className="lunar-chapter" aria-labelledby="lunar-anatomy-title">
      <div>
        <p className="eyebrow">Anatomia da Lua natal</p>
        <h2 id="lunar-anatomy-title">Você nasceu sob {reading.dashboard.natalPhase.label}.</h2>
        <p>
          A Lua estava a {moon.signDegree.toFixed(2)}° de {moon.sign}, formando um ângulo de{" "}
          {reading.dashboard.natalPhase.angle.toFixed(2)}° com o Sol. Essa fase descreve seu modo de
          transformar experiência em resposta emocional, não um destino fechado.
        </p>
      </div>
      <div
        className="lunar-data-orbit"
        style={
          { "--lunar-angle": `${reading.dashboard.natalPhase.angle}deg` } as React.CSSProperties
        }
      >
        <span>☉</span>
        <i />
        <strong>☾</strong>
      </div>
      <dl className="lunar-facts">
        <div>
          <dt>Mansão tropical árabe</dt>
          <dd>{reading.dashboard.natalMansion.number} de 28</dd>
        </div>
        <div>
          <dt>Nodo Norte</dt>
          <dd>
            {northNode.sign} · {northNode.signDegree.toFixed(2)}°
          </dd>
        </div>
        <div>
          <dt>Lilith média</dt>
          <dd>
            {lilith.sign} · {lilith.signDegree.toFixed(2)}°
          </dd>
        </div>
      </dl>
      <p className="module-disclaimer">
        Mansões árabes tropicais e Nakshatras védicos usam referenciais diferentes. Esta leitura não
        os combina e não apresenta karma ou vidas passadas como fatos verificáveis.
      </p>
    </section>
  );
}

function ProgressedMoon({
  reading,
}: Readonly<{ reading: LunarModuleResponse }>): React.JSX.Element {
  const progressed = reading.dashboard.progressed;
  return (
    <section className="lunar-chapter lunar-progressed" aria-labelledby="progressed-moon-title">
      <div>
        <p className="eyebrow">Progressão secundária · relógio lento</p>
        <h2 id="progressed-moon-title">Lua progredida em {progressed.moon.sign}</h2>
        <p>
          No relógio dia-por-ano, sua Lua alcança {progressed.moon.signDegree.toFixed(2)}° de{" "}
          {progressed.moon.sign}
          {progressed.moonHouse === null
            ? ". A casa exige hora natal conhecida."
            : ` e atravessa a Casa ${progressed.moonHouse}.`}
          Essa passagem dura cerca de dois anos e meio e desloca o foco emocional gradualmente.
        </p>
      </div>
      <div className="lunar-phase-meter">
        <span>Fase progredida</span>
        <strong>{progressed.phase.label}</strong>
        <small>{progressed.phase.angle.toFixed(2)}° entre Sol e Lua progredidos</small>
      </div>
      <div className="editorial-longform">
        <h3>Como trabalhar esta fase</h3>
        <p>{progressedMeaning(progressed.phase.id, progressed.moonHouse)}</p>
      </div>
    </section>
  );
}

function LunarReturn({
  reading,
  timezone,
}: Readonly<{ reading: LunarModuleResponse; timezone: string }>): React.JSX.Element {
  const chart = reading.lunarReturn;
  const ascendant = zodiacPlacement(chart.houses.ascendant);
  const midheaven = zodiacPlacement(chart.houses.midheaven);
  const mercury = returnPlacement(reading, "mercury");
  const venus = returnPlacement(reading, "venus");
  const mars = returnPlacement(reading, "mars");
  const sixthHouse = zodiacPlacement(chart.houses.cusps[5] ?? 0);
  return (
    <section className="lunar-chapter" aria-labelledby="lunar-return-title">
      <div>
        <p className="eyebrow">Retorno Lunar · mapa de aproximadamente 27,3 dias</p>
        <h2 id="lunar-return-title">O mês começa em {formatInstant(chart.instant, timezone)}.</h2>
        <p>
          A Lua retorna ao grau natal com orbe de {chart.orb.toFixed(5)}°. O Ascendente mensal em{" "}
          {ascendant.sign} organiza a maneira de atravessar o ciclo; o Meio do Céu em{" "}
          {midheaven.sign} mostra onde a experiência busca visibilidade.
        </p>
      </div>
      <div className="return-signature">
        <LunarDatum
          label="Ascendente mensal"
          value={`${ascendant.sign} · ${ascendant.signDegree.toFixed(2)}°`}
        />
        <LunarDatum
          label="Meio do Céu"
          value={`${midheaven.sign} · ${midheaven.signDegree.toFixed(2)}°`}
        />
        <LunarDatum label="Ideias" value={`Mercúrio em ${mercury.sign}`} />
        <LunarDatum label="Afeto" value={`Vênus em ${venus.sign}`} />
      </div>
      <div className="editorial-module-grid">
        <article>
          <span>☾</span>
          <h3>Humor e necessidades</h3>
          <p>
            A Lua retorna à posição natal e reabre seu padrão básico de segurança. O Ascendente
            mensal mostra como essa necessidade procura forma no cotidiano.
          </p>
        </article>
        <article>
          <span>♀</span>
          <h3>Relações e finanças</h3>
          <p>
            Vênus em {venus.sign} colore reciprocidade, prazer e escolhas de valor. Observe acordos
            reais antes de associar conforto a gasto ou aprovação.
          </p>
        </article>
        <article>
          <span>♂</span>
          <h3>Ação e picos de tensão</h3>
          <p>
            Marte em {mars.sign} mostra onde a pressa pode aumentar. Tensão é um sinal para regular
            ritmo e limite, não previsão de acidente ou diagnóstico.
          </p>
        </article>
        <article>
          <span>☿</span>
          <h3>Estudos e conversas</h3>
          <p>
            Mercúrio em {mercury.sign} orienta a linguagem do mês. Registre decisões importantes e
            retorne ao que foi combinado antes de reagir a ruído.
          </p>
        </article>
        <article>
          <span>Ⅵ</span>
          <h3>Rotina e autocuidado</h3>
          <p>
            A Casa 6 mensal começa em {sixthHouse.sign}. Organize sono, pausas e tarefas de modo
            compatível com seu corpo; esta camada é simbólica e não substitui avaliação de saúde.
          </p>
        </article>
      </div>
    </section>
  );
}

function LunarTransits({ reading }: Readonly<{ reading: LunarModuleResponse }>): React.JSX.Element {
  return (
    <section className="lunar-chapter" aria-labelledby="lunar-transits-title">
      <div>
        <p className="eyebrow">Trânsitos lunares exatos</p>
        <h2 id="lunar-transits-title">O ponteiro das próximas horas</h2>
        <p>
          Aspectos da Lua em trânsito aos planetas natais mudam rapidamente. Use-os para nomear
          clima e reação, não para prometer eventos.
        </p>
      </div>
      <div className="lunar-transit-list">
        {reading.transits.length === 0 ? (
          <p className="module-empty">
            Nenhum aspecto lunar maior está dentro do orbe neste instante.
          </p>
        ) : (
          reading.transits.slice(0, 10).map((transit) => (
            <article key={`${transit.natalBody}-${transit.type}`}>
              <span>{Math.round(transit.relativeIntensity * 100)}%</span>
              <div>
                <h3>
                  Lua em {aspectLabel(transit.type)} com {bodyLabel(transit.natalBody)}
                </h3>
                <p>
                  Orbe {transit.orb.toFixed(2)}° ·{" "}
                  {transit.applying ? "aproximando-se da exatidão" : "afastando-se da exatidão"}.{" "}
                  {lunarTransitMeaning(transit.natalBody, transit.type)}
                </p>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}

function LunarSynastry({
  profile,
  profiles,
  comparison,
  comparisonId,
  onComparisonChange,
}: Readonly<{
  profile: ProfileRecord;
  profiles: ProfileRecord[];
  comparison: ProfileRecord | undefined;
  comparisonId: string;
  onComparisonChange: (id: string) => void;
}>): React.JSX.Element {
  const firstMoon = placement(profile, "moon");
  const secondMoon = comparison === undefined ? undefined : placement(comparison, "moon");
  const relation =
    secondMoon === undefined ? undefined : moonRelation(firstMoon.longitude, secondMoon.longitude);
  const firstMoonInComparisonHouse =
    comparison?.chart.natal.houses === undefined
      ? null
      : houseForLongitude(firstMoon.longitude, comparison.chart.natal.houses.cusps);
  const secondMoonInProfileHouse =
    secondMoon === undefined || profile.chart.natal.houses === undefined
      ? null
      : houseForLongitude(secondMoon.longitude, profile.chart.natal.houses.cusps);
  return (
    <section className="lunar-chapter" aria-labelledby="lunar-synastry-title">
      <div>
        <p className="eyebrow">Sinastria lunar</p>
        <h2 id="lunar-synastry-title">Como duas necessidades emocionais convivem</h2>
      </div>
      <label className="lunar-comparison-select">
        <span>Comparar com</span>
        <select value={comparisonId} onChange={(event) => onComparisonChange(event.target.value)}>
          <option value="">Escolha outro mapa</option>
          {profiles
            .filter(({ id }) => id !== profile.id)
            .map((candidate) => (
              <option key={candidate.id} value={candidate.id}>
                {candidate.displayName}
              </option>
            ))}
        </select>
      </label>
      {secondMoon === undefined || relation === undefined ? (
        <p className="module-empty">Escolha outro mapa para cruzar as duas Luas.</p>
      ) : (
        <>
          <div className="future-sky-callout">
            <p className="eyebrow">
              Lua em {firstMoon.sign} × Lua em {secondMoon.sign}
            </p>
            <h3>{relation.title}</h3>
            <p>{relation.text}</p>
          </div>
          {comparison === undefined ||
          firstMoonInComparisonHouse === null ||
          secondMoonInProfileHouse === null ? null : (
            <div className="return-signature lunar-house-exchange">
              <LunarDatum
                label={`${profile.displayName} desperta`}
                value={`Casa ${firstMoonInComparisonHouse} de ${comparison.displayName}`}
              />
              <LunarDatum
                label={`${comparison.displayName} desperta`}
                value={`Casa ${secondMoonInProfileHouse} de ${profile.displayName}`}
              />
            </div>
          )}
        </>
      )}
      <p className="module-disclaimer">
        A casa em que a Lua do outro cai exige hora conhecida nos dois mapas. Quando esse dado
        falta, a comparação permanece somente por signo e aspecto.
      </p>
    </section>
  );
}

function LunarElection({ reading }: Readonly<{ reading: LunarModuleResponse }>): React.JSX.Element {
  const voidState = reading.dashboard.voidOfCourse;
  return (
    <section className="lunar-chapter lunar-election" aria-labelledby="lunar-election-title">
      <div>
        <p className="eyebrow">Lua fora de curso e eleição simbólica</p>
        <h2 id="lunar-election-title">
          {voidState.active ? "A Lua está fora de curso." : "A Lua ainda aplica a um aspecto."}
        </h2>
        <p>
          {voidState.active
            ? `Até entrar em outro signo em ${formatInstant(voidState.ingressAt, "UTC")}, a tradição recomenda revisar e concluir em vez de forçar definições.`
            : `O próximo aspecto é ${astrologicalAspectWithArticle(voidState.nextApplyingAspect?.type ?? "")} com ${bodyLabel(voidState.nextApplyingAspect?.body ?? "")}, antes da entrada em outro signo.`}
        </p>
      </div>
      <div className="editorial-module-grid">
        <article>
          <span>●</span>
          <h3>Lua Nova</h3>
          <p>
            O céu escuro é o único lugar onde dá para plantar sem plateia. A tradição associa esta
            fase ao começo discreto: uma intenção simples, guardada, sem anúncio. Você não vê a
            semente trabalhando — e é justamente por isso que ela trabalha. Vale escolher uma coisa
            só, e deixar em paz alguns dias.
          </p>
          <p className="lunar-phase-note">
            É leitura simbólica de uma tradição, e não promessa de resultado.
          </p>
        </article>
        <article>
          <span>◐</span>
          <h3>Crescente</h3>
          <p>
            A luz aumenta, e o que começou passa a pedir. É a fase de sustentar nos dias em que não
            apetece, testar o que parecia óbvio e corrigir a rota sem tratar o desvio como fracasso.
            Aqui é onde a maioria das intenções se perde — raramente por falta de força, quase
            sempre por falta de constância.
          </p>
        </article>
        <article>
          <span>○</span>
          <h3>Lua Cheia</h3>
          <p>
            Tudo fica visível, inclusive o que era mais confortável não ver. A tradição fala em
            culminação: resultados aparecem, excessos também, e sentimentos adiados escolhem esta
            noite para pedir passagem. Bom momento para olhar com honestidade — inclusive para o que
            deu certo, que a gente costuma esquecer de reconhecer.
          </p>
          <p className="lunar-phase-note">
            Leitura simbólica. Não serve de critério para cirurgia, diagnóstico ou qualquer decisão
            de saúde.
          </p>
        </article>
        <article>
          <span>◑</span>
          <h3>Minguante</h3>
          <p>
            Minguar é uma forma de generosidade: abrir espaço. A tradição associa esta fase a
            revisar, podar e encerrar o que já cumpriu o que tinha para cumprir. Se der vontade de
            fazer menos, não é desânimo — é o ciclo preparando o próximo começo.
          </p>
          <p className="lunar-phase-note">
            Calendários de beleza e de plantio são tradições culturais, e não relações de causa e
            efeito.
          </p>
        </article>
      </div>
    </section>
  );
}

function LunarDatum({
  label,
  value,
}: Readonly<{ label: string; value: string }>): React.JSX.Element {
  return (
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function placement(
  profile: ProfileRecord,
  body: string,
): ReturnType<typeof zodiacPlacement> & { longitude: number } {
  const longitude = profile.chart.natal.planets.find(({ id }) => id === body)?.longitude ?? 0;
  return { ...zodiacPlacement(longitude), longitude };
}

function returnPlacement(
  reading: LunarModuleResponse,
  body: string,
): ReturnType<typeof zodiacPlacement> {
  const longitude = reading.lunarReturn.planets.find(({ id }) => id === body)?.longitude ?? 0;
  return zodiacPlacement(longitude);
}

const PHASE_EDITORIAL: ReadonlyArray<{
  id: string;
  label: string;
  movement: string;
  gift: string;
  tension: string;
  practice: string;
}> = [
  {
    id: "new",
    label: "Lua Nova",
    movement: "semente, interiorização e intenção",
    gift: "escutar o que ainda não tem forma e começar sem exigir visibilidade imediata",
    tension: "confundir ausência de evidência com ausência de caminho",
    practice: "escolha uma intenção pequena e registre o primeiro gesto possível",
  },
  {
    id: "crescent",
    label: "Lua Crescente inicial",
    movement: "emergência, curiosidade e primeiros testes",
    gift: "proteger uma possibilidade enquanto ela encontra linguagem",
    tension: "desistir diante da primeira resistência ou dispersar energia",
    practice: "defina o que merece continuidade até o quarto crescente",
  },
  {
    id: "first_quarter",
    label: "Quarto Crescente",
    movement: "decisão, atrito e construção",
    gift: "agir diante do obstáculo e transformar intenção em estrutura",
    tension: "tratar toda dificuldade como combate ou prova de fracasso",
    practice: "nomeie o conflito central e faça uma escolha verificável",
  },
  {
    id: "gibbous",
    label: "Lua Gibosa",
    movement: "refinamento, preparação e discernimento",
    gift: "aperfeiçoar o que já ganhou corpo sem perder o propósito",
    tension: "perfeccionismo, ansiedade de antecipação ou correção excessiva",
    practice: "melhore um ponto decisivo e preserve o que já funciona",
  },
  {
    id: "full",
    label: "Lua Cheia",
    movement: "culminação, contraste e revelação",
    gift: "enxergar resultados, relações e necessidades com maior nitidez",
    tension: "amplificar emoções e tomar intensidade como certeza",
    practice: "separe fato, sentimento e interpretação antes de responder",
  },
  {
    id: "disseminating",
    label: "Lua Disseminadora",
    movement: "partilha, ensino e distribuição",
    gift: "transformar experiência em contribuição para outras pessoas",
    tension: "pregar uma conclusão antes de escutar contextos diferentes",
    practice: "compartilhe o aprendizado como convite, não como regra",
  },
  {
    id: "last_quarter",
    label: "Quarto Minguante",
    movement: "revisão, reposicionamento e desapego",
    gift: "questionar hábitos e liberar estruturas que perderam sentido",
    tension: "romper por cansaço sem compreender o aprendizado",
    practice: "encerre uma obrigação que já não serve ao ciclo seguinte",
  },
  {
    id: "balsamic",
    label: "Lua Balsâmica",
    movement: "síntese, repouso e entrega",
    gift: "recolher sabedoria, aceitar o intervalo e preparar renovação",
    tension: "isolamento, nostalgia ou tentativa de prolongar o que terminou",
    practice: "reduza ruído, conclua pendências e preserve tempo para descanso",
  },
];

function lunarEditorialReadings(
  reading: LunarModuleResponse,
  profile: ProfileRecord,
): EditorialReading[] {
  const natalMoon = placement(profile, "moon");
  const moonHouse =
    profile.chart.natal.houses === undefined
      ? undefined
      : editorialHouseForLongitude(natalMoon.longitude, profile.chart.natal.houses.cusps);
  const moonReading = interpretPlacement({
    body: "moon",
    sign: natalMoon.sign,
    degree: natalMoon.signDegree,
    ...(moonHouse === undefined ? {} : { house: moonHouse }),
    context: `Sua fase natal é ${reading.dashboard.natalPhase.label}, com separação Sol–Lua de ${reading.dashboard.natalPhase.angle.toFixed(2)}°; ela colore a maneira como você inicia, desenvolve e conclui experiências emocionais.`,
  });
  const phases = PHASE_EDITORIAL.map((phase) => {
    const natal = phase.id === reading.dashboard.natalPhase.id;
    return {
      version: EDITORIAL_REPORT_VERSION,
      title: `${phase.label}${natal ? " · sua fase natal" : ""}`,
      lead: `${phase.label} simboliza ${phase.movement}. ${natal ? "Como você nasceu nesta fase, esse movimento funciona como uma assinatura recorrente no modo de processar a vida." : "No ciclo mensal, esta é uma etapa disponível a todas as pessoas e não altera sua fase natal."}`,
      mechanics: `A fase nasce do ângulo entre Sol e Lua, não apenas da aparência iluminada no céu. Ela descreve uma relação entre consciência e necessidade emocional; por isso, é um ritmo simbólico, não uma garantia de acontecimentos.`,
      dailyLife: `Na prática, o potencial é ${phase.gift}. Observe este movimento em projetos, conversas, vínculos e no modo como seu corpo pede alternância entre ação e pausa.`,
      tension: `O ponto de atenção é ${phase.tension}. Emoção intensa traz informação, mas ainda precisa de contexto antes de orientar decisões importantes.`,
      integration: `Prática da fase: ${phase.practice}. Use o gesto como observação de si, sem transformar o calendário lunar em obrigação ou explicação única para o seu humor.`,
      reflection: `O que esta etapa pede que você comece, sustente, revele ou encerre com mais consciência?`,
    } satisfies EditorialReading;
  });
  return [moonReading, ...phases];
}

function houseForLongitude(longitude: number, cusps: number[]): number {
  for (let index = 0; index < cusps.length; index += 1) {
    const start = cusps[index] ?? 0;
    const end = cusps[(index + 1) % cusps.length] ?? start;
    const span = (((end - start) % 360) + 360) % 360;
    const offset = (((longitude - start) % 360) + 360) % 360;
    if (offset < span) return index + 1;
  }
  return 1;
}

function progressedMeaning(phase: string, house: number | null): string {
  const phases: Readonly<Record<string, string>> = {
    new: "Uma semente de ciclo longo pede silêncio suficiente para descobrir o que realmente quer nascer.",
    crescent: "O impulso novo precisa de compromisso e experimentação para ganhar contorno.",
    first_quarter: "Decisões e atritos tornam visível o que precisa ser construído com coragem.",
    gibbous: "Aperfeiçoar, estudar e ajustar prepara uma culminação que ainda não chegou.",
    full: "Resultados e relações ficam mais visíveis; consciência cresce ao integrar polos opostos.",
    disseminating: "Conhecimento e experiência pedem circulação, ensino e contribuição.",
    last_quarter: "Uma reorientação interna questiona estruturas que já cumpriram sua função.",
    balsamic: "O ciclo solicita recolhimento, conclusão e espaço psíquico para o próximo começo.",
  };
  const houseText =
    house === null
      ? ""
      : ` A Casa ${house} mostra o campo concreto em que essa fase procura acontecer.`;
  return `${phases[phase] ?? phases.new}${houseText}`;
}

function moonRelation(first: number, second: number): { title: string; text: string } {
  const distance = Math.min(Math.abs(first - second) % 360, 360 - (Math.abs(first - second) % 360));
  if (distance <= 10)
    return {
      title: "Ritmos semelhantes",
      text: "As duas Luas reconhecem necessidades parecidas. A familiaridade ajuda, mas também pode duplicar defesas e expectativas silenciosas.",
    };
  if (Math.abs(distance - 180) <= 10)
    return {
      title: "Necessidades complementares",
      text: "Cada Lua ilumina o polo que a outra tende a projetar. Intimidade cresce quando diferença não vira disputa por quem sente do jeito certo.",
    };
  if (Math.abs(distance - 90) <= 8)
    return {
      title: "Ajuste emocional necessário",
      text: "Os ritmos procuram segurança por caminhos distintos. Pedidos claros e tempo de regulação evitam que reação seja confundida com rejeição.",
    };
  if (Math.abs(distance - 120) <= 8 || Math.abs(distance - 60) <= 6)
    return {
      title: "Circulação emocional fluida",
      text: "Há facilidade para compreender o clima afetivo do outro. A harmonia ganha profundidade quando não substitui conversas difíceis.",
    };
  return {
    title: "Duas linguagens para aprender",
    text: "Não há um aspecto maior exato entre as Luas. A compatibilidade depende mais de escuta, acordos e do restante da sinastria do que de uma única medida.",
  };
}

function formatInstant(instant: string, timezone: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: timezone,
  }).format(new Date(instant));
}

function aspectLabel(type: string): string {
  return astrologicalAspectName(type);
}

function bodyLabel(body: string): string {
  return astrologicalBodyName(body);
}

function lunarTransitMeaning(body: string, type: string): string {
  const themes: Readonly<Record<string, string>> = {
    sun: "emoção e identidade procuram se reconhecer",
    moon: "a sensibilidade fica amplificada",
    mercury: "sentimento procura palavra",
    venus: "afeto e valor pessoal ganham destaque",
    mars: "reação e desejo pedem regulação",
    jupiter: "o humor tende a ampliar expectativas",
    saturn: "limite e responsabilidade atravessam o campo emocional",
    uranus: "mudanças de ritmo podem surpreender",
    neptune: "imaginação e projeção ficam mais permeáveis",
    pluto: "conteúdos intensos procuram elaboração",
  };
  const movement =
    type === "square" || type === "opposition"
      ? "A tensão pede pausa antes da resposta."
      : "A energia pode circular com menos resistência, desde que permaneça consciente.";
  return `${themes[body] ?? "um tema natal é ativado"}. ${movement}`;
}
