import { describe, expect, it } from "vitest";

import { seededElectionProfiles } from "@/domain/astrology/elections/profiles";
import { resolvePlanetaryHourAt } from "@/domain/astrology/planetary-hours";
import { condenseStructuralFunctions } from "@/domain/orixas/regency/function-graph";
import { regencyFunctionGraph } from "@/domain/orixas/regency/function-graph-data";

import {
  createDomainConflictReport,
  createDomainFreezeManifest,
  createSourceCoverageReport,
  DOMAIN_FREEZE_VERSION,
  frozenDomainVersions,
} from "./domain-freeze";
import {
  duplicateLineageGraph,
  frozenGuidanceGoalCategories,
  frozenGuidanceOperations,
  frozenGuidanceTargets,
  frozenWorkspaceKinds,
  goldenCrossSystemRelations,
  goldenElectionMoments,
  goldenEntityRecords,
  goldenTimingCases,
} from "./domain-freeze-data";
import { workspaceKindSchema } from "./entity-records";
import { guidanceGoalCategorySchema, guidancePolicyInputSchema } from "./guidance-policy";

describe("congelamento do domínio cerimonial", () => {
  it("produz o mesmo manifesto a cada execução e é independente da ordem de entrada", () => {
    const first = createDomainFreezeManifest();
    const second = createDomainFreezeManifest();
    const shuffled = createDomainFreezeManifest({
      records: [...goldenEntityRecords].reverse(),
      timingCases: [...goldenTimingCases].reverse(),
      moments: [...goldenElectionMoments].reverse(),
    });

    expect(second.fingerprint).toBe(first.fingerprint);
    expect(shuffled.fingerprint).toBe(first.fingerprint);
    expect(first.freezeVersion).toBe(DOMAIN_FREEZE_VERSION);
  });

  it("cobre as cinco superfícies que a task manda congelar", () => {
    expect(createDomainFreezeManifest().surfaces.map(({ surfaceId }) => surfaceId)).toEqual([
      "elections",
      "guidance_policy",
      "planetary_timing",
      "source_variants",
      "system_discriminants",
    ]);
  });

  it("muda o fingerprint quando qualquer caso congelado muda", () => {
    const baseline = createDomainFreezeManifest();
    const perturbado = createDomainFreezeManifest({
      moments: goldenElectionMoments.map((moment, index) =>
        index === 0 ? { ...moment, jdUt: moment.jdUt + 1 } : moment,
      ),
    });
    const surface = (manifest: typeof baseline, id: string) =>
      manifest.surfaces.find((entry) => entry.surfaceId === id)?.fingerprint;

    expect(perturbado.fingerprint).not.toBe(baseline.fingerprint);
    // O fingerprint global muda, mas não esconde *qual* superfície mudou: a que
    // ninguém tocou continua idêntica.
    expect(surface(perturbado, "elections")).not.toBe(surface(baseline, "elections"));
    expect(surface(perturbado, "guidance_policy")).toBe(surface(baseline, "guidance_policy"));
  });

  it("congela os três desfechos possíveis da hora planetária", () => {
    const resolucoes = goldenTimingCases
      .filter((golden) => golden.kind === "location")
      .map((golden) => [golden.caseId, resolvePlanetaryHourAt(golden.location).method]);

    // O modo estrito recusa em vez de inventar horário; o proxy responde, mas
    // rotula a própria aproximação. A diferença viaja no resultado.
    expect(resolucoes).toEqual([
      ["timing:latitude-temperada", "observed_solar"],
      ["timing:polar-estrito", "unavailable"],
      ["timing:polar-proxy", "equinoctial_local_solar_proxy"],
    ]);
  });

  /**
   * Portão de versionamento. Alterar uma saída do domínio quebra aqui, e a
   * correção é registrar ANTES/DEPOIS/MOTIVO/IMPACTO e subir a versão do módulo
   * afetado — nunca reescrever o número esperado para o teste voltar ao verde.
   *
   * Já exerceu esse papel uma vez, na task 22:
   *
   * - ANTES: `regency-function-graph-0.3.0-research`, 27 atribuições.
   * - DEPOIS: `0.4.0-research`, 32 atribuições.
   * - MOTIVO: a tradição angélica entrou com cinco atribuições verificadas no
   *   corpus, e o rótulo `school:trithemius` foi corrigido por não ser sustentado
   *   pela bibliografia da própria obra.
   * - IMPACTO: **nenhuma força de convergência mudou** — seguem seis
   *   `convergent`, uma `corroborated` e duas `single_school`. As escolas novas
   *   entraram na família que já existia, então somaram testemunho e não somaram
   *   convergência. Surgiu o primeiro conflito real registrado no grafo.
   */
  it("congela as versões declaradas de cada módulo do domínio", () => {
    expect(frozenDomainVersions).toEqual({
      electionEngine: "election-engine-0.2.0-research",
      electionProfileSchema: "election-profiles-0.2.0-research",
      entityRecords: "ceremonial-entity-records-0.1.0-research",
      functionGraph: "regency-function-graph-0.4.0-research",
      guidancePolicy: "ceremonial-guidance-policy-0.1.0",
      planetaryHours: "planetary-hours-0.1.0",
      structuralFunctions: "structural-functions-0.1.0-research",
    });
    expect(createDomainFreezeManifest().versions).toEqual(frozenDomainVersions);
  });
});

