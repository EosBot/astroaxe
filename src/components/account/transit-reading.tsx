"use client";

import { useEffect, useState } from "react";

import { astrologicalAspectName, astrologicalBodyName } from "@/domain/astrology/labels";

import { shadowTransitContent } from "@/lib/shadow-horoscope/transit-content";
import {
  transitReadingResponseSchema,
  type TransitReadingResponse,
} from "@/lib/transits/interpretations";

type ReadingStatus = "loading" | "ready" | "empty" | "error";
type DisplayableAspect = {
  transitingBody: string;
  natalBody: string;
  type: string;
  orb: number;
  applying: boolean;
};

export function TransitReading({
  profileId,
  timezone,
  variant = "standard",
}: Readonly<{
  profileId: string;
  timezone: string;
  variant?: "standard" | "shadow";
}>): React.JSX.Element {
  const [requestVersion, setRequestVersion] = useState(0);
  const [reading, setReading] = useState<TransitReadingResponse>();
  const [status, setStatus] = useState<ReadingStatus>("loading");
  const today = dateInTimezone(timezone);
  const earliestDate = shiftIsoDate(today, -366);
  const latestDate = shiftIsoDate(today, 90);
  const [date, setDate] = useState(today);

  useEffect(() => {
    const controller = new AbortController();

    void fetch(`/api/profiles/${profileId}/transits?date=${date}`, { signal: controller.signal })
      .then(async (response) => {
        const parsed = transitReadingResponseSchema.safeParse(await response.json());
        if (!response.ok || !parsed.success) throw new Error("transit_reading_failed");
        setReading(parsed.data);
        setStatus(parsed.data.interpretations.length === 0 ? "empty" : "ready");
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setStatus("error");
      });

    return () => controller.abort();
  }, [date, profileId, requestVersion]);

  const dateNavigation = (
    <nav className="transit-date-navigation" aria-label="Histórico do Tempo do Céu">
      <button
        type="button"
        className="quiet-button"
        disabled={date <= earliestDate}
        onClick={() => setDate((current) => shiftIsoDate(current, -1))}
      >
        Dia anterior
      </button>
      <label>
        <span>Data da leitura</span>
        <input
          type="date"
          min={earliestDate}
          max={latestDate}
          value={date}
          onChange={(event) => {
            if (event.target.value !== "") setDate(event.target.value);
          }}
        />
      </label>
      <button
        type="button"
        className="quiet-button"
        disabled={date >= latestDate}
        onClick={() => setDate((current) => shiftIsoDate(current, 1))}
      >
        Dia seguinte
      </button>
      <button
        type="button"
        className="text-button"
        disabled={date === today}
        onClick={() => setDate(today)}
      >
        Voltar para hoje
      </button>
    </nav>
  );

  if (status === "loading")
    return (
      <section className="transit-reading transit-reading-state" aria-live="polite">
        {dateNavigation}
        <p className="eyebrow">Tempo do Céu · {formatReadingDate(date)}</p>
        <h3>Localizando o tema mais nítido de hoje…</h3>
      </section>
    );

  if (status === "error")
    return (
      <section className="transit-reading transit-reading-state" aria-live="polite">
        {dateNavigation}
        <p className="eyebrow">Tempo do Céu</p>
        <h3>A leitura diária não abriu.</h3>
        <p>O mapa permanece preservado. Tente carregar novamente.</p>
        <button
          type="button"
          className="quiet-button"
          onClick={() => {
            setStatus("loading");
            setReading(undefined);
            setRequestVersion((current) => current + 1);
          }}
        >
          Carregar novamente
        </button>
      </section>
    );

  const interpretation = reading?.interpretations[0];
  if (status === "empty" || interpretation === undefined || reading === undefined) {
    const strongest = reading?.snapshot.aspects[0];
    return (
      <section className="transit-reading transit-reading-state">
        {dateNavigation}
        <p className="eyebrow">Tempo do Céu · {formatReadingDate(date)}</p>
        <h3>O céu foi calculado; a leitura editorial ainda não existe.</h3>
        <p>
          {strongest
            ? describeAspect(strongest)
            : "Nenhum aspecto principal entrou no orbe configurado para esta data."}
        </p>
        <small>O AstroAxe não improvisa interpretações quando o texto revisado está ausente.</small>
      </section>
    );
  }

  const { content, transit } = interpretation;
  const displayContent = variant === "shadow" ? shadowTransitContent(transit) : content;
  const window = reading?.snapshot.windows.find(
    (candidate) =>
      candidate.transitingBody === transit.transitingBody &&
      candidate.natalBody === transit.natalBody &&
      candidate.type === transit.type,
  );
  return (
    <section
      className="transit-reading"
      data-variant={variant}
      aria-labelledby={
        variant === "shadow" ? "shadow-transit-reading-title" : "transit-reading-title"
      }
    >
      {dateNavigation}
      <header className="transit-reading-header">
        <div>
          <p className="eyebrow">Tempo do Céu · {formatReadingDate(date)}</p>
          <h3 id={variant === "shadow" ? "shadow-transit-reading-title" : "transit-reading-title"}>
            {displayContent.title}
          </h3>
          <p>{reading.interpretations.length} influências ativas nesta data</p>
        </div>
        <span className="transit-intensity">
          {Math.round(transit.relativeIntensity * 100)}% <small>de proximidade ao pico</small>
        </span>
      </header>

      {window ? (
        <dl className="transit-window" aria-label="Janela deste trânsito">
          <div>
            <dt>Início</dt>
            <dd>{formatWindowInstant(window.startsAt, timezone)}</dd>
          </div>
          <div data-peak="true">
            <dt>Pico</dt>
            <dd>{formatWindowInstant(window.peaksAt, timezone)}</dd>
          </div>
          <div>
            <dt>Fim</dt>
            <dd>{formatWindowInstant(window.endsAt, timezone)}</dd>
          </div>
        </dl>
      ) : null}

      <div className="meridian-reading">
        <article>
          <span>Agora</span>
          <p>{displayContent.opening}</p>
        </article>
        <article>
          <span>Por quê</span>
          <p>{displayContent.technicalWhy}</p>
          <small>{describeAspect(transit)}</small>
        </article>
        <article>
          <span>Como trabalhar</span>
          <p>{displayContent.deepening}</p>
          <blockquote>{displayContent.reflectionPrompt}</blockquote>
          <p className="transit-practice">Prática possível: {displayContent.practice}</p>
        </article>
      </div>

      <footer className="transit-attribution">
        <span>
          {content.generationMethod === "AI_ASSISTED" ? "Texto assistido por IA" : "Texto humano"}
        </span>
        <span>Autoria: {content.author.displayName}</span>
        <span>Revisão: {content.reviewer.displayName}</span>
      </footer>

      {reading.interpretations.length > 1 ? (
        <section className="transit-feed" aria-labelledby="other-transits-title">
          <div className="transit-feed-heading">
            <p className="eyebrow">Outros ciclos no seu mapa</p>
            <h4 id="other-transits-title">
              Mais {reading.interpretations.length - 1}{" "}
              {reading.interpretations.length === 2 ? "leitura ativa" : "leituras ativas"}
            </h4>
          </div>
          {reading.interpretations.slice(1).map((item) => {
            const itemContent =
              variant === "shadow" ? shadowTransitContent(item.transit) : item.content;
            const itemWindow = reading.snapshot.windows.find(
              (candidate) =>
                candidate.transitingBody === item.transit.transitingBody &&
                candidate.natalBody === item.transit.natalBody &&
                candidate.type === item.transit.type,
            );
            return (
              <details
                key={`${item.transit.transitingBody}-${item.transit.natalBody}-${item.transit.type}`}
              >
                <summary>
                  <span>{itemContent.title}</span>
                  <small>{classifyWindow(itemWindow, reading.snapshot.instant)}</small>
                </summary>
                <div className="transit-feed-body">
                  <p>{itemContent.opening}</p>
                  <p>{itemContent.deepening}</p>
                  <p className="transit-technical">{itemContent.technicalWhy}</p>
                  <blockquote>{itemContent.reflectionPrompt}</blockquote>
                  <p className="transit-practice">Prática possível: {itemContent.practice}</p>
                  <small>
                    {item.content.generationMethod === "AI_ASSISTED"
                      ? "Texto assistido por IA"
                      : "Texto humano"}
                    {` · Autoria: ${item.content.author.displayName} · Revisão: ${item.content.reviewer.displayName}`}
                  </small>
                </div>
              </details>
            );
          })}
        </section>
      ) : null}
    </section>
  );
}

