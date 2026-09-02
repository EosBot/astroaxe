"use client";

import { useState } from "react";

import { geocodingResponseSchema, type PlaceCandidate } from "@/lib/maps/contracts";
import { instantFromWallClock } from "@/lib/time/zoned-instant";

/**
 * Formulário do instante e do lugar.
 *
 * A versão anterior pedia latitude, longitude e uma string ISO com fuso digitada
 * à mão. Isso pressupõe que quem chega saiba as coordenadas da própria cidade e
 * o próprio deslocamento em relação a Greenwich — inclusive no horário de verão,
 * que é justamente quando errar muda a hora planetária.
 *
 * Agora usa a mesma busca de cidades do resto do site. O fuso vem junto do
 * resultado, então data e hora podem ser comuns: o deslocamento é deduzido do
 * lugar e da data, e não perguntado.
 *
 * O envio continua sendo GET com os mesmos campos de antes, porque o resultado
 * precisa caber num endereço que se possa guardar e compartilhar.
 */
export function CeremonialMomentForm({
  defaultDate,
  defaultTime,
}: Readonly<{ defaultDate: string; defaultTime: string }>): React.JSX.Element {
  const [query, setQuery] = useState("");
  const [places, setPlaces] = useState<PlaceCandidate[]>([]);
  const [place, setPlace] = useState<PlaceCandidate>();
  const [date, setDate] = useState(defaultDate);
  const [time, setTime] = useState(defaultTime);
  const [searching, setSearching] = useState(false);
  const [message, setMessage] = useState("");

  async function searchPlaces(): Promise<void> {
    setMessage("");
    setSearching(true);
    try {
      const response = await fetch(`/api/geocoding?q=${encodeURIComponent(query)}`);
      const parsed = geocodingResponseSchema.safeParse(await response.json());
      if (!response.ok || !parsed.success) throw new Error("geocoding_failed");
      setPlaces(parsed.data.places);
      if (parsed.data.places.length === 0)
        setMessage("Não encontramos essa cidade. Confira a grafia.");
    } catch {
      setMessage("A busca de cidades está fora do ar agora. Tente de novo daqui a pouco.");
    } finally {
      setSearching(false);
    }
  }

  const ready = place !== undefined && date !== "" && time !== "";

  return (
    <form className="timing-form" method="get" action="/tempo-cerimonial">
      <p className="eyebrow">Momento e lugar</p>

      <label htmlFor="place">Em que cidade?</label>
      <div className="search-row">
        <input
          id="place"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={places.length > 0}
          aria-controls="timing-place-options"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setPlace(undefined);
          }}
          placeholder="Ex.: Salvador, Bahia"
        />
        <button
          type="button"
          className="quiet-button"
          disabled={query.trim().length < 2 || searching}
          onClick={() => void searchPlaces()}
        >
          {searching ? "Buscando…" : "Buscar"}
        </button>
      </div>
      {places.length > 0 ? (
        <ul className="place-list" id="timing-place-options" aria-label="Cidades encontradas">
          {places.map((candidate) => (
            <li key={`${candidate.latitude}-${candidate.longitude}`}>
              <button
                type="button"
                aria-pressed={place?.label === candidate.label}
                onClick={() => {
                  setPlace(candidate);
                  setQuery(candidate.label);
                  setPlaces([]);
                }}
              >
                {candidate.label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <label htmlFor="date">Que dia?</label>
      <input
        id="date"
        type="date"
        value={date}
        onChange={(event) => setDate(event.target.value)}
        required
      />

      <label htmlFor="time">Que hora? (a hora do relógio daí)</label>
      <input
        id="time"
        type="time"
        value={time}
        onChange={(event) => setTime(event.target.value)}
        required
      />

      {/* O que a página lê. Preenchido a partir da cidade escolhida, para que a
          pessoa nunca precise saber a própria coordenada nem o próprio fuso. */}
      <input
        type="hidden"
        name="instant"
        value={
          place === undefined || date === "" || time === ""
            ? ""
            : instantFromWallClock({ date, time, timeZone: place.timezone })
        }
      />
      <input type="hidden" name="latitude" value={place?.latitude ?? ""} />
      <input type="hidden" name="longitude" value={place?.longitude ?? ""} />

      {message === "" ? null : <p className="timing-form-message">{message}</p>}

      <button type="submit" disabled={!ready}>
        Ler este instante
      </button>
      {ready ? null : (
        <p className="timing-form-hint">Escolha uma cidade da lista para liberar a leitura.</p>
      )}
    </form>
  );
}
