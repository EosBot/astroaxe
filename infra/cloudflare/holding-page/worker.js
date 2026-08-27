/**
 * Página de espera de astroaxe.net.
 *
 * Roda na borda, antes do Cloudflare Tunnel, portanto funciona enquanto a VPS de
 * produção não existe. Responde 503 com Retry-After e noindex: uma placeholder
 * devolvendo 200 seria indexada como se fosse o conteúdo real do domínio.
 *
 * Sem JavaScript no cliente, sem webfont de terceiro, sem WebGL. O readout é
 * renderizado aqui e a página permanece legível sem nenhuma dessas camadas.
 *
 * Direção visual e tokens: docs/design-references.md. Operação: docs/cloudflare-edge.md.
 */

const RETRY_AFTER_SECONDS = 86400;

const SECURITY_HEADERS = {
  "content-type": "text/html; charset=utf-8",
  "cache-control": "no-store",
  "retry-after": String(RETRY_AFTER_SECONDS),
  "x-robots-tag": "noindex, nofollow",
  "x-content-type-options": "nosniff",
  "x-frame-options": "DENY",
  "referrer-policy": "no-referrer",
  "permissions-policy": "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  "cross-origin-opener-policy": "same-origin",
  "cross-origin-resource-policy": "same-origin",
  "content-security-policy":
    "default-src 'none'; style-src 'unsafe-inline'; img-src 'self' data:; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
};

function escapeHtml(value) {
  return String(value).replace(
    /[&<>"']/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character],
  );
}

/** Deslocamento do fuso do observador, no formato UTC−3 / UTC+5:30. */
function utcOffsetLabel(now, timeZone) {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      timeZoneName: "longOffset",
    }).formatToParts(now);
    const raw = parts.find((part) => part.type === "timeZoneName")?.value ?? "";
    const match = /GMT([+-])(\d{2}):(\d{2})/.exec(raw);
    if (!match) return "UTC±0";
    const [, sign, hours, minutes] = match;
    const hour = String(Number(hours));
    return `UTC${sign === "-" ? "−" : "+"}${hour}${minutes === "00" ? "" : `:${minutes}`}`;
  } catch {
    return "UTC±0";
  }
}

/** Só devolve o que a borda já sabe da própria requisição. Nada é registrado. */
function readObserver(request) {
  const edge = request.cf ?? {};
  const city = typeof edge.city === "string" && edge.city.length > 0 ? edge.city : null;
  const region = typeof edge.country === "string" && edge.country.length > 0 ? edge.country : null;
  const timeZone =
    typeof edge.timezone === "string" && edge.timezone.length > 0 ? edge.timezone : "UTC";
  const colo = typeof edge.colo === "string" && edge.colo.length > 0 ? edge.colo : null;

  const place = city ? (region ? `${city}, ${region}` : city) : "Posição indisponível";
  return { place, timeZone, colo };
}

function render(request) {
  const now = new Date();
  const iso = now.toISOString();
  const observer = readObserver(request);
  const offset = utcOffsetLabel(now, observer.timeZone);
  const coordinate = observer.colo ? `${offset} · ${observer.colo}` : offset;

  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<meta name="theme-color" content="#070a10">
<title>AstroAxé — em construção</title>
<meta name="description" content="O observatório ainda não abriu. A aplicação entra no ar quando o servidor de produção for provisionado.">
<style>
:root {
  color-scheme: dark;
  --obsidian: #070a10;
  --night: #0b1720;
  --atlantic: #123047;
  --ink: #e9e4d9;
  --muted: #a8b0ae;
  --copper: #c47a4a;
  --aqua: #68a8a4;
  --line: rgb(104 168 164 / 24%);
  --ease-out: cubic-bezier(0.23, 1, 0.32, 1);
  --mono: ui-monospace, SFMono-Regular, "IBM Plex Mono", "SF Mono", Menlo, monospace;
}
* { box-sizing: border-box; }
html { background: var(--obsidian); }
body {
  min-height: 100vh;
  min-height: 100svh;
  margin: 0;
  overflow-x: clip;
  color: var(--ink);
  background:
    radial-gradient(circle at 68% 24%, rgb(18 48 71 / 55%), transparent 30rem),
    radial-gradient(circle at 12% 86%, rgb(196 122 74 / 9%), transparent 28rem),
    linear-gradient(135deg, var(--obsidian), var(--night));
  font-family: Inter, ui-sans-serif, system-ui, sans-serif;
  -webkit-text-size-adjust: 100%;
}
.stage {
  min-height: 100vh;
  min-height: 100svh;
  width: min(1240px, calc(100% - 2rem));
  margin: 0 auto;
  padding: 2rem 0 3rem;
  display: flex;
  flex-direction: column;
  gap: 3rem;
  justify-content: space-between;
}

/* Marca idêntica a src/components/site/astroaxe-logo.tsx */
.mark { display: inline-flex; align-items: center; gap: 0.72rem; }
.mark svg { width: 2.8rem; height: 2.8rem; overflow: visible; flex: none; }
.mark svg circle:first-child { fill: rgb(18 48 71 / 38%); stroke: var(--aqua); stroke-width: 1; }
.mark svg path:first-of-type { fill: rgb(196 122 74 / 18%); stroke: var(--copper); stroke-width: 1.3; }
.mark svg circle:last-of-type { fill: var(--obsidian); stroke: var(--ink); stroke-width: 1; }
.mark svg path:last-of-type { fill: none; stroke: rgb(233 228 217 / 52%); stroke-width: 0.8; }
.mark span { display: grid; }
.mark strong { font-family: Georgia, "Times New Roman", serif; font-size: 1.12rem; letter-spacing: 0.025em; font-weight: 400; }
.mark small { color: var(--muted); font-size: 0.62rem; letter-spacing: 0.16em; text-transform: uppercase; }

.statement { max-width: 46rem; }
.eyebrow {
  margin: 0 0 1.5rem;
  display: inline-block;
  padding: 0.35rem 0.7rem;
  border: 1px solid var(--line);
  border-radius: 6px;
  color: var(--aqua);
  font-family: var(--mono);
  font-size: 0.62rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}
h1 {
  margin: 0 0 1.25rem;
  max-width: 18ch;
  color: var(--ink);
  font-family: Georgia, "Times New Roman", serif;
  font-size: clamp(2.25rem, 7vw, 4.25rem);
  font-weight: 400;
  line-height: 1.05;
  letter-spacing: -0.015em;
}
.statement p {
  margin: 0;
  max-width: 62ch;
  color: var(--muted);
  font-size: 1rem;
  line-height: 1.6;
}

/* Assinatura: o meridiano de cobre é o eixo da página, não ornamento. */
.meridian { display: grid; gap: 1.5rem; }
.meridian-line {
  position: relative;
  height: 1px;
  background: linear-gradient(90deg, var(--copper), rgb(196 122 74 / 25%) 62%, transparent);
  transform-origin: left center;
}
.meridian-line::after {
  content: "";
  position: absolute;
  top: 50%;
  left: 0;
  width: 7px;
  height: 7px;
  margin: -3px 0 0 -3px;
  border-radius: 999px;
  background: var(--copper);
  box-shadow: 0 0 0 4px rgb(196 122 74 / 14%);
}
.readout {
  margin: 0;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, auto));
  justify-content: start;
  gap: 1.25rem 3.5rem;
  font-family: var(--mono);
}
.readout dt {
  margin: 0 0 0.45rem;
  color: var(--muted);
  font-size: 0.62rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}
