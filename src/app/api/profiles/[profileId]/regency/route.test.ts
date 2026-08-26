import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  resolveAccount: vi.fn(),
  findFirst: vi.fn(),
  getPrisma: vi.fn(),
  upsert: vi.fn(),
  deleteMany: vi.fn(),
  isSameOrigin: vi.fn(),
}));

vi.mock("@/lib/env", () => ({
  parseServerEnv: () => ({ AUTH_SESSION_SECRET: "a".repeat(32), SITE_URL: "http://localhost" }),
}));
vi.mock("@/lib/prisma", () => ({ getPrisma: mocks.getPrisma }));
vi.mock("@/lib/security/account", () => ({
  resolveAccount: mocks.resolveAccount,
  isSameOrigin: mocks.isSameOrigin,
}));

describe("protected regency result", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.isSameOrigin.mockReturnValue(true);
    mocks.resolveAccount.mockResolvedValue({ id: "owner-id" });
    mocks.findFirst.mockResolvedValue({
      id: "123e4567-e89b-42d3-a456-426614174000",
      birthDate: new Date("1990-06-10T00:00:00.000Z"),
      chart: { result: chartResult() },
    });
    mocks.upsert.mockResolvedValue({ id: "feedback-id" });
    mocks.deleteMany.mockResolvedValue({ count: 1 });
    mocks.getPrisma.mockReturnValue({
      birthProfile: { findFirst: mocks.findFirst },
      regencyFeedback: { upsert: mocks.upsert, deleteMany: mocks.deleteMany },
    });
  });

  it("returns only the public projection for an owned profile", async () => {
    const { POST } = await import("./route");
    const profileId = "123e4567-e89b-42d3-a456-426614174000";
    const response = await POST(request(profileId), {
      params: Promise.resolve({ profileId }),
    });
    const body: unknown = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(mocks.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: profileId, userId: "owner-id" } }),
    );
    expect(JSON.stringify(body)).not.toMatch(/claimId|ruleId|weight|matrixVersion|contribution/);
    expect(body).toMatchObject({ methodVersion: "AstroAxe Regências 3.0 — pesquisa aplicada" });
  });

  it("rejects a cross-origin POST before touching the database", async () => {
    mocks.isSameOrigin.mockReturnValue(false);
    const { POST } = await import("./route");
    const profileId = "123e4567-e89b-42d3-a456-426614174000";
    const response = await POST(request(profileId), { params: Promise.resolve({ profileId }) });
    expect(response.status).toBe(403);
    expect(mocks.findFirst).not.toHaveBeenCalled();
  });

  it("rejects an oversized POST payload as 413", async () => {
    const { POST } = await import("./route");
    const profileId = "123e4567-e89b-42d3-a456-426614174000";
    const oversized = new NextRequest(`http://localhost/api/profiles/${profileId}/regency`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Content-Length": "16385" },
      body: JSON.stringify({ version: "regency-questionnaire-1.0.0", answers: [] }),
    });
    const response = await POST(oversized, { params: Promise.resolve({ profileId }) });
    expect(response.status).toBe(413);
    expect(mocks.findFirst).not.toHaveBeenCalled();
  });

  it("returns a sanitized 503 when the stored chart cannot be parsed", async () => {
    mocks.findFirst.mockResolvedValue({
      id: "123e4567-e89b-42d3-a456-426614174000",
      birthDate: new Date("1990-06-10T00:00:00.000Z"),
      chart: { result: { not: "a chart" } },
    });
    const { POST } = await import("./route");
    const profileId = "123e4567-e89b-42d3-a456-426614174000";
    const response = await POST(request(profileId), { params: Promise.resolve({ profileId }) });
    expect(response.status).toBe(503);
    const body: unknown = await response.json();
    expect(JSON.stringify(body)).not.toMatch(/ZodError|stack/i);
  });

  it("withdraws a matching feedback and returns 204", async () => {
    const { DELETE } = await import("./route");
    const profileId = "123e4567-e89b-42d3-a456-426614174000";
    const response = await DELETE(deleteRequest(profileId), {
      params: Promise.resolve({ profileId }),
    });
    expect(response.status).toBe(204);
    expect(mocks.deleteMany).toHaveBeenCalledWith({
      where: {
        birthProfileId: profileId,
        birthProfile: { userId: "owner-id" },
        methodVersion: "AstroAxe Regências 3.0 — pesquisa aplicada",
        questionnaireVersion: "regency-questionnaire-1.0.0",
      },
    });
  });

  it("returns 404 without deleting when nothing matches (non-owner or unknown feedback)", async () => {
    mocks.deleteMany.mockResolvedValue({ count: 0 });
    const { DELETE } = await import("./route");
    const profileId = "123e4567-e89b-42d3-a456-426614174000";
    const response = await DELETE(deleteRequest(profileId), {
      params: Promise.resolve({ profileId }),
    });
    expect(response.status).toBe(404);
  });

  it("rejects a cross-origin DELETE before touching the database", async () => {
    mocks.isSameOrigin.mockReturnValue(false);
    const { DELETE } = await import("./route");
    const profileId = "123e4567-e89b-42d3-a456-426614174000";
    const response = await DELETE(deleteRequest(profileId), {
      params: Promise.resolve({ profileId }),
    });
    expect(response.status).toBe(403);
    expect(mocks.deleteMany).not.toHaveBeenCalled();
  });

  it("rejects an unversioned DELETE query as 400", async () => {
    const { DELETE } = await import("./route");
    const profileId = "123e4567-e89b-42d3-a456-426614174000";
    const request = new NextRequest(
      `http://localhost/api/profiles/${profileId}/regency?methodVersion=wrong`,
      { method: "DELETE" },
    );
    const response = await DELETE(request, { params: Promise.resolve({ profileId }) });
    expect(response.status).toBe(400);
    expect(mocks.deleteMany).not.toHaveBeenCalled();
  });

  it("does not calculate without an authenticated owner", async () => {
    mocks.resolveAccount.mockResolvedValue(null);
    const { POST } = await import("./route");
    const response = await POST(request("123e4567-e89b-42d3-a456-426614174000"), {
      params: Promise.resolve({ profileId: "123e4567-e89b-42d3-a456-426614174000" }),
    });
    expect(response.status).toBe(401);
    expect(mocks.findFirst).not.toHaveBeenCalled();
  });

  it("stores a consented correction as a versioned calibration example", async () => {
    const { PUT } = await import("./route");
    const profileId = "123e4567-e89b-42d3-a456-426614174000";
    const response = await PUT(feedbackRequest(profileId), {
      params: Promise.resolve({ profileId }),
    });
    expect(response.status).toBe(201);
    expect(mocks.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          birthProfileId: profileId,
          verdict: "polarity_inverted",
          knowsOrisas: true,
          correctedTriad: { front: "orisa:oya", head: null, back: null },
        }),
      }),
    );
  });
});

