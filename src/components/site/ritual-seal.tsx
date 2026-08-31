/**
 * Selos rituais desenhados em SVG próprio.
 *
 * `docs/BLUEPRINT.md` §5.0: símbolos, selos e pontos riscados são redesenhados
 * em vetor nosso. O símbolo é tradicional e livre; o que carrega autoria é o
 * traço de um artista numa edição específica — por isso nada aqui é decalque de
 * scan. Cada selo é uma composição autoral a partir dos elementos que as fontes
 * do acervo atribuem à entidade, e cada entrada registra o que a fundamenta.
 *
 * O desenho é geométrico e herda `currentColor`. Entidade sem selo fundamentado
 * não renderiza nada: inventar um traço para completar a grade seria exatamente
 * o que o método recusa em toda parte.
 */

const STROKE = 1.6;

interface SealDefinition {
  /** O que no acervo sustenta os elementos escolhidos. */
  readonly grounding: string;
  readonly drawing: React.ReactNode;
}

const SEALS: Readonly<Record<string, SealDefinition>> = {
  // "É o tridente da execução. No 'Ponto Riscado' apresentado, o tridente
  // quadrado está apontado…" — Quimbanda, O Culto da Chama Vermelha e Preta;
  // a encruzilhada como portal aparece na mesma obra.
  "orisa:exu": {
    grounding: "Tridente e encruzilhada, Quimbanda — O Culto da Chama Vermelha e Preta",
    drawing: (
      <>
        <path d="M11 44h42" />
        <path d="M32 50V28" />
        <path d="M21 30v-9M32 30V17M43 30v-9" />
        <path d="M21 30h22" />
        <circle cx="32" cy="32" r="21" />
      </>
    ),
  },
  // "Sua espada brilhou na Umbanda"; a onda vibratória em fileira de ferraduras
  // está descrita em Fundamentos Doutrinários de Umbanda.
  "orisa:ogum": {
    grounding: "Espada e a onda em ferradura, Fundamentos Doutrinários de Umbanda",
    drawing: (
      <>
        <path d="M32 11v25" />
        <path d="M25 22h14" />
        <path d="M32 36v8" />
        <path d="M20 49v-3.4a3.8 3.8 0 0 1 7.6 0V49M28.2 49v-3.4a3.8 3.8 0 0 1 7.6 0V49M36.4 49v-3.4a3.8 3.8 0 0 1 7.6 0V49" />
        <circle cx="32" cy="32" r="21" />
      </>
    ),
  },
  // "As flechas de Oxóssi voam pelo ar"; o caçador e o ofá.
  "orisa:oxossi": {
    grounding: "Arco e flecha, ponto cantado Flechas de Oxóssi",
    drawing: (
      <>
        <path d="M20 46 46 20M38 18h10v10" />
        <path d="M20 20c14 0 24 10 24 24" />
        <circle cx="32" cy="32" r="21" />
      </>
    ),
  },
  // "Com seu machado de duas faces / Ele faz justiça inteira" — ponto de Xangô.
  "orisa:xango": {
    grounding: "Machado de duas faces, ponto cantado Xangô é Rei",
    drawing: (
      <>
        <path d="M32 12v40" />
        <path d="M29.5 16.5 16 25l13.5 8.5" />
        <path d="M34.5 16.5 48 25l-13.5 8.5" />
        <path d="M26 52h12" />
        <circle cx="32" cy="32" r="21" />
      </>
    ),
  },
  // "Estrelinha que brilha no mar"; "Rainha das águas do mar".
  "orisa:iemanja": {
    grounding: "Estrela sobre a onda, pontos cantados Mãe Iemanjá e Na Beira da Praia",
    drawing: (
      <>
        <path d="M32 16v12M26 22l12 0M27.5 17.5 36.5 26.5M36.5 17.5 27.5 26.5" />
        <path d="M14 38c4-4 7-4 11 0s7 4 11 0 7-4 11 0" />
        <path d="M14 46c4-4 7-4 11 0s7 4 11 0 7-4 11 0" />
        <circle cx="32" cy="32" r="21" />
      </>
    ),
  },
};

export const RITUAL_SEAL_IDS = Object.freeze(Object.keys(SEALS));

export function hasRitualSeal(orisaId: string): boolean {
  return orisaId in SEALS;
}

/** O que fundamenta o selo, para auditoria e para a documentação do método. */
export function ritualSealGrounding(orisaId: string): string | undefined {
  return SEALS[orisaId]?.grounding;
}

/**
 * Desenha o selo de uma entidade, ou nada quando não existe selo fundamentado.
 *
 * Decorativo por contrato: o nome da entidade acompanha o selo em texto em
 * todos os usos, então anunciá-lo ao leitor de tela duplicaria a leitura.
 */
export function RitualSeal({
  orisaId,
  size = 64,
}: Readonly<{ orisaId: string; size?: string | number }>): React.JSX.Element | null {
  const seal = SEALS[orisaId];
  if (seal === undefined) return null;
  return (
    <svg
      className="ritual-seal"
      viewBox="0 0 64 64"
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
      {seal.drawing}
    </svg>
  );
}
