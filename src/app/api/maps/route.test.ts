import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  resolveAccount: vi.fn(),
  isSameOrigin: vi.fn(),
  rateLimit: vi.fn(),
  create: vi.fn(),
  sanitize: vi.fn(),
  calculate: vi.fn(),
}));
vi.mock("@/lib/env", () => ({
  parseServerEnv: () => ({
    AUTH_SESSION_SECRET: "a".repeat(32),
    GUEST_SESSION_SECRET: "g".repeat(32),
    FINGERPRINT_SECRET: "f".repeat(32),
  }),
}));
vi.mock("@/lib/security/account", () => ({
  resolveAccount: mocks.resolveAccount,
  isSameOrigin: mocks.isSameOrigin,
}));
vi.mock("@/lib/rate-limit", () => ({ enforceRateLimit: mocks.rateLimit }));
vi.mock("@/lib/prisma", () => ({ getPrisma: () => ({ birthProfile: { create: mocks.create } }) }));
vi.mock("@/lib/data-hygiene/birth-data", () => ({ sanitizeBirthData: mocks.sanitize }));
vi.mock("@/domain/astrology/western", () => ({ calculateWesternChart: mocks.calculate }));
vi.mock("@/lib/logger", () => ({ logger: { error: vi.fn() } }));

describe("map route boundary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.resolveAccount.mockResolvedValue({ id: "owner-id", email: "lu@example.test" });
    mocks.rateLimit.mockResolvedValue(true);
    mocks.isSameOrigin.mockReturnValue(true);
    mocks.sanitize.mockImplementation((input: object) => ({
      ...input,
      quality: { timeKnown: false, normalized: true },
    }));
    mocks.calculate.mockReturnValue({
      mode: "untimed",
      engineVersion: "test-engine",
      configVersion: "test-config",
      inputFingerprint: "a".repeat(64),
      jdUt: 2_440_000,
      planets: [],
      warnings: [],
    });
    mocks.create.mockResolvedValue({
      id: "123e4567-e89b-42d3-a456-426614174000",
      chart: { id: "223e4567-e89b-42d3-a456-426614174000" },
    });
  });

  it("rejects a non-JSON request before resolving an owner", async () => {
    const { POST } = await import("./route");
    const response = await POST(new NextRequest("http://localhost/api/maps", { method: "POST" }));
    expect(response.status).toBe(415);
  });

  it("rejects an oversized payload before reading it", async () => {
    const { POST } = await import("./route");
    const response = await POST(
      new NextRequest("http://localhost/api/maps", {
        method: "POST",
        headers: { "content-type": "application/json", "content-length": "16385" },
        body: "{}",
      }),
    );
    expect(response.status).toBe(413);
  });

  it("persists a valid map directly under an authenticated owner", async () => {
    const { POST } = await import("./route");
    const response = await POST(
      new NextRequest("http://localhost/api/maps", {
        method: "POST",
        headers: { "content-type": "application/json", origin: "http://localhost" },
        body: JSON.stringify({
          displayName: "Lu",
          date: "1990-06-10",
          timePrecision: "unknown",
          latitude: -12.97,
          longitude: -38.5,
          timezone: "America/Bahia",
          location: "Salvador, Bahia, Brasil",
          houseSystem: "placidus",
        }),
      }),
    );
    expect(response.status).toBe(201);
    expect(mocks.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ guestSessionId: null, userId: "owner-id" }),
      }),
    );
  });

  it("recusa criar mapa para quem não tem conta", async () => {
    mocks.resolveAccount.mockResolvedValue(null);
    const { POST } = await import("./route");
    const response = await POST(
      new NextRequest("http://localhost/api/maps", {
        method: "POST",
        headers: { "content-type": "application/json", origin: "http://localhost" },
        body: JSON.stringify({
          displayName: "Lu",
          date: "1990-06-10",
          timePrecision: "unknown",
          latitude: -12.97,
          longitude: -38.5,
          timezone: "America/Bahia",
          location: "Salvador, Bahia, Brasil",
          houseSystem: "placidus",
        }),
      }),
    );

    // O mapa é gratuito, mas guarda data, hora e lugar de nascimento. Guardar
    // isso sob uma sessão anônima cria dado pessoal sem titular — ninguém para
    // pedir exclusão nem exportação depois.
    expect(response.status).toBe(401);
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("returns a bounded validation error for invalid birth data", async () => {
    const { POST } = await import("./route");
    const response = await POST(
      new NextRequest("http://localhost/api/maps", {
        method: "POST",
        headers: { "content-type": "application/json", origin: "http://localhost" },
        body: JSON.stringify({ displayName: "" }),
      }),
    );
    expect(response.status).toBe(400);
  });

  it("recusa criação vinda de outra origem", async () => {
    // O mapa passou a nascer na conta de quem está logado. Sem esta checagem,
    // uma página de terceiro poderia criar perfis dentro da conta da pessoa
    // usando o cookie que o navegador envia sozinho.
    mocks.isSameOrigin.mockReturnValue(false);
    const { POST } = await import("./route");
    const response = await POST(
      new NextRequest("http://localhost/api/maps", {
        method: "POST",
        headers: { "content-type": "application/json", origin: "https://outro.example" },
        body: JSON.stringify({ displayName: "Lu" }),
      }),
    );

    expect(response.status).toBe(403);
    expect(mocks.create).not.toHaveBeenCalled();
  });
});