describe("cobertura de fontes", () => {
  it("enumera todos os discriminantes de sistema", () => {
    const report = createSourceCoverageReport();

    expect(Object.keys(report.entities.byWorkspaceKind).sort()).toEqual([...frozenWorkspaceKinds]);
    // Cada discriminante tem golden próprio: um workspaceKind novo entra aqui
    // com zero e acusa que o congelamento ainda não o cobre.
    for (const kind of frozenWorkspaceKinds)
      expect(report.entities.byWorkspaceKind[kind]).toBeGreaterThan(0);
  });

  it("mantém a enumeração congelada alinhada com os schemas", () => {
    expect([...frozenWorkspaceKinds]).toEqual([...workspaceKindSchema.options].sort());

    const categorias = guidanceGoalCategorySchema.options.flatMap((option) => [...option.options]);
    expect([...frozenGuidanceGoalCategories]).toEqual(categorias.sort());
    expect([...frozenGuidanceOperations]).toEqual(
      [...guidancePolicyInputSchema.shape.operation.options].sort(),
    );
    expect([...frozenGuidanceTargets]).toEqual(
      [...guidancePolicyInputSchema.shape.target.options].sort(),
    );
  });

  it("relata completude de obra, edição e correspondência com locator", () => {
    const report = createSourceCoverageReport();

    expect(report.entities.total).toBe(goldenEntityRecords.length);
    // O schema recusa correspondência sem locator; o relatório mede em vez de supor.
    expect(report.correspondences.withLocator).toBe(report.correspondences.total);
    expect(report.works.editions).toBeGreaterThan(report.works.total);
    expect(report.crossSystemRelations.total).toBe(goldenCrossSystemRelations.length);
  });

  it("não conta obras da mesma linhagem como consenso independente", () => {
    const report = createSourceCoverageReport({ graph: duplicateLineageGraph });
    const consenso = report.consensus.find(
      ({ functionId }) => functionId === "function:path-opening",
    );

    // Três obras distintas, uma linhagem só: a força não sobe com a repetição.
    expect(consenso).toMatchObject({
      assignmentCount: 3,
      independentFamilyCount: 1,
      strength: "single_school",
    });
    expect(consenso?.collapsedWorkGroups).toEqual([
      {
        familyId: "family:saraceni",
        workIds: ["work:saraceni-a", "work:saraceni-b", "work:saraceni-c"],
      },
    ]);
  });

  it("congela a cobertura observada no grafo real de funções", () => {
    const report = createSourceCoverageReport({ graph: regencyFunctionGraph });
    const strengths = report.consensus.map(({ strength }) => strength);

    expect(report.consensus).toHaveLength(9);
    expect(
      report.consensus.reduce((total, { assignmentCount }) => total + assignmentCount, 0),
    ).toBe(32);
    expect(strengths.filter((strength) => strength === "convergent")).toHaveLength(6);
    expect(strengths.filter((strength) => strength === "corroborated")).toHaveLength(1);
    expect(strengths.filter((strength) => strength === "single_school")).toHaveLength(2);

    // O colapso é real, não hipotético: as duas atribuições desta função saem
    // de obras de Saraceni, e por isso ela permanece `single_school`.
    expect(
      report.consensus.find(({ functionId }) => functionId === "function:passage-between-planes"),
    ).toMatchObject({
      assignmentCount: 2,
      independentFamilyCount: 1,
      strength: "single_school",
    });
  });

  it("marca como não computável o requisito que a fonte exige e o motor não calcula", () => {
    const report = createSourceCoverageReport();
    const agrippa = report.timing.find(
      ({ profileId }) => profileId === "profile:agrippa-operation-planet",
    );

    expect(agrippa).toMatchObject({ nonComputableConditions: 1, fullyComputable: false });
    // Ars Paulina não é lacuna de texto, e por isso não vira perfil vazio.
    expect(report.timingGaps.map(({ sourceSystemId }) => sourceSystemId)).toEqual([
      "source-system:ars-paulina",
    ]);
  });
});

