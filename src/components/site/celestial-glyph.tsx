/**
 * Glifos astrológicos desenhados em SVG próprio.
 *
 * A interface usava os caracteres Unicode (☉ ☾ ☿ ♀ ♂). Eles dependem da fonte
 * instalada, caem em tofu em vários sistemas, não aceitam espessura consistente
 * e não acompanham o tema. `docs/BLUEPRINT.md` §5.0 pede vetor próprio, e o
 * glifo planetário é símbolo tradicional e livre.
 *
 * Cada glifo é composto das mesmas primitivas com que a tradição os constrói —
 * círculo, cruz, crescente e seta —, e não de um traço decalcado. O desenho é
 * puramente geométrico e herda `currentColor`, então segue a cor do texto.
 *
 * Nenhum selo, ponto riscado ou símbolo sagrado entra aqui: §10.3 proíbe
 * símbolo sagrado usado como ornamento, e não existe no produto um contexto
 * cultural aprovado para eles.
 */

const STROKE = 1.7;

/** Traços de cada glifo dentro de um viewBox 24×24. */
const GLYPHS: Readonly<Record<string, React.ReactNode>> = {
  // Círculo do espírito com o ponto central.
  sun: (
    <>
      <circle cx="12" cy="12" r="6.5" />
      <circle cx="12" cy="12" r="1.1" fill="currentColor" stroke="none" />
    </>
  ),
  // Crescente: dois arcos de raios diferentes.
  moon: <path d="M15.4 4.6a8.6 8.6 0 1 0 0 14.8 6.9 6.9 0 1 1 0-14.8Z" />,
  // Crescente sobre círculo sobre cruz.
  mercury: (
    <>
      <path d="M8.4 3.2a4.2 4.2 0 0 0 7.2 0" />
      <circle cx="12" cy="11" r="4" />
      <path d="M12 15v6M9 18.2h6" />
    </>
  ),
  // Círculo sobre cruz.
  venus: (
    <>
      <circle cx="12" cy="8" r="4.6" />
      <path d="M12 12.6V21M8.6 17.6h6.8" />
    </>
  ),
  // Círculo com a seta ascendente.
  mars: (
    <>
      <circle cx="10" cy="14.2" r="4.8" />
      <path d="M13.6 10.8 19.6 4.8M14.8 4.4h5v5" />
    </>
  ),
  // Crescente ligado à cruz.
  // Arco superior descendo à direita, cruzado pela barra — a forma tradicional.
  // O arco é explícito (A) e não bezier: as tentativas com curva de controle
  // saíam angulares em tamanho pequeno.
  jupiter: (
    <>
      <path d="M5.4 9.6A4.2 4.2 0 0 1 13.8 9.6V19.4" />
      <path d="M5 19.4h13.2" />
    </>
  ),

  // Cruz sobre a curva descendente.
  saturn: (
    <>
      <path d="M8.6 3.6V12M5.4 6.6h6.4" />
      <path d="M8.6 12c4.6-1.2 7 2.4 5.4 5.6-1.1 2.2-3.6 2.6-4.8 1" />
    </>
  ),
  // Haste com braços e o círculo na base.
  uranus: (
    <>
      <path d="M12 4.4v11.2" />
      <path d="M6.4 6.4v5.2M17.6 6.4v5.2M6.4 9h11.2" />
      <circle cx="12" cy="18.4" r="2.6" />
    </>
  ),
  // Tridente sobre a cruz.
  neptune: (
    <>
      <path d="M12 5.6V21M8.4 18.6h7.2" />
      <path d="M5.4 5.2v3.4c0 4 3 6.4 6.6 6.4s6.6-2.4 6.6-6.4V5.2" />
    </>
  ),
  // Círculo dentro do crescente, sobre a cruz.
  pluto: (
    <>
      <path d="M5.6 7.4a6.4 6.4 0 0 0 12.8 0" />
      <circle cx="12" cy="7.2" r="2.9" />
      <path d="M12 13.4V21M8.6 18.4h6.8" />
    </>
  ),
  // Monograma K sobre o círculo.
  chiron: (
    <>
      <path d="M9 3.4v9.2M9 8.4l4.6-4.4M9 8.4l4.6 4.4" />
      <circle cx="11.4" cy="17.4" r="3.6" />
    </>
  ),
  // Ferradura com os dois pés.
  true_node: (
    <>
      <path d="M6.6 18.4c-2.6-3.4-2-8.2 1.4-10.4 2.4-1.6 5.6-1.6 8 0 3.4 2.2 4 7 1.4 10.4" />
      <circle cx="6" cy="20" r="1.9" />
      <circle cx="18" cy="20" r="1.9" />
    </>
  ),
  south_node: (
    <>
      <path d="M17.4 5.6c2.6 3.4 2 8.2-1.4 10.4-2.4 1.6-5.6 1.6-8 0-3.4-2.2-4-7-1.4-10.4" />
      <circle cx="6" cy="4" r="1.9" />
      <circle cx="18" cy="4" r="1.9" />
    </>
  ),
  // Crescente da lua negra sobre a cruz.
  mean_lilith: (
    <>
      <path
        d="M12 2.6a5.6 5.6 0 0 1 0 11.2 4.4 4.4 0 0 0 0-11.2Z"
        fill="currentColor"
        stroke="none"
      />
      <path d="M12 2.6a5.6 5.6 0 0 1 0 11.2" />
      <path d="M12 13.8V21.4M8.6 18.4h6.8" />
    </>
  ),
};

export const CELESTIAL_GLYPH_IDS = Object.freeze(Object.keys(GLYPHS));

export function hasCelestialGlyph(body: string): boolean {
  return body.toLowerCase() in GLYPHS;
}

/**
 * Desenha o glifo de um corpo celeste.
 *
 * Sempre decorativo: o nome do corpo já acompanha o glifo em texto em todos os
 * usos, então repeti-lo para leitor de tela só produziria leitura duplicada.
 * Corpo sem glifo desenhado não renderiza nada — um retângulo de fallback
 * sujaria a roda sem informar.
 */
export function CelestialGlyph({
  body,
  size = "1em",
}: Readonly<{ body: string; size?: string | number }>): React.JSX.Element | null {
  const drawing = GLYPHS[body.toLowerCase()];
  if (drawing === undefined) return null;
  return (
    <svg
      className="celestial-glyph"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={STROKE}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {drawing}
    </svg>
  );
}
