interface CelestialDashboardProps {
  profileName: string;
  profileCount: number;
  timed: boolean;
  onNavigate: (view: "map" | "cycles" | "synastry" | "biorhythm" | "orixas") => void;
}

export function CelestialDashboard({
  profileName,
  profileCount,
  timed,
  onNavigate,
}: Readonly<CelestialDashboardProps>): React.JSX.Element {
  return (
    <section className="celestial-dashboard" aria-labelledby="celestial-dashboard-title">
      <header className="celestial-dashboard-intro">
        <div>
          <p className="eyebrow">Sua central celeste</p>
          <h1 id="celestial-dashboard-title">Bem-vindo ao seu observatório, {profileName}.</h1>
        </div>
        <p>
          {profileCount === 1 ? "Um mapa salvo" : profileCount + " mapas salvos"} ·{" "}
          {timed ? "quatro ângulos calculados" : "hora natal ainda desconhecida"}
        </p>
      </header>
      <div className="celestial-module-grid">
        <button
          className="celestial-module celestial-module-featured"
          type="button"
          onClick={() => onNavigate("map")}
        >
          <span className="celestial-module-glyph" aria-hidden="true">
            ✦
          </span>
          <small>Disponível</small>
          <h2>Mapa natal completo</h2>
          <p>
            {timed
              ? "Planetas, casas, aspectos, quatro ângulos, Quíron, nodos e Lilith."
              : "Planetas, aspectos, Quíron, nodos e Lilith — sem inventar casas ou ângulos."}
          </p>
          <strong>Abrir instrumento →</strong>
        </button>
        <button className="celestial-module" type="button" onClick={() => onNavigate("cycles")}>
          <span className="celestial-module-glyph" aria-hidden="true">
            ◌
          </span>
          <small>Disponível</small>
          <h2>Horóscopo</h2>
          <p>Período atual, carreira, vínculos, espiritualidade, sombras e trânsitos.</p>
          <strong>Abrir leitura atual →</strong>
        </button>
        <button className="celestial-module" type="button" onClick={() => onNavigate("cycles")}>
          <span className="celestial-module-glyph" aria-hidden="true">
            ⌁
          </span>
          <small>Disponível</small>
          <h2>Diário celeste</h2>
          <p>Registre percepções por data em um espaço privado e exportável.</p>
          <strong>Escrever reflexão →</strong>
        </button>
        <button className="celestial-module" type="button" onClick={() => onNavigate("synastry")}>
          <span className="celestial-module-glyph" aria-hidden="true">
            ◎
          </span>
          <small>Disponível</small>
          <h2>Sinastria</h2>
          <p>Compare os aspectos pessoais de dois mapas salvos no seu arquivo.</p>
          <strong>{profileCount > 1 ? "Comparar mapas →" : "Adicionar outro mapa →"}</strong>
        </button>
        <button className="celestial-module" type="button" onClick={() => onNavigate("biorhythm")}>
          <span className="celestial-module-glyph" aria-hidden="true">
            ∿
          </span>
          <small>Disponível</small>
          <h2>Biorritmo</h2>
          <p>Observe três ciclos clássicos por uma data escolhida, com contexto crítico.</p>
          <strong>Abrir ciclos →</strong>
        </button>
        <button
          className="celestial-module celestial-module-cultural"
          type="button"
          onClick={() => onNavigate("orixas")}
        >
          <span className="celestial-module-glyph" aria-hidden="true">
            ◇
          </span>
          <small>Método autoral v2</small>
          <h2>Tríade de Regências</h2>
          <p>Explore frente, cabeça e costas com sinais explicáveis e limites declarados.</p>
          <strong>Abrir minha leitura →</strong>
        </button>
      </div>
    </section>
  );
}
