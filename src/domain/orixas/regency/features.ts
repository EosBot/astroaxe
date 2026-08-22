import type { WesternChartEnvelope } from "@/domain/astrology/western/contracts";

export const REGENCY_FEATURE_VERSION = "regency-features-0.2.0";

const SIGNS = [
  "aries",
  "taurus",
  "gemini",
  "cancer",
  "leo",
  "virgo",
  "libra",
  "scorpio",
  "sagittarius",
  "capricorn",
  "aquarius",
  "pisces",
] as const;

const ELEMENT_BY_SIGN = {
  aries: "fire",
  taurus: "earth",
  gemini: "air",
  cancer: "water",
  leo: "fire",
  virgo: "earth",
  libra: "air",
  scorpio: "water",
  sagittarius: "fire",
  capricorn: "earth",
  aquarius: "air",
  pisces: "water",
} as const;

const MODALITY_BY_SIGN = {
  aries: "cardinal",
  taurus: "fixed",
  gemini: "mutable",
  cancer: "cardinal",
  leo: "fixed",
  virgo: "mutable",
  libra: "cardinal",
  scorpio: "fixed",
  sagittarius: "mutable",
  capricorn: "cardinal",
  aquarius: "fixed",
  pisces: "mutable",
} as const;

const DOMICILES: Record<string, readonly string[]> = {
  sun: ["leo"],
  moon: ["cancer"],
  mercury: ["gemini", "virgo"],
  venus: ["taurus", "libra"],
  mars: ["aries", "scorpio"],
  jupiter: ["sagittarius", "pisces"],
  saturn: ["capricorn", "aquarius"],
};

const EXALTATIONS: Record<string, string> = {
  sun: "aries",
  moon: "taurus",
  mercury: "virgo",
  venus: "pisces",
  mars: "capricorn",
  jupiter: "cancer",
  saturn: "libra",
};

export type RegencyFeatureCategory =
  | "planet_sign"
  | "element"
  | "modality"
  | "decan"
  | "retrograde"
  | "dignity"
  | "house"
  | "angle"
  | "angularity"
  | "aspect";

export interface RegencyAstrologicalFeature {
  key: string;
  category: RegencyFeatureCategory;
  value: string;
  body?: string;
  strength: number;
  requiresBirthTime: boolean;
}

export function extractRegencyAstrologicalFeatures(
  chart: WesternChartEnvelope,
): RegencyAstrologicalFeature[] {
  const features = chart.planets.flatMap((planet) => planetFeatures(planet));
  if (chart.houses !== undefined) {
    const angles = [
      ["ascendant", chart.houses.ascendant],
      ["midheaven", chart.houses.midheaven],
      ["descendant", normalizeLongitude(chart.houses.ascendant + 180)],
      ["imum_coeli", normalizeLongitude(chart.houses.midheaven + 180)],
    ] as const;
    for (const [angle, longitude] of angles) {
      const sign = signAt(longitude);
      features.push(
        feature(`angle:${angle}:sign:${sign}`, "angle", sign, 1, true),
        feature(
          `angle:${angle}:element:${ELEMENT_BY_SIGN[sign]}`,
          "element",
          ELEMENT_BY_SIGN[sign],
          1,
          true,
        ),
        feature(
          `angle:${angle}:modality:${MODALITY_BY_SIGN[sign]}`,
          "modality",
          MODALITY_BY_SIGN[sign],
          1,
          true,
        ),
        feature(`angle:${angle}:decan:${decanAt(longitude)}`, "decan", decanAt(longitude), 1, true),
      );
    }
    for (const planet of chart.planets) {
      const house = houseAt(planet.longitude, chart.houses.cusps);
      features.push(
        feature(`planet:${planet.id}:house:${house}`, "house", house, 1, true, planet.id),
      );
      const angularity = angularityStrength(
        planet.longitude,
        angles.map(([, value]) => value),
      );
      let angularityKind = "cadent";
      if (angularity >= 0.75) angularityKind = "angular";
      else if (angularity >= 0.4) angularityKind = "succedent";
      features.push(
        feature(
          `planet:${planet.id}:angularity`,
          "angularity",
          angularityKind,
          angularity,
          true,
          planet.id,
        ),
      );
    }
  }
  for (const aspect of chart.aspects ?? [])
    features.push(
      feature(
        `aspect:${aspect.a}:${aspect.type}:${aspect.b}`,
        "aspect",
        aspect.type,
        clamp01(aspect.strength),
        true,
        `${aspect.a}:${aspect.b}`,
      ),
    );
  return features.sort((left, right) => left.key.localeCompare(right.key));
}

