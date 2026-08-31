"use client";

import { useEffect, useRef, useState } from "react";
import { CelestialGlyph, hasCelestialGlyph } from "@/components/site/celestial-glyph";

import { zodiacPlacement } from "@/domain/astrology/western/zodiac";
import type { CreateMapResponse } from "@/lib/maps/contracts";

type Chart = CreateMapResponse["chart"];
type Planet = Chart["planets"][number];

const PLANETS: Readonly<Record<string, { label: string; glyph: string; theme: string }>> = {
  sun: { label: "Sol", glyph: "☉", theme: "identidade, presença e direção consciente" },
  moon: { label: "Lua", glyph: "☾", theme: "necessidades emocionais, memória e proteção" },
  mercury: { label: "Mercúrio", glyph: "☿", theme: "pensamento, linguagem e aprendizado" },
  venus: { label: "Vênus", glyph: "♀", theme: "afetos, valores e formas de aproximação" },
  mars: { label: "Marte", glyph: "♂", theme: "iniciativa, desejo e modo de enfrentar tensões" },
  jupiter: { label: "Júpiter", glyph: "♃", theme: "expansão, confiança e construção de sentido" },
  saturn: { label: "Saturno", glyph: "♄", theme: "limites, responsabilidade e amadurecimento" },
  uranus: { label: "Urano", glyph: "♅", theme: "mudança, autonomia e ruptura de padrões" },
  neptune: {
    label: "Netuno",
    glyph: "♆",
    theme: "imaginação, sensibilidade e dissolução de fronteiras",
  },
  pluto: { label: "Plutão", glyph: "♇", theme: "transformação, poder e processos profundos" },
  chiron: { label: "Quíron", glyph: "⚷", theme: "feridas elaboradas, cuidado e aprendizagem" },
  true_node: {
    label: "Nodo Norte",
    glyph: "☊",
    theme: "direção de desenvolvimento, encontros e experiências que ampliam repertório",
  },
  south_node: {
    label: "Nodo Sul",
    glyph: "☋",
    theme: "padrões familiares, recursos já disponíveis e zonas de repetição",
  },
  mean_lilith: {
    label: "Lilith média",
    glyph: "⚸",
    theme: "autonomia, recusa e conteúdos que não aceitam domesticação fácil",
  },
};

const SIGN_EXPRESSIONS: Readonly<Record<string, string>> = {
  Áries: "de forma direta, inaugural e movida por ação",
  Touro: "com constância, senso de valor e atenção ao que pode ser sustentado",
  Gêmeos: "por curiosidade, troca e multiplicidade de perspectivas",
  Câncer: "com sensibilidade, vínculo e atenção à segurança emocional",
  Leão: "com expressão criativa, calor e desejo de reconhecimento autêntico",
  Virgem: "por observação, aprimoramento e cuidado com os detalhes",
  Libra: "por relações, busca de equilíbrio e leitura do outro",
  Escorpião: "com intensidade, reserva e disposição para atravessar mudanças",
  Sagitário: "por expansão, franqueza e busca de horizontes mais amplos",
  Capricórnio: "com estrutura, responsabilidade e orientação para o longo prazo",
  Aquário: "por independência, visão coletiva e abertura ao incomum",
  Peixes: "com imaginação, permeabilidade e percepção do que não é imediatamente visível",
};

