import "server-only";

import { experimentalRegencyConfig } from "./experimental-config";
import { regencyScoringConfigSchema, type RegencyScoringConfig } from "./scorer";

export const REGENCY_V2_CONFIG_VERSION = "regency-weights-0.1.0-v2-research";

const structuralSourceIds = ["source:astroaxe:role-lenses"];

export const regencyV2Config: RegencyScoringConfig = regencyScoringConfigSchema.parse({
  ...experimentalRegencyConfig,
  version: REGENCY_V2_CONFIG_VERSION,
  rules: [
    ...experimentalRegencyConfig.rules,
    numerologyRule("front-v2-birth-number", "front", 1),
    numerologyRule("head-v2-birth-number", "head", 2),
    numerologyRule("back-v2-birth-number", "back", 1),
  ],
});

function numerologyRule(id: string, role: "front" | "head" | "back", weight: number) {
  return {
    id,
    role,
    claimFactor: "birth_number" as const,
    featureCategory: "birth_number" as const,
    weight,
    structuralSourceIds,
  };
}
