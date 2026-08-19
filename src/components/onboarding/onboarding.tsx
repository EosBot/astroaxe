"use client";

import { useState } from "react";

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

  if (result !== undefined)
    return (
      <div className="experience-grid">
        <OrbitStory step={4} />
        <ChartReveal name={displayName} result={result} />
      </div>
    );

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
  return (
    <section className="orbit-story" aria-labelledby="astroaxe-title">
      <div className="story-copy">
        <p className="eyebrow">Astrologia calculada · cultura contextualizada</p>
        <h1 id="astroaxe-title">O céu revela movimentos.</h1>
        <p>
          Quatro coordenadas abrem seu primeiro mapa. Nenhuma conta ou plano antes do resultado.
        </p>
      </div>
      <div className="system-map" aria-label={`Progresso: ${Math.min(step + 1, 4)} de 4`}>
        <span className="system-sun" aria-hidden="true">
          0°
        </span>
        {STEPS.map((label, index) => {
          const state = getOrbitNodeState(index, step);
          return (
            <span className={`orbit-node orbit-node-${index + 1}`} data-state={state} key={label}>
              <i aria-hidden="true" />
              {label}
            </span>
          );
        })}
      </div>
      <p className="story-footnote">
        Precisão declarada · fontes rastreáveis · sem determinações religiosas
      </p>
    </section>
  );
}

function getOrbitNodeState(index: number, step: number): "complete" | "active" | "pending" {
  if (index < step) return "complete";
  if (index === step) return "active";
  return "pending";
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
  const featured = result.chart.planets.filter((planet) => ["sun", "moon"].includes(planet.id));
  return (
    <section className="reveal" aria-live="polite">
      <div className="celestial-seal" aria-hidden="true">
        <span>0°</span>
      </div>
      <p className="eyebrow">Seu primeiro céu</p>
      <h2>Seu céu se abre assim, {name}.</h2>
      <p className="quality-note">
        {result.chart.mode === "timed"
          ? "Hora informada · casas e Ascendente disponíveis"
          : "Hora desconhecida · leitura sem casas e Ascendente"}
      </p>
      <div className="placement-grid">
        {featured.map((planet) => (
          <article key={planet.id}>
            <span>{planet.id === "sun" ? "Sol" : "Lua"}</span>
            <strong>{planet.sign}</strong>
            <small>{planet.signDegree.toFixed(2)}° no signo</small>
          </article>
        ))}
        {result.chart.houses ? (
          <article>
            <span>Ascendente</span>
            <strong>{zodiacName(result.chart.houses.ascendant)}</strong>
            <small>{result.chart.houses.ascendant.toFixed(2)}°</small>
          </article>
        ) : null}
      </div>
      <p className="cultural-note">
        As futuras afinidades culturais serão narrativas simbólicas do AstroAxe. Elas não determinam
        nem confirmam Orixá, Odù ou vínculo iniciático.
      </p>
    </section>
  );
}

function zodiacName(longitude: number): string {
  const signs = [
    "Áries",
    "Touro",
    "Gêmeos",
    "Câncer",
    "Leão",
    "Virgem",
    "Libra",
    "Escorpião",
    "Sagitário",
    "Capricórnio",
    "Aquário",
    "Peixes",
  ];
  return signs[Math.floor(longitude / 30) % 12] ?? "—";
}
