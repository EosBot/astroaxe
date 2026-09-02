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
            <p className="eyebrow">Instrumento</p>
            <h1>O mesmo instante, lido por critérios que discordam.</h1>
          </div>
          <p>
            Não existe nota universal de bom momento. Tradições independentes pedem coisas
            diferentes de um horário, e quando elas divergem a divergência é o dado — não um empate
            a ser desfeito. Aqui você vê o que cada critério exige e se este instante atende. A
            escolha continua sua. O método por trás está em{" "}
            <Link href="/metodologia">Como este método funciona</Link>.
          </p>
        </header>

        <form className="timing-form" method="get" action="/tempo-cerimonial">
          <p className="eyebrow">Momento e lugar</p>
          <label htmlFor="instant">Instante, com fuso — ex.: 2026-06-21T15:00:00-03:00</label>
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
          <button type="submit">Ler este instante</button>
        </form>

        {reading === null ? (
          <section className="methodology-section" aria-labelledby="timing-empty">
            <h2 id="timing-empty">Informe um instante e um lugar.</h2>
            <p>
              A leitura depende de três coisas: o instante com fuso declarado, a latitude e a
              longitude. O fuso não é detalhe — sem ele não dá para saber que hora do dia é naquele
              lugar, e um horário chutado seria pior que resposta nenhuma.
            </p>
          </section>
        ) : (
          <>
            <section className="methodology-section" aria-labelledby="timing-moment">
              <p className="eyebrow">Regência</p>
              <h2 id="timing-moment">A hora em que este instante cai.</h2>
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
              <p className="eyebrow">Critérios</p>
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
          <p className="eyebrow">O que ficou de fora</p>
          <h2 id="timing-gaps">Nem toda instrução é um critério de momento.</h2>
          <p>
            Parte do material lido ensina como conduzir um trabalho depois que a hora já foi
            escolhida — não como escolhê-la. Transformar isso em critério de momento faria a fonte
            dizer o que ela não diz. Fica de fora, e o motivo fica registrado, para que a decisão
            possa ser revista depois.
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
