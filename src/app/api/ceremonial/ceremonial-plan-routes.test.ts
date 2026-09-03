import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const KEYRING = JSON.stringify({
  keys: [{ version: 1, material: "iAK5IMitVrSgtMEO5Es8PCr/Gnj64OdG7SmtuS87ETw=", state: "active" }],
});

const mocks = vi.hoisted(() => ({
  resolveAccount: vi.fn(),
  isSameOrigin: vi.fn(),
  getPrisma: vi.fn(),
  planCreate: vi.fn(),
  planFindMany: vi.fn(),
  planFindFirst: vi.fn(),
  planDeleteMany: vi.fn(),
  userFindUnique: vi.fn(),
  transaction: vi.fn(),
  sessionFindMany: vi.fn(),
  tombstoneCreateMany: vi.fn(),
  keyring: { value: "" as string | undefined },
}));

vi.mock("@/lib/env", () => ({
  parseServerEnv: () => ({
    AUTH_SESSION_SECRET: "a".repeat(32),
    SITE_URL: "http://localhost",
    CEREMONIAL_RECORD_KEYRING: mocks.keyring.value,
  }),
}));
vi.mock("@/lib/prisma", () => ({ getPrisma: mocks.getPrisma }));
vi.mock("@/lib/security/account", () => ({
  resolveAccount: mocks.resolveAccount,
  isSameOrigin: mocks.isSameOrigin,
}));

const { GET, POST } = await import("./plans/route");
const { DELETE } = await import("./plans/[planId]/route");

const OWNER = "11111111-1111-4111-8111-111111111111";
const PLAN_ID = "22222222-2222-4222-8222-222222222222";

