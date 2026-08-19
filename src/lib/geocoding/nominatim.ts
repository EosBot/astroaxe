import { z } from "zod";
import tzlookup from "tz-lookup";

import { getRedis } from "@/lib/redis";

const nominatimItemSchema = z.object({
  display_name: z.string(),
  lat: z.string(),
  lon: z.string(),
  type: z.string(),
});

const nominatimResponseSchema = z.array(nominatimItemSchema).max(5);

export interface PlaceCandidate {
  label: string;
  latitude: number;
  longitude: number;
  timezone: string;
}

export async function searchBirthplaces(
  query: string,
  userAgent: string,
): Promise<PlaceCandidate[]> {
  const normalized = query.normalize("NFC").trim().replace(/\s+/g, " ").toLocaleLowerCase("pt-BR");
  const redis = getRedis();
  const cacheKey = `v1:geo:${normalized}`;
  const cached = await redis.get(cacheKey);
  if (cached !== null)
    return z
      .array(
        z.object({
          label: z.string(),
          latitude: z.number(),
          longitude: z.number(),
          timezone: z.string(),
        }),
      )
      .parse(JSON.parse(cached));

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", normalized);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("addressdetails", "0");
  url.searchParams.set("limit", "5");
  url.searchParams.set("featuretype", "settlement");

  const response = await fetch(url, {
    headers: { "Accept-Language": "pt-BR,pt;q=0.9", "User-Agent": userAgent },
    signal: AbortSignal.timeout(5000),
  });
  if (!response.ok) throw new Error(`Geocoder respondeu com status ${response.status}.`);
  const items = nominatimResponseSchema.parse(await response.json());
  const candidates = items.flatMap((item) => {
    const latitude = Number(item.lat);
    const longitude = Number(item.lon);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return [];
    return [
      { label: item.display_name, latitude, longitude, timezone: tzlookup(latitude, longitude) },
    ];
  });
  await redis.set(cacheKey, JSON.stringify(candidates), "EX", 30 * 24 * 60 * 60);
  return candidates;
}