function planetFeatures(planet: WesternChartEnvelope["planets"][number]) {
  const sign = normalizeSign(planet.sign);
  const result: RegencyAstrologicalFeature[] = [
    feature(`planet:${planet.id}:sign:${sign}`, "planet_sign", sign, 1, false, planet.id),
    feature(
      `planet:${planet.id}:element:${ELEMENT_BY_SIGN[sign]}`,
      "element",
      ELEMENT_BY_SIGN[sign],
      1,
      false,
      planet.id,
    ),
    feature(
      `planet:${planet.id}:modality:${MODALITY_BY_SIGN[sign]}`,
      "modality",
      MODALITY_BY_SIGN[sign],
      1,
      false,
      planet.id,
    ),
    feature(
      `planet:${planet.id}:decan:${decanFromSignDegree(planet.signDegree)}`,
      "decan",
      decanFromSignDegree(planet.signDegree),
      1,
      false,
      planet.id,
    ),
  ];
  if (planet.retrograde)
    result.push(
      feature(`planet:${planet.id}:retrograde`, "retrograde", "true", 1, false, planet.id),
    );
  if (DOMICILES[planet.id]?.includes(sign) === true)
    result.push(
      feature(`planet:${planet.id}:dignity:domicile`, "dignity", "domicile", 1, false, planet.id),
    );
  if (EXALTATIONS[planet.id] === sign)
    result.push(
      feature(
        `planet:${planet.id}:dignity:exaltation`,
        "dignity",
        "exaltation",
        1,
        false,
        planet.id,
      ),
    );
  return result;
}

function feature(
  key: string,
  category: RegencyFeatureCategory,
  value: string,
  strength: number,
  requiresBirthTime: boolean,
  body?: string,
): RegencyAstrologicalFeature {
  return body === undefined
    ? { key, category, value, strength, requiresBirthTime }
    : { key, category, value, body, strength, requiresBirthTime };
}

function normalizeSign(value: string): keyof typeof ELEMENT_BY_SIGN {
  const normalized = value.trim().toLocaleLowerCase("en-US");
  if ((SIGNS as readonly string[]).includes(normalized))
    return normalized as keyof typeof ELEMENT_BY_SIGN;
  throw new RangeError(`Unsupported zodiac sign: ${value}`);
}

function signAt(longitude: number): keyof typeof ELEMENT_BY_SIGN {
  return SIGNS[Math.floor(normalizeLongitude(longitude) / 30)] ?? "aries";
}

function decanAt(longitude: number): string {
  return decanFromSignDegree(normalizeLongitude(longitude) % 30);
}

function decanFromSignDegree(degree: number): string {
  if (!Number.isFinite(degree) || degree < 0 || degree >= 30)
    throw new RangeError("Sign degree must be between 0 and 30.");
  return String(Math.floor(degree / 10) + 1);
}

function houseAt(longitude: number, cusps: number[]): string {
  if (cusps.length !== 12) throw new RangeError("A timed chart must have twelve house cusps.");
  const point = normalizeLongitude(longitude);
  for (let index = 0; index < cusps.length; index += 1) {
    const start = normalizeLongitude(cusps[index] ?? 0);
    const end = normalizeLongitude(cusps[(index + 1) % cusps.length] ?? 0);
    if (forwardDistance(start, point) < forwardDistance(start, end)) return String(index + 1);
  }
  return "12";
}

function angularityStrength(longitude: number, angles: readonly number[]): number {
  const distance = Math.min(...angles.map((angle) => circularDistance(longitude, angle)));
  return clamp01(1 - distance / 30);
}

function circularDistance(left: number, right: number): number {
  const distance = Math.abs(normalizeLongitude(left) - normalizeLongitude(right));
  return Math.min(distance, 360 - distance);
}

function forwardDistance(start: number, end: number): number {
  return normalizeLongitude(end - start);
}

function normalizeLongitude(value: number): number {
  return ((value % 360) + 360) % 360;
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}
