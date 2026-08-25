import Link from "next/link";

import { AstroAxeLogo } from "./astroaxe-logo";

export function SiteFooter(): React.JSX.Element {
  return (
    <footer className="site-footer">
      <div className="site-footer-brand">
        <AstroAxeLogo />
        <p>Seu céu calculado, explicado com clareza e aberto à sua interpretação.</p>
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
          <span>Privacidade e controles na conta</span>
          <span>Versões e limites publicados</span>
        </div>
      </nav>
      <p className="site-footer-note">
        Regências são resultados do método autoral AstroAxe. Não confirmam identidade religiosa nem
        substituem jogo de búzios, consulta tradicional ou cuidado profissional.
      </p>
    </footer>
  );
}
