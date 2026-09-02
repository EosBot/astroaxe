"use client";

import { useState } from "react";

import { geocodingResponseSchema, type PlaceCandidate } from "@/lib/maps/contracts";

/**
 * Busca de cidade.
 *
 * Terceiro lugar do site a precisar disto — onboarding, tempo cerimonial e
 * agora as janelas. Duas cópias ainda se justificavam pela marcação diferente
 * em volta; três significam que a próxima mudança de comportamento seria feita
 * em dois lugares e esquecida no terceiro.
 *
 * Devolve o lugar escolhido inteiro, com fuso, porque quem chama quase sempre
 * precisa do fuso junto: é ele que evita perguntar deslocamento a quem não sabe
 * o próprio.
 */
export function CitySearch({
  id,
  label,
  placeholder = "Ex.: Salvador, Bahia",
  onSelect,
}: Readonly<{
  id: string;
  label: string;
  placeholder?: string;
  onSelect: (place: PlaceCandidate | undefined) => void;
}>): React.JSX.Element {
  const [query, setQuery] = useState("");
  const [places, setPlaces] = useState<PlaceCandidate[]>([]);
  const [chosen, setChosen] = useState<PlaceCandidate>();
  const [searching, setSearching] = useState(false);
  const [message, setMessage] = useState("");

  async function search(): Promise<void> {
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

  return (
    <>
      <label htmlFor={id}>{label}</label>
      <div className="search-row">
        <input
          id={id}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={places.length > 0}
          aria-controls={`${id}-options`}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setChosen(undefined);
            onSelect(undefined);
          }}
          placeholder={placeholder}
        />
        <button
          type="button"
          className="quiet-button"
          disabled={query.trim().length < 2 || searching}
          onClick={() => void search()}
        >
          {searching ? "Buscando…" : "Buscar"}
        </button>
      </div>
      {places.length > 0 ? (
        <ul className="place-list" id={`${id}-options`} aria-label="Cidades encontradas">
          {places.map((candidate) => (
            <li key={`${candidate.latitude}-${candidate.longitude}`}>
              <button
                type="button"
                aria-pressed={chosen?.label === candidate.label}
                onClick={() => {
                  setChosen(candidate);
                  setQuery(candidate.label);
                  setPlaces([]);
                  onSelect(candidate);
                }}
              >
                {candidate.label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      {message === "" ? null : <p className="timing-form-message">{message}</p>}
    </>
  );
}
