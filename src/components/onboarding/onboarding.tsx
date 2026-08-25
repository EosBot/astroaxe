"use client";

import { useEffect, useRef, useState } from "react";

import { AccountPrompt } from "@/components/account/account-prompt";
import { CelestialObservatory3D } from "@/components/onboarding/celestial-observatory-3d";
import { NatalChartWheel } from "@/components/onboarding/natal-chart-wheel";

import {
  createMapResponseSchema,
  geocodingResponseSchema,
  type CreateMapResponse,
  type PlaceCandidate,
} from "@/lib/maps/contracts";

const STEPS = ["Nome", "Data", "Hora", "Local"] as const;

export function Onboarding(): React.JSX.Element {
  const state = useOnboardingState();
  const {
    step,
    displayName,
    setDisplayName,
    date,
    setDate,
    time,
    setTime,
    unknownTime,
    setUnknownTime,
    placeQuery,
    setPlaceQuery,
    places,
    place,
    setPlace,
    setPlaces,
    status,
    error,
    setError,
    result,
    setStep,
    searchPlaces,
    calculate,
  } = state;

  if (result !== undefined) return <ChartReveal name={displayName} result={result} />;

  const canContinue = canAdvance(step, { displayName, date, time, unknownTime, place });
  const primaryLabel = getPrimaryLabel(step, status);

  return (
    <div className="experience-grid" id="ceu">
      <OrbitStory step={step} />
      <form
        className="ritual-panel"
        aria-labelledby="onboarding-title"
        onSubmit={(event) => {
          event.preventDefault();
          if (step < 3 && canContinue) setStep((current) => current + 1);
          else if (step === 3 && place !== undefined) void calculate();
          else if (step === 3 && placeQuery.trim().length >= 2) void searchPlaces();
        }}
      >
        <div
          className="orbit-progress"
          aria-hidden="true"
          style={{ "--progress": `${(step + 1) * 25}%` } as React.CSSProperties}
        >
          <span>{step + 1}</span>
        </div>
        <p className="eyebrow">
          Etapa {step + 1} de 4 · {STEPS[step]}
        </p>

        <div className="step-stage" key={step}>
          {step === 0 ? (
            <Field
              title="Como podemos chamar você?"
              help="Um nome ou apelido basta. Ele não aparece em logs nem analytics."
            >
              <label htmlFor="displayName">Nome ou apelido</label>
              <input
                id="displayName"
                autoComplete="nickname"
                maxLength={100}
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder="Ex.: Lu, Ana Clara"
              />
            </Field>
          ) : null}
          {step === 1 ? (
            <Field
              title="Em que dia você nasceu?"
              help="Nesta versão, calculamos mapas a partir de 01/01/1900."
            >
              <label htmlFor="birthDate">Data de nascimento</label>
              <input
                id="birthDate"
                type="date"
                min="1900-01-01"
                value={date}
                onChange={(event) => setDate(event.target.value)}
              />
            </Field>
          ) : null}
          {step === 2 ? (
            <Field
              title="Você sabe a hora em que nasceu?"
              help="A hora permite calcular Ascendente e casas. Não inventamos esses dados quando ela é desconhecida."
            >
              <label htmlFor="birthTime">Hora de nascimento</label>
              <input
                id="birthTime"
                type="time"
                disabled={unknownTime}
                value={time}
                onChange={(event) => setTime(event.target.value)}
              />
              <label className="choice">
                <input
                  type="checkbox"
                  checked={unknownTime}
                  onChange={(event) => {
                    setUnknownTime(event.target.checked);
                    if (event.target.checked) setTime("");
                  }}
                />{" "}
                Não sei minha hora
              </label>
            </Field>
          ) : null}
          {step === 3 ? (
            <Field
              title="Onde você nasceu?"
              help="Busque apenas a cidade. Não precisamos do seu endereço."
            >
              <label htmlFor="place">Cidade de nascimento</label>
              <div className="search-row">
                <input
                  id="place"
                  role="combobox"
                  aria-autocomplete="list"
                  aria-expanded={places.length > 0}
                  aria-controls="place-options"
                  value={placeQuery}
                  onChange={(event) => {
                    setPlaceQuery(event.target.value);
                    setPlace(undefined);
                  }}
                  placeholder="Ex.: Salvador, Bahia"
                />
                <button
                  type="button"
                  className="quiet-button"
                  disabled={placeQuery.trim().length < 2 || status === "searching"}
                  onClick={searchPlaces}
                >
                  {status === "searching" ? "Buscando…" : "Buscar"}
                </button>
              </div>
              {places.length > 0 ? (
                <ul className="place-list" id="place-options" aria-label="Cidades encontradas">
                  {places.map((candidate) => (
                    <li key={`${candidate.latitude}-${candidate.longitude}`}>
                      <button
                        type="button"
                        aria-pressed={place?.label === candidate.label}
                        onClick={() => {
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
              ) : null}
            </Field>
          ) : null}
        </div>

        {error ? (
          <p className="form-error" role="alert">
            {error}
          </p>
        ) : null}
        <div className="form-actions">
          {step > 0 ? (
            <button
              type="button"
              className="quiet-button"
              onClick={() => {
                setStep((current) => current - 1);
                setError("");
              }}
            >
              Voltar
            </button>
          ) : (
            <span />
          )}
          <button
            type="submit"
            className="primary-button"
            disabled={!canContinue || status === "calculating"}
          >
            {primaryLabel}
          </button>
        </div>
      </form>
    </div>
  );
}

function OrbitStory({ step }: Readonly<{ step: number }>): React.JSX.Element {
  const { mapRef, ambientActive } = useAmbientMotion();
  return (
    <section className="orbit-story" aria-labelledby="astroaxe-title">
      <div className="story-copy">
        <p className="eyebrow">Astrologia calculada · leitura autoral brasileira</p>
        <h1 id="astroaxe-title">Veja seu céu. Entenda o que ele movimenta.</h1>
        <p>
          Seu mapa nasce de data, hora e lugar — não de um texto genérico para o seu signo. Informe
          seus dados e abra uma leitura que você pode explorar e conferir.
        </p>
      </div>
      <div
        ref={mapRef}
        className="system-map"
        data-ambient-active={ambientActive}
        data-step={step}
        aria-hidden="true"
      >
        <CelestialObservatory3D />
      </div>
      <p className="story-footnote">
        Precisão declarada · método versionado · seus dados sob seu controle
      </p>
    </section>
  );
}

function useAmbientMotion(): {
  mapRef: React.RefObject<HTMLDivElement | null>;
  ambientActive: boolean;
} {
  const mapRef = useRef<HTMLDivElement>(null);
  const [inViewport, setInViewport] = useState(true);
  const [pageVisible, setPageVisible] = useState(
    () => typeof document === "undefined" || document.visibilityState === "visible",
  );

  useEffect(() => {
    const handleVisibility = () => setPageVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", handleVisibility);

    const element = mapRef.current;
    if (element === null || typeof IntersectionObserver === "undefined") {
      return () => document.removeEventListener("visibilitychange", handleVisibility);
    }

    const observer = new IntersectionObserver(
      ([entry]) => setInViewport(entry?.isIntersecting ?? false),
      { threshold: 0.08 },
    );
    observer.observe(element);

    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  return { mapRef, ambientActive: inViewport && pageVisible };
}

function useOnboardingState() {
  const [step, setStep] = useState(0);
  const [displayName, setDisplayName] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [unknownTime, setUnknownTime] = useState(false);
  const [placeQuery, setPlaceQuery] = useState("");
  const [places, setPlaces] = useState<PlaceCandidate[]>([]);
  const [place, setPlace] = useState<PlaceCandidate>();
  const [status, setStatus] = useState<"idle" | "searching" | "calculating">("idle");
  const [error, setError] = useState("");
  const [result, setResult] = useState<CreateMapResponse>();

  async function searchPlaces(): Promise<void> {
    setError("");
    setStatus("searching");
    try {
      const response = await fetch(`/api/geocoding?q=${encodeURIComponent(placeQuery)}`);
      const parsed = geocodingResponseSchema.safeParse(await response.json());
      if (!response.ok || !parsed.success) throw new Error("geocoding_failed");
      setPlaces(parsed.data.places);
      if (parsed.data.places.length === 0)
        setError("Não encontramos essa cidade. Confira a grafia.");
    } catch {
      setError("A busca de cidades está temporariamente indisponível. Seus dados continuam aqui.");
    } finally {
      setStatus("idle");
    }
  }

  async function calculate(): Promise<void> {
    if (place === undefined) return setError("Escolha uma cidade da lista para continuar.");
    setStatus("calculating");
    setError("");
    try {
      const response = await fetch("/api/maps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName,
          date,
          time: unknownTime ? undefined : time,
          timePrecision: unknownTime ? "unknown" : "known",
          latitude: place.latitude,
          longitude: place.longitude,
          timezone: place.timezone,
          location: place.label,
          houseSystem: "placidus",
        }),
      });
      const parsed = createMapResponseSchema.safeParse(await response.json());
      if (!response.ok || !parsed.success) throw new Error("calculation_failed");
      setResult(parsed.data);
    } catch {
      setError("Não foi possível calcular agora. Tente novamente sem preencher tudo de novo.");
    } finally {
      setStatus("idle");
    }
  }

  return {
    step,
    setStep,
    displayName,
    setDisplayName,
    date,
    setDate,
    time,
    setTime,
    unknownTime,
    setUnknownTime,
    placeQuery,
    setPlaceQuery,
    places,
    setPlaces,
    place,
    setPlace,
    status,
    error,
    setError,
    result,
    searchPlaces,
    calculate,
  };
}

function canAdvance(
  step: number,
  values: Readonly<{
    displayName: string;
    date: string;
    time: string;
    unknownTime: boolean;
    place: PlaceCandidate | undefined;
  }>,
): boolean {
  switch (step) {
    case 0:
      return values.displayName.trim().length > 0;
    case 1:
      return values.date.length > 0;
    case 2:
      return values.unknownTime || values.time.length > 0;
    default:
      return values.place !== undefined;
  }
}

function getPrimaryLabel(step: number, status: "idle" | "searching" | "calculating"): string {
  if (status === "calculating") return "Posicionando os astros…";
  return step === 3 ? "Calcular meu céu" : "Continuar";
}

function Field({
  title,
  help,
  children,
}: Readonly<{
  title: string;
  help: string;
  children: React.ReactNode;
}>): React.JSX.Element {
  return (
    <div className="field-stack">
      <h2 id="onboarding-title">{title}</h2>
      <p>{help}</p>
      {children}
    </div>
  );
}

function ChartReveal({
  name,
  result,
}: Readonly<{
  name: string;
  result: CreateMapResponse;
}>): React.JSX.Element {
  const titleRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => titleRef.current?.focus(), []);
  return (
    <section className="natal-journey" aria-live="polite">
      <h2 ref={titleRef} tabIndex={-1} className="sr-only">
        Seu mapa natal, {name}
      </h2>
      <NatalChartWheel chart={result.chart} name={name} />
      <footer className="natal-journey-footer">
        <p className="cultural-note">
          Sua Tríade de Regências está disponível em Meu céu. Ela combina o mapa calculado com o
          método autoral AstroAxe e informa quando um papel permanece em aberto.{" "}
          <a href="/metodologia">Veja como funciona.</a>
        </p>
        <AccountPrompt profileId={result.profileId} />
      </footer>
    </section>
  );
}
