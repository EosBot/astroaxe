"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import {
  createMapResponseSchema,
  geocodingResponseSchema,
  type PlaceCandidate,
} from "@/lib/maps/contracts";
import { profilesResponseSchema, type ProfileRecord } from "@/lib/profiles/contracts";
import { TransitReading } from "./transit-reading";
import { AccountSecurity } from "./account-security";
import { PrivateJournal } from "./private-journal";

export function ProfileArchive(): React.JSX.Element {
  const [profiles, setProfiles] = useState<ProfileRecord[]>([]);
  const [selectedId, setSelectedId] = useState<string>();
  const [status, setStatus] = useState<"loading" | "ready" | "unauthorized" | "error">("loading");

  useEffect(() => {
    void loadProfiles(setProfiles, setSelectedId, setStatus);
  }, []);

  if (status === "loading")
    return <ArchiveMessage title="Abrindo seu arquivo…" detail="Buscando mapas salvos." />;
  if (status === "unauthorized")
    return (
      <ArchiveMessage
        title="Este arquivo é pessoal."
        detail="Volte ao início, calcule seu céu e entre na sua conta para continuar."
        actionHref="/"
        actionLabel="Ir ao início"
      />
    );
  if (status === "error")
    return (
      <ArchiveMessage
        title="O arquivo não abriu."
        detail="Tente novamente. Seus mapas continuam preservados."
        actionHref="/conta"
        actionLabel="Tentar novamente"
      />
    );
  if (profiles.length === 0)
    return (
      <>
        <ArchiveMessage
          title="Seu arquivo ainda está vazio."
          detail="Calcule o primeiro céu antes de criar uma conta ou adicione um novo perfil."
          actionHref="/"
          actionLabel="Calcular um céu"
        />
        <AccountSecurity />
      </>
    );

  const selected = profiles.find((profile) => profile.id === selectedId) ?? profiles[0];
  if (selected === undefined)
    return (
      <ArchiveMessage title="Seu arquivo ainda está vazio." detail="Calcule um céu para começar." />
    );

  return (
    <>
      <div className="archive-grid">
        <aside className="archive-index" aria-label="Mapas salvos">
          <p className="eyebrow">Seus mapas · {profiles.length}</p>
          <h1>Um arquivo do céu que você informou.</h1>
          <p>
            Atualize quando encontrar uma hora mais precisa. O cálculo anterior permanece registrado
            para auditoria.
          </p>
          <ol>
            {profiles.map((profile, index) => (
              <li key={profile.id}>
                <button
                  type="button"
                  aria-current={profile.id === selected.id ? "true" : undefined}
                  onClick={() => setSelectedId(profile.id)}
                >
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <strong>{profile.displayName}</strong>
                  <small>{profile.location}</small>
                </button>
              </li>
            ))}
          </ol>
        </aside>
        <ProfileEditor
          key={selected.id}
          profile={selected}
          onUpdated={(profile) =>
            setProfiles((current) =>
              current.map((item) => (item.id === profile.id ? profile : item)),
            )
          }
        />
      </div>
      <AccountSecurity />
    </>
  );
}

