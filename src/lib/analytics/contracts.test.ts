import { describe, expect, it } from "vitest";

import {
  ANALYTICS_CONSENT_VERSION,
  mayCollectAnalytics,
  parseAnalyticsConsent,
  parseAnalyticsEvent,
} from "./contracts";

const grantedConsent = {
  version: ANALYTICS_CONSENT_VERSION,
  analytics: "granted",
  decidedAt: "2026-08-20T12:00:00-03:00",
} as const;

describe("analytics consent boundary", () => {
  it("remains fail-closed while collection is disabled", () => {
    expect(mayCollectAnalytics(grantedConsent, false)).toBe(false);
  });

  it("requires a valid, current and explicit grant", () => {
    expect(mayCollectAnalytics(grantedConsent, true)).toBe(true);
    expect(mayCollectAnalytics({ ...grantedConsent, analytics: "denied" }, true)).toBe(false);
    expect(mayCollectAnalytics({ ...grantedConsent, version: "old" }, true)).toBe(false);
    expect(mayCollectAnalytics(undefined, true)).toBe(false);
  });

  it("rejects implicit timestamps and extra consent fields", () => {
    expect(() => parseAnalyticsConsent({ ...grantedConsent, decidedAt: "today" })).toThrow();
    expect(() =>
      parseAnalyticsConsent({ ...grantedConsent, email: "synthetic@example.invalid" }),
    ).toThrow();
  });
});

describe("analytics event boundary", () => {
  it("accepts only the minimal activation vocabulary", () => {
    expect(
      parseAnalyticsEvent({
        name: "onboarding_completed",
        surface: "onboarding",
        viewport: "mobile",
      }),
    ).toEqual({ name: "onboarding_completed", surface: "onboarding", viewport: "mobile" });
  });

  it("rejects identifiers and sensitive or free-form payloads", () => {
    for (const forbiddenField of ["email", "birthDate", "location", "profileId", "text"]) {
      expect(() =>
        parseAnalyticsEvent({
          name: "map_explanation_opened",
          surface: "map",
          viewport: "desktop",
          [forbiddenField]: "not-allowed",
        }),
      ).toThrow();
    }
  });
});