describe("comportamento diante de conflito entre fontes", () => {
  it("preserva conflitos declarados entre atribuições, sem conciliar", () => {
    const report = createDomainConflictReport({ graph: duplicateLineageGraph });

    expect(report.functionConflicts).toEqual([
      {
        functionId: "function:iron-and-war-craft",
        left: "assignment:conflito-a",
        right: "assignment:conflito-b",
      },
    ]);
    // Os dois lados continuam no grafo condensado: nenhum foi descartado nem
    // substituído por uma posição média entre eles.
    expect(
      condenseStructuralFunctions(duplicateLineageGraph).find(
        ({ functionId }) => functionId === "function:iron-and-war-craft",
      )?.assignmentCount,
    ).toBe(2);
  });

  it("relata homônimos entre sistemas sem fundir os registros", () => {
    expect(createDomainConflictReport().nameCollisions).toEqual([
      {
        name: "bethor",
        records: [
          {
            id: "entity-record:angelical-trithemius:bethor",
            sourceSystemId: "source-system:angelical-trithemius",
          },
          { id: "entity-record:arbatel:bethor", sourceSystemId: "source-system:arbatel" },
        ],
      },
    ]);
  });

  it("mostra perfis divergentes lado a lado no mesmo instante", () => {
    const divergencia = createDomainConflictReport().electionDivergences.find(
      ({ momentId }) => momentId === "moment:lua-nova",
    );

    // Lua nova: Heptameron e Kabbala Teúrgica proíbem, Agrippa não é computável.
    // A observação preserva a discordância em vez de eleger um vencedor.
    expect(divergencia?.conflicted).toContain("profile:heptameron-lua-crescente-nao-combusta");
    expect(divergencia?.conflicted).toContain("profile:kabbala-teurgica-lua-visivel");
    expect(divergencia?.unavailable).toContain("profile:agrippa-operation-planet");
    expect(
      (divergencia?.matched.length ?? 0) +
        (divergencia?.conflicted.length ?? 0) +
        (divergencia?.unavailable.length ?? 0),
    ).toBe(seededElectionProfiles.length);
  });

  it("mantém o relatório de conflito estável e publicável", () => {
    const first = JSON.stringify(createDomainConflictReport());
    const second = JSON.stringify(createDomainConflictReport());

    expect(second).toBe(first);
    // Só identificadores, versões e locators: nenhum caminho de acervo nem
    // coordenada do momento observado atravessa o relatório.
    expect(first).not.toMatch(/\/mnt\/|latitude|longitude|jdUt/i);
  });
});
