import type { EditorialReading } from "@/domain/astrology/editorial-report";

export function ImmersiveReport({
  title,
  intro,
  readings,
}: Readonly<{ title: string; intro: string; readings: EditorialReading[] }>): React.JSX.Element {
  return (
    <section className="immersive-report" aria-labelledby={`${slug(title)}-title`}>
      <header>
        <p className="eyebrow">Caderno de interpretação · {readings.length} capítulos</p>
        <h2 id={`${slug(title)}-title`}>{title}</h2>
        <p>{intro}</p>
      </header>
      <nav aria-label={`Sumário de ${title}`}>
        <ol>
          {readings.map((reading, index) => (
            <li key={`${reading.title}-${index}`}>
              <a href={`#${slug(title)}-${index + 1}`}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                {reading.title}
              </a>
            </li>
          ))}
        </ol>
      </nav>
      <div className="immersive-report-pages">
        {readings.map((reading, index) => (
          <article id={`${slug(title)}-${index + 1}`} key={`${reading.title}-${index}`}>
            <div className="report-folio" aria-hidden="true">
              {String(index + 1).padStart(2, "0")}
            </div>
            <div>
              <p className="eyebrow">{reading.version}</p>
              <h3>{reading.title}</h3>
              <p className="report-lead">{reading.lead}</p>
              <h4>Como essa posição funciona</h4>
              <p>{reading.mechanics}</p>
              <h4>Onde você reconhece isso na vida</h4>
              <p>{reading.dailyLife}</p>
              <h4>Potência e ponto de atenção</h4>
              <p>{reading.tension}</p>
              <p>{reading.integration}</p>
              <blockquote>
                <span>Pergunta de integração</span>
                {reading.reflection}
              </blockquote>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function slug(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
