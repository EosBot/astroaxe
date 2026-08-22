import { describe, expect, it } from "vitest";

import { editorialTransitionResponse } from "@/lib/editorial/http";

describe("editorial transition responses", () => {
  it.each([
    ["forbidden", 403],
    ["not_found", 404],
    ["missing_claims", 409],
    ["invalid_state", 409],
  ] as const)("maps %s without exposing internals", async (status, expectedStatus) => {
    const response = editorialTransitionResponse({ status });
    expect(response.status).toBe(expectedStatus);
    expect(await response.json()).toHaveProperty("error");
  });
});
