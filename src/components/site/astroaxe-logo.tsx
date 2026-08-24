import Link from "next/link";

export function AstroAxeLogo(): React.JSX.Element {
  return (
    <Link className="astroaxe-logo" href="/" aria-label="AstroAxe — página inicial">
      <svg viewBox="0 0 64 64" role="img" aria-hidden="true">
        <circle cx="32" cy="32" r="25" />
        <path d="M32 5 38 26 59 32 38 38 32 59 26 38 5 32 26 26Z" />
        <circle cx="32" cy="32" r="6" />
        <path d="M19 19 45 45M45 19 19 45" />
      </svg>
      <span>
        <strong>AstroAxé</strong>
        <small>Observatório ritual</small>
      </span>
    </Link>
  );
}
