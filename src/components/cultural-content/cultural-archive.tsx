"use client";

import { useEffect, useState } from "react";

import {
  publicCulturalCollectionSchema,
  type PublicCulturalEntry,
} from "@/lib/cultural-content/contracts";

type ArchiveStatus = "loading" | "ready" | "error";

export function CulturalArchive(): React.JSX.Element {
  const [entries, setEntries] = useState<PublicCulturalEntry[]>([]);
  const [status, setStatus] = useState<ArchiveStatus>("loading");

  async function reload(): Promise<void> {
    setStatus("loading");
    try {
      setEntries(await fetchCulturalEntries());
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }

  useEffect(() => {
    let active = true;
    void fetchCulturalEntries()
      .then((loadedEntries) => {
        if (!active) return;
        setEntries(loadedEntries);
        setStatus("ready");
      })
      .catch(() => {
        if (active) setStatus("error");
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="cultural-archive">
      <header className="cultural-archive-intro">
        <p className="eyebrow">Contexto antes de correspondência</p>
        <h1>Um acervo para ler devagar.</h1>
        <p>
          Textos pré-escritos, longos e versionados. Cada afirmação pública abre sua fonte e seus
          limites. Este acervo não revela Orixá, não substitui tradição viva e não transforma um
          trânsito astrológico em identidade religiosa.
        </p>
      </header>

      {status === "loading" ? (
        <output className="archive-state">Abrindo os textos aprovados…</output>
      ) : null}
      {status === "error" ? (
        <div className="archive-state" role="alert">
          <p>O acervo não abriu agora. Os textos continuam preservados.</p>
          <button type="button" className="quiet-button" onClick={() => void reload()}>
            Tentar novamente
          </button>
        </div>
      ) : null}
      {status === "ready" && entries.length === 0 ? (
        <p className="archive-state">Ainda não há textos publicados para esta coleção.</p>
      ) : null}

      <div className="cultural-entry-list">
        {entries.map((entry, index) => (
          <article className="cultural-entry" key={`${entry.slug}-${entry.version}`}>
            <header>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <div>
                <p className="eyebrow">{formatTradition(entry.traditionId)}</p>
                <h2>{entry.displayName}</h2>
                <p className="cultural-summary">{entry.summary}</p>
              </div>
            </header>
            <div className="cultural-body">
              {entry.editorialBody.split("\n\n").map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
            <aside className="cultural-provenance" aria-label="Autoria, revisão e fontes">
              <p>
                <strong>Autoria:</strong> {entry.author.displayName}. {entry.author.attributionLine}
              </p>
              <p>
                <strong>Revisão:</strong> {entry.reviewer.displayName}.{" "}
                {entry.reviewer.attributionLine}
              </p>
              <p>
                <strong>Versão:</strong> {entry.version} · publicada em{" "}
                {new Intl.DateTimeFormat("pt-BR", { dateStyle: "long" }).format(
                  new Date(entry.publishedAt),
                )}
              </p>
              <details>
                <summary>Ver afirmações e fontes</summary>
                <ul>
                  {entry.claims.map((claim) => (
                    <li key={claim.claimKey}>
                      <p>{claim.objectSummary}</p>
                      <a href={claim.source.url} target="_blank" rel="noreferrer">
                        {claim.source.title}
                      </a>
                      <small>
                        {claim.sourceLocator} · acesso em{" "}
                        {formatAccessDate(claim.source.accessedAt)}
                      </small>
                    </li>
                  ))}
                </ul>
              </details>
            </aside>
            <p className="cultural-disclaimer">{entry.disclaimer}</p>
          </article>
        ))}
      </div>
    </div>
  );
}

async function fetchCulturalEntries(): Promise<PublicCulturalEntry[]> {
  const response = await fetch("/api/cultural-content");
  const parsed = publicCulturalCollectionSchema.safeParse(await response.json());
  if (!response.ok || !parsed.success) throw new Error("invalid cultural collection");
  return parsed.data.entries;
}

function formatTradition(traditionId: string): string {
  const labels: Record<string, string> = {
    CandombleKetuNago: "Candomblé Ketu/Nagô · contexto documental",
    YorubaFolkloreOgumefu1929: "Narrativa iorubá · registro escrito de 1929",
  };
  return labels[traditionId] ?? "Contexto cultural situado";
}

function formatAccessDate(date: string): string {
  const [year, month, day] = date.split("-").map(Number);
  return new Intl.DateTimeFormat("pt-BR").format(new Date(year ?? 0, (month ?? 1) - 1, day ?? 1));
}
