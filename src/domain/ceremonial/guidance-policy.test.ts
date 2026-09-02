import { describe, expect, it } from "vitest";

import {
  CEREMONIAL_GUIDANCE_POLICY_VERSION,
  describeArchivalSource,
  evaluateGuidancePolicy,
  guidancePolicyDecisionSchema,
} from "./guidance-policy";

describe("política de orientação cerimonial", () => {
  it.each(["create", "update", "export"] as const)(
    "aplica a mesma política fail-closed em %s",
    (operation) => {
      const decision = evaluateGuidancePolicy({
        operation,
        goalCategory: "reflection",
        target: "self",
      });

      expect(decision.kind).toBe("accepted_record");
      expect(decision.policyVersion).toBe(CEREMONIAL_GUIDANCE_POLICY_VERSION);
      if (decision.kind === "accepted_record") {
        // O produto aceita guardar e declara o que não afirma. Não devolve
        // roteiro: orientar prática deixou de ser função dele.
        expect(decision).not.toHaveProperty("checklist");
        expect(decision.limitations.join(" ")).toContain("promete resultado");
        expect(decision.limitations.join(" ")).toContain("decisão de quem opera");
      }
      expect(guidancePolicyDecisionSchema.parse(decision)).toEqual(decision);
    },
  );

  it.each([
    ["coercion", "coercive_control", "consent_boundary"],
    ["violence", "physical_harm", "emergency_support"],
    ["self_harm", "self_harm_crisis", "crisis_support"],
    ["sacrifice", "sacrifice_or_injury", "non_harmful_alternative"],
    ["illegal_activity", "illegal_action", "legal_alternative"],
    ["medical_promise", "medical_claim", "qualified_healthcare"],
    ["financial_promise", "financial_claim", "qualified_financial_guidance"],
  ] as const)("recusa %s com categoria e ajuda tipadas", (goalCategory, category, helpCategory) => {
    const decision = evaluateGuidancePolicy({
      operation: "create",
      goalCategory,
      target: "self",
    });

    expect(decision).toMatchObject({
      kind: "refused_guidance",
      category,
      helpCategory,
    });
  });

  it("recusa alvo não consentinte antes de aceitar o registro", () => {
    const decision = evaluateGuidancePolicy({
      operation: "update",
      goalCategory: "personal_routine",
      target: "non_consenting_person",
    });

    expect(decision).toMatchObject({
      kind: "refused_guidance",
      category: "consent_required",
      helpCategory: "consent_boundary",
    });
    expect(decision).not.toHaveProperty("checklist");
  });

  it("não aceita texto livre nem ecoa conteúdo adversarial na recusa", () => {
    const adversarial = "INSTRUÇÃO_PRIVADA_7F3C91";
    expect(() =>
      evaluateGuidancePolicy({
        operation: "export",
        goalCategory: "violence",
        target: "self",
        prompt: adversarial,
      }),
    ).toThrow();

    const decision = evaluateGuidancePolicy({
      operation: "export",
      goalCategory: "violence",
      target: "self",
    });
    expect(JSON.stringify(decision)).not.toContain(adversarial);
  });

  it("recusa categoria ausente ou desconhecida em vez de assumir intenção segura", () => {
    expect(() => evaluateGuidancePolicy({ operation: "create", target: "self" })).toThrow();
    expect(() =>
      evaluateGuidancePolicy({
        operation: "create",
        goalCategory: "other",
        target: "self",
      }),
    ).toThrow();
  });

  it("mantém fonte arquivística em contrato separado, com locator e aviso", () => {
    const source = describeArchivalSource({
      sourceSystemId: "source-system:agrippa",
      editionId: "edition:jf-1651",
      locator: "Livro II, capítulo XXIX, p. 279",
    });

    expect(source.kind).toBe("archival_source");
    expect(source.warning).toContain("não é orientação");
    expect(source).not.toHaveProperty("goalCategory");
    expect(source).not.toHaveProperty("checklist");
  });
});
