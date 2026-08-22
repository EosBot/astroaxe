import { regencyScoringConfigSchema, type RegencyScoringConfig } from "./scorer";
import { astroAxePublicDecisionPolicy } from "./decision-policy";

export const REGENCY_RESEARCH_CONFIG_VERSION = "regency-weights-0.3.0-research";

const productHypothesis = ["source:astroaxe:role-lenses"];
const agrippaAndHypothesis = ["source:agrippa:occult-philosophy", ...productHypothesis];
const heptameronAndHypothesis = ["source:heptameron", ...productHypothesis];

/**
 * Pesos iniciais para calibração. Não é configuração publicável nem validada.
 */
export const regencyResearchConfig: RegencyScoringConfig = regencyScoringConfigSchema.parse({
  version: REGENCY_RESEARCH_CONFIG_VERSION,
  status: "research",
  decisionPolicy: astroAxePublicDecisionPolicy,
  selectionMinimums: {
    front: { minimumRawScore: 2, minimumEvidenceBreadth: 1 },
    head: { minimumRawScore: 2, minimumEvidenceBreadth: 1 },
    back: { minimumRawScore: 4, minimumEvidenceBreadth: 1 },
  },
  structuralSources: [
    {
      id: "source:heptameron",
      title: "Heptameron",
      url: "https://www.esotericarchives.com/solomon/heptamer.htm",
      locator: "Seções I, II e XXV",
      tradition: "ceremonial",
    },
    {
      id: "source:agrippa:occult-philosophy",
      title: "De occulta philosophia, livros II e III",
      url: "https://www.esotericarchives.com/agrippa/agrippa3.htm",
      locator: "Livro II, caps. 21–22 e 58–60; livro III, ordens celestes",
      tradition: "ceremonial",
    },
    {
      id: "source:lemegeton",
      title: "Lemegeton / Lesser Key of Solomon",
      url: "https://www.esotericarchives.com/solomon/lemegeton.htm",
      locator: "Sumário dos cinco livros; Theurgia Goetia e Ars Paulina",
      tradition: "goetia",
    },
    {
      id: "source:astroaxe:role-lenses",
      title: "Hipóteses de lentes para frente, cabeça e costas",
      localPath: "docs/knowledge/regency-method.md",
      locator: "Scorer de pesquisa 0.2.0",
      tradition: "product_hypothesis",
    },
  ],
  rules: [
    rule("front-ascendant-sign", "front", "zodiac_sign", "angle", 4, agrippaAndHypothesis, {
      featureKeyPrefix: "angle:ascendant:sign:",
    }),
    rule("front-angular-planet", "front", "planet", "angularity", 3, agrippaAndHypothesis),
    rule("front-birth-hour", "front", "planet", "planetary_hour", 2, heptameronAndHypothesis, {
      matchMode: "planetary_resonance",
      temporalScope: "birth",
    }),
    rule("head-zodiac-emphasis", "head", "zodiac_sign", "planet_sign", 3, productHypothesis),
    rule("head-planet-dignity", "head", "planet", "dignity", 4, agrippaAndHypothesis),
    rule("head-birth-day", "head", "planet", "planetary_day", 2, heptameronAndHypothesis, {
      matchMode: "planetary_resonance",
      temporalScope: "birth",
    }),
    rule("back-imum-coeli-sign", "back", "zodiac_sign", "angle", 4, agrippaAndHypothesis, {
      featureKeyPrefix: "angle:imum_coeli:sign:",
    }),
    rule("back-retrograde-planet", "back", "planet", "retrograde", 3, productHypothesis),
  ],
});

function rule(
  id: string,
  role: "front" | "head" | "back",
  claimFactor: "planet" | "zodiac_sign",
  featureCategory:
    | "planet_sign"
    | "dignity"
    | "angle"
    | "angularity"
    | "retrograde"
    | "planetary_day"
    | "planetary_hour",
  weight: number,
  structuralSourceIds: string[],
  options: {
    matchMode?: "direct" | "planetary_resonance";
    temporalScope?: "birth" | "reading";
    featureKeyPrefix?: string;
  } = {},
) {
  return { id, role, claimFactor, featureCategory, weight, structuralSourceIds, ...options };
}
