"use client";

import { useEffect, useState } from "react";

import { astrologicalAspectName, astrologicalBodyName } from "@/domain/astrology/labels";
import { zodiacPlacement } from "@/domain/astrology/western/zodiac";
import {
  houseForLongitude,
  interpretHouse,
  interpretPlacement,
  type EditorialReading,
} from "@/domain/astrology/editorial-report";
import type { ProfileRecord } from "@/lib/profiles/contracts";
import { geocodingResponseSchema, type PlaceCandidate } from "@/lib/maps/contracts";
import {
  planetaryReturnResponseSchema,
  type PlanetaryReturnResponse,
} from "@/lib/returns/contracts";
import { ModernPointsPanel } from "./modern-points-panel";
import { TransitReading } from "./transit-reading";
import { ImmersiveReport } from "./immersive-report";

type Natal = ProfileRecord["chart"]["natal"];

export function HoroscopeOverview({
  profile,
}: Readonly<{ profile: ProfileRecord }>): React.JSX.Element {
  const sun = placement(profile.chart.natal, "sun");
  const moon = placement(profile.chart.natal, "moon");
  const jupiter = placement(profile.chart.natal, "jupiter");
  const saturn = placement(profile.chart.natal, "saturn");
  const cards = [
    {
      title: "Dinheiro e carreira",
      glyph: "♃",
      text: `Júpiter em ${jupiter.sign} descreve como você tende a reconhecer expansão ${expression(jupiter.sign)}. Saturno em ${saturn.sign} mostra onde constância, limite e responsabilidade precisam amadurecer. Juntos, eles formam a base natal para interpretar os ciclos profissionais calculados abaixo.`,
    },
    {
      title: "Família e amigos",
      glyph: "☾",
      text: `Sua Lua em ${moon.sign} procura segurança ${expression(moon.sign)}. Nos vínculos próximos, essa necessidade pode orientar pedidos, limites e formas de cuidado. Reconhecê-la evita transformar afeto em obrigação silenciosa ou expectativa de adivinhação.`,
    },
    {
      title: "Espiritualidade",
      glyph: "✦",
      text: `O Sol em ${sun.sign} reconhece sentido quando a consciência se expressa ${expression(sun.sign)}. Esta é uma lente simbólica sobre propósito e presença, não uma declaração de crença, iniciação ou vínculo religioso.`,
    },
  ];
  return (
    <section className="editorial-module" aria-labelledby="horoscope-overview-title">
      <header>
        <p className="eyebrow">Base natal e movimentos atuais</p>
        <h1 id="horoscope-overview-title">Horóscopo de {profile.displayName}</h1>
        <p>
          Primeiro, três lentes permanentes do mapa natal oferecem contexto. Depois, o Tempo do Céu
          usa trânsitos datados para mostrar o que está ativo agora. Assim, tendência natal e
          movimento do período não são apresentados como se fossem a mesma coisa.
        </p>
      </header>
      <div className="editorial-module-grid">
        {cards.map((card) => (
          <article key={card.title}>
            <span aria-hidden="true">{card.glyph}</span>
            <h2>{card.title}</h2>
            <p>{card.text}</p>
          </article>
        ))}
      </div>
      <aside className="future-sky-callout">
        <p className="eyebrow">Como ler a linha do tempo</p>
        <h2>Cada trânsito tem começo, pico e encerramento.</h2>
        <p>
          Abra o Tempo do Céu abaixo para acompanhar a passagem completa. Aspectos aplicantes ainda
          ganham força; aspectos separativos mostram o que começa a perder intensidade. Use a janela
          para preparar escolhas, conversas e limites — não como sentença sobre o futuro.
        </p>
      </aside>
    </section>
  );
}

export function ShadowHoroscopeView({
  profile,
}: Readonly<{ profile: ProfileRecord }>): React.JSX.Element {
  const sun = placement(profile.chart.natal, "sun");
  const moon = placement(profile.chart.natal, "moon");
  const mercury = placement(profile.chart.natal, "mercury");
  const venus = placement(profile.chart.natal, "venus");
  const mars = placement(profile.chart.natal, "mars");
  const chapters = [
    ["☉", "A máscara da força", sun, "sun"],
    ["☾", "A defesa emocional", moon, "moon"],
    ["☿", "A armadilha da mente", mercury, "mercury"],
    ["♀", "O preço de ser amado", venus, "venus"],
    ["♂", "A sombra do desejo", mars, "mars"],
  ] as const;
  const shadowAreas = [
    {
      title: "Identidade e autoimagem",
      text: `O Sol em ${sun.sign} pode defender a própria identidade repetindo uma força que perdeu flexibilidade. Como padrão natal, ele pede atenção quando afirmar-se vira provar valor ou quando a necessidade de coerência impede uma mudança necessária.`,
    },
    {
      title: "Dinheiro e carreira",
      text: `A sombra profissional aparece quando ambição, medo de escassez ou necessidade de reconhecimento escolhem por você. Marte em ${mars.sign} pode reagir ${expression(mars.sign)} antes de medir custo, limite e consequência.`,
    },
    {
      title: "Família e amigos",
      text: `A Lua em ${moon.sign} protege pertencimento ${expression(moon.sign)}. Sob ameaça, cuidado pode virar cobrança, silêncio, controle ou expectativa de que os outros adivinhem uma necessidade que ainda não foi nomeada.`,
    },
    {
      title: "Espiritualidade",
      text: `A sombra espiritual surge quando intuição vira certeza absoluta, quando sinais substituem responsabilidade ou quando a busca de sentido evita uma realidade desconfortável. Seu caminho precisa ampliar consciência, não alimentar medo ou superioridade.`,
    },
  ];
  return (
    <section className="editorial-module shadow-horoscope" aria-labelledby="shadow-title">
      <header>
        <p className="eyebrow">Horóscopo sombrio</p>
        <h1 id="shadow-title">Aquilo que pede integração.</h1>
        <p>
          A sombra não é maldade nem condenação. É a qualidade do mapa que, quando negada ou
          endurecida, passa a agir sem consciência. Esta leitura mostra seus mecanismos de defesa,
          excessos e projeções — e a potência que retorna quando você assume autoria sobre eles.
        </p>
      </header>
      <div className="editorial-module-grid">
        {shadowAreas.map((area) => (
          <article key={area.title}>
            <span aria-hidden="true">◐</span>
            <h2>{area.title}</h2>
            <p>{area.text}</p>
          </article>
        ))}
      </div>
      <div className="biorhythm-chapter">
        <p className="eyebrow">Arquitetura natal da sombra</p>
        <h4>Cinco mecanismos pessoais</h4>
        <p>
          Os capítulos abaixo mostram como identidade, emoção, pensamento, afeto e desejo podem se
          defender — e qual potência reaparece quando cada padrão é reconhecido.
        </p>
      </div>
      <div className="editorial-module-grid">
        {chapters.map(([glyph, title, value, body]) => (
          <article key={body}>
            <span aria-hidden="true">{glyph}</span>
            <p className="eyebrow">
              {value.sign} · {value.signDegree.toFixed(2)}°
            </p>
            <h2>{title}</h2>
            <p>{shadowMeaning(body, value.sign)}</p>
          </article>
        ))}
      </div>
      <div className="biorhythm-chapter">
        <p className="eyebrow">Sombras ativas e próximas</p>
        <h4>Trânsitos do seu Horóscopo Sombrio</h4>
        <p>
          Navegue pela data para acompanhar quando um padrão entra em cena, alcança o pico e começa
          a perder força. Aspectos futuros funcionam como preparação para não repetir no automático.
        </p>
      </div>
      <TransitReading profileId={profile.id} timezone={profile.timezone} variant="shadow" />
      <aside className="future-sky-callout">
        <p className="eyebrow">Prática de integração</p>
        <h2>O que irrita, fascina ou assusta também informa.</h2>
        <p>
          Observe durante sete dias quando cada padrão aparece. Registre o gatilho, a reação e a
          necessidade que ficou escondida. A sombra perde poder quando ganha linguagem, limite e uma
          escolha diferente — não quando é combatida com vergonha.
        </p>
      </aside>
    </section>
  );
}

