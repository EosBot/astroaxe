import { z } from "zod";

export const ANALYTICS_CONSENT_VERSION = "analytics-consent-1" as const;

const analyticsConsentSchema = z
  .object({
    version: z.literal(ANALYTICS_CONSENT_VERSION),
    analytics: z.enum(["granted", "denied"]),
    decidedAt: z.iso.datetime({ offset: true }),
  })
  .strict();

const analyticsEventSchema = z
  .object({
    name: z.enum(["onboarding_completed", "map_explanation_opened", "account_claim_completed"]),
    surface: z.enum(["onboarding", "map", "account"]),
    viewport: z.enum(["mobile", "desktop"]),
  })
  .strict();

export type AnalyticsConsent = z.infer<typeof analyticsConsentSchema>;
export type AnalyticsEvent = z.infer<typeof analyticsEventSchema>;

export function parseAnalyticsConsent(value: unknown): AnalyticsConsent {
  return analyticsConsentSchema.parse(value);
}

export function parseAnalyticsEvent(value: unknown): AnalyticsEvent {
  return analyticsEventSchema.parse(value);
}

export function mayCollectAnalytics(value: unknown, collectionEnabled: boolean): boolean {
  if (!collectionEnabled) {
    return false;
  }

  const consent = analyticsConsentSchema.safeParse(value);
  return consent.success && consent.data.analytics === "granted";
}
