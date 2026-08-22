import { createHash } from "node:crypto";

import { Temporal } from "@js-temporal/polyfill";

import { calculateTransitSnapshot, TRANSIT_CONFIG_VERSION } from "@/domain/astrology/transits";
import type { PlanetPosition } from "@/domain/astrology/western/contracts";
import { transitSnapshotSchema, type TransitSnapshot } from "@/domain/astrology/transits/contracts";
import { getRedis } from "@/lib/redis";

const DAILY_TRANSIT_TTL_SECONDS = 3 * 24 * 60 * 60;

export async function dailyTransitSnapshot(input: {
  date: string;
  timezone: string;
  natalInputFingerprint: string;
  natalPlanets: PlanetPosition[];
  fingerprintSecret: string;
}): Promise<TransitSnapshot> {
  const instant = Temporal.ZonedDateTime.from(`${input.date}T12:00:00[${input.timezone}]`, {
    disambiguation: "reject",
  })
    .toInstant()
    .toString();
  const key = transitCacheKey(input);
  const redis = getRedis();
  const cached = await redis.get(key);
  if (cached !== null) {
    const parsed = parseCachedSnapshot(cached);
    if (parsed !== null) return parsed;
  }
  const snapshot = calculateTransitSnapshot({
    instant,
    natalInputFingerprint: input.natalInputFingerprint,
    natalPlanets: input.natalPlanets,
    fingerprintSecret: input.fingerprintSecret,
  });
  await redis.set(key, JSON.stringify(snapshot), "EX", DAILY_TRANSIT_TTL_SECONDS);
  return snapshot;
}

function parseCachedSnapshot(value: string): TransitSnapshot | null {
  try {
    const parsed = transitSnapshotSchema.safeParse(JSON.parse(value));
    return parsed.success ? parsed.data : null;
  } catch (error) {
    if (error instanceof SyntaxError) return null;
    throw error;
  }
}

export function transitCacheKey(input: {
  date: string;
  timezone: string;
  natalInputFingerprint: string;
}): string {
  const scope = createHash("sha256")
    .update(`${input.natalInputFingerprint}|${input.date}|${input.timezone}`)
    .digest("hex");
  return `v1:transit:${TRANSIT_CONFIG_VERSION}:${scope}`;
}
