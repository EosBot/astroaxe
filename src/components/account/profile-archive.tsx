"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import {
  createMapResponseSchema,
  geocodingResponseSchema,
  type PlaceCandidate,
} from "@/lib/maps/contracts";
import { profilesResponseSchema, type ProfileRecord } from "@/lib/profiles/contracts";
import { TransitReading } from "./transit-reading";
import { AccountSecurity } from "./account-security";
import { PrivateJournal } from "./private-journal";
import { NatalChartWheel } from "@/components/onboarding/natal-chart-wheel";
import { CelestialDashboard } from "./celestial-dashboard";
import { BiorhythmPanel } from "./biorhythm-panel";
import { SynastryPanel } from "./synastry-panel";
import { ModernPointsPanel } from "./modern-points-panel";
import { OrisaResearchLab } from "./orisa-research-lab";
import { LunarIntelligencePanel } from "./lunar-intelligence-panel";
import {
  AnnualGuideView,
  CompleteNatalMapView,
  HoroscopeOverview,
  LoveMapView,
  LunarNodesView,
  ProfessionalMapView,
  SexualMapView,
  ShadowHoroscopeView,
} from "./astrology-module-panels";

export function ProfileArchive(): React.JSX.Element {
  const [profiles, setProfiles] = useState<ProfileRecord[]>([]);
  const [selectedId, setSelectedId] = useState<string>();
  const [status, setStatus] = useState<"loading" | "ready" | "unauthorized" | "error">("loading");
  const [view, setView] = useState<AccountView>("overview");

  async function handleProfileCreated(profileId: string): Promise<void> {
    const response = await fetch("/api/profiles");
    const parsed = profilesResponseSchema.safeParse(await response.json());
    if (!response.ok || !parsed.success) throw new Error("profiles_refresh_failed");
    setProfiles(parsed.data.profiles);
    setSelectedId(profileId);
    setView("synastry");
  }

  useEffect(() => {
    void loadProfiles(setProfiles, setSelectedId, setStatus);
  }, []);

  useEffect(() => {
    function selectHashView(): void {
      if (window.location.hash === "#configuracoes") setView("settings");
    }
    selectHashView();
    window.addEventListener("hashchange", selectHashView);
    return () => window.removeEventListener("hashchange", selectHashView);
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
      <nav className="account-section-nav" aria-label="Seções de Meu céu">
        <div className="account-primary-tabs">
          {(
            [
              ["overview", "Visão geral"],
              ["map", "Mapa natal"],
              ["cycles", "Horóscopo"],
              ["shadow", "Horóscopo sombrio"],
              ["synastry", "Sinastria"],
              ["complete", "Mapa completo"],
            ] as const
          ).map(([value, label]) => (
            <ViewButton key={value} value={value} label={label} view={view} onSelect={setView} />
          ))}
        </div>
        <details className="account-more-menu">
          <summary>Mais módulos</summary>
          <div>
            {(
              [
                ["biorhythm", "Biorritmo"],
                ["annual", `Revolução Solar ${new Date().getFullYear()}`],
                ["nodes", "Nodos lunares"],
                ["love", "Mapa do amor"],
                ["sexual", "Mapa sexual"],
                ["professional", "Mapa profissional"],
                ["lunar", "Área Lua"],
                ["orixas", "Orixás"],
                ["settings", "Configurações"],
              ] as const
            ).map(([value, label]) => (
              <ViewButton key={value} value={value} label={label} view={view} onSelect={setView} />
            ))}
          </div>
        </details>
      </nav>
      <div className="account-view" hidden={view !== "overview"}>
        <CelestialDashboard
          profileName={selected.displayName}
          profileCount={profiles.length}
          timed={selected.chart.mode === "timed"}
          onNavigate={setView}
        />
        <ModernPointsPanel
          chart={selected.chart.natal}
          onOpenSettings={() => setView("settings")}
        />
      </div>
      <div className="account-view" hidden={view !== "map"}>
        <div className="archive-grid">
          <aside className="archive-index" aria-label="Mapas salvos">
            <p className="eyebrow">Seus mapas · {profiles.length}</p>
            <h1>Um arquivo do céu que você informou.</h1>
            <p>
              Atualize quando encontrar uma hora mais precisa. O cálculo anterior permanece
              registrado para auditoria.
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
            view="map"
            onUpdated={(profile) =>
              setProfiles((current) =>
                current.map((item) => (item.id === profile.id ? profile : item)),
              )
            }
            onDeleted={() => {
              const remaining = profiles.filter((item) => item.id !== selected.id);
              setProfiles(remaining);
              setSelectedId(remaining[0]?.id);
            }}
          />
        </div>
        <ModernPointsPanel
          chart={selected.chart.natal}
          onOpenSettings={() => setView("settings")}
        />
      </div>
      <div className="account-view" hidden={view !== "cycles"}>
        <HoroscopeOverview profile={selected} />
        <ProfileEditor
          key={`${selected.id}-cycles`}
          profile={selected}
          view="cycles"
          onUpdated={() => undefined}
          onDeleted={() => undefined}
        />
      </div>
      <div className="account-view" hidden={view !== "synastry"}>
        <SynastryPanel profiles={profiles} onProfileCreated={handleProfileCreated} />
      </div>
      <div className="account-view" hidden={view !== "shadow"}>
        <ShadowHoroscopeView profile={selected} />
      </div>
      <div className="account-view" hidden={view !== "biorhythm"}>
        <section className="standalone-module-heading" aria-labelledby="biorhythm-view-title">
          <p className="eyebrow">Ritmos de observação</p>
          <h1 id="biorhythm-view-title">Biorritmo de {selected.displayName}</h1>
          <p>
            Escolha uma data e observe como cada ciclo atravessa fases de ascensão, auge, descida e
            renovação. A leitura abaixo explica o significado de cada movimento.
          </p>
        </section>
        <BiorhythmPanel
          birthDate={selected.date}
          comparisonOptions={profiles
            .filter(({ id }) => id !== selected.id)
            .map((profile) => ({
              id: profile.id,
              label: profile.displayName,
              birthDate: profile.date,
            }))}
        />
      </div>
      <div className="account-view" hidden={view !== "nodes"}>
        <LunarNodesView chart={selected.chart.natal} />
      </div>
      <div className="account-view" hidden={view !== "love"}>
        <LoveMapView profile={selected} />
      </div>
      <div className="account-view" hidden={view !== "sexual"}>
        <SexualMapView profile={selected} />
      </div>
      <div className="account-view" hidden={view !== "professional"}>
        <ProfessionalMapView profile={selected} />
      </div>
      <div className="account-view" hidden={view !== "complete"}>
        <CompleteNatalMapView profile={selected} />
      </div>
      <div className="account-view" hidden={view !== "annual"}>
        <AnnualGuideView profile={selected} />
      </div>
      <div className="account-view" hidden={view !== "lunar"}>
        <LunarIntelligencePanel profile={selected} profiles={profiles} />
      </div>
      <div className="account-view" hidden={view !== "orixas"}>
        {view === "orixas" ? <OrisaResearchLab profileId={selected.id} /> : null}
      </div>
      <div
        className="account-view account-settings-view"
        id="configuracoes"
        hidden={view !== "settings"}
      >
        <ProfileEditor
          key={`${selected.id}-settings`}
          profile={selected}
          view="settings"
          onUpdated={(profile) =>
            setProfiles((current) =>
              current.map((item) => (item.id === profile.id ? profile : item)),
            )
          }
          onDeleted={() => {
            const remaining = profiles.filter((item) => item.id !== selected.id);
            setProfiles(remaining);
            setSelectedId(remaining[0]?.id);
          }}
        />
        <AccountSecurity />
      </div>
    </>
  );
}

type AccountView =
  | "overview"
  | "map"
  | "cycles"
  | "shadow"
  | "synastry"
  | "biorhythm"
  | "nodes"
  | "love"
  | "sexual"
  | "professional"
  | "complete"
  | "annual"
  | "lunar"
  | "orixas"
  | "settings";

function ViewButton({
  value,
  label,
  view,
  onSelect,
}: Readonly<{
  value: AccountView;
  label: string;
  view: AccountView;
  onSelect: (view: AccountView) => void;
}>): React.JSX.Element {
  return (
    <button
      type="button"
      aria-current={view === value ? "page" : undefined}
      onClick={(event) => {
        onSelect(value);
        event.currentTarget.closest("details")?.removeAttribute("open");
      }}
    >
      {label}
    </button>
  );
}

function ProfileEditor({
  profile,
  onUpdated,
  onDeleted,
  view,
}: Readonly<{
  profile: ProfileRecord;
  onUpdated: (profile: ProfileRecord) => void;
  onDeleted: () => void;
  view: "map" | "cycles" | "settings";
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
  const [deleteOpen, setDeleteOpen] = useState(false);

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
      <ProfilePlacements profile={profile} />
      {view === "map" ? (
        <div id="mapa-natal">
          <NatalChartWheel chart={profile.chart.natal} compact />
        </div>
      ) : null}
      {view === "cycles" ? (
        <>
          <div id="tempo-do-ceu">
            <TransitReading profileId={profile.id} timezone={profile.timezone} />
          </div>
          <div id="diario-celeste">
            <PrivateJournal profileId={profile.id} timezone={profile.timezone} />
          </div>
        </>
      ) : null}
      {view === "settings" ? (
        <>
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
          <div className="profile-danger-zone">
            <div>
              <p className="eyebrow">Gerenciar este mapa</p>
              <h3>Remover {profile.displayName} do arquivo</h3>
              <p>
                A conta permanece ativa. Somente este mapa e os registros ligados a ele serão
                apagados.
              </p>
            </div>
            <button type="button" className="danger-button" onClick={() => setDeleteOpen(true)}>
              Excluir este mapa
            </button>
          </div>
          <DeleteProfileDialog
            open={deleteOpen}
            profile={profile}
            onCancel={() => setDeleteOpen(false)}
            onDeleted={onDeleted}
          />
        </>
      ) : null}
    </section>
  );
}

function ProfilePlacements({ profile }: Readonly<{ profile: ProfileRecord }>): React.JSX.Element {
  const precision = profile.chart.mode === "timed" ? "Com hora" : "Sem hora";
  return (
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
        Precisão <strong>{precision}</strong>
      </span>
    </div>
  );
}

function DeleteProfileDialog({
  open,
  profile,
  onCancel,
  onDeleted,
}: Readonly<{
  open: boolean;
  profile: ProfileRecord;
  onCancel: () => void;
  onDeleted: () => void;
}>): React.JSX.Element {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [confirmation, setConfirmation] = useState("");
  const [status, setStatus] = useState<"idle" | "deleting">("idle");
  const [error, setError] = useState("");
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog === null) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  async function deleteProfile(): Promise<void> {
    setStatus("deleting");
    setError("");
    try {
      const response = await fetch(`/api/profiles/${profile.id}`, { method: "DELETE" });
      if (!response.ok) {
        const body = (await response.json()) as { error?: unknown };
        throw new Error(typeof body.error === "string" ? body.error : "Não foi possível excluir.");
      }
      dialogRef.current?.close();
      onDeleted();
    } catch (error_) {
      setError(error_ instanceof Error ? error_.message : "Não foi possível excluir este mapa.");
      setStatus("idle");
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className="profile-delete-dialog"
      aria-labelledby="delete-profile-title"
      onCancel={(event) => {
        event.preventDefault();
        if (status === "idle") onCancel();
      }}
      onClose={() => {
        setConfirmation("");
        setError("");
        if (open) onCancel();
      }}
    >
      <AnimatePresence>
        {open ? (
          <motion.div
            className="profile-delete-dialog-card"
            initial={reduceMotion ? false : { opacity: 0, scale: 0.94, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 8 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="eyebrow">Confirmação de exclusão</p>
            <h2 id="delete-profile-title">Excluir o mapa de {profile.displayName}?</h2>
            <p>Esta ação não pode ser desfeita. Sua conta e os outros mapas não serão alterados.</p>
            <label htmlFor="delete-profile-confirmation">
              Digite <strong>EXCLUIR MAPA</strong>
            </label>
            <input
              id="delete-profile-confirmation"
              autoComplete="off"
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
            />
            {error ? (
              <output className="form-error" aria-live="polite">
                {error}
              </output>
            ) : null}
            <div className="profile-delete-actions">
              <button
                type="button"
                className="quiet-button"
                disabled={status !== "idle"}
                onClick={onCancel}
              >
                Manter mapa
              </button>
              <button
                type="button"
                className="danger-button"
                disabled={status !== "idle" || confirmation !== "EXCLUIR MAPA"}
                onClick={() => void deleteProfile()}
              >
                {status === "deleting" ? "Excluindo…" : "Excluir mapa definitivamente"}
              </button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </dialog>
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
