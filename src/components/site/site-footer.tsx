import Link from "next/link";

import { AstroAxeLogo } from "./astroaxe-logo";

export function SiteFooter(): React.JSX.Element {
  return (
    <footer className="site-footer">
      <div className="site-footer-brand">
        <AstroAxeLogo />
        <p>Astrologia calculada, leitura contextualizada e espaço para escolha.</p>
      </div>
      <nav aria-label="Rodapé">
        <div>
          <strong>Explorar</strong>
          <Link href="/">Calcular mapa</Link>
          <Link href="/conta">Minha central</Link>
          <Link href="/acervo-cultural">Acervo cultural</Link>
        </div>
        <div>
          <strong>Transparência</strong>
          <Link href="/metodologia">Metodologia</Link>
          <span>Privacidade em preparação</span>
          <span>Termos em preparação</span>
        </div>
      </nav>
      <p className="site-footer-note">
        Correspondências com Orixás são interpretações culturais em pesquisa; não substituem jogo de
        búzios, orientação religiosa ou cuidado profissional.
      </p>
    </footer>
  );
}
