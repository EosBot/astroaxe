"use client";

import { useEffect, useState } from "react";

import {
  publicCulturalCollectionSchema,
  type PublicCulturalEntry,
} from "@/lib/cultural-content/contracts";

type ArchiveStatus = "loading" | "ready" | "error";

/**
 * Classe de evidência em linguagem de leitura.
 *
 * É o que substitui a lista de títulos e links. Dizer que uma afirmação se apoia
 * num inventário institucional informa o leitor sobre a solidez dela; dizer qual
 * inventário entrega o acervo de pesquisa sem que o leitor ganhe nada com isso.
 */
function evidenceKindLabel(kind: string): string {
  const labels: Readonly<Record<string, string>> = {
    "community-primary": "Vem de comunidade de terreiro, em fonte primária.",
    "institutional-inventory": "Vem de inventário de patrimônio de instituição pública.",
    ethnography: "Vem de registro etnográfico.",
    "scholarly-analysis": "Vem de análise acadêmica revisada por pares.",
    "product-editorial": "Leitura nossa. Não é registro histórico, e não se apresenta como tal.",
  };
  return labels[kind] ?? "Origem registrada internamente.";
}

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
        <p className="eyebrow">Acervo cultural e corpus de pesquisa</p>
        <h1>Conhecimento situado, com origem visível.</h1>
        <p>
          O AstroAxe mantém separados os textos culturalmente revisados e o material usado em
          pesquisa técnica. Cada afirmação publicada abre sua fonte e seus limites. O acervo não
          revela Orixá, não substitui tradição viva e não transforma cálculo em identidade
          religiosa.
        </p>
      </header>

      <section className="archive-research-snapshot" aria-labelledby="research-snapshot-title">
        <div>
          <p className="eyebrow">Atualização do corpus · agosto de 2026</p>
          <h2 id="research-snapshot-title">Uma base maior, sem confundir volume com verdade.</h2>
          <p>
            O ciclo mais recente reuniu fontes institucionais e acadêmicas, páginas públicas e uma
            coleção privada de estudo. Duplicatas foram identificadas, documentos foram extraídos
            por página e divergências entre linhagens e escolas permaneceram explícitas.
          </p>
        </div>
        <dl>
          <div>
            <dt>801</dt>
            <dd>arquivos inventariados</dd>
          </div>
          <div>
            <dt>737</dt>
            <dd>conteúdos únicos por hash</dd>
          </div>
          <div>
            <dt>124</dt>
            <dd>PDFs únicos examinados</dd>
          </div>
          <div>
            <dt>4</dt>
            <dd>verbetes culturalmente publicados</dd>
          </div>
        </dl>
        <p className="archive-research-note">
          O corpus de pesquisa informa hipóteses e controles do método autoral, mas não promove
          automaticamente uma associação a fato religioso. Pesos, matriz e regras internas não fazem
          parte deste acervo público.
        </p>
      </section>

      <div className="archive-section-heading">
        <p className="eyebrow">Coleção publicada</p>
        <h2>Verbetes com proveniência editorial</h2>
        <p>Somente a versão vigente de cada texto aprovado aparece abaixo.</p>
      </div>

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
            <aside
              className="cultural-provenance"
              aria-label="Autoria, revisão e origem das afirmações"
            >
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
                <summary>Ver afirmações e classe de evidência</summary>
                <ul>
                  {entry.claims.map((claim) => (
                    <li key={claim.claimKey}>
                      <p>{claim.objectSummary}</p>
                      <small>{evidenceKindLabel(claim.source.evidenceKind)}</small>
                    </li>
                  ))}
                </ul>
                <p className="cultural-evidence-note">
                  Cada afirmação diz de que tipo de material veio. Guardamos internamente qual
                  material foi — é o que permite corrigir o texto quando uma fonte se mostra errada,
                  e já aconteceu.
                </p>
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