function ProfileEditor({
  profile,
  onUpdated,
}: Readonly<{
  profile: ProfileRecord;
  onUpdated: (profile: ProfileRecord) => void;
}>): React.JSX.Element {
  const [displayName, setDisplayName] = useState(profile.displayName);
  const [date, setDate] = useState(profile.date);
  const [time, setTime] = useState(profile.time ?? "");
  const [unknownTime, setUnknownTime] = useState(profile.timePrecision === "unknown");
  const [placeQuery, setPlaceQuery] = useState(profile.location);
  const [place, setPlace] = useState<PlaceCandidate>({
    label: profile.location,
    latitude: profile.latitude,
    longitude: profile.longitude,
    timezone: profile.timezone,
  });
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

  async function save(): Promise<void> {
    setStatus("saving");
    setMessage("");
    try {
      const response = await fetch(`/api/profiles/${profile.id}`, {
        method: "PUT",
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
      const body: unknown = await response.json();
      if (!response.ok || !createMapResponseSchema.safeParse(body).success)
        throw new Error("save_failed");
      const refreshed = await fetch("/api/profiles");
      const parsed = profilesResponseSchema.safeParse(await refreshed.json());
      const updated = parsed.success
        ? parsed.data.profiles.find((item) => item.id === profile.id)
        : undefined;
      if (!refreshed.ok || updated === undefined) throw new Error("refresh_failed");
      onUpdated(updated);
      setMessage("Dados atualizados e mapa recalculado.");
    } catch {
      setMessage("Não foi possível recalcular. Revise os dados e tente novamente.");
    } finally {
      setStatus("idle");
    }
  }

  return (
    <section className="archive-sheet" aria-labelledby="profile-title">
      <div className="archive-orbit" aria-hidden="true">
        <span>{profile.chart.sunSign}</span>
      </div>
      <p className="eyebrow">Ficha ativa · recalculada em {formatDate(profile.updatedAt)}</p>
      <h2 id="profile-title">{profile.displayName}</h2>
      <div className="archive-placements">
        <span>
          Sol <strong>{profile.chart.sunSign}</strong>
        </span>
        {profile.chart.moonSign ? (
          <span>
            Lua <strong>{profile.chart.moonSign}</strong>
          </span>
        ) : null}
        <span>
          Precisão <strong>{profile.chart.mode === "timed" ? "Com hora" : "Sem hora"}</strong>
        </span>
      </div>
      <TransitReading profileId={profile.id} timezone={profile.timezone} />
      <PrivateJournal profileId={profile.id} timezone={profile.timezone} />
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void save();
        }}
      >
        <label htmlFor="archive-name">Nome ou apelido</label>
        <input
          id="archive-name"
          value={displayName}
          maxLength={100}
          onChange={(event) => setDisplayName(event.target.value)}
        />
        <label htmlFor="archive-date">Data de nascimento</label>
        <input
          id="archive-date"
          type="date"
          min="1900-01-01"
          value={date}
          onChange={(event) => setDate(event.target.value)}
        />
        <label htmlFor="archive-time">Hora de nascimento</label>
        <input
          id="archive-time"
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
        <label htmlFor="archive-place">Cidade de nascimento</label>
        <div className="search-row">
          <input
            id="archive-place"
            value={placeQuery}
            onChange={(event) => {
              setPlaceQuery(event.target.value);
              setPlaces([]);
            }}
          />
          <button
            type="button"
            className="quiet-button"
            disabled={placeQuery.trim().length < 2 || status !== "idle"}
            onClick={() => void searchPlaces()}
          >
            {status === "searching" ? "Buscando…" : "Buscar"}
          </button>
        </div>
        {places.length > 0 ? (
          <ul className="place-list" aria-label="Cidades encontradas">
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
          <output className={message.startsWith("Dados") ? "form-success" : "form-error"}>
            {message}
          </output>
        ) : null}
        <button
          type="submit"
          className="primary-button"
          disabled={
            status !== "idle" ||
            displayName.trim().length === 0 ||
            (!unknownTime && time.length === 0)
          }
        >
          {status === "saving" ? "Recalculando…" : "Salvar e recalcular"}
        </button>
      </form>
    </section>
  );
}

function ArchiveMessage({
  title,
  detail,
  actionHref,
  actionLabel,
}: Readonly<{
  title: string;
  detail: string;
  actionHref?: string;
  actionLabel?: string;
}>): React.JSX.Element {
  return (
    <section className="archive-message">
      <p className="eyebrow">Arquivo celeste</p>
      <h1>{title}</h1>
      <p>{detail}</p>
      {actionHref && actionLabel ? (
        <Link className="primary-button" href={actionHref}>
          {actionLabel}
        </Link>
      ) : null}
    </section>
  );
}

async function loadProfiles(
  setProfiles: (profiles: ProfileRecord[]) => void,
  setSelectedId: (id: string | undefined) => void,
  setStatus: (status: "loading" | "ready" | "unauthorized" | "error") => void,
): Promise<void> {
  try {
    const response = await fetch("/api/profiles");
    if (response.status === 401) return setStatus("unauthorized");
    const parsed = profilesResponseSchema.safeParse(await response.json());
    if (!response.ok || !parsed.success) throw new Error("profiles_failed");
    setProfiles(parsed.data.profiles);
    setSelectedId(parsed.data.profiles[0]?.id);
    setStatus("ready");
  } catch {
    setStatus("error");
  }
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(value));
}
