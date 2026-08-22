import { describe, expect, it } from "vitest";

import { astroAxePublicDecisionPolicy, regencyDecisionPolicySchema } from "./decision-policy";

describe("regency decision policy", () => {
  it("is scoped, sourced and omits restricted details", () => {
    const policy = regencyDecisionPolicySchema.parse(astroAxePublicDecisionPolicy);

    expect(policy.scope.traditionId).toBe("afro-brazilian-plural");
    expect(policy.tieHandling).toBe("require_tradition_confirmation");
    expect(policy.ancestralRole).toBe("optional");
    expect(policy.requiresPractitionerReview).toBe(true);
    expect(policy.restrictedDetailsOmitted).toBe(true);
    expect(policy.publicSources).toHaveLength(3);
  });

  it("rejects a policy without public provenance", () => {
    expect(() =>
      regencyDecisionPolicySchema.parse({ ...astroAxePublicDecisionPolicy, publicSources: [] }),
    ).toThrow();
  });
});