.readout dd { margin: 0; font-size: 0.9rem; line-height: 1.45; }
.readout dd b { display: block; color: var(--ink); font-weight: 400; }
.readout dd span { display: block; color: var(--aqua); }
.readout .pending b, .readout .pending span { color: var(--copper); }

/* Uma única revelação, dentro da faixa de 900–1400ms da direção visual. */
@media (prefers-reduced-motion: no-preference) {
  .meridian-line { animation: draw 1100ms var(--ease-out) 260ms both; }
  .mark, .eyebrow, h1, .statement p, .readout { animation: rise 260ms var(--ease-out) both; }
  .eyebrow { animation-delay: 60ms; }
  h1 { animation-delay: 120ms; }
  .statement p { animation-delay: 180ms; }
  .readout { animation-delay: 1000ms; }
  @keyframes draw { from { transform: scaleX(0); } to { transform: scaleX(1); } }
  @keyframes rise { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
}

@media (max-width: 640px) {
  .stage { gap: 2.5rem; padding-top: 1.5rem; }
  .readout { grid-template-columns: minmax(0, 1fr); gap: 1rem; }
  h1 { max-width: none; }
}
</style>
</head>
<body>
<div class="stage">
  <header>
    <span class="mark">
      <svg viewBox="0 0 64 64" role="img" aria-label="AstroAxé">
        <circle cx="32" cy="32" r="25" />
        <path d="M32 5 38 26 59 32 38 38 32 59 26 38 5 32 26 26Z" />
        <circle cx="32" cy="32" r="6" />
        <path d="M19 19 45 45M45 19 19 45" />
      </svg>
      <span><strong>AstroAxé</strong><small>Observatório ritual</small></span>
    </span>
  </header>

  <main class="statement">
    <p class="eyebrow">Em construção</p>
    <h1>O observatório ainda não abriu.</h1>
    <p>O AstroAxé calcula mapa natal, trânsitos e a Tríade de Regências a partir de efemérides reais. A borda pública já está de pé — a aplicação entra no ar quando o servidor de produção for provisionado.</p>
  </main>

  <section class="meridian" aria-label="Estado do instrumento">
    <div class="meridian-line" aria-hidden="true"></div>
    <dl class="readout">
      <div>
        <dt>Instante UTC</dt>
        <dd><b>${escapeHtml(iso.slice(0, 10))}</b><span>${escapeHtml(iso.slice(11, 19))}Z</span></dd>
      </div>
      <div>
        <dt>Observador</dt>
        <dd><b>${escapeHtml(observer.place)}</b><span>${escapeHtml(coordinate)}</span></dd>
      </div>
      <div class="pending">
        <dt>Estado</dt>
        <dd><b>Instrumento</b><span>em montagem</span></dd>
      </div>
    </dl>
  </section>
</div>
</body>
</html>`;
}

// Nomeado em vez de exportado anonimamente: o objeto aparece com nome em stack traces, e o
// lint do repositório exige isso de todo default export.
const holdingWorker = {
  async fetch(request) {
    const { pathname } = new URL(request.url);

    if (pathname === "/robots.txt") {
      return new Response("User-agent: *\nDisallow: /\n", {
        status: 200,
        headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" },
      });
    }

    if (request.method !== "GET" && request.method !== "HEAD") {
      return new Response(null, {
        status: 503,
        headers: { "retry-after": String(RETRY_AFTER_SECONDS), allow: "GET, HEAD" },
      });
    }

    const body = render(request);
    return new Response(request.method === "HEAD" ? null : body, {
      status: 503,
      headers: SECURITY_HEADERS,
    });
  },
};

export default holdingWorker;