function dateInTimezone(timezone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const values = new Map(parts.map((part) => [part.type, part.value]));
  return `${values.get("year")}-${values.get("month")}-${values.get("day")}`;
}

function shiftIsoDate(date: string, days: number): string {
  const shifted = new Date(`${date}T12:00:00.000Z`);
  shifted.setUTCDate(shifted.getUTCDate() + days);
  return shifted.toISOString().slice(0, 10);
}

function formatReadingDate(date: string): string {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "long", timeZone: "UTC" }).format(
    new Date(`${date}T12:00:00.000Z`),
  );
}

function formatWindowInstant(instant: string, timezone: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: timezone,
  }).format(new Date(instant));
}

function classifyWindow(
  window: TransitReadingResponse["snapshot"]["windows"][number] | undefined,
  referenceInstant: string,
): "Mudança recente" | "Tendência ativa" | "Longo prazo" | "Terminando" {
  if (window === undefined) return "Tendência ativa";
  const startsAt = Date.parse(window.startsAt);
  const endsAt = Date.parse(window.endsAt);
  const duration = endsAt - startsAt;
  if (duration >= 90 * 24 * 60 * 60 * 1000) return "Longo prazo";
  const progress = (Date.parse(referenceInstant) - startsAt) / duration;
  if (progress <= 0.2) return "Mudança recente";
  if (progress >= 0.8) return "Terminando";
  return "Tendência ativa";
}

function describeAspect(aspect: DisplayableAspect): string {
  const movement = aspect.applying ? "se aproximando da exatidão" : "se afastando da exatidão";
  const aspectName = astrologicalAspectName(aspect.type);
  const transitingBody = astrologicalBodyName(aspect.transitingBody);
  const natalBody = astrologicalBodyName(aspect.natalBody);
  return `${transitingBody} em ${aspectName} com ${natalBody}, orbe de ${aspect.orb.toFixed(2)}°, ${movement}.`;
}
