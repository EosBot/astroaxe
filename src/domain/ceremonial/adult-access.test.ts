import { describe, expect, it } from "vitest";

import {
  ADULT_ATTESTATION_TEXT,
  ADULT_ATTESTATION_VERSION,
  adultAttestationInputSchema,
  ageOn,
  evaluateAdultAccess,
} from "./adult-access";

const HOJE = "2026-09-02";

function decisao(overrides: Partial<Parameters<typeof evaluateAdultAccess>[0]> = {}) {
  return evaluateAdultAccess({
    birthDate: "2000-01-01",
    attestedAt: "2026-09-02T00:00:00.000Z",
    attestationVersion: ADULT_ATTESTATION_VERSION,
    on: HOJE,
    ...overrides,
  });
}

describe("acesso adulto por declaração", () => {
  it("libera quem declarou e tem 18 anos completos", () => {
    expect(decisao()).toEqual({ status: "cleared", basis: "self_declaration" });
  });

  it("nunca afirma que a idade foi verificada", () => {
    // É declaração da pessoa. Chamar isso de verificação emprestaria ao registro
    // uma autoridade que ele não tem, e o texto exibido diz isso em voz alta.
    expect(decisao().basis).toBe("self_declaration");
    expect(ADULT_ATTESTATION_TEXT).toContain("não verifica documentos");
    expect(ADULT_ATTESTATION_TEXT).toContain("declaração sua");
  });

  it("barra quem não declarou", () => {
    expect(decisao({ birthDate: null }).status).toBe("missing_declaration");
    expect(decisao({ attestedAt: null }).status).toBe("missing_declaration");
    expect(decisao({ attestationVersion: null }).status).toBe("missing_declaration");
  });

  it("barra menor de 18 pela própria data declarada", () => {
    expect(decisao({ birthDate: "2010-01-01" }).status).toBe("under_age");
  });

  it("barra declaração feita sob texto que não é mais o vigente", () => {
    // Se o texto mudou, a pessoa concordou com outra coisa.
    expect(decisao({ attestationVersion: "adult-attestation-0.9.0" }).status).toBe(
      "stale_attestation",
    );
  });

  it("conta idade por componentes de data, e acerta a véspera do aniversário", () => {
    // Dividir milissegundos por 365,25 erra em bissexto e na véspera, e aqui um
    // dia decide se a pessoa entra.
    expect(ageOn("2008-09-02", "2026-09-02")).toBe(18);
    expect(ageOn("2008-09-03", "2026-09-02")).toBe(17);
    expect(decisao({ birthDate: "2008-09-03" }).status).toBe("under_age");
    expect(decisao({ birthDate: "2008-09-02" }).status).toBe("cleared");
  });

  it("exige aceite explícito e a versão vigente na entrada", () => {
    const valido = {
      birthDate: "2000-01-01",
      attestationVersion: ADULT_ATTESTATION_VERSION,
      accepted: true,
    };
    expect(adultAttestationInputSchema.parse(valido)).toEqual(valido);

    // Aceite ausente ou falso não é declaração, e versão antiga não é a que a
    // pessoa está vendo agora.
    expect(() => adultAttestationInputSchema.parse({ ...valido, accepted: false })).toThrow();
    expect(() =>
      adultAttestationInputSchema.parse({ ...valido, attestationVersion: "outra" }),
    ).toThrow();
  });
});
