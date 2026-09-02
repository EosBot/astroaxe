import { Temporal } from "@js-temporal/polyfill";
import { julianDay } from "caelus";
import type { Metadata } from "next";
import Link from "next/link";
import { z } from "zod";

import { evaluateElections } from "@/domain/astrology/elections";
import { seededElectionProfiles } from "@/domain/astrology/elections/profiles";
import { buildPublicTimingReading } from "@/domain/astrology/elections/public-observation";
import { resolvePlanetaryHourAt } from "@/domain/astrology/planetary-hours";

export const metadata: Metadata = {
  title: "Tempo cerimonial",
  description:
    "Regente do dia e da hora, e o que critérios de tradições independentes pedem de um momento — lado a lado, sem conciliar.",
  alternates: { canonical: "/tempo-cerimonial" },
  openGraph: {
    type: "website",
    title: "Tempo cerimonial — AstroAxe",
    description:
      "Regente do dia e da hora, e o que critérios de tradições independentes pedem de um momento.",
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
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<React.JSX.Element> {
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

  return (
    <main id="conteudo-principal" className="observatory-shell methodology-shell">
      <article className="methodology-document">
        <header className="methodology-hero">
          <div>
            <p className="eyebrow">Instrumento · regência do momento</p>
            <h1>O que as regras pedem de um momento.</h1>
          </div>
          <p>
            Não existe pontuação universal de bom momento. Tradições independentes definem critérios
            diferentes, e quando discordam a discordância é o dado — por isso aparecem lado a lado,
            sem média e sem vencedor. Escolher continua sendo de quem opera. O método que sustenta
            estas leituras está em <Link href="/metodologia">Como este método funciona</Link>.
          </p>
        </header>

        <form className="timing-form" method="get" action="/tempo-cerimonial">
          <p className="eyebrow">Momento e lugar</p>
          <label htmlFor="instant">Instante, com fuso (ex.: 2026-06-21T15:00:00-03:00)</label>
          <input id="instant" name="instant" defaultValue={single("instant") ?? ""} required />
          <label htmlFor="latitude">Latitude</label>
          <input id="latitude" name="latitude" defaultValue={single("latitude") ?? ""} required />
          <label htmlFor="longitude">Longitude</label>
          <input
            id="longitude"
            name="longitude"
            defaultValue={single("longitude") ?? ""}
            required
          />
          <button type="submit">Ver a leitura</button>
        </form>

        {reading === null ? (
          <section className="methodology-section" aria-labelledby="timing-empty">
            <h2 id="timing-empty">Informe um instante e um lugar.</h2>
            <p>
              A leitura precisa dos três: instante com fuso declarado, latitude e longitude. Sem
              fuso não há como saber que hora do dia é ali, e inventar um seria pior que não
              responder.
            </p>
          </section>
        ) : (
          <>
            <section className="methodology-section" aria-labelledby="timing-moment">
              <p className="eyebrow">Regência do momento</p>
              <h2 id="timing-moment">A hora que este instante ocupa.</h2>
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
              <p className="eyebrow">Critérios consultados</p>
              <h2 id="timing-sources">As regras, lado a lado.</h2>
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
          <p className="eyebrow">O que não vira regra</p>
          <h2 id="timing-gaps">Nem todo critério consultado vira regra de momento.</h2>
          <p>
            Parte do material consultado descreve como construir um trabalho depois que o momento já
            foi escolhido, e não como escolhê-lo. Forçar esse tipo de instrução a virar critério de
            eleição deturparia o que ela diz, então ela fica de fora — e o registro interno guarda o
            motivo, para que a decisão possa ser revista.
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
