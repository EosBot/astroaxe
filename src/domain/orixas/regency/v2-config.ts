import "server-only";

import { experimentalRegencyConfig } from "./experimental-config";
import { regencyScoringConfigSchema, type RegencyScoringConfig } from "./scorer";

export const REGENCY_V2_CONFIG_VERSION = "regency-weights-0.3.0-astrology-primary";

const structuralSourceIds = ["source:astroaxe:role-lenses"];

export const regencyV2Config: RegencyScoringConfig = regencyScoringConfigSchema.parse({
  ...experimentalRegencyConfig,
  version: REGENCY_V2_CONFIG_VERSION,
  rules: [
    ...experimentalRegencyConfig.rules,
    numerologyRule("front-v2-birth-number", "front", 1),
    numerologyRule("head-v2-birth-number", "head", 2),
    numerologyRule("back-v2-birth-number", "back", 1),
    selfReportRule("front-v3-self-report", "front", 1),
    selfReportRule("head-v3-self-report", "head", 2),
    selfReportRule("back-v3-self-report", "back", 1),
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

function selfReportRule(id: string, role: "front" | "head" | "back", weight: number) {
  return {
    id,
    role,
    claimFactor: "self_report" as const,
    featureCategory: "self_report" as const,
    weight,
    structuralSourceIds,
  };
}