export function LunarNodesView({ chart }: Readonly<{ chart: Natal }>): React.JSX.Element {
  const readings = placementReadings(
    chart,
    ["true_node", "south_node", "sun", "moon"],
    "No eixo nodal, repertório conhecido e direção de desenvolvimento precisam cooperar.",
  );
  return (
    <section className="editorial-module" aria-labelledby="nodes-view-title">
      <header>
        <p className="eyebrow">Eixo de memória e crescimento</p>
        <h1 id="nodes-view-title">Nodos Lunares</h1>
        <p>
          Os Nodos formam um único eixo. O Sul guarda repertórios conhecidos; o Norte convoca
          experiências que ampliam a vida. Um não deve ser abandonado em favor do outro: a arte é
          usar a competência do passado para atravessar a direção do futuro.
        </p>
      </header>
      <ModernPointsPanel chart={chart} />
      <ImmersiveReport
        title="Seu eixo nodal, capítulo por capítulo"
        intro="Esta é uma leitura da astrologia ocidental moderna. Ela não transforma Nodo Sul em condenação nem Nodo Norte em promessa: explica o repertório disponível, a experiência que pede cultivo e como Sol e Lua participam dessa travessia."
        readings={readings}
      />
      <p className="module-disclaimer">
        A interpretação evolutiva dos Nodos não é uma doutrina única em toda a história da
        astrologia. Aqui ela é apresentada como linguagem simbólica contemporânea, com a linha usada
        explicitada.
      </p>
    </section>
  );
}

export function LoveMapView({ profile }: Readonly<{ profile: ProfileRecord }>): React.JSX.Element {
  const moon = placement(profile.chart.natal, "moon");
  const venus = placement(profile.chart.natal, "venus");
  const mars = placement(profile.chart.natal, "mars");
  const readings = [
    ...placementReadings(
      profile.chart.natal,
      ["moon", "venus", "mars", "sun", "saturn"],
      "No Mapa do Amor, esta função descreve necessidades, escolhas e padrões que participam dos vínculos.",
    ),
    ...houseReadings(
      profile.chart.natal,
      [5, 7, 8],
      "No amor, esta casa mostra um palco específico de romance, parceria ou intimidade.",
    ),
  ];
  return (
    <section className="editorial-module" aria-labelledby="love-map-title">
      <header>
        <p className="eyebrow">Afeto, intimidade e desejo</p>
        <h1 id="love-map-title">Mapa do Amor</h1>
        <p>
          Amar envolve pelo menos três linguagens no mapa: a Lua precisa sentir segurança, Vênus
          reconhece prazer e reciprocidade, Marte move desejo e iniciativa. O seu mapa pede que elas
          conversem, sem obrigar uma única pessoa a preencher todas as funções.
        </p>
      </header>
      <div className="editorial-module-grid editorial-module-grid-three">
        <PlacementChapter
          glyph="☾"
          title="O que faz você se sentir em casa"
          value={moon}
          body="moon"
        />
        <PlacementChapter
          glyph="♀"
          title="Como você oferece e recebe amor"
          value={venus}
          body="venus"
        />
        <PlacementChapter
          glyph="♂"
          title="Como o desejo ganha movimento"
          value={mars}
          body="mars"
        />
      </div>
      <aside className="future-sky-callout">
        <p className="eyebrow">Integração amorosa</p>
        <h2>Química não substitui vínculo; compatibilidade não substitui escolha.</h2>
        <p>
          Quando Lua, Vênus e Marte pedem ritmos diferentes, sua tarefa não é escolher um e calar os
          outros. É construir relações em que cuidado, prazer e desejo possam ser nomeados com
          honestidade, consentimento e espaço para reparação.
        </p>
      </aside>
      <ImmersiveReport
        title="Seu relatório afetivo completo"
        intro="Comece pela Lua para compreender segurança, passe por Vênus e Marte para reconhecer reciprocidade e desejo, e use as casas para localizar romance, parceria e entrega na vida concreta."
        readings={readings}
      />
    </section>
  );
}