export function NatalChartWheel({
  chart,
  name = "você",
  compact = false,
}: Readonly<{ chart: Chart; name?: string; compact?: boolean }>): React.JSX.Element {
  const [selectedId, setSelectedId] = useState("sun");
  const displayPlanets = withDerivedSouthNode(chart.planets);
  const selected = displayPlanets.find(({ id }) => id === selectedId) ?? displayPlanets[0];
  const rotation = chart.houses === undefined ? 0 : 180 - chart.houses.ascendant;
  const angles = getAngles(chart);
  const meridian =
    chart.houses === undefined ? undefined : getMeridian(chart.houses.midheaven, rotation);

  return (
    <div className="natal-chart-experience">
      <section className="natal-sky-stage" aria-labelledby="natal-instrument-title">
        <header className="natal-stage-heading">
          <p className="eyebrow">Seu céu de nascimento</p>
          <h3 id="natal-instrument-title">O mapa natal de {name}</h3>
          <p>
            {chart.mode === "timed"
              ? "A hora informada permite posicionar as doze casas e os quatro ângulos do céu."
              : "Sem uma hora conhecida, mostramos somente posições planetárias confiáveis."}
          </p>
        </header>

        <div className="natal-wheel-frame">
          <div className="natal-wheel" data-mode={chart.mode}>
            <svg viewBox="0 0 100 100" aria-hidden="true">
              <circle cx="50" cy="50" r="48" />
              <circle cx="50" cy="50" r="39" />
              <circle cx="50" cy="50" r="21" />
              {Array.from({ length: 12 }, (_, index) => {
                const angle = index * 30 + rotation;
                const inner = polarPoint(angle, 39);
                const outer = polarPoint(angle, 48);
                return (
                  <line key={`sign-${angle}`} x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y} />
                );
              })}
              {chart.houses?.cusps.map((cusp, index) => {
                const point = polarPoint(cusp + rotation, 39);
                const labelPoint = polarPoint(cusp + rotation + 8, 25);
                return (
                  <g key={`house-${index + 1}`}>
                    <line className="natal-house-line" x1="50" y1="50" x2={point.x} y2={point.y} />
                    <text className="natal-house-number" x={labelPoint.x} y={labelPoint.y}>
                      {index + 1}
                    </text>
                  </g>
                );
              })}
              {chart.houses === undefined ? null : (
                <>
                  <line className="natal-cardinal-axis" x1="1" y1="50" x2="99" y2="50" />
                  <line
                    className="natal-meridian-axis"
                    x1={meridian?.mc.x}
                    y1={meridian?.mc.y}
                    x2={meridian?.ic.x}
                    y2={meridian?.ic.y}
                  />
                </>
              )}
            </svg>
            {displayPlanets.map((planet) => {
              const point = markerPoint(planet, displayPlanets, rotation);
              return (
                <button
                  key={planet.id}
                  type="button"
                  className="natal-planet-marker"
                  data-selected={planet.id === selected?.id}
                  aria-label={`Ler ${planetMeta(planet).label}`}
                  aria-pressed={planet.id === selected?.id}
                  style={{ left: `${point.x}%`, top: `${point.y}%` }}
                  onClick={() => setSelectedId(planet.id)}
                >
                  <PlanetGlyph id={planet.id} fallback={planetMeta(planet).glyph} />
                </button>
              );
            })}
            {selected === undefined ? null : <PlanetReading planet={selected} compact />}
          </div>
          {chart.houses === undefined ? null : <AngleDock angles={angles} />}
        </div>

        <a className="natal-scroll-cue" href="#leitura-do-mapa">
          <span>Descer para interpretar</span>
          <i aria-hidden="true" />
        </a>
      </section>

      {compact ? (
        <section
          className="natal-archive-reading"
          id="leitura-do-mapa"
          aria-labelledby="archive-reading-title"
        >
          <header>
            <p className="eyebrow">Leitura por posição</p>
            <h3 id="archive-reading-title">Escolha um ponto para aprofundar.</h3>
            <p>Uma leitura por vez mantém a relação entre coordenada e interpretação clara.</p>
          </header>
          <div className="natal-archive-reading-grid">
            <div className="natal-position-selector" aria-label="Posições do mapa">
              {displayPlanets.map((planet) => {
                const placement = zodiacPlacement(planet.longitude);
                return (
                  <button
                    key={planet.id}
                    type="button"
                    aria-pressed={planet.id === selected?.id}
                    onClick={() => setSelectedId(planet.id)}
                  >
                    <PlanetGlyph id={planet.id} fallback={planetMeta(planet).glyph} />
                    <strong>{planetMeta(planet).label}</strong>
                    <small>
                      {placement.sign} · {placement.signDegree.toFixed(2)}°
                    </small>
                  </button>
                );
              })}
            </div>
            {selected === undefined ? null : <PlanetReading planet={selected} />}
          </div>
        </section>
      ) : (
        <section
          className="natal-reading-flow"
          id="leitura-do-mapa"
          aria-labelledby="reading-title"
        >
          <ScrollReveal className="natal-reading-intro">
            <p className="eyebrow">Leitura em camadas</p>
            <h3 id="reading-title">Do desenho do céu à experiência.</h3>
            <p>
              Cada posição abaixo combina um dado astronômico calculado com uma interpretação
              simbólica. Ela oferece linguagem para reflexão, não determina personalidade ou
              destino.
            </p>
          </ScrollReveal>

          {chart.houses === undefined ? (
            <ScrollReveal className="natal-unknown-time">
              <strong>Casas e ângulos não foram inferidos.</strong>
              <p>
                Informe uma hora confiável em um novo perfil para calcular Ascendente e Descendente.
              </p>
            </ScrollReveal>
          ) : (
            <div className="natal-angle-chapters" aria-label="Quatro ângulos do mapa natal">
              <AngleChapter
                label="Ascendente"
                code="ASC"
                placement={angles.ascendant}
                description="o modo como você inicia movimentos, ocupa o ambiente e é percebido nos primeiros encontros"
              />
              <AngleChapter
                label="Descendente"
                code="DSC"
                placement={angles.descendant}
                description="o horizonte das parcerias: qualidades encontradas no outro e aprendizados construídos nas relações"
              />
              <AngleChapter
                label="Meio do Céu"
                code="MC"
                placement={angles.midheaven}
                axis="Eixo do meridiano"
                description="a direção pública, os chamados de realização e a maneira como sua contribuição se torna visível"
              />
              <AngleChapter
                label="Fundo do Céu"
                code="FC"
                placement={angles.imumCoeli}
                axis="Eixo do meridiano"
                description="as raízes, a intimidade e as bases internas a partir das quais você constrói segurança"
              />
            </div>
          )}

          <div className="natal-planet-chapters" aria-label="Interpretações de planetas e pontos">
            {displayPlanets.map((planet, index) => (
              <ScrollReveal className="natal-planet-chapter" key={planet.id}>
                <span className="natal-chapter-index">{String(index + 1).padStart(2, "0")}</span>
                <PlanetReading planet={planet} />
              </ScrollReveal>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function AngleDock({
  angles,
}: Readonly<{ angles: ReturnType<typeof getAngles> }>): React.JSX.Element {
  const items = [
    ["ASC", "Ascendente", angles.ascendant],
    ["DSC", "Descendente", angles.descendant],
    ["MC", "Meio do Céu", angles.midheaven],
    ["FC", "Fundo do Céu", angles.imumCoeli],
  ] as const;
  return (
    <dl className="natal-angle-dock" aria-label="Coordenadas dos quatro ângulos">
      {items.map(([code, label, placement]) => (
        <div key={code}>
          <dt>
            <span>{code}</span>
            {label}
          </dt>
          <dd>
            {placement?.sign} <small>{placement?.signDegree.toFixed(2)}°</small>
          </dd>
        </div>
      ))}
    </dl>
  );
}

function PlanetReading({
  planet,
  compact = false,
}: Readonly<{ planet: Planet; compact?: boolean }>): React.JSX.Element {
  const placement = zodiacPlacement(planet.longitude);
  const meta = planetMeta(planet);
  return (
    <article
      className={compact ? "natal-selected-reading" : "natal-detailed-reading"}
      aria-live={compact ? "polite" : undefined}
    >
      <p className="eyebrow">{compact ? "Corpo em foco" : meta.theme}</p>
      <div className="natal-reading-title">
        <PlanetGlyph id={planet.id} fallback={meta.glyph} />
        <h4>
          {meta.label} em {placement.sign}
        </h4>
      </div>
      <p className="natal-coordinate">
        {placement.signDegree.toFixed(2)}° no signo
        {planet.retrograde ? " · movimento retrógrado" : ""}
      </p>
      {compact ? null : (
        <>
          <p>
            No mapa natal, {meta.label} organiza temas de {meta.theme}. Em {placement.sign}, essa
            função tende a buscar expressão{" "}
            {SIGN_EXPRESSIONS[placement.sign] ?? "de acordo com a linguagem simbólica desse signo"}.
          </p>
          <p>
            Observe essa posição como uma pergunta recorrente: onde essa qualidade aparece com
            naturalidade e onde ela pede mais consciência? O grau registra a coordenada exata usada
            no cálculo; a interpretação permanece aberta ao contexto da sua vida.
          </p>
        </>
      )}
    </article>
  );
}

function AngleChapter({
  label,
  code,
  placement,
  description,
  axis = "Eixo do horizonte",
}: Readonly<{
  label: string;
  code: string;
  placement: ReturnType<typeof zodiacPlacement> | undefined;
  description: string;
  axis?: string;
}>): React.JSX.Element | null {
  if (placement === undefined) return null;
  return (
    <ScrollReveal className="natal-angle-chapter">
      <span className="natal-angle-code">{code}</span>
      <div>
        <p className="eyebrow">{axis}</p>
        <h4>
          {label} em {placement.sign}
        </h4>
        <p className="natal-coordinate">{placement.signDegree.toFixed(2)}° no signo</p>
        <p>
          Este ponto descreve {description}. Em {placement.sign}, ele se manifesta{" "}
          {SIGN_EXPRESSIONS[placement.sign] ?? "pela linguagem simbólica do signo"}.
        </p>
      </div>
    </ScrollReveal>
  );
}

function ScrollReveal({
  className,
  children,
}: Readonly<{ className: string; children: React.ReactNode }>): React.JSX.Element {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = ref.current;
    if (element === null || typeof IntersectionObserver === "undefined") return;
    element.dataset.motionReady = "true";
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          element.dataset.visible = "true";
          observer.disconnect();
        }
      },
      { rootMargin: "0px 0px -12%" },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return (
    <div ref={ref} className={`natal-scroll-reveal ${className}`}>
      {children}
    </div>
  );
}

function getAngles(chart: Chart): {
  ascendant?: ReturnType<typeof zodiacPlacement>;
  descendant?: ReturnType<typeof zodiacPlacement>;
  midheaven?: ReturnType<typeof zodiacPlacement>;
  imumCoeli?: ReturnType<typeof zodiacPlacement>;
} {
  if (chart.houses === undefined) return {};
  return {
    ascendant: zodiacPlacement(chart.houses.ascendant),
    descendant: zodiacPlacement((chart.houses.ascendant + 180) % 360),
    midheaven: zodiacPlacement(chart.houses.midheaven),
    imumCoeli: zodiacPlacement((chart.houses.midheaven + 180) % 360),
  };
}

function withDerivedSouthNode(planets: Planet[]): Planet[] {
  const northNode = planets.find(({ id }) => id === "true_node");
  if (northNode === undefined) return planets;
  const longitude = (northNode.longitude + 180) % 360;
  const placement = zodiacPlacement(longitude);
  return [
    ...planets,
    {
      ...northNode,
      id: "south_node",
      longitude,
      latitude: 0,
      sign: placement.sign,
      signDegree: placement.signDegree,
    },
  ];
}

function getMeridian(midheaven: number, rotation: number) {
  const angle = midheaven + rotation;
  return {
    mc: polarPoint(angle, 49),
    ic: polarPoint(angle + 180, 49),
  };
}

function polarPoint(longitude: number, radius: number): { x: number; y: number } {
  const radians = ((longitude - 90) * Math.PI) / 180;
  return { x: 50 + radius * Math.cos(radians), y: 50 + radius * Math.sin(radians) };
}

export function markerPoint(
  planet: Planet,
  planets: Planet[],
  rotation: number,
): { x: number; y: number } {
  const neighbors = planets
    .filter((candidate) => angularDistance(candidate.longitude, planet.longitude) <= 9)
    .toSorted((left, right) => left.longitude - right.longitude || left.id.localeCompare(right.id));
  const lane = Math.max(
    0,
    neighbors.findIndex(({ id }) => id === planet.id),
  );
  const radii = [31, 23, 39, 27, 35] as const;
  const radius = radii[lane % radii.length] ?? 31;
  return polarPoint(planet.longitude + rotation + Math.floor(lane / radii.length) * 2.5, radius);
}

function angularDistance(left: number, right: number): number {
  const distance = Math.abs((((left - right) % 360) + 360) % 360);
  return Math.min(distance, 360 - distance);
}

function planetMeta(planet: Planet): { label: string; glyph: string; theme: string } {
  return (
    PLANETS[planet.id] ?? {
      label: planet.id,
      glyph: "•",
      theme: "uma dimensão simbólica da experiência",
    }
  );
}

/**
 * Glifo do corpo celeste, sempre decorativo — o nome acompanha em texto.
 *
 * Corpo sem glifo desenhado cai no caractere Unicode em vez de sumir da roda:
 * perder o marcador seria pior que renderizá-lo com a fonte do sistema.
 */
function PlanetGlyph({
  id,
  fallback,
}: Readonly<{ id: string; fallback: string }>): React.JSX.Element {
  if (!hasCelestialGlyph(id)) return <span aria-hidden="true">{fallback}</span>;
  return <CelestialGlyph body={id} />;
}