function jsonRequest(body: unknown) {
  return new NextRequest("http://localhost/api/ceremonial/plans", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

const PLANO_VALIDO = {
  title: "Estudo do Heptameron",
  intention: "Ler a seção de eleição com calma",
  goalCategory: "study",
  target: "self",
};

describe("rotas de plano cerimonial", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.keyring.value = KEYRING;
    mocks.isSameOrigin.mockReturnValue(true);
    mocks.resolveAccount.mockResolvedValue({ id: OWNER });
    mocks.planFindMany.mockResolvedValue([]);
    mocks.planDeleteMany.mockResolvedValue({ count: 1 });
    mocks.sessionFindMany.mockResolvedValue([]);
    mocks.tombstoneCreateMany.mockResolvedValue({ count: 1 });
    // A exclusão roda em transação: apagar e sepultar precisam acontecer juntos.
    mocks.transaction.mockImplementation((fn: (tx: unknown) => unknown) =>
      Promise.resolve(
        fn({
          ceremonialPlan: { deleteMany: mocks.planDeleteMany },
          ceremonialSession: { findMany: mocks.sessionFindMany },
          deletionTombstone: { createMany: mocks.tombstoneCreateMany },
        }),
      ),
    );
    // Titular adulto declarado: o portão da task 39 é atestação, e sem ela as
    // rotas respondem 403.
    mocks.userFindUnique.mockResolvedValue({
      birthDate: new Date("1990-01-01T00:00:00.000Z"),
      adultAttestedAt: new Date("2026-09-02T00:00:00.000Z"),
      adultAttestationVersion: "adult-attestation-1.0.0",
    });
    mocks.getPrisma.mockReturnValue({
      user: { findUnique: mocks.userFindUnique },
      $transaction: mocks.transaction,
      ceremonialSession: { findMany: mocks.sessionFindMany },
      deletionTombstone: { createMany: mocks.tombstoneCreateMany },
      ceremonialPlan: {
        create: mocks.planCreate,
        findMany: mocks.planFindMany,
        findFirst: mocks.planFindFirst,
        deleteMany: mocks.planDeleteMany,
      },
    });
  });

  it("recusa quem não entrou", async () => {
    mocks.resolveAccount.mockResolvedValue(null);
    expect((await GET(new NextRequest("http://localhost/api/ceremonial/plans"))).status).toBe(401);
  });

  it("responde 503 e não grava quando o keyring não está configurado", async () => {
    mocks.keyring.value = undefined;
    const response = await POST(jsonRequest(PLANO_VALIDO));

    // Guardar em claro "só até configurarem" é como esses dados vazam.
    expect(response.status).toBe(503);
    expect(mocks.planCreate).not.toHaveBeenCalled();
  });

  it("recusa origem cruzada nas escritas", async () => {
    mocks.isSameOrigin.mockReturnValue(false);
    expect((await POST(jsonRequest(PLANO_VALIDO))).status).toBe(403);
    expect(mocks.planCreate).not.toHaveBeenCalled();
  });

  it("aplica a política de orientação antes de gravar", async () => {
    const response = await POST(
      jsonRequest({ ...PLANO_VALIDO, goalCategory: "coercion", target: "non_consenting_person" }),
    );

    // Recusar depois de gravar deixaria no banco exatamente o que a política
    // existe para não aceitar.
    expect(response.status).toBe(422);
    expect(mocks.planCreate).not.toHaveBeenCalled();
  });

  it("grava cifrado e devolve o plano decifrado", async () => {
    mocks.planCreate.mockImplementation(({ data }: { data: Record<string, unknown> }) =>
      Promise.resolve({
        id: data.id,
        titleEnvelope: data.titleEnvelope,
        intentionEnvelope: data.intentionEnvelope,
        selectionEnvelope: null,
        scheduleEnvelope: null,
        createdAt: new Date("2026-09-01T00:00:00.000Z"),
        updatedAt: new Date("2026-09-01T00:00:00.000Z"),
      }),
    );

    const response = await POST(jsonRequest(PLANO_VALIDO));
    expect(response.status).toBe(201);

    const gravado = JSON.stringify(mocks.planCreate.mock.calls[0]?.[0]);
    expect(gravado).not.toContain("Heptameron");
    expect(gravado).not.toContain("calma");

    const body = (await response.json()) as { plan: { title: string; intention: string } };
    expect(body.plan.title).toBe("Estudo do Heptameron");
    expect(body.plan.intention).toBe("Ler a seção de eleição com calma");
  });

  it("lista e apaga sempre filtrando pelo dono", async () => {
    await GET(new NextRequest("http://localhost/api/ceremonial/plans"));
    expect(mocks.planFindMany.mock.calls[0]?.[0]).toMatchObject({ where: { userId: OWNER } });

    const response = await DELETE(
      new NextRequest("http://localhost/api/ceremonial/plans/" + PLAN_ID, { method: "DELETE" }),
      { params: Promise.resolve({ planId: PLAN_ID }) },
    );
    expect(response.status).toBe(204);
    // Filtrar por dono na própria consulta, em vez de conferir depois, é o que
    // impede que um id alheio chegue a tocar a linha.
    expect(mocks.planDeleteMany.mock.calls[0]?.[0]).toEqual({
      where: { id: PLAN_ID, userId: OWNER },
    });
  });

  it("não distingue plano alheio de inexistente", async () => {
    mocks.planDeleteMany.mockResolvedValue({ count: 0 });
    const response = await DELETE(
      new NextRequest("http://localhost/api/ceremonial/plans/" + PLAN_ID, { method: "DELETE" }),
      { params: Promise.resolve({ planId: PLAN_ID }) },
    );

    // Distinguir os dois confirmaria a existência de um plano alheio.
    expect(response.status).toBe(404);
  });

  it("recusa corpo grande demais antes de lê-lo", async () => {
    const grande = new NextRequest("http://localhost/api/ceremonial/plans", {
      method: "POST",
      headers: { "content-type": "application/json", "content-length": "999999" },
      body: JSON.stringify(PLANO_VALIDO),
    });

    // O guard olha o Content-Length declarado e recusa antes de trazer o corpo
    // para a memória, que é o ponto de recusar cedo.
    expect((await POST(grande)).status).toBe(413);
    expect(mocks.planCreate).not.toHaveBeenCalled();
  });

  it("recusa tipo de conteúdo que não seja JSON", async () => {
    const texto = new NextRequest("http://localhost/api/ceremonial/plans", {
      method: "POST",
      headers: { "content-type": "text/plain" },
      body: "nao e json",
    });

    expect((await POST(texto)).status).toBe(415);
    expect(mocks.planCreate).not.toHaveBeenCalled();
  });

  it("libera qualquer titular autenticado, sem portão de maioridade", async () => {
    // O portão existiu e barrava todo mundo: a declaração nunca teve tela,
    // nenhuma conta a possuía, e as ferramentas respondiam 403 a qualquer
    // titular. Quem trata idade agora é o contrato de uso.
    mocks.userFindUnique.mockResolvedValue({
      birthDate: null,
      adultAttestedAt: null,
      adultAttestationVersion: null,
    });

    expect((await POST(jsonRequest(PLANO_VALIDO))).status).toBe(201);
    expect(mocks.planCreate).toHaveBeenCalled();
  });

  it("sepulta o que apagou, na mesma transação", async () => {
    mocks.sessionFindMany.mockResolvedValue([{ id: "66666666-6666-4666-8666-666666666666" }]);

    await DELETE(
      new NextRequest("http://localhost/api/ceremonial/plans/" + PLAN_ID, { method: "DELETE" }),
      { params: Promise.resolve({ planId: PLAN_ID }) },
    );

    // Apagar sem registrar deixaria uma restauração ressuscitar o plano sem que
    // nada apontasse o erro. As sessões em cascata ganham marca própria.
    const gravados = mocks.tombstoneCreateMany.mock.calls[0]?.[0] as {
      data: { recordKind: string; recordId: string }[];
    };
    expect(gravados.data.map(({ recordKind }) => recordKind).sort()).toEqual([
      "ceremonial_plan",
      "ceremonial_session",
    ]);
    // O tombstone guarda identificador e nada do conteúdo apagado.
    expect(JSON.stringify(gravados.data)).not.toContain("Heptameron");
  });
});
