import { afterEach, describe, expect, it } from "vitest";

import { getSiteUrl, serializeJsonLd } from "./site-metadata";

const previousSiteUrl = process.env.SITE_URL;

afterEach(() => {
  if (previousSiteUrl === undefined) delete process.env.SITE_URL;
  else process.env.SITE_URL = previousSiteUrl;
});

describe("site metadata", () => {
  it("uses the configured absolute HTTP URL", () => {
    process.env.SITE_URL = "https://astroaxe.example";
    expect(getSiteUrl().href).toBe("https://astroaxe.example/");
  });

  it("rejects non-HTTP canonical origins", () => {
    process.env.SITE_URL = "javascript:alert(1)";
    expect(() => getSiteUrl()).toThrow();
  });

  it("escapes markup-significant characters in JSON-LD", () => {
    expect(serializeJsonLd({ value: "</script>" })).toBe('{"value":"\\u003c/script>"}');
  });
});
