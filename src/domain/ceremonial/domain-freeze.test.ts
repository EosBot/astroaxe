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
   *
   * E uma segunda vez, na investigação das divergências:
   *
   * - ANTES: `0.4.0-research`, conflito registrado sem natureza declarada.
   * - DEPOIS: `0.5.0-research`, conflito exige um registro de divergência que
   *   diga se é grafia, disputa de posto, esquema concorrente ou erro da fonte,
   *   e se a função permanece estável apesar dele.
   * - MOTIVO: `conflictsWith` dizia *que* duas fontes colidem e nunca *como*.
   *   Sem isso o produto trata igual variante ortográfica, divergência
   *   estruturada e engano de autor — e chamar erro de tradição empresta
   *   autoridade a um engano.
   * - IMPACTO: nenhuma contagem mudou. O schema passou a recusar conflito mudo,
   *   então a exigência vale para todo conflito futuro, não só para este.
   *
   * E uma terceira vez, na task 23:
   *
   * - ANTES: `0.5.0-research`, 32 atribuições, duas funções `single_school`.
   * - DEPOIS: `0.6.0-research`, 37 atribuições, **nenhuma** `single_school`.
   * - MOTIVO: cinco atribuições do Lemegeton, linhagem genuinamente independente
   *   das escolas praticantes brasileiras. Marbas sustenta aflição e cura nas
   *   duas metades — o que as fontes angélicas não faziam — e Bune sustenta a
   *   passagem entre planos.
   * - IMPACTO: as duas funções mais frágeis do grafo saíram de uma escola só
   *   para duas linhagens independentes. É a primeira vez que o congelamento
   *   registra **aumento** de convergência, e ele é real: um grimório solomônico
   *   do século XVII e a Umbanda do século XX não se copiaram.
   *
   * E uma quarta vez, nas tasks 24 e 25:
   *
   * - ANTES: `0.6.0-research`, 37 atribuições, seis funções `convergent`.
   * - DEPOIS: `0.7.0-research`, 41 atribuições, sete `convergent`.
   * - MOTIVO: entraram o ofício coletivo da Theurgia-Goetia, os anjos da
   *   Primeira Altitude do Ars Almadel e três testemunhos de Rankine e d'Este
   *   sobre os olímpicos. **Saiu** Ophiel de `path-opening`: o Arbatel original
   *   não sustenta abertura de caminho, e a atribuição repousava na glosa do
   *   compilador.
   * - IMPACTO: `generative-waters` foi a `convergent` com o Almadel, que gera e
   *   sustenta a vida que nasce sem envolver água nenhuma. `path-opening` perdeu
   *   uma linhagem e continua `convergent`. Uma mudança sobe e outra desce na
   *   mesma versão, o que é o comportamento certo de um registro que não torce
   *   para o próprio produto.
   *
   * E uma quinta vez, na task 26:
   *
   * - ANTES: `0.7.0-research`, 41 atribuições.
   * - DEPOIS: `0.8.0-research`, 43 atribuições.
   * - MOTIVO: a inteligência planetária Hagiel entrou em atração e em geração,
   *   com a categoria própria `planetary_intelligence`.
   * - IMPACTO: nenhuma força mudou. A categoria separada é o ponto: Hagiel
   *   divide Vênus com Anael, Uriel e Hagith, e compartilhar planeta é relação,
   *   nunca identidade.
   */
  it("congela as versões declaradas de cada módulo do domínio", () => {
    expect(frozenDomainVersions).toEqual({
      electionEngine: "election-engine-0.2.0-research",
      electionProfileSchema: "election-profiles-0.2.0-research",
      entityRecords: "ceremonial-entity-records-0.1.0-research",
      functionGraph: "regency-function-graph-0.8.0-research",
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
    ).toBe(43);
    expect(strengths.filter((strength) => strength === "convergent")).toHaveLength(7);
    expect(strengths.filter((strength) => strength === "corroborated")).toHaveLength(2);
    // Nenhuma função continua sustentada por uma escola só desde a task 23.
    expect(strengths.filter((strength) => strength === "single_school")).toHaveLength(0);

    // O colapso continua real e continua visível: das três atribuições desta
    // função, duas saem de obras de Saraceni e contam como uma linhagem só. A
    // segunda família é o Lemegeton, não a segunda entrada de Saraceni.
    expect(
      report.consensus.find(({ functionId }) => functionId === "function:passage-between-planes"),
    ).toMatchObject({
      assignmentCount: 3,
      independentFamilyCount: 2,
      strength: "corroborated",
      collapsedWorkGroups: [
        {
          familyId: "family:saraceni",
          workIds: ["work:saraceni-fundamentos-doutrinarios", "work:saraceni-teogonia"],
        },
      ],
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
