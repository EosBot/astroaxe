import type { PrismaClient } from "@/generated/prisma/client";
import { describe, expect, it, vi } from "vitest";

import { canReview, resolveEditorialActor } from "@/lib/editorial/authorization";

describe("editorial authorization", () => {
  it("resolves only an explicitly linked contributor", async () => {
    const findUnique = vi.fn().mockResolvedValue({
      id: "123e4567-e89b-42d3-a456-426614174000",
      userId: "123e4567-e89b-42d3-a456-426614174001",
      role: "REVIEWER",
    });
    const actor = await resolveEditorialActor(
      { culturalContributor: { findUnique } } as unknown as PrismaClient,
      "123e4567-e89b-42d3-a456-426614174001",
    );
    expect(actor?.role).toBe("REVIEWER");
    if (actor === null) throw new Error("Expected a linked editorial actor.");
    expect(canReview(actor)).toBe(true);
  });

  it("does not authorize an unlinked contributor", async () => {
    const findUnique = vi.fn().mockResolvedValue(null);
    await expect(
      resolveEditorialActor(
        { culturalContributor: { findUnique } } as unknown as PrismaClient,
        "123e4567-e89b-42d3-a456-426614174001",
      ),
    ).resolves.toBeNull();
  });
});