function request(profileId: string) {
  return new NextRequest(`http://localhost/api/profiles/${profileId}/regency`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      version: "regency-questionnaire-1.0.0",
      answers: ["faith", "love", "knowledge", "justice", "law", "evolution", "generation"].map(
        (questionId) => ({ questionId, value: "both" }),
      ),
    }),
  });
}

function deleteRequest(profileId: string) {
  const query = new URLSearchParams({
    methodVersion: "AstroAxe Regências 3.0 — pesquisa aplicada",
    questionnaireVersion: "regency-questionnaire-1.0.0",
  });
  return new NextRequest(`http://localhost/api/profiles/${profileId}/regency?${query}`, {
    method: "DELETE",
    headers: { Origin: "http://localhost" },
  });
}

function feedbackRequest(profileId: string) {
  return new NextRequest(`http://localhost/api/profiles/${profileId}/regency`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Origin: "http://localhost" },
    body: JSON.stringify({
      methodVersion: "AstroAxe Regências 3.0 — pesquisa aplicada",
      questionnaire: questionnaireBody(),
      verdict: "polarity_inverted",
      knowsOrisas: true,
      correctedTriad: { front: "orisa:oya", head: null, back: null },
      confirmationBasis: "buzios_or_oracle",
      consent: true,
      consentVersion: "regency-feedback-consent-1.0",
    }),
  });
}

function questionnaireBody() {
  return {
    version: "regency-questionnaire-1.0.0",
    answers: ["faith", "love", "knowledge", "justice", "law", "evolution", "generation"].map(
      (questionId) => ({ questionId, value: "both" }),
    ),
  };
}

function chartResult() {
  const ids = [
    "sun",
    "moon",
    "mercury",
    "venus",
    "mars",
    "jupiter",
    "saturn",
    "uranus",
    "neptune",
    "pluto",
  ];
  return {
    mode: "untimed",
    engineVersion: "test-engine",
    configVersion: "test-config",
    inputFingerprint: "a".repeat(64),
    jdUt: 2_440_000,
    planets: ids.map((id, index) => ({
      id,
      longitude: index * 30,
      latitude: 0,
      speed: 1,
      retrograde: false,
      sign: "Aries",
      signDegree: 0,
    })),
    warnings: [],
  };
}
