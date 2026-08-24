"use client";

import { useState } from "react";

import {
  createMapResponseSchema,
  geocodingResponseSchema,
  type PlaceCandidate,
} from "@/lib/maps/contracts";

interface SynastryMapFormProps {
  onCreated: (profileId: string) => Promise<void>;
  onCancel: () => void;
}

export function SynastryMapForm({
  onCreated,
  onCancel,
}: Readonly<SynastryMapFormProps>): React.JSX.Element {
  const [displayName, setDisplayName] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [unknownTime, setUnknownTime] = useState(false);
  const [placeQuery, setPlaceQuery] = useState("");
  const [place, setPlace] = useState<PlaceCandidate>();
  const [places, setPlaces] = useState<PlaceCandidate[]>([]);
  const [status, setStatus] = useState<"idle" | "searching" | "saving">("idle");
  const [message, setMessage] = useState("");

  async function searchPlaces(): Promise<void> {
    setStatus("searching");
    setMessage("");
    try {
      const response = await fetch(`/api/geocoding?q=${encodeURIComponent(placeQuery)}`);
      const parsed = geocodingResponseSchema.safeParse(await response.json());
      if (!response.ok || !parsed.success) throw new Error("search_failed");
      setPlaces(parsed.data.places);
      if (parsed.data.places.length === 0) setMessage("Nenhuma cidade encontrada.");
    } catch {
      setMessage("A busca de cidades está indisponível agora.");
    } finally {
      setStatus("idle");
    }
  }

  async function createProfile(): Promise<void> {
    if (place === undefined) return;
    setStatus("saving");
    setMessage("");
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
      if (!response.ok || !parsed.success) throw new Error("create_failed");
      await onCreated(parsed.data.profileId);
    } catch {
      setMessage("Não foi possível adicionar este mapa. Revise os dados e tente novamente.");
      setStatus("idle");
    }
  }

  const canSave =
    displayName.trim().length > 0 &&
    date.length > 0 &&
    (unknownTime || time.length > 0) &&
    place !== undefined;

  return (
    <form
      className="synastry-map-form"
      aria-labelledby="synastry-map-form-title"
      onSubmit={(event) => {
        event.preventDefault();
        void createProfile();
      }}
    >
      <div className="synastry-map-form-intro">
        <p className="eyebrow">Novo mapa de vínculo</p>
        <h3 id="synastry-map-form-title">Quem você deseja encontrar neste céu?</h3>
        <p>
          Este mapa será salvo na sua conta e usado na comparação. Não cria outro usuário nem altera
          seu mapa principal.
        </p>
      </div>
      <div className="synastry-map-fields">
        <label>
          <span>Nome ou apelido</span>
          <input
            value={displayName}
            maxLength={100}
            autoComplete="off"
            placeholder="Ex.: Rafael"
            onChange={(event) => setDisplayName(event.target.value)}
          />
        </label>
        <label>
          <span>Data de nascimento</span>
          <input
            type="date"
            min="1900-01-01"
            value={date}
            onChange={(event) => setDate(event.target.value)}
          />
        </label>
        <label>
          <span>Hora de nascimento</span>
          <input
            type="time"
            disabled={unknownTime}
            value={time}
            onChange={(event) => setTime(event.target.value)}
          />
        </label>
        <label className="choice synastry-time-choice">
          <input
            type="checkbox"
            checked={unknownTime}
            onChange={(event) => {
              setUnknownTime(event.target.checked);
              if (event.target.checked) setTime("");
            }}
          />{" "}
          Não sei a hora
        </label>
        <div className="synastry-place-field">
          <label htmlFor="synastry-place">Cidade de nascimento</label>
          <div className="search-row">
            <input
              id="synastry-place"
              role="combobox"
              aria-expanded={places.length > 0}
              aria-controls="synastry-place-options"
              value={placeQuery}
              placeholder="Ex.: Recife, Pernambuco"
              onChange={(event) => {
                setPlaceQuery(event.target.value);
                setPlace(undefined);
                setPlaces([]);
              }}
            />
            <button
              className="quiet-button"
              type="button"
              disabled={placeQuery.trim().length < 2 || status !== "idle"}
              onClick={() => void searchPlaces()}
            >
              {status === "searching" ? "Buscando…" : "Buscar cidade"}
            </button>
          </div>
        </div>
      </div>
      {places.length > 0 ? (
        <ul className="place-list" id="synastry-place-options" aria-label="Cidades encontradas">
          {places.map((candidate) => (
            <li key={`${candidate.latitude}-${candidate.longitude}`}>
              <button
                type="button"
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
      {message ? (
        <output className="form-error" aria-live="polite">
          {message}
        </output>
      ) : null}
      <div className="form-actions">
        <button
          className="quiet-button"
          type="button"
          disabled={status !== "idle"}
          onClick={onCancel}
        >
          Cancelar
        </button>
        <button className="primary-button" type="submit" disabled={!canSave || status !== "idle"}>
          {status === "saving" ? "Calculando o encontro…" : "Adicionar e comparar mapas"}
        </button>
      </div>
    </form>
  );
}
