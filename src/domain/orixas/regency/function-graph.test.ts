import { describe, expect, it } from "vitest";

import {
  condenseStructuralFunctions,
  regencyFunctionGraphSchema,
  type FunctionAssignment,
} from "./function-graph";
import { regencyFunctionGraph } from "./function-graph-data";
import { structuralFunctionIds } from "./structural-functions";

const [firstAssignment] = regencyFunctionGraph.assignments as [FunctionAssignment];

function graphWith(...extra: FunctionAssignment[]) {
  return { ...regencyFunctionGraph, assignments: [...regencyFunctionGraph.assignments, ...extra] };
}

function groupFor(graph: unknown, functionId: string) {
  return condenseStructuralFunctions(graph).find((group) => group.functionId === functionId);
}

describe("grafo de funções estruturais", () => {
  it("pesa famílias de fonte independentes, não a contagem de atribuições", () => {
    const copy: FunctionAssignment = {
      ...firstAssignment,
      id: "assignment:exu-path-quimbanda-reimpressao",
      workId: "work:quimbanda-chama-vermelha-e-preta-2a-edicao",
    };

    const before = groupFor(regencyFunctionGraph, "function:path-opening");
    const after = groupFor(graphWith(copy), "function:path-opening");

    expect(after?.assignmentCount).toBe((before?.assignmentCount ?? 0) + 1);
    expect(after?.independentFamilyCount).toBe(before?.independentFamilyCount);
    expect(after?.strength).toBe(before?.strength);
  });

  it("não conta escolas da mesma linhagem como confirmações separadas", () => {
    // Agrippa e Trithemius partilham família: um foi mestre do outro.
    const agrippa: FunctionAssignment = {
      ...firstAssignment,
      id: "assignment:mercurio-path-agrippa",
      entityId: "entity:ceremonial:mercurio",
      traditionId: "tradition:agrippa",
      claimSchoolId: "school:agrippa",
      sourceFamilyId: "family:renaissance-ceremonial",
      workId: "work:agrippa-occult-philosophy",
    };

    const before = groupFor(regencyFunctionGraph, "function:path-opening");
    const after = groupFor(graphWith(agrippa), "function:path-opening");

    expect(after?.schoolCount).toBe((before?.schoolCount ?? 0) + 1);
    expect(after?.independentFamilyCount).toBe(before?.independentFamilyCount);
  });

  it("gradua a força pela quantidade de linhagens independentes", () => {
    const single = condenseStructuralFunctions({
      ...regencyFunctionGraph,
      assignments: [firstAssignment],
    });
    expect(single[0]?.strength).toBe("single_school");
    expect(single[0]?.independentFamilyCount).toBe(1);

    const twoFamilies = condenseStructuralFunctions({
      ...regencyFunctionGraph,
      assignments: regencyFunctionGraph.assignments.filter(({ id }) =>
        ["assignment:ogum-iron-pena", "assignment:ogum-iron-ramatis"].includes(id),
      ),
    });
    expect(twoFamilies[0]?.strength).toBe("corroborated");

    expect(groupFor(regencyFunctionGraph, "function:iron-and-war-craft")?.strength).toBe(
      "convergent",
    );
  });

  it("registra divergência como conflito em vez de resolver por média", () => {
    const left: FunctionAssignment = {
      ...firstAssignment,
      id: "assignment:disputa-a",
      conflictsWith: ["assignment:disputa-b"],
    };
    const right: FunctionAssignment = {
      ...firstAssignment,
      id: "assignment:disputa-b",
      entityId: "entity:umbanda:ogum",
      conflictsWith: ["assignment:disputa-a"],
    };

    const group = groupFor(graphWith(left, right), "function:path-opening");

    expect(group?.conflicts).toEqual([
      { left: "assignment:disputa-a", right: "assignment:disputa-b" },
    ]);
    // Os dois lados continuam presentes: nada foi descartado nem promediado.
    expect(group?.members.map(({ entityId }) => entityId)).toContain("entity:umbanda:ogum");
  });

  it("afirma posição análoga, nunca identidade entre entidades", () => {
    const groups = condenseStructuralFunctions(regencyFunctionGraph);
    expect(groups.every((group) => group.relation === "analogous_position")).toBe(true);

    const solar = groups.find(({ functionId }) => functionId === "function:solar-vitality");
    expect(solar?.members.map(({ entityId }) => entityId)).toEqual([
      "entity:ceremonial:michael",
      "entity:ceremonial:och",
      "entity:umbanda:oxala",
    ]);
  });

  it("mantém categorias de entidade distintas dentro da mesma função", () => {
    const solar = groupFor(regencyFunctionGraph, "function:solar-vitality");
    expect(solar?.entityCategories).toEqual(["angel", "olympic_spirit", "orisa"]);
  });

  it("não classifica entidade de guia como Orixá", () => {
    // `docs/METHOD.md`: Exus e Pombagiras não são Orixás.
    const exu = regencyFunctionGraph.assignments.find(
      ({ entityId }) => entityId === "entity:quimbanda:exu",
    );
    expect(exu?.entityCategory).toBe("guide_entity");

    const orisaEntities = new Set(
      regencyFunctionGraph.assignments
        .filter(({ entityCategory }) => entityCategory === "orisa")
        .map(({ entityId }) => entityId),
    );
    expect(orisaEntities.has("entity:quimbanda:exu")).toBe(false);
  });

  it("expõe a pergunta que autoriza a comparação", () => {
    const groups = condenseStructuralFunctions(regencyFunctionGraph);
    expect(groups.every((group) => group.question.length > 0)).toBe(true);
  });

  it("recusa função fora do vocabulário", () => {
    expect(() =>
      regencyFunctionGraphSchema.parse(
        graphWith({ ...firstAssignment, id: "assignment:x", functionId: "function:inventada" }),
      ),
    ).toThrow();
  });

  it("recusa conflito pendurado e autoconflito", () => {
    expect(() =>
      regencyFunctionGraphSchema.parse({
        ...regencyFunctionGraph,
        assignments: [{ ...firstAssignment, conflictsWith: ["assignment:inexistente"] }],
      }),
    ).toThrow();

    expect(() =>
      regencyFunctionGraphSchema.parse({
        ...regencyFunctionGraph,
        assignments: [{ ...firstAssignment, conflictsWith: [firstAssignment.id] }],
      }),
    ).toThrow();
  });

  it("mantém as atribuições dentro do vocabulário publicado", () => {
    for (const { functionId } of regencyFunctionGraph.assignments)
      expect(structuralFunctionIds.has(functionId)).toBe(true);
  });

  it("conta as quatro obras de Saraceni como uma única linhagem", () => {
    // Teogonia, As Sete Linhas, Os Arquétipos e Fundamentos Doutrinários são do
    // mesmo autor. É a fonte mais presente do corpus: tratá-las como quatro
    // confirmações quadruplicaria a convergência exatamente onde ela precisa
    // ser honesta.
    const saraceni = regencyFunctionGraph.assignments.filter(
      ({ sourceFamilyId }) => sourceFamilyId === "family:saraceni",
    );
    expect(new Set(saraceni.map(({ workId }) => workId)).size).toBeGreaterThan(1);
    expect(new Set(saraceni.map(({ claimSchoolId }) => claimSchoolId))).toEqual(
      new Set(["school:umbanda-sagrada-saraceni"]),
    );

    const passage = groupFor(regencyFunctionGraph, "function:passage-between-planes");
    expect(passage?.assignmentCount).toBe(2);
    expect(passage?.independentFamilyCount).toBe(1);
    expect(passage?.strength).toBe("single_school");
  });

  it("gradua funções sustentadas por uma só linhagem sem escondê-las", () => {
    // Uma função com uma escola só continua no grafo: o rótulo diz o que ela é,
    // em vez de a omissão sugerir sustentação que não existe.
    const groups = condenseStructuralFunctions(regencyFunctionGraph);
    expect(groups.some(({ strength }) => strength === "single_school")).toBe(true);
    expect(groups.every(({ independentFamilyCount }) => independentFamilyCount >= 1)).toBe(true);
  });

  it("preserva três linhagens localizadas de adivinhação sem universalizar Bascom", () => {
    const ifa = groupFor(regencyFunctionGraph, "function:divination-and-counsel");
    // A tradição angélica entrou na versão 0.4.0 com Gabriel e Raphael, ambos da
    // mesma obra: duas atribuições, uma linhagem. A quarta família é a angélica,
    // não a segunda entrada dela.
    expect(ifa?.assignmentCount).toBe(5);
    expect(ifa?.independentFamilyCount).toBe(4);
    expect(ifa?.strength).toBe("convergent");
    expect(ifa?.members.map(({ entityId }) => entityId)).toEqual([
      "entity:ceremonial:gabriel",
      "entity:ceremonial:raphael",
      "entity:ifa:orunmila",
      "entity:yoruba:orishala",
    ]);
    expect(
      regencyFunctionGraph.assignments.find(
        ({ id }) => id === "assignment:orishala-divination-bascom-salako",
      )?.locator,
    ).toContain("Salakọ");
  });

  it("distingue revisão manual externa de recuperação no corpus local", () => {
    const prandi = regencyFunctionGraph.assignments.find(
      ({ id }) => id === "assignment:esu-threshold-prandi",
    );
    const unesco = regencyFunctionGraph.assignments.find(
      ({ id }) => id === "assignment:orunmila-divination-unesco",
    );
    const geodiversidade = regencyFunctionGraph.assignments.find(
      ({ id }) => id === "assignment:ogum-iron-geodiversidade",
    );

    expect(prandi?.extractionMethod).toBe("manual_review");
    expect(unesco?.extractionMethod).toBe("manual_review");
    expect(geodiversidade?.extractionMethod).toBe("table_review");
  });

  it("reúne mais de uma tradição no grafo como um todo", () => {
    const traditions = new Set(regencyFunctionGraph.assignments.map((a) => a.traditionId));
    expect(traditions.size).toBeGreaterThanOrEqual(4);
  });

  it("registra a divergência sobre Vênus sem escolher um lado", () => {
    const atracao = groupFor(regencyFunctionGraph, "function:attraction-and-concord");

    // Dalton põe Haniel em Vênus; Rankine e d'Este põem Uriel. Não são variantes
    // do mesmo nome, e o grafo guarda a discordância em vez de arbitrá-la.
    expect(atracao?.conflicts).toEqual([
      {
        left: "assignment:haniel-attraction-angelical",
        right: "assignment:uriel-attraction-rankine",
      },
    ]);
    expect(atracao?.members.map(({ entityId }) => entityId)).toContain("entity:ceremonial:uriel");
    expect(atracao?.members.map(({ entityId }) => entityId)).toContain("entity:ceremonial:haniel");
  });

  it("conta duas escolas angélicas como uma linhagem só", () => {
    const ferro = groupFor(regencyFunctionGraph, "function:iron-and-war-craft");
    const angelicais = regencyFunctionGraph.assignments.filter(
      ({ functionId, sourceFamilyId }) =>
        functionId === "function:iron-and-war-craft" &&
        sourceFamilyId === "family:renaissance-ceremonial",
    );

    // Dalton e Rankine/d'Este são escolas distintas transmitindo a mesma
    // linhagem: somam testemunho, não somam convergência.
    expect(angelicais).toHaveLength(2);
    expect(new Set(angelicais.map(({ claimSchoolId }) => claimSchoolId)).size).toBe(2);
    expect(ferro?.assignmentCount).toBe(6);
    expect(ferro?.independentFamilyCount).toBe(5);
    expect(ferro?.schoolCount).toBe(6);
  });
});
