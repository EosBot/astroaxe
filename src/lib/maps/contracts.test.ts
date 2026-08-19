import { describe, expect, it } from "vitest";

import { geocodingResponseSchema } from "./contracts";

describe("map API contracts", () => {
  it("accepts bounded geocoding candidates", () => {
    expect(
      geocodingResponseSchema.parse({
        places: [
          {
            label: "Salvador, Bahia, Brasil",
            latitude: -12.97,
            longitude: -38.5,
            timezone: "America/Bahia",
          },
        ],
      }).places,
    ).toHaveLength(1);
  });

  it("rejects impossible coordinates", () => {
    expect(() =>
      geocodingResponseSchema.parse({
        places: [{ label: "Invalido", latitude: 100, longitude: 0, timezone: "UTC" }],
      }),
    ).toThrow();
  });
});
