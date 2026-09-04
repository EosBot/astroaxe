import {
  astrologicalAspectName,
  astrologicalBodyName,
  zodiacSignName,
} from "../../astrology/labels";

/**
 * Tradução dos fatores que sustentam um papel para linguagem pública.
 *
 * `docs/BLUEPRINT.md` §5.0 pede que a Tríade seja entregue com os fatores
 * determinantes visíveis. O que atravessa para a interface é o **fato
 * astrológico** — "Ascendente em Áries", "Marte angular" —, nunca o
 * identificador da regra, o peso aplicado ou a fonte estrutural que a sustenta.
 * A ordem preserva quanto cada fator pesou; o valor, não.
 */
export const PUBLIC_REGENCY_FACTOR_LIMIT = 4;

const ANGLE_NAMES: Readonly<Record<string, string>> = {
  ascendant: "Ascendente",
  midheaven: "Meio do Céu",
  descendant: "Descendente",
  imum_coeli: "Fundo do Céu",
};

const ELEMENT_NAMES: Readonly<Record<string, string>> = {
  fire: "Fogo",
  earth: "Terra",
  air: "Ar",
  water: "Água",
};

const MODALITY_NAMES: Readonly<Record<string, string>> = {
  cardinal: "cardinal",
  fixed: "fixo",
  mutable: "mutável",
};

const DIGNITY_NAMES: Readonly<Record<string, string>> = {
  domicile: "em domicílio",
  exaltation: "em exaltação",
};

const SOLAR_SEGMENT_NAMES: Readonly<Record<string, string>> = {
  day: "Nascimento diurno",
  night: "Nascimento noturno",
};

const NUMEROLOGY_LENS_NAMES: Readonly<Record<string, string>> = {
  "date-digit-sum-1-16-repeated": "Camada numerológica da data",
  "date-digital-root-1-9": "Raiz numerológica da data",
};

/**
 * Descreve um fator, ou devolve `null` quando ele não deve ir para a interface.
 *
 * Chave desconhecida vira `null` em vez de um rótulo genérico: exibir "fator
 * astrológico" sem dizer qual seria ruído com aparência de explicação.
 */
export function describeRegencyFactor(featureKey: string): string | null {
  const parts = featureKey.split(":");
  const describe = FACTOR_DESCRIBERS[parts[0] ?? ""];
  return describe === undefined ? null : describe(parts);
}

/** `angle:ascendant:sign:leo` e parentes. */
function describeAngle(parts: string[]): string | null {
  const angle = ANGLE_NAMES[parts[1] ?? ""];
  const value = parts[3];
  if (angle === undefined || value === undefined) return null;
  if (parts[2] === "sign") return `${angle} em ${zodiacSignName(value)}`;
  if (parts[2] === "element") return `${angle} em signo de ${ELEMENT_NAMES[value] ?? value}`;
  if (parts[2] === "modality") return `${angle} em signo ${MODALITY_NAMES[value] ?? value}`;
  if (parts[2] === "decan") return `${angle} no ${value}º decanato`;
  return null;
}

/** `planet:mars:dignity:domicile` e parentes. */
function describePlanet(parts: string[]): string | null {
  const body = astrologicalBodyName(parts[1] ?? "");
  if (parts[2] === "angularity") return `${body} angular`;
  if (parts[2] === "retrograde") return `${body} retrógrado`;

  const value = parts[3];
  if (value === undefined) return null;
  if (parts[2] === "house") return `${body} na casa ${value}`;
  if (parts[2] === "sign") return `${body} em ${zodiacSignName(value)}`;
  if (parts[2] === "element") return `${body} em signo de ${ELEMENT_NAMES[value] ?? value}`;
  if (parts[2] === "modality") return `${body} em signo ${MODALITY_NAMES[value] ?? value}`;
  if (parts[2] === "dignity") {
    const dignity = DIGNITY_NAMES[value];
    return dignity === undefined ? null : `${body} ${dignity}`;
  }
  return null;
}

/** `birth:planetary-day:mars` e parentes. */
function describeBirth(parts: string[]): string | null {
  if (parts[1] === "planetary-day" && parts[2] !== undefined)
    return `Nascimento em dia de ${astrologicalBodyName(parts[2])}`;
  if (parts[1] === "planetary-hour" && parts[3] !== undefined)
    return `Nascimento em hora de ${astrologicalBodyName(parts[3])}`;
  if (parts[1] === "solar-segment" && parts[2] !== undefined)
    return SOLAR_SEGMENT_NAMES[parts[2]] ?? null;
  return null;
}

/**
 * Despacho por família de chave.
 *
 * Tabela em vez de cadeia de `if`: cada família fica numa função com nome, e a
 * chave desconhecida cai fora sem precisar de ramo próprio. Rótulo genérico
 * seria ruído com aparência de explicação, então a ausência continua sendo
 * `null`.
 */
const FACTOR_DESCRIBERS: Readonly<Record<string, (parts: string[]) => string | null>> = {
  angle: describeAngle,
  planet: describePlanet,
  birth: describeBirth,
  aspect: (parts) =>
    parts[1] === undefined || parts[3] === undefined
      ? null
      : `${astrologicalBodyName(parts[1])} em ${astrologicalAspectName(parts[2] ?? "")} com ${astrologicalBodyName(parts[3])}`,
  numerology: (parts) => {
    const lens = NUMEROLOGY_LENS_NAMES[parts[1] ?? ""];
    return lens === undefined || parts[2] === undefined ? null : `${lens}: ${parts[2]}`;
  },
  // O autorrelato é cálculo-apenas e não é persistido. Ele aparece como
  // categoria, sem devolver a resposta que a pessoa deu.
  "self-report": () => "Movimento simbólico que você reconheceu",
};

/**
 * Os fatores que mais sustentaram um papel, do maior para o menor peso.
 *
 * Recebe as contribuições já ordenadas por peso decrescente. Rótulos repetidos
 * são colapsados — dois fatores podem descrever o mesmo fato astrológico por
 * regras diferentes, e repetir a mesma frase daria impressão de dupla
 * sustentação onde há uma.
 */
export function describeRegencyFactors(
  contributions: readonly { featureKey: string; amount: number }[],
  limit: number = PUBLIC_REGENCY_FACTOR_LIMIT,
): string[] {
  const ordered = [...contributions].sort((left, right) => right.amount - left.amount);
  const labels: string[] = [];
  for (const { featureKey } of ordered) {
    const label = describeRegencyFactor(featureKey);
    if (label === null || labels.includes(label)) continue;
    labels.push(label);
    if (labels.length === limit) break;
  }
  return labels;
}
