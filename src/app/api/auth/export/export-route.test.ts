import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({ resolveAccount: vi.fn(), findUnique: vi.fn() }));

vi.mock("@/lib/env", () => ({
  parseServerEnv: () => ({ AUTH_SESSION_SECRET: "a".repeat(32) }),
}));
vi.mock("@/lib/security/account", () => ({ resolveAccount: mocks.resolveAccount }));
vi.mock("@/lib/prisma", () => ({
  getPrisma: () => ({ user: { findUnique: mocks.findUnique } }),
}));

describe("account export", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejects unauthenticated downloads before querying private data", async () => {
    mocks.resolveAccount.mockResolvedValue(null);
    const { GET } = await import("./route");
    const response = await GET(new NextRequest("http://localhost/api/auth/export"));

    expect(response.status).toBe(401);
    expect(mocks.findUnique).not.toHaveBeenCalled();
  });

  it("exports only the resolved owner without password or session hashes", async () => {
    mocks.resolveAccount.mockResolvedValue({
      id: "123e4567-e89b-42d3-a456-426614174000",
      email: "owner@example.invalid",
    });
    mocks.findUnique.mockResolvedValue({
      email: "owner@example.invalid",
      createdAt: new Date("2026-08-20T10:00:00.000Z"),
      profiles: [
        {
          id: "223e4567-e89b-42d3-a456-426614174000",
          displayName: "Perfil sintético",
          birthDate: new Date("1990-06-15T00:00:00.000Z"),
          birthTime: "08:45",
          timePrecision: "KNOWN",
          latitude: -23.5,
          longitude: -46.6,
          timezone: "America/Sao_Paulo",
          location: "Vila sintética, Brasil",
          createdAt: new Date("2026-08-20T10:01:00.000Z"),
          chart: {
            engineVersion: "engine-test",
            configVersion: "config-test",
            calculationMode: "timed",
            result: {
              mode: "timed",
              warnings: [],
              inputFingerprint: "internal-current-fingerprint",
              nested: { inputFingerprint: "internal-nested-fingerprint", publicValue: 1 },
            },
            createdAt: new Date("2026-08-20T10:02:00.000Z"),
            revisions: [
              {
                engineVersion: "engine-test",
                configVersion: "config-test",
                calculationMode: "untimed",
                result: {
                  mode: "untimed",
                  warnings: ["unknown-time"],
                  inputFingerprint: "internal-revision-fingerprint",
                },
                reason: "birth_data_updated",
                supersededAt: new Date("2026-08-20T10:03:00.000Z"),
              },
            ],
          },
          journalEntries: [
            {
              id: "323e4567-e89b-42d3-a456-426614174000",
              entryDate: new Date("2026-08-20T00:00:00.000Z"),
              content: "Versão atual sintética.",
              createdAt: new Date("2026-08-20T10:04:00.000Z"),
              updatedAt: new Date("2026-08-20T10:05:00.000Z"),
              revisions: [
                {
                  content: "Versão anterior sintética.",
                  supersededAt: new Date("2026-08-20T10:05:00.000Z"),
                },
              ],
            },
          ],
          regencyFeedbacks: [
            {
              methodVersion: "AstroAxe Regências 3.0 — pesquisa aplicada",
              matrixVersion: "0.5.0-v3",
              configVersion: "0.2.0-v3",
              scorerVersion: "0.6.0",
              questionnaireVersion: "regency-questionnaire-1.0.0",
              questionnaireAnswers: [],
              predictedTriad: { front: "orisa:ogum", head: null, back: null },
              verdict: "polarity_inverted",
              knowsOrisas: true,
              correctedTriad: { front: "orisa:oya", head: null, back: null },
              confirmationBasis: "buzios_or_oracle",
              comment: null,
              consentVersion: "regency-feedback-consent-1.0",
              createdAt: new Date("2026-08-20T10:06:00.000Z"),
              updatedAt: new Date("2026-08-20T10:06:00.000Z"),
            },
          ],
        },
      ],
    });

    const { GET } = await import("./route");
    const response = await GET(new NextRequest("http://localhost/api/auth/export"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("content-disposition")).toContain("astroaxe-conta.json");
    expect(body).toMatchObject({
      format: "astroaxe-account-export",
      version: 1,
      account: { email: "owner@example.invalid" },
      profiles: [
        {
          displayName: "Perfil sintético",
          birthDate: "1990-06-15",
          chart: { engineVersion: "engine-test" },
          chartRevisions: [{ reason: "birth_data_updated" }],
          journal: [{ revisions: [{ content: "Versão anterior sintética." }] }],
          regencyFeedback: [
            {
              verdict: "polarity_inverted",
              correctedTriad: { front: "orisa:oya" },
              matrixVersion: "0.5.0-v3",
              configVersion: "0.2.0-v3",
              scorerVersion: "0.6.0",
            },
          ],
        },
      ],
    });
    expect(JSON.stringify(body)).not.toMatch(/password|tokenHash|inputFingerprint/);
    expect(mocks.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "123e4567-e89b-42d3-a456-426614174000" } }),
    );
  });

  it("does not export a deleted account", async () => {
    mocks.resolveAccount.mockResolvedValue({ id: "deleted-owner" });
    mocks.findUnique.mockResolvedValue(null);
    const { GET } = await import("./route");
    const response = await GET(new NextRequest("http://localhost/api/auth/export"));
    expect(response.status).toBe(401);
  });

  it("returns a sanitized error when storage is unavailable", async () => {
    mocks.resolveAccount.mockResolvedValue({ id: "owner-id" });
    mocks.findUnique.mockRejectedValue(new Error("synthetic storage failure"));
    const { GET } = await import("./route");
    const response = await GET(new NextRequest("http://localhost/api/auth/export"));
    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      error: "Não foi possível exportar a conta agora.",
    });
  });
});
