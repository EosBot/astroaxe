import { describe, expect, it } from "vitest";

import {
  evaluateReleaseApprovals,
  PLANNER_REQUIRED_APPROVALS,
  RELEASE_REQUIRED_APPROVALS,
  type ReleaseApproval,
} from "./release-approval";
import { declaredReleaseApprovals } from "./release-approval-data";

const HOJE = "2026-09-01";

function aprovacao(overrides: Partial<ReleaseApproval> = {}): ReleaseApproval {
  return {
    id: "approval:fixture",
    type: "sensitive_data_governance",
    scope: "Escopo de fixture.",
    reviewerRole: "product_owner",
    declaredOn: "2026-09-01",
    expiresOn: null,
    revokedOn: null,
    legalBasis: null,
    caveat: null,
    ...overrides,
  };
}

describe("aprovações de release", () => {
  it("libera o planejador com o que o responsável declarou", () => {
    const resultado = evaluateReleaseApprovals({
      approvals: declaredReleaseApprovals,
      required: PLANNER_REQUIRED_APPROVALS,
      on: HOJE,
    });

    expect(resultado.status).toBe("cleared");
    expect(resultado.missing).toEqual([]);
  });

  it("libera a prontidão de release quando os cinco controles existem", () => {
    const resultado = evaluateReleaseApprovals({
      approvals: declaredReleaseApprovals,
      required: RELEASE_REQUIRED_APPROVALS,
      on: HOJE,
    });

    // Cada aprovação foi emitida depois que o controle passou a existir. Com os
    // cinco no código, a prontidão de release deixa de estar bloqueada por
    // aprovação — o que resta é o checkpoint em ambiente real.
    expect(resultado.status).toBe("cleared");
    expect(resultado.missing).toEqual([]);
  });

  it("registra a base legal declarada junto com a ressalva do momento", () => {
    const base = declaredReleaseApprovals.find(({ type }) => type === "legal_basis");

    expect(base?.legalBasis).toBe("signup_consent");
    // A ressalva vive no registro para que revisar a base seja trocar uma versão,
    // e não refazer a arqueologia da decisão.
    expect(base?.caveat).toContain("art. 11");
    expect(base?.caveat).toContain("específico e destacado");
  });

  it("bloqueia por revogação e por vencimento com o mesmo peso", () => {
    const revogada = evaluateReleaseApprovals({
      approvals: [aprovacao({ revokedOn: "2026-08-30" })],
      required: ["sensitive_data_governance"],
      on: HOJE,
    });
    const vencida = evaluateReleaseApprovals({
      approvals: [aprovacao({ expiresOn: "2026-08-30" })],
      required: ["sensitive_data_governance"],
      on: HOJE,
    });

    // Tratar "venceu" como menos grave que "nunca houve" transformaria prazo em
    // sugestão.
    expect(revogada.status).toBe("blocked");
    expect(revogada.revoked).toEqual(["sensitive_data_governance"]);
    expect(vencida.status).toBe("blocked");
    expect(vencida.expired).toEqual(["sensitive_data_governance"]);
  });

  it("aceita aprovação que ainda não venceu e recusa escopo vazio", () => {
    expect(
      evaluateReleaseApprovals({
        approvals: [aprovacao({ expiresOn: "2026-12-31" })],
        required: ["sensitive_data_governance"],
        on: HOJE,
      }).status,
    ).toBe("cleared");

    // Escopo vago não é aprovação.
    expect(() =>
      evaluateReleaseApprovals({
        approvals: [{ ...aprovacao(), scope: "" }],
        required: ["sensitive_data_governance"],
        on: HOJE,
      }),
    ).toThrow();
  });

  it("não guarda nome nem credencial de quem aprovou", () => {
    for (const approval of declaredReleaseApprovals) {
      expect(["product_owner", "legal_counsel", "cultural_council"]).toContain(
        approval.reviewerRole,
      );
      expect(Object.keys(approval)).not.toContain("reviewerName");
    }
  });

  it("registra que o acesso adulto é atestação, e não verificação", () => {
    const adulto = declaredReleaseApprovals.find(({ type }) => type === "adult_access");

    expect(adulto?.caveat).toContain("atestação, não verificação");
    expect(adulto?.caveat).toContain("Não existe caminho gratuito");
    // O escopo diz o que cobre e o que não cobre, para que ninguém leia mais do
    // que foi aprovado.
    expect(adulto?.scope).toContain("não cobre verificação de identidade");
  });
});
