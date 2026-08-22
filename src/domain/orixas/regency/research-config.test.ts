import { describe, expect, it } from "vitest";

import { regencyScoringConfigSchema } from "./scorer";
import { regencyResearchConfig } from "./research-config";

describe("regency research scoring configuration", () => {
  it("keeps experimental role lenses valid, sourced and explicitly unvalidated", () => {
    expect(regencyScoringConfigSchema.parse(regencyResearchConfig)).toEqual(regencyResearchConfig);
    expect(regencyResearchConfig.status).toBe("research");
    expect(regencyResearchConfig.rules.every((rule) => rule.structuralSourceIds.length > 0)).toBe(
      true,
    );
  });

  it("separates ascendant and imum coeli role lenses", () => {
    expect(
      regencyResearchConfig.rules.find(({ id }) => id === "front-ascendant-sign"),
    ).toMatchObject({ role: "front", featureKeyPrefix: "angle:ascendant:sign:" });
    expect(
      regencyResearchConfig.rules.find(({ id }) => id === "back-imum-coeli-sign"),
    ).toMatchObject({ role: "back", featureKeyPrefix: "angle:imum_coeli:sign:" });
  });

  it("limits planetary time resonance to the natal context", () => {
    const temporalRules = regencyResearchConfig.rules.filter(
      ({ matchMode }) => matchMode === "planetary_resonance",
    );
    expect(temporalRules).toHaveLength(2);
    expect(temporalRules.every(({ temporalScope }) => temporalScope === "birth")).toBe(true);
  });
});
