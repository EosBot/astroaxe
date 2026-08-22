import { regencyResearchConfig } from "./research-config";
import { regencyScoringConfigSchema, type RegencyScoringConfig } from "./scorer";

export const EXPERIMENTAL_REGENCY_CONFIG_VERSION = "regency-weights-0.4.0-derived-research";

const sourceIds = ["source:astroaxe:role-lenses"];

export const experimentalRegencyConfig: RegencyScoringConfig = regencyScoringConfigSchema.parse({
  ...regencyResearchConfig,
  version: EXPERIMENTAL_REGENCY_CONFIG_VERSION,
  rules: [
    ...regencyResearchConfig.rules,
    rule("front-derived-element", "front", "element", "element", 2, "angle:ascendant:element:"),
    rule("front-derived-modality", "front", "modality", "modality", 2, "angle:ascendant:modality:"),
    rule("front-derived-house", "front", "house", "house", 1),
    rule("head-derived-element", "head", "element", "element", 0.5, "planet:"),
    rule("head-derived-modality", "head", "modality", "modality", 0.5, "planet:"),
    rule("head-derived-house", "head", "house", "house", 1),
    rule("back-derived-element", "back", "element", "element", 2, "angle:imum_coeli:element:"),
    rule("back-derived-modality", "back", "modality", "modality", 2, "angle:imum_coeli:modality:"),
    rule("back-derived-house", "back", "house", "house", 1),
  ],
});

function rule(
  id: string,
  role: "front" | "head" | "back",
  claimFactor: "element" | "modality" | "house",
  featureCategory: "element" | "modality" | "house",
  weight: number,
  featureKeyPrefix?: string,
) {
  return {
    id,
    role,
    claimFactor,
    featureCategory,
    weight,
    structuralSourceIds: sourceIds,
    ...(featureKeyPrefix === undefined ? {} : { featureKeyPrefix }),
  };
}