export function CompleteNatalMapView({
  profile,
}: Readonly<{ profile: ProfileRecord }>): React.JSX.Element {
  const natal = profile.chart.natal;
  const ascendant = natal.houses?.ascendant;
  const ascendantPlacement = ascendant === undefined ? undefined : zodiacPlacement(ascendant);
  const elements = elementBalance(natal);
  const chapters = [
    [
      "☉",
      "Sua identidade",
      "Sol",
      "sun",
      "o centro consciente, a vitalidade e o sentido de autoria",
    ],
    [
      "☾",
      "Seu emocional",
      "Lua",
      "moon",
      "as necessidades íntimas, os afetos e sua maneira de buscar segurança",
    ],
    [
      "☿",
      "Intelecto e comunicação",
      "Mercúrio",
      "mercury",
      "o raciocínio, a linguagem e o modo de aprender",
    ],
    [
      "♀",
      "Vida afetiva",
      "Vênus",
      "venus",
      "o prazer, os valores e a forma de construir reciprocidade",
    ],
    ["♂", "Força interior", "Marte", "mars", "o desejo, a coragem e a maneira de entrar em ação"],
    [
      "♃",
      "Oportunidades",
      "Júpiter",
      "jupiter",
      "a expansão, a confiança e os caminhos que ampliam horizontes",
    ],
    [
      "♄",
      "Desafios e maturidade",
      "Saturno",
      "saturn",
      "os limites, as responsabilidades e a competência construída no tempo",
    ],
    [
      "♅",
      "Liberdade e reinvenção",
      "Urano",
      "uranus",
      "a ruptura de padrões e a necessidade de autenticidade",
    ],
    [
      "♆",
      "Imaginação e espiritualidade",
      "Netuno",
      "neptune",
      "a sensibilidade, os ideais e os limites entre inspiração e projeção",
    ],
    [
      "♇",
      "Evolução profunda",
      "Plutão",
      "pluto",
      "as crises de poder, regeneração e transformação",
    ],
  ] as const;
  return (
    <section className="editorial-module complete-natal-map" aria-labelledby="complete-map-title">
      <header>
        <p className="eyebrow">Mapa Astral Completo · leitura permanente</p>
        <h1 id="complete-map-title">A arquitetura do céu em que você nasceu.</h1>
        <p>
          Este mapa não vence no próximo aniversário. Ele combina planetas, signos, casas e aspectos
          do instante natal para explicar identidade, emoções, pensamento, amor, ação,
          oportunidades, desafios e processos de evolução ao longo da vida.
        </p>
      </header>
      <section className="identity-axis" aria-labelledby="identity-axis-title">
        <p className="eyebrow">Capítulo 01 · Signo e Ascendente</p>
        <h2 id="identity-axis-title">Sua identidade e a forma de chegar ao mundo</h2>
        <p>
          Seu Sol em {placement(natal, "sun").sign} descreve o centro que procura se tornar
          consciente.{" "}
          {ascendantPlacement === undefined
            ? "Como a hora não foi informada, o Ascendente e as casas permanecem indisponíveis; inventá-los tornaria a leitura imprecisa."
            : `Seu Ascendente em ${ascendantPlacement.sign} mostra a postura espontânea com que você inicia experiências. A combinação pede que essência e presença aprendam a cooperar, sem reduzir você a um único signo.`}
        </p>
      </section>
      <section className="element-balance" aria-labelledby="element-balance-title">
        <div>
          <p className="eyebrow">Capítulo 02 · Temperamento</p>
          <h2 id="element-balance-title">A distribuição dos quatro elementos</h2>
          <p>
            Elemento forte não significa virtude e elemento menos presente não é defeito. O
            equilíbrio mostra quais linguagens surgem naturalmente e quais precisam ser cultivadas
            com intenção.
          </p>
        </div>
        <div className="element-bars">
          {elements.map((element) => (
            <div key={element.name}>
              <span>{element.name}</span>
              <i style={{ "--element-level": `${element.percentage}%` } as React.CSSProperties} />
              <strong>{element.percentage}%</strong>
            </div>
          ))}
        </div>
      </section>
      <div className="editorial-module-grid complete-map-chapters">
        {chapters.map(([glyph, title, bodyNameLabel, body, theme], index) => {
          const value = placement(natal, body);
          return (
            <article key={body}>
              <span aria-hidden="true">{glyph}</span>
              <p className="eyebrow">
                Capítulo {String(index + 3).padStart(2, "0")} · {bodyNameLabel}
              </p>
              <h2>{title}</h2>
              <p>
                {bodyNameLabel} em {value.sign}, a {value.signDegree.toFixed(2)}°, colore {theme}.
                Em você, essa função busca expressão {expression(value.sign)}. A maturidade aparece
                quando essa qualidade pode agir sem se tornar máscara, excesso ou automatismo.
              </p>
            </article>
          );
        })}
      </div>
      <section className="natal-aspect-reading" aria-labelledby="natal-aspects-title">
        <p className="eyebrow">Aspectos natais · desafios e oportunidades</p>
        <h2 id="natal-aspects-title">Como os planetas conversam entre si</h2>
        <p>
          Trígonos e sextis facilitam circulação; quadraturas e oposições pedem elaboração;
          conjunções concentram forças. Nenhum aspecto é somente bom ou ruim: cada encontro mostra
          uma dinâmica que pode amadurecer.
        </p>
        <div className="annual-event-list">
          {(natal.aspects ?? []).slice(0, 18).map((aspect) => (
            <article key={`${aspect.a}-${aspect.b}-${aspect.type}`}>
              <strong>{aspectName(aspect.type)}</strong>
              <div>
                <h3>
                  {bodyName(aspect.a)} com {bodyName(aspect.b)}
                </h3>
                <p>
                  Esta relação une duas necessidades do mapa com orbe de {aspect.orb.toFixed(2)}°.
                  Quanto menor o orbe, mais nítida tende a ser a dinâmica na experiência pessoal.
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}

export function SexualMapView({
  profile,
}: Readonly<{ profile: ProfileRecord }>): React.JSX.Element {
  const natal = profile.chart.natal;
  const venus = placement(natal, "venus");
  const mars = placement(natal, "mars");
  const moon = placement(natal, "moon");
  const sun = placement(natal, "sun");
  const lilith = placement(natal, "mean_lilith");
  const timed = natal.houses !== undefined;
  const chapters = [
    [
      "♀ + ♂",
      "Vênus e Marte: seu perfil erótico",
      `Vênus em ${venus.sign} busca prazer ${expression(venus.sign)}, enquanto Marte em ${mars.sign} acende iniciativa ${expression(mars.sign)}. O encontro mostra como sedução e impulso podem cooperar sem transformar desejo em obrigação.`,
    ],
    [
      "♂",
      "Marte: impulso, libido e conquista",
      `Marte a ${mars.signDegree.toFixed(2)}° de ${mars.sign} descreve como o corpo entra em ação, demonstra interesse e sustenta intensidade. Desejo saudável inclui liberdade para avançar, recuar, negociar e ouvir limites.`,
    ],
    [
      "♀",
      "Vênus: prazer, atração e sedução",
      `Vênus a ${venus.signDegree.toFixed(2)}° de ${venus.sign} reconhece beleza e reciprocidade ${expression(venus.sign)}. Este capítulo fala do que favorece entrega e encanto, sem definir gênero ou formato de relação.`,
    ],
    [
      "⚸",
      "Lilith: desejos ocultos e bloqueios",
      `Lilith média em ${lilith.sign} toca desejos que podem ter sido julgados, escondidos ou projetados. Integrá-la não é agir todo impulso: é dar linguagem ao desejo, separar fantasia de consentimento e reduzir vergonha.`,
    ],
    [
      "☾",
      "Lua: sentimentos no sexo",
      `Lua em ${moon.sign} precisa de segurança ${expression(moon.sign)}. Quando o corpo deseja e o emocional não confia, defesa e ambivalência podem aparecer; intimidade amadurece quando afeto e limite podem ser nomeados.`,
    ],
    [
      "☉",
      "Sol: presença e vontade",
      `Sol em ${sun.sign} mostra a versão de si que deseja estar inteira na experiência. Sua potência cresce quando prazer não exige personagem e quando reconhecimento não substitui conexão real.`,
    ],
    [
      "I",
      "Casa 1: como você se mostra",
      timed
        ? `A Casa 1 começa em ${houseSign(natal, 1)} e descreve sua presença na aproximação, o impacto inicial e aquilo com que você espontaneamente se identifica.`
        : "Sem hora conhecida, Ascendente e Casa 1 não podem ser calculados com segurança.",
    ],
    [
      "VII",
      "Casa 7: o que busca no outro",
      timed
        ? `A Casa 7 começa em ${houseSign(natal, 7)} e revela qualidades projetadas na parceria e o tipo de encontro que convida reciprocidade e negociação.`
        : "Sem hora conhecida, a Casa 7 permanece indisponível; o produto não inventa um perfil de parceria.",
    ],
    [
      "VIII",
      "Casa 8: entrega, prazer e fantasia",
      timed
        ? `A Casa 8 começa em ${houseSign(natal, 8)} e descreve como confiança, vulnerabilidade, poder compartilhado e fantasia ganham profundidade na intimidade.`
        : "Sem hora conhecida, a Casa 8 permanece indisponível; Vênus, Marte, Lua, Sol e Lilith ainda oferecem leitura confiável por signo.",
    ],
  ] as const;
  const readings = [
    ...placementReadings(
      natal,
      ["venus", "mars", "moon", "sun", "mean_lilith"],
      "No Mapa Sexual, o símbolo é lido com foco em atração, prazer, resposta emocional, desejo e autonomia.",
    ),
    ...houseReadings(
      natal,
      [1, 5, 7, 8],
      "Na vida íntima, esta casa situa presença, prazer, parceria ou entrega.",
    ),
  ];
  return (
    <>
      <ChapterCollection
        eyebrow="Mapa Sexual"
        title="Prazer em se conhecer — com desejo, consciência e consentimento."
        intro="Uma leitura personalizada de atração, afeto, impulso, intimidade e conteúdos ocultos. Potenciais não são comandos: toda expressão sexual depende de desejo mútuo, segurança e consentimento contínuo."
        chapters={chapters}
      />
      <ImmersiveReport
        title="Caderno de intimidade e desejo"
        intro="Os capítulos aprofundam cada função do seu mapa sem presumir gênero, orientação ou formato de relação. Leia como vocabulário para autoconhecimento, conversa e consentimento — nunca como obrigação de viver uma fantasia."
        readings={readings}
      />
    </>
  );
}

export function ProfessionalMapView({
  profile,
}: Readonly<{ profile: ProfileRecord }>): React.JSX.Element {
  const natal = profile.chart.natal;
  const sun = placement(natal, "sun");
  const moon = placement(natal, "moon");
  const mercury = placement(natal, "mercury");
  const mars = placement(natal, "mars");
  const jupiter = placement(natal, "jupiter");
  const saturn = placement(natal, "saturn");
  const timed = natal.houses !== undefined;
  const chapters = [
    [
      "MC",
      "Vocação e direção pública",
      timed
        ? `Seu Meio do Céu em ${zodiacPlacement(natal.houses?.midheaven ?? 0).sign} orienta a construção de reputação. Sol em ${sun.sign} busca autoria ${expression(sun.sign)}; Lua em ${moon.sign} mostra o ambiente emocional necessário para sustentar essa trajetória.`
        : "Sem hora conhecida, Meio do Céu e casas profissionais não podem ser calculados. A leitura preserva os potenciais planetários confiáveis.",
    ],
    [
      "II",
      "Renda e recursos",
      timed
        ? `A Casa 2 começa em ${houseSign(natal, 2)} e mostra como talentos, valores e recursos materiais procuram estabilidade. Ela orienta formas de gerar renda, sem prometer ganho ou escolher uma profissão única.`
        : "A Casa 2 exige hora conhecida. Informe-a nas configurações para completar a leitura de renda e recursos.",
    ],
    [
      "VI",
      "Rotina, técnica e serviço",
      timed
        ? `A Casa 6 começa em ${houseSign(natal, 6)} e descreve o cotidiano que transforma capacidade em ofício: método, aperfeiçoamento, colaboração e cuidado com o ritmo de trabalho.`
        : "A Casa 6 exige hora conhecida. Mercúrio e Saturno ainda mostram estilo de aprendizagem e disciplina.",
    ],
    [
      "X",
      "Carreira e reconhecimento",
      timed
        ? `A Casa 10 começa em ${houseSign(natal, 10)} e revela a forma de assumir responsabilidade e visibilidade ao longo do tempo.`
        : "A Casa 10 e o Meio do Céu permanecem indisponíveis sem hora conhecida.",
    ],
    [
      "☿",
      "Aptidões intelectuais",
      `Mercúrio em ${mercury.sign} aprende e comunica ${expression(mercury.sign)}. Favorece atividades em que essa linguagem possa resolver problemas, conectar pessoas ou organizar conhecimento.`,
    ],
    [
      "♂",
      "Execução e iniciativa",
      `Marte em ${mars.sign} age ${expression(mars.sign)}. É uma força para começar, competir e defender prioridades; o ponto de atenção é não confundir urgência com direção.`,
    ],
    [
      "♃",
      "Oportunidades de expansão",
      `Júpiter em ${jupiter.sign} cresce ${expression(jupiter.sign)}. Redes, estudo e experiências ampliam possibilidades quando existe critério para selecionar promessas.`,
    ],
    [
      "♄",
      "Pontos fortes construídos e desafios",
      `Saturno em ${saturn.sign} transforma limite em competência ${expression(saturn.sign)}. Pode começar como cobrança ou medo de falhar, mas amadurece em rigor, consistência e autoridade conquistada.`,
    ],
  ] as const;
  const readings = [
    ...placementReadings(
      natal,
      ["sun", "mercury", "mars", "jupiter", "saturn"],
      "No Mapa Profissional, esta função ajuda a compreender autoria, raciocínio, execução, expansão e maturidade no trabalho.",
    ),
    ...houseReadings(
      natal,
      [2, 6, 10, 11],
      "Na vida profissional, esta casa localiza recursos, rotina, direção pública ou redes.",
    ),
  ];
  return (
    <>
      <ChapterCollection
        eyebrow="Mapa Profissional"
        title="Vocação é uma direção cultivada, não um cargo predestinado."
        intro="Este estudo identifica ambientes, habilidades e modos de trabalho em que seus potenciais podem se desenvolver. Ele não prescreve uma única profissão e não usa regras diferentes conforme gênero."
        chapters={chapters}
      />
      <ImmersiveReport
        title="Relatório de vocação, trabalho e recursos"
        intro="A leitura conecta potencial a ambientes e práticas: como você pensa, executa, aprende, sustenta rotina, constrói reputação e participa de redes. Use-a para formular hipóteses profissionais e testá-las na realidade."
        readings={readings}
      />
    </>
  );
}

function ChapterCollection({
  eyebrow,
  title,
  intro,
  chapters,
}: Readonly<{
  eyebrow: string;
  title: string;
  intro: string;
  chapters: ReadonlyArray<readonly [string, string, string]>;
}>): React.JSX.Element {
  return (
    <section className="editorial-module" aria-label={eyebrow}>
      <header>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p>{intro}</p>
      </header>
      <div className="editorial-module-grid">
        {chapters.map(([glyph, chapterTitle, text]) => (
          <article key={chapterTitle}>
            <span aria-hidden="true">{glyph}</span>
            <h2>{chapterTitle}</h2>
            <p>{text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export function AnnualGuideView({
  profile,
}: Readonly<{ profile: ProfileRecord }>): React.JSX.Element {
  const year = new Date().getFullYear();
  const [guide, setGuide] = useState<PlanetaryReturnResponse>();
  const [status, setStatus] = useState<"awaiting" | "loading" | "ready" | "error">("awaiting");
  const [birthdayCity, setBirthdayCity] = useState("");
  const [places, setPlaces] = useState<PlaceCandidate[]>([]);
  const [returnPlace, setReturnPlace] = useState<PlaceCandidate>();
  useEffect(() => {
    if (returnPlace === undefined) return;
    const controller = new AbortController();
    const query = new URLSearchParams({
      kind: "solar",
      year: String(year),
      latitude: String(returnPlace.latitude),
      longitude: String(returnPlace.longitude),
      timezone: returnPlace.timezone,
    });
    void fetch(`/api/profiles/${profile.id}/returns?${query.toString()}`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        const parsed = planetaryReturnResponseSchema.safeParse(await response.json());
        if (!response.ok || !parsed.success) throw new Error("solar_return_failed");
        setGuide(parsed.data);
        setStatus("ready");
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setStatus("error");
      });
    return () => controller.abort();
  }, [profile.id, returnPlace, year]);
  async function searchBirthdayCity(): Promise<void> {
    setStatus("loading");
    try {
      const response = await fetch(`/api/geocoding?q=${encodeURIComponent(birthdayCity)}`);
      const parsed = geocodingResponseSchema.safeParse(await response.json());
      if (!response.ok || !parsed.success) throw new Error("geocoding_failed");
      setPlaces(parsed.data.places);
      setStatus("awaiting");
    } catch {
      setStatus("error");
    }
  }
  const solarReturn = guide?.returnChart;
  const sun = placement(profile.chart.natal, "sun");
  const annualSun = returnPlacement(solarReturn, "sun", profile.chart.natal);
  const annualMoon = returnPlacement(solarReturn, "moon", profile.chart.natal);
  const annualMercury = returnPlacement(solarReturn, "mercury", profile.chart.natal);
  const annualVenus = returnPlacement(solarReturn, "venus", profile.chart.natal);
  const annualMars = returnPlacement(solarReturn, "mars", profile.chart.natal);
  const jupiter = returnPlacement(solarReturn, "jupiter", profile.chart.natal);
  const saturn = returnPlacement(solarReturn, "saturn", profile.chart.natal);
  const annualUranus = returnPlacement(solarReturn, "uranus", profile.chart.natal);
  const ascendant =
    solarReturn === undefined ? undefined : zodiacPlacement(solarReturn.houses.ascendant);
  const midheaven =
    solarReturn === undefined ? undefined : zodiacPlacement(solarReturn.houses.midheaven);
  let returnStatus: React.JSX.Element;
  if (status === "awaiting") {
    returnStatus = (
      <p className="module-empty">
        Escolha a cidade onde passou ou passará seu aniversário de {year}.
      </p>
    );
  } else if (status === "loading") {
    returnStatus = (
      <p className="module-empty">Calculando o instante exato da sua Revolução Solar…</p>
    );
  } else if (status === "error" || solarReturn === undefined) {
    returnStatus = (
      <p className="module-empty">
        A Revolução Solar não abriu agora. O mapa natal permanece preservado; tente novamente.
      </p>
    );
  } else {
    returnStatus = (
      <div className="return-signature">
        <ReturnDatum
          label="Instante exato"
          value={formatReturnInstant(solarReturn.instant, profile.timezone)}
        />
        <ReturnDatum
          label="Ascendente do ano"
          value={`${ascendant?.sign} · ${ascendant?.signDegree.toFixed(2)}°`}
        />
        <ReturnDatum
          label="Meio do Céu do ano"
          value={`${midheaven?.sign} · ${midheaven?.signDegree.toFixed(2)}°`}
        />
        <ReturnDatum label="Precisão" value={`orbe ${solarReturn.orb.toFixed(5)}°`} />
      </div>
    );
  }
  return (
    <section className="editorial-module" aria-labelledby="annual-guide-title">
      <header>
        <p className="eyebrow">Guia astrológico · {year}</p>
        <h1 id="annual-guide-title">Um ano para orientar, não aprisionar.</h1>
        <p>
          A Revolução Solar localiza o instante exato em que o Sol retorna ao seu grau natal em{" "}
          {sun.sign} e ergue um novo mapa para o local cadastrado. Esse céu descreve as ênfases
          entre um aniversário e o próximo; as janelas diárias continuam no Horóscopo.
        </p>
      </header>
      <section className="solar-return-location" aria-labelledby="solar-return-location-title">
        <div>
          <p className="eyebrow">Local do aniversário</p>
          <h2 id="solar-return-location-title">Onde começa o seu novo ano pessoal?</h2>
          <p>
            A cidade altera Ascendente e casas da Revolução Solar. Seu mapa natal não muda; este
            local vale somente para a análise anual.
          </p>
        </div>
        <div>
          <label htmlFor="birthday-city">Cidade onde passou ou passará o aniversário</label>
          <div className="search-row">
            <input
              id="birthday-city"
              value={birthdayCity}
              onChange={(event) => setBirthdayCity(event.target.value)}
            />
            <button
              type="button"
              className="quiet-button"
              disabled={birthdayCity.trim().length < 2 || status === "loading"}
              onClick={() => void searchBirthdayCity()}
            >
              Buscar cidade
            </button>
          </div>
          {places.length === 0 ? null : (
            <ul className="place-results">
              {places.map((place) => (
                <li key={`${place.latitude}-${place.longitude}`}>
                  <button
                    type="button"
                    onClick={() => {
                      setStatus("loading");
                      setReturnPlace(place);
                      setBirthdayCity(place.label);
                      setPlaces([]);
                    }}
                  >
                    {place.label}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
      {returnStatus}
      <div
        className="annual-compass"
        role="img"
        aria-label="Bússola anual de expansão, estrutura, relações e integração"
      >
        <div>
          <span>Expansão</span>
          <strong>{jupiter.sign}</strong>
        </div>
        <div>
          <span>Estrutura</span>
          <strong>{saturn.sign}</strong>
        </div>
        <div>
          <span>Direção</span>
          <strong>{annualSun.sign}</strong>
        </div>
        <div>
          <span>Integração</span>
          <strong>{ascendant?.sign ?? "Calculando"}</strong>
        </div>
      </div>
      <div className="editorial-module-grid annual-guide-chapters">
        <article>
          <span aria-hidden="true">☉</span>
          <p className="eyebrow">Identidade e propósito</p>
          <h2>O eixo que organiza o ano</h2>
          <p>
            O Sol anual retorna a {annualSun.sign} e renova a tarefa de expressar sua essência{" "}
            {expression(annualSun.sign)}. O Ascendente anual em{" "}
            {ascendant?.sign ?? "cálculo em andamento"} mostra a linguagem prática dessa travessia:
            a forma como você inicia, reage e se apresenta entre um aniversário e o próximo.
          </p>
        </article>
        <article>
          <span aria-hidden="true">☾</span>
          <p className="eyebrow">Casa, família e emoções</p>
          <h2>O que precisa de abrigo</h2>
          <p>
            A Lua anual em {annualMoon.sign} pede nutrição emocional {expression(annualMoon.sign)}.
            Mudanças de ritmo, intimidade e pertencimento precisam respeitar esse modo de processar
            experiências; ignorá-lo transforma cansaço em reatividade.
          </p>
        </article>
        <article>
          <span aria-hidden="true">♃</span>
          <p className="eyebrow">Dinheiro e oportunidades</p>
          <h2>Onde a vida quer crescer</h2>
          <p>
            Júpiter em {jupiter.sign} amplia redes, recursos e confiança quando você age{" "}
            {expression(jupiter.sign)}. A expansão é fértil quando existe critério: promessa,
            investimento ou convite precisa caber na estrutura real da sua vida.
          </p>
        </article>
        <article>
          <span aria-hidden="true">♄</span>
          <p className="eyebrow">Carreira e responsabilidade</p>
          <h2>O que o tempo pede para construir</h2>
          <p>
            Saturno em {saturn.sign} seleciona compromissos e evidencia limites{" "}
            {expression(saturn.sign)}. O Meio do Céu anual em{" "}
            {midheaven?.sign ?? "cálculo em andamento"} orienta visibilidade e vocação: reputação
            cresce pela coerência entre discurso, competência e entrega.
          </p>
        </article>
        <article>
          <span aria-hidden="true">☿</span>
          <p className="eyebrow">Ideias e estudos</p>
          <h2>Como a mente atravessa o ano</h2>
          <p>
            Mercúrio anual em {annualMercury.sign} favorece decisões, estudos e conversas{" "}
            {expression(annualMercury.sign)}. Revisar premissas antes de comunicar evita que
            velocidade se transforme em ruído.
          </p>
        </article>
        <article>
          <span aria-hidden="true">♀</span>
          <p className="eyebrow">Sua vida afetiva</p>
          <h2>Reciprocidade e valores</h2>
          <p>
            Vênus anual em {annualVenus.sign} reorganiza vínculos, prazer e escolhas materiais{" "}
            {expression(annualVenus.sign)}. O ano pergunta onde existe troca real e onde agradar
            encobre uma necessidade.
          </p>
        </article>
        <article>
          <span aria-hidden="true">♂</span>
          <p className="eyebrow">O guerreiro</p>
          <h2>Desejo que encontra ação</h2>
          <p>
            Marte anual em {annualMars.sign} impulsiona iniciativa {expression(annualMars.sign)}.
            Direcione intensidade para ações sustentáveis e reconheça conflito antes que ele se
            torne reação automática.
          </p>
        </article>
        <article>
          <span aria-hidden="true">♅</span>
          <p className="eyebrow">No caminho da evolução</p>
          <h2>O inesperado que liberta</h2>
          <p>
            Urano anual em {annualUranus.sign} abre espaço para reinvenção{" "}
            {expression(annualUranus.sign)}. Mudança fértil nasce de experimentação consciente, não
            de romper apenas para escapar do desconforto.
          </p>
        </article>
      </div>
      <div className="editorial-longform">
        <h2>Sua pergunta central para {year}</h2>
        <p>
          Como crescer sem abandonar a estrutura que sustenta sua vida? Júpiter anual em{" "}
          {jupiter.sign} convida a ampliar experiências {expression(jupiter.sign)}, enquanto Saturno
          em {saturn.sign} exige responsabilidade {expression(saturn.sign)}. A Lua anual em{" "}
          {annualMoon.sign} mostra que o campo emocional se reorganiza {expression(annualMoon.sign)}
          . O avanço acontece quando entusiasmo e compromisso deixam de competir.
        </p>
        <h2>Ritmo de revisão</h2>
        <p>
          Retorne a este guia no início de cada estação e compare a bússola natal com os trânsitos
          ativos. Registre o que começou, o que ganhou forma e o que perdeu sentido. Um guia anual é
          mais poderoso como prática de consciência do que como lista rígida de acontecimentos.
        </p>
        <h2>Quatro portais de acompanhamento</h2>
        <p>
          No primeiro trimestre após o aniversário, reconheça o tema e reduza dispersões. No
          segundo, teste escolhas no mundo concreto. No terceiro, revise relações, recursos e
          resultados. No quarto, encerre o que não deve atravessar o próximo retorno. Use os
          trânsitos diários para localizar as datas de ativação dentro de cada portal.
        </p>
      </div>
      {solarReturn === undefined ? null : (
        <ImmersiveReport
          title={`Revolução Solar ${year} · relatório de 20 capítulos`}
          intro="Os oito primeiros capítulos aprofundam as funções que organizam o ano; os doze seguintes percorrem cada campo da vida. Leia em conjunto com o mapa natal: a Revolução Solar descreve a ênfase entre aniversários, não substitui sua arquitetura de nascimento."
          readings={solarReturnReadings(solarReturn, profile.chart.natal)}
        />
      )}
      <section className="annual-calendar" aria-labelledby="annual-calendar-title">
        <p className="eyebrow">Datas-chave calculadas</p>
        <h2 id="annual-calendar-title">Eclipses e viradas retrógradas de {year}</h2>
        <p>
          A visibilidade dos eclipses considera o local deste mapa. Os contatos destacados com o
          mapa natal são calculados por conjunção, quadratura ou oposição e indicam janelas de maior
          ressonância pessoal — não acontecimentos inevitáveis.
        </p>
        <div className="annual-event-list">
          {(guide?.annualCalendar?.events ?? []).map((event) => (
            <article key={event.id}>
              <time dateTime={event.instant}>
                {formatEventDate(event.instant, profile.timezone)}
              </time>
              <div>
                <h3>{event.title}</h3>
                <p>{event.detail}</p>
                {event.natalContact === null ? null : (
                  <strong>
                    Toca seu {bodyName(event.natalContact.body)} natal por{" "}
                    {aspectName(event.natalContact.aspect)} · orbe{" "}
                    {event.natalContact.orb.toFixed(2)}°
                  </strong>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}

function ReturnDatum({
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

export function LunarCycleView({
  profile,
}: Readonly<{ profile: ProfileRecord }>): React.JSX.Element {
  const natalMoon = placement(profile.chart.natal, "moon");
  const phases = ["Lua nova", "Crescente", "Lua cheia", "Minguante"];
  return (
    <section className="editorial-module" aria-labelledby="lunar-cycle-title">
      <header>
        <p className="eyebrow">Ritual de quatro movimentos</p>
        <h1 id="lunar-cycle-title">Ciclo Lunar</h1>
        <p>
          Com a Lua natal em {natalMoon.sign}, você processa mudanças {expression(natalMoon.sign)}.
          O ciclo mensal oferece quatro momentos para iniciar, sustentar, revelar e liberar — não
          como obrigação, mas como um calendário de escuta emocional.
        </p>
      </header>
      <div className="lunar-phase-track" aria-label="Quatro fases principais do ciclo lunar">
        {phases.map((phase, index) => (
          <article key={phase}>
            <div className={`lunar-phase lunar-phase-${index}`} aria-hidden="true" />
            <span>0{index + 1}</span>
            <h2>{phase}</h2>
            <p>{lunarPhaseMeaning(index)}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function PlacementChapter({
  glyph,
  title,
  value,
  body,
}: Readonly<{
  glyph: string;
  title: string;
  value: ReturnType<typeof placement>;
  body: "moon" | "venus" | "mars";
}>): React.JSX.Element {
  const opening = {
    moon: "Seu coração se abre",
    venus: "Seu afeto floresce",
    mars: "Seu desejo desperta",
  }[body];
  const guidance = {
    moon: "Você precisa sentir que sua vulnerabilidade será recebida antes de baixar as defesas.",
    venus: "Reciprocidade aparece quando beleza, valor e presença deixam de ser apenas promessa.",
    mars: "A iniciativa ganha potência quando existe liberdade para desejar, escolher e também ouvir limites.",
  }[body];
  return (
    <article>
      <span aria-hidden="true">{glyph}</span>
      <p className="eyebrow">
        {value.sign} · {value.signDegree.toFixed(2)}°
      </p>
      <h2>{title}</h2>
      <p>
        {opening} {expression(value.sign)}. {guidance}
      </p>
    </article>
  );
}

function placement(chart: Natal, body: string): ReturnType<typeof zodiacPlacement> {
  const found = chart.planets.find(({ id }) => id === body);
  return zodiacPlacement(found?.longitude ?? 0);
}

function placementReadings(chart: Natal, bodies: string[], context: string): EditorialReading[] {
  return bodies.flatMap((body) => {
    let longitude: number | undefined;
    if (body === "south_node") {
      const north = chart.planets.find(({ id }) => id === "true_node")?.longitude;
      longitude = north === undefined ? undefined : (north + 180) % 360;
    } else {
      longitude = chart.planets.find(({ id }) => id === body)?.longitude;
    }
    if (longitude === undefined) return [];
    const zodiac = zodiacPlacement(longitude);
    const house =
      chart.houses === undefined ? undefined : houseForLongitude(longitude, chart.houses.cusps);
    return [
      interpretPlacement({
        body,
        sign: zodiac.sign,
        degree: zodiac.signDegree,
        ...(house === undefined ? {} : { house }),
        context,
      }),
    ];
  });
}

function houseReadings(chart: Natal, houses: number[], context: string): EditorialReading[] {
  if (chart.houses === undefined) return [];
  return houses.flatMap((house) => {
    const longitude = chart.houses?.cusps[house - 1];
    if (longitude === undefined) return [];
    const zodiac = zodiacPlacement(longitude);
    return [interpretHouse({ house, sign: zodiac.sign, degree: zodiac.signDegree, context })];
  });
}

function solarReturnReadings(
  chart: PlanetaryReturnResponse["returnChart"],
  natal: Natal,
): EditorialReading[] {
  const planetChapters = [
    "sun",
    "moon",
    "mercury",
    "venus",
    "mars",
    "jupiter",
    "saturn",
    "uranus",
  ].flatMap((body) => {
    const planet = chart.planets.find(({ id }) => id === body);
    if (planet === undefined) return [];
    const zodiac = zodiacPlacement(planet.longitude);
    const natalPosition = placement(natal, body);
    return [
      interpretPlacement({
        body,
        sign: zodiac.sign,
        degree: zodiac.signDegree,
        house: houseForLongitude(planet.longitude, chart.houses.cusps),
        context: `Na Revolução Solar, esta posição anual dialoga com seu ${bodyName(body)} natal em ${natalPosition.sign}.`,
      }),
    ];
  });
  const houseChapters = Array.from({ length: 12 }, (_, index) => index + 1).map((house) => {
    const longitude = chart.houses.cusps[house - 1] ?? 0;
    const zodiac = zodiacPlacement(longitude);
    return interpretHouse({
      house,
      sign: zodiac.sign,
      degree: zodiac.signDegree,
      context:
        "Neste ano pessoal, observe acontecimentos e decisões deste campo ao longo dos quatro trimestres após o aniversário.",
    });
  });
  return [...planetChapters, ...houseChapters];
}

function returnPlacement(
  returnChart: PlanetaryReturnResponse["returnChart"] | undefined,
  body: string,
  natal: Natal,
): ReturnType<typeof zodiacPlacement> {
  const returned = returnChart?.planets.find(({ id }) => id === body);
  return returned === undefined ? placement(natal, body) : zodiacPlacement(returned.longitude);
}

function houseSign(chart: Natal, house: number): string {
  const longitude = chart.houses?.cusps[house - 1];
  return longitude === undefined ? "indisponível" : zodiacPlacement(longitude).sign;
}

function formatReturnInstant(instant: string, timezone: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: timezone,
  }).format(new Date(instant));
}

function formatEventDate(instant: string, timezone: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    timeZone: timezone,
  }).format(new Date(instant));
}

function bodyName(body: string): string {
  return astrologicalBodyName(body);
}

function aspectName(aspect: string): string {
  return astrologicalAspectName(aspect);
}

function elementBalance(chart: Natal): Array<{ name: string; percentage: number }> {
  const signs: Readonly<Record<string, "Fogo" | "Terra" | "Ar" | "Água">> = {
    Áries: "Fogo",
    Leão: "Fogo",
    Sagitário: "Fogo",
    Touro: "Terra",
    Virgem: "Terra",
    Capricórnio: "Terra",
    Gêmeos: "Ar",
    Libra: "Ar",
    Aquário: "Ar",
    Câncer: "Água",
    Escorpião: "Água",
    Peixes: "Água",
  };
  const counts = new Map<string, number>([
    ["Fogo", 0],
    ["Terra", 0],
    ["Ar", 0],
    ["Água", 0],
  ]);
  for (const planet of chart.planets) {
    const element = signs[zodiacPlacement(planet.longitude).sign];
    if (element !== undefined) counts.set(element, (counts.get(element) ?? 0) + 1);
  }
  const total = Math.max(chart.planets.length, 1);
  return [...counts].map(([name, count]) => ({
    name,
    percentage: Math.round((count / total) * 100),
  }));
}

function expression(sign: string): string {
  const values: Readonly<Record<string, string>> = {
    Áries: "com coragem e iniciativa",
    Touro: "com presença, constância e segurança",
    Gêmeos: "pela palavra, curiosidade e troca",
    Câncer: "pelo cuidado, memória e pertencimento",
    Leão: "com criatividade, calor e expressão",
    Virgem: "por discernimento, prática e aprimoramento",
    Libra: "pela reciprocidade, beleza e negociação",
    Escorpião: "com profundidade, intimidade e transformação",
    Sagitário: "pela verdade, liberdade e busca de sentido",
    Capricórnio: "com responsabilidade, estratégia e tempo",
    Aquário: "pela autonomia, originalidade e visão coletiva",
    Peixes: "com sensibilidade, imaginação e compaixão",
  };
  return values[sign] ?? "pelas qualidades desse signo";
}

function lunarPhaseMeaning(index: number): string {
  return (
    [
      "Plante uma intenção simples e honesta. A escuridão fértil favorece escuta antes da exposição.",
      "Escolha ações que alimentem o que começou. Crescer também exige ajuste, repetição e coragem para corrigir a rota.",
      "Observe o que ficou visível. A culminação ilumina resultados, excessos e sentimentos que já não aceitam permanecer implícitos.",
      "Finalize, edite e devolva espaço. A fase minguante transforma experiência em aprendizado e prepara o próximo começo.",
    ][index] ?? ""
  );
}

function shadowMeaning(body: string, sign: string): string {
  const patterns: Readonly<Record<string, string>> = {
    sun: "Quando sua identidade se sente ameaçada, a vontade de ser reconhecido pode virar rigidez, orgulho ou necessidade de controlar a narrativa.",
    moon: "Quando não se sente seguro, seu campo emocional pode repetir antigas estratégias de proteção antes mesmo de verificar o que está acontecendo agora.",
    mercury:
      "Sob pressão, a mente pode usar explicações, silêncio, ironia ou excesso de argumentos para evitar uma verdade emocional mais simples.",
    venus:
      "O desejo de reciprocidade pode levar a agradar, idealizar ou medir o próprio valor pela resposta alheia, criando ressentimento onde faltou pedido claro.",
    mars: "A força de agir pode se tornar confronto, impaciência ou desejo reprimido. A tarefa é reconhecer raiva e vontade antes que elas escolham por você.",
  };
  return `${patterns[body] ?? "Um padrão inconsciente procura ser reconhecido."} Em ${sign}, esse mecanismo tende a operar ${expression(sign)}; a mesma qualidade, quando consciente, devolve escolha e potência.`;
}
