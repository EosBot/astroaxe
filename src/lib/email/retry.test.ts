import { describe, expect, it } from "vitest";

import { nextEmailAttempt } from "./retry";

describe("nextEmailAttempt", () => {
  const now = new Date("2026-08-22T12:00:00Z");

  it("backs off retries with a bounded delay", () => {
    expect(nextEmailAttempt(1, now)?.toISOString()).toBe("2026-08-22T12:01:00.000Z");
    expect(nextEmailAttempt(5, now)?.toISOString()).toBe("2026-08-22T12:16:00.000Z");
  });

  it("moves the sixth failed attempt to the dead-letter state", () => {
    expect(nextEmailAttempt(6, now)).toBeNull();
  });
});
