"use client";

import { useMemo, useState } from "react";

import { buildSynastryReading, calculateSynastry } from "@/domain/astrology/synastry";
import type { ProfileRecord } from "@/lib/profiles/contracts";
import { SynastryMapForm } from "./synastry-map-form";

export function SynastryPanel({
  profiles,
  onProfileCreated,
}: Readonly<{
  profiles: ProfileRecord[];
  onProfileCreated: (profileId: string) => Promise<void>;
}>): React.JSX.Element {
  const [firstId, setFirstId] = useState(profiles[0]?.id ?? "");
  const [secondId, setSecondId] = useState(profiles[1]?.id ?? "");
  const [addingProfile, setAddingProfile] = useState(false);
  const first = profiles.find(({ id }) => id === firstId);
  const second = profiles.find(({ id }) => id === secondId);
  const aspects = useMemo(
    () =>
      first === undefined || second === undefined
        ? []
        : calculateSynastry(first.chart.natal.planets, second.chart.natal.planets),
    [first, second],
  );
  const reading = useMemo(
    () =>
      first === undefined || second === undefined || first.id === second.id
        ? undefined
        : buildSynastryReading(first.displayName, second.displayName, aspects),
    [aspects, first, second],
  );
  let panelContent: React.ReactNode;
  if (addingProfile) {
    panelContent = (
      <SynastryMapForm
        onCancel={() => setAddingProfile(false)}
        onCreated={async (profileId) => {
          await onProfileCreated(profileId);
          setSecondId(profileId);
          setAddingProfile(false);
        }}
      />
    );
  } else if (profiles.length < 2) {
    panelContent = (
      <div className="module-empty">
        <strong>Adicione um segundo mapa para comparar.</strong>
        <p>
          Você continuará dentro da sua conta. Basta informar os dados da outra pessoa para abrir o
          Observatório do Vínculo.
        </p>
        <button className="primary-button" type="button" onClick={() => setAddingProfile(true)}>
          Adicionar mapa para comparar
        </button>
      </div>
    );
  } else {
    let readingContent: React.ReactNode = null;
    if (firstId === secondId)
      readingContent = <p className="module-empty">Escolha dois mapas diferentes.</p>;
    else if (reading !== undefined) readingContent = <SynastryReadingView reading={reading} />;
    panelContent = (
      <>
        <div className="synastry-selectors">
          <label>
            <span>Primeiro mapa</span>
            <select value={firstId} onChange={(event) => setFirstId(event.target.value)}>
              {profiles.map((profile) => (
                <option value={profile.id} key={profile.id}>
                  {profile.displayName}
                </option>
              ))}
            </select>
          </label>
          <span aria-hidden="true">×</span>
          <label>
            <span>Segundo mapa</span>
            <select value={secondId} onChange={(event) => setSecondId(event.target.value)}>
              {profiles.map((profile) => (
                <option value={profile.id} key={profile.id}>
                  {profile.displayName}
                </option>
              ))}
            </select>
          </label>
        </div>
        <button
          className="quiet-button synastry-add-map"
          type="button"
          onClick={() => setAddingProfile(true)}
        >
          Adicionar outro mapa
        </button>
        {readingContent}
      </>
    );
  }

  return (
    <section className="synastry-panel" id="sinastria" aria-labelledby="synastry-title">
      <header>
        <div>
          <p className="eyebrow">Dois céus em diálogo</p>
          <h2 id="synastry-title">Sinastria</h2>
        </div>
        <p>
          Uma leitura guiada de identidade, emoções, afeto, desejo, compromisso, transformação e
          propósito, calculada com orbe máximo de 6°.
        </p>
      </header>
      {panelContent}
      <p className="module-disclaimer">
        Esta leitura descreve tensões e facilidades simbólicas; não mede amor, consentimento ou
        qualidade de vínculo.
      </p>
    </section>
  );
}

function SynastryReadingView({
  reading,
}: Readonly<{ reading: ReturnType<typeof buildSynastryReading> }>): React.JSX.Element {
  return (
    <article className="synastry-reading" aria-labelledby="synastry-reading-title">
      <header className="synastry-reading-opening">
        <p className="eyebrow">Observatório do Vínculo</p>
        <h3 id="synastry-reading-title">{reading.title}</h3>
        <p>{reading.introduction}</p>
        <dl>
          <div>
            <dt>Fluxos naturais</dt>
            <dd>{reading.supportiveCount}</dd>
          </div>
          <div>
            <dt>Portais de crescimento</dt>
            <dd>{reading.growthCount}</dd>
          </div>
        </dl>
      </header>
      <div className="synastry-theme-list">
        {reading.themes.map((theme) => (
          <section className="synastry-theme" key={theme.id} aria-labelledby={`theme-${theme.id}`}>
            <div className="synastry-theme-intro">
              <p>{theme.subtitle}</p>
              <h4 id={`theme-${theme.id}`}>{theme.title}</h4>
              <p>{theme.introduction}</p>
            </div>
            {theme.aspects.length === 0 ? (
              <p className="synastry-theme-empty">
                Nenhum aspecto maior aparece neste capítulo dentro do orbe de 6°. A dinâmica existe,
                mas não é uma das vozes dominantes desta leitura.
              </p>
            ) : (
              <div className="synastry-aspect-readings">
                {theme.aspects.map((aspect) => (
                  <article
                    className="synastry-aspect-reading"
                    data-tone={aspect.tone}
                    key={`${theme.id}-${aspect.firstBody}-${aspect.secondBody}-${aspect.type}`}
                  >
                    <div className="synastry-aspect-heading">
                      <span>{aspect.type}</span>
                      <small>orbe {aspect.orb.toFixed(2)}°</small>
                    </div>
                    <h5>{aspect.headline}</h5>
                    <p>{aspect.meaning}</p>
                    <p>{aspect.livedExperience}</p>
                    <blockquote>{aspect.invitation}</blockquote>
                  </article>
                ))}
              </div>
            )}
          </section>
        ))}
      </div>
    </article>
  );
}
