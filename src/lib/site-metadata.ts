import { z } from "zod";

const absoluteHttpUrlSchema = z.url().refine((value) => {
  const protocol = new URL(value).protocol;
  return protocol === "http:" || protocol === "https:";
});

export function getSiteUrl(): URL {
  const configured = process.env.SITE_URL ?? "http://localhost";
  return new URL(absoluteHttpUrlSchema.parse(configured));
}

export function serializeJsonLd(value: unknown): string {
  return JSON.stringify(value).replaceAll("<", String.raw`\u003c`);
}
