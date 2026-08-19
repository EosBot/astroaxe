import { Onboarding } from "@/components/onboarding/onboarding";

export default function HomePage() {
  return (
    <main className="observatory-shell">
      <header className="brand-mark">
        <a href="#ceu">
          <span aria-hidden="true">✦</span> AstroAxe
        </a>
        <small>Observatório Ritual</small>
      </header>
      <Onboarding />
    </main>
  );
}
