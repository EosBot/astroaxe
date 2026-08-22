"use client";

import { useEffect, useState } from "react";

import {
  journalEntriesResponseSchema,
  journalEntrySchema,
  type JournalEntry,
} from "@/lib/journal/contracts";

export function PrivateJournal({
  profileId,
  timezone,
}: Readonly<{ profileId: string; timezone: string }>): React.JSX.Element {
  const date = dateInTimezone(timezone);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [content, setContent] = useState("");
  const [status, setStatus] = useState<"loading" | "ready" | "saving" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    void fetch(`/api/profiles/${profileId}/journal`, { signal: controller.signal })
      .then(async (response) => {
        const parsed = journalEntriesResponseSchema.safeParse(await response.json());
        if (!response.ok || !parsed.success) throw new Error("journal_load_failed");
        setEntries(parsed.data.entries);
        setContent(parsed.data.entries.find((entry) => entry.date === date)?.content ?? "");
        setStatus("ready");
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setStatus("error");
      });
    return () => controller.abort();
  }, [date, profileId]);

  async function save(): Promise<void> {
    setStatus("saving");
    setMessage("");
    try {
      const response = await fetch(`/api/profiles/${profileId}/journal`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, content }),
      });
      const body: unknown = await response.json();
      if (!response.ok) throw new Error(publicError(body));
      const entry = journalEntrySchema.parse(
        typeof body === "object" && body !== null && "entry" in body ? body.entry : undefined,
      );
      setEntries((current) => [entry, ...current.filter((item) => item.id !== entry.id)]);
      setStatus("ready");
      setMessage("Reflexão guardada somente no seu arquivo.");
    } catch (error) {
      setStatus("ready");
      setMessage(error instanceof Error ? error.message : "Não foi possível guardar agora.");
    }
  }

  async function remove(entry: JournalEntry): Promise<void> {
    setMessage("");
    const response = await fetch(`/api/profiles/${profileId}/journal/${entry.id}`, {
      method: "DELETE",
    });
    if (!response.ok) return setMessage("Não foi possível excluir esta reflexão.");
    setEntries((current) => current.filter((item) => item.id !== entry.id));
    if (entry.date === date) setContent("");
    setMessage("Reflexão excluída.");
  }

  if (status === "loading")
    return <section className="private-journal">Abrindo seu diário privado…</section>;
  if (status === "error")
    return (
      <section className="private-journal">
        <h3>Seu diário não abriu.</h3>
        <p>As reflexões já guardadas permanecem preservadas.</p>
      </section>
    );

  return (
    <section className="private-journal" aria-labelledby="private-journal-title">
      <header>
        <div>
          <p className="eyebrow">Diário privado · {formatDate(date)}</p>
          <h3 id="private-journal-title">O que este céu movimentou em você?</h3>
        </div>
        <a className="text-link" href="/api/journal/export" download>
          Exportar JSON
        </a>
      </header>
      <p>Este texto fica na sua conta e não é enviado para analytics, IA ou conteúdo público.</p>
      <label htmlFor={`journal-${profileId}`}>Reflexão de hoje</label>
      <textarea
        id={`journal-${profileId}`}
        rows={6}
        maxLength={4000}
        value={content}
        onChange={(event) => setContent(event.target.value)}
      />
      <div className="journal-actions">
        <small>{content.length}/4.000</small>
        <button
          type="button"
          className="primary-button"
          disabled={status === "saving" || content.trim().length === 0}
          onClick={() => void save()}
        >
          {status === "saving" ? "Guardando…" : "Guardar reflexão"}
        </button>
      </div>
      {message ? <output className="form-message">{message}</output> : null}
      {entries.length > 0 ? (
        <details>
          <summary>Reflexões anteriores ({entries.length})</summary>
          <ol>
            {entries.map((entry) => (
              <li key={entry.id}>
                <div>
                  <strong>{formatDate(entry.date)}</strong>
                  <p>{entry.content}</p>
                </div>
                <button type="button" className="text-button" onClick={() => void remove(entry)}>
                  Excluir
                </button>
              </li>
            ))}
          </ol>
        </details>
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

function formatDate(date: string): string {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "long", timeZone: "UTC" }).format(
    new Date(`${date}T12:00:00.000Z`),
  );
}

function publicError(body: unknown): string {
  if (
    typeof body === "object" &&
    body !== null &&
    "error" in body &&
    typeof body.error === "string"
  )
    return body.error;
  return "Não foi possível guardar agora.";
}
