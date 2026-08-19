import { describe, expect, it } from "vitest";

import { apiJson } from "./headers";

describe("apiJson", () => {
  it("adds non-cacheable API security headers and preserves custom headers", async () => {
    const response = apiJson({ ok: true }, { status: 201, headers: { "X-Test": "yes" } });
    expect(response.status).toBe(201);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("x-frame-options")).toBe("DENY");
    expect(response.headers.get("x-test")).toBe("yes");
    await expect(response.json()).resolves.toEqual({ ok: true });
  });
});
