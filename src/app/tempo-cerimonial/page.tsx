import { Temporal } from "@js-temporal/polyfill";
import { julianDay } from "caelus";
import type { Metadata } from "next";
import Link from "next/link";
import { z } from "zod";

import { CeremonialMomentForm } from "@/components/site/ceremonial-moment-form";
import { evaluateElections } from "@/domain/astrology/elections";
import { seededElectionProfiles } from "@/domain/astrology/elections/profiles";
import { buildPublicTimingReading } from "@/domain/astrology/elections/public-observation";
import { resolvePlanetaryHourAt } from "@/domain/astrology/planetary-hours";

export const metadata: Metadata = {
  title: "Tempo cerimonial",
  description:
    "Descubra em que hora planetária um instante cai e como critérios de tradições que discordam entre si julgam esse momento.",
  alternates: { canonical: "/tempo-cerimonial" },
  openGraph: {
    type: "website",
    title: "Tempo cerimonial — AstroAxe",
    description:
      "Em que hora planetária um instante cai, e como critérios que discordam entre si julgam esse momento.",
    url: "/tempo-cerimonial",
  },
};

const querySchema = z
  .object({
    instant: z.iso.datetime({ offset: true }),
    latitude: z.coerce.number().min(-90).max(90),
    longitude: z.coerce.number().min(-180).max(180),
    sunLongitude: z.coerce.number().min(0).max(360).optional(),
    moonLongitude: z.coerce.number().min(0).max(360).optional(),
  })
  .strict();

export default async function CeremonialTimingPage({
  searchParams,
}: Readonly<{
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}>): Promise<React.JSX.Element> {
  const query = await searchParams;
  const single = (key: string): string | undefined => {
    const value = query[key];
    return Array.isArray(value) ? value[0] : value;
  };
  const parsed = querySchema.safeParse({
    instant: single("instant"),
    latitude: single("latitude"),
    longitude: single("longitude"),
    ...(single("sunLongitude") === undefined ? {} : { sunLongitude: single("sunLongitude") }),
    ...(single("moonLongitude") === undefined ? {} : { moonLongitude: single("moonLongitude") }),
  });

  const reading = parsed.success ? readingFor(parsed.data) : null;
  // Hoje, em ISO, só para o formulário abrir num dia plausível em vez de vazio.
  const defaultDate = Temporal.Now.plainDateISO().toString();

  return (
    <main id="conteudo-principal" className="observatory-shell methodology-shell">
      <article className="methodology-document">
        <header className="methodology-hero">
          <div>
            <p className="eyebrow">Instrumento</p>
            <h1>Que horas são, no relógio antigo?</h1>
          </div>
          <p>
            O relógio do celular conta as horas todas do mesmo tamanho. As tradições antigas faziam
            diferente: dividiam a luz e o escuro em pedaços, e davam a cada pedaço um planeta
            regente. Diga um instante e um lugar, e mostramos em que hora ele caiu — e o que
            tradições que nunca se falaram pedem de um momento como esse. Quando elas discordam, a
            discordância fica à vista, porque ela também é resposta. Ninguém aqui vai dizer se a
            hora é boa: isso depende do que você pretende, e disso só você sabe. Se quiser ver como
            tudo isso é apurado, está em <Link href="/metodologia">Como este método funciona</Link>.
          </p>
        </header>

        <CeremonialMomentForm defaultDate={defaultDate} defaultTime="12:00" />

        {reading === null ? (
          <section className="methodology-section" aria-labelledby="timing-empty">
            <h2 id="timing-empty">Comece dizendo quando, e onde.</h2>
            <p>
              Escolha a cidade, o dia e a hora — a hora do relógio de lá mesmo, sem conta nenhuma. O
              lugar pesa mais do que parece: o mesmo horário cai em pedaços diferentes do céu
              conforme onde você está, porque as horas antigas nascem do nascer e do pôr do sol
              daquele ponto do mundo. Por isso perguntamos onde, em vez de adivinhar.
            </p>
          </section>
        ) : (
          <>
            <section className="methodology-section" aria-labelledby="timing-moment">
              <p className="eyebrow">Regência</p>
              <h2 id="timing-moment">Onde o seu instante caiu.</h2>
              {reading.moment === null ? (
                <p>{reading.methodLabel}</p>
              ) : (
                <>
                  <dl className="method-detail-list">
                    <div>
                      <dt>Regente do dia</dt>
                      <dd>{reading.moment.dayRuler}</dd>
                    </div>
                    <div>
                      <dt>Regente da hora</dt>
                      <dd>{reading.moment.hourRuler}</dd>
                    </div>
                    <div>
                      <dt>Hora</dt>
                      <dd>
                        {reading.moment.hourNumber}ª {reading.moment.segmentLabel}
                      </dd>
                    </div>
                  </dl>
                  <p className="method-function-support">{reading.methodLabel}</p>
                </>
              )}
            </section>

            <section className="methodology-section" aria-labelledby="timing-sources">
              <p className="eyebrow">Lado a lado</p>
              <h2 id="timing-sources">O que cada tradição pede deste momento.</h2>
              <ol className="method-function-list">
                {reading.observations.map((observation) => (
                  <li key={observation.ruleId}>
                    <h3>{observation.ruleLabel}</h3>
                    <p className="method-function-question">{observation.ruleSummary}</p>
                    <p className="method-function-support" data-status={observation.status}>
                      {observation.statusLabel}
                    </p>
                    {observation.limitations.length === 0 ? null : (
                      <ul className="method-function-occupants">
                        {observation.limitations.map((limitation) => (
                          <li key={limitation}>
                            <span>{limitation}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ol>
              <p className="method-emphasis method-limit">{reading.disclaimer}</p>
            </section>
          </>
        )}

        <section className="methodology-section" aria-labelledby="timing-gaps">
          <p className="eyebrow">O que ficou de fora</p>
          <h2 id="timing-gaps">O que a gente escolheu não transformar em regra.</h2>
          <p>
            Boa parte do que se aprende sobre esses assuntos ensina como conduzir um trabalho depois
            que a hora já foi escolhida — e não como escolher a hora. São coisas diferentes.
            Espremer uma na outra faria a tradição dizer o que ela não disse, e é o tipo de erro que
            passa despercebido justamente porque soa convincente. Então fica de fora, com o motivo
            anotado, para que a decisão possa ser revista quando alguém souber mais do que sabemos
            hoje.
          </p>
        </section>
      </article>
    </main>
  );
}

function readingFor(input: z.infer<typeof querySchema>) {
  const utc = Temporal.Instant.from(input.instant).toZonedDateTimeISO("UTC");
  const jdUt = julianDay(utc.year, utc.month, utc.day, utc.hour, utc.minute, utc.second);
  const moment = {
    jdUt,
    latitude: input.latitude,
    longitude: input.longitude,
    ...(input.sunLongitude === undefined ? {} : { sunLongitude: input.sunLongitude }),
    ...(input.moonLongitude === undefined ? {} : { moonLongitude: input.moonLongitude }),
  };

  return buildPublicTimingReading({
    resolution: resolvePlanetaryHourAt({
      jdUt,
      latitude: input.latitude,
      longitude: input.longitude,
    }),
    observations: evaluateElections({ profiles: [...seededElectionProfiles], moment }),
  });
}
