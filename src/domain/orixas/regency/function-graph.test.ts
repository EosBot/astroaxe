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
    // Recortar atribuições deixa divergências órfãs, e o schema recusa isso —
    // é a mesma regra que impede conflito sem explicação.
    const single = condenseStructuralFunctions({
      ...regencyFunctionGraph,
      assignments: [firstAssignment],
      divergences: [],
    });
    expect(single[0]?.strength).toBe("single_school");
    expect(single[0]?.independentFamilyCount).toBe(1);

    const twoFamilies = condenseStructuralFunctions({
      ...regencyFunctionGraph,
      assignments: regencyFunctionGraph.assignments.filter(({ id }) =>
        ["assignment:ogum-iron-pena", "assignment:ogum-iron-ramatis"].includes(id),
      ),
      divergences: [],
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

    const group = groupFor(
      {
        ...graphWith(left, right),
        divergences: [
          ...regencyFunctionGraph.divergences,
          {
            id: "divergence:disputa-sintetica",
            functionId: "function:path-opening",
            between: ["assignment:disputa-a", "assignment:disputa-b"],
            kind: "competing_scheme",
            explanation: "Fixture: duas escolas atribuem a função a potências distintas.",
            functionRemainsStable: true,
            locators: ["Fixture sintética"],
          },
        ],
      },
      "function:path-opening",
    );

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

    // Desde a task 23 o Lemegeton é a segunda linhagem desta função, mas as duas
    // atribuições de Saraceni continuam contando como uma: três atribuições,
    // duas famílias.
    const passage = groupFor(regencyFunctionGraph, "function:passage-between-planes");
    expect(passage?.assignmentCount).toBe(3);
    expect(passage?.independentFamilyCount).toBe(2);
    expect(passage?.strength).toBe("corroborated");
    expect(
      passage?.members.filter(({ familyIds }) => familyIds.includes("family:saraceni")),
    ).toHaveLength(2);
  });

  it("gradua funções sustentadas por uma só linhagem sem escondê-las", () => {
    // Uma função com uma escola só continua no grafo: o rótulo diz o que ela é,
    // em vez de a omissão sugerir sustentação que não existe.
    //
    // Desde a task 23 nenhuma função real é `single_school` — o Lemegeton deu
    // segunda linhagem às duas que eram. A garantia é testada em recorte para
    // não desaparecer junto com o caso que a motivou.
    const groups = condenseStructuralFunctions(regencyFunctionGraph);
    expect(groups.every(({ independentFamilyCount }) => independentFamilyCount >= 1)).toBe(true);
    expect(groups.some(({ strength }) => strength === "single_school")).toBe(false);

    const recorte = condenseStructuralFunctions({
      ...regencyFunctionGraph,
      assignments: regencyFunctionGraph.assignments.filter(
        ({ sourceFamilyId }) => sourceFamilyId === "family:saraceni",
      ),
      divergences: [],
    });
    expect(recorte.every(({ strength }) => strength === "single_school")).toBe(true);
  });

  it("preserva três linhagens localizadas de adivinhação sem universalizar Bascom", () => {
    const ifa = groupFor(regencyFunctionGraph, "function:divination-and-counsel");
    // A tradição angélica entrou na versão 0.4.0 com Gabriel e Raphael, ambos da
    // mesma obra: duas atribuições, uma linhagem. A quarta família é a angélica,
    // não a segunda entrada dela.
    // Gusion (Livro I) e os Espíritos Chefes (Livro II) são dois livros do mesmo
    // Lemegeton: sete atribuições, cinco linhagens.
    expect(ifa?.assignmentCount).toBe(7);
    expect(ifa?.independentFamilyCount).toBe(5);
    expect(ifa?.strength).toBe("convergent");
    expect(ifa?.members.map(({ entityId }) => entityId)).toEqual([
      "entity:ceremonial:gabriel",
      "entity:ceremonial:raphael",
      "entity:goetia:gusion",
      "entity:ifa:orunmila",
      "entity:theurgia:espiritos-chefes",
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
    expect(ferro?.assignmentCount).toBe(8);
    expect(ferro?.independentFamilyCount).toBe(6);
    expect(ferro?.schoolCount).toBe(7);
  });

  it("classifica a divergência de Vênus como disputa de posto, não erro", () => {
    const atracao = groupFor(regencyFunctionGraph, "function:attraction-and-concord");
    const divergencia = atracao?.divergences.find(
      ({ id }) => id === "divergence:venus-archangel-rank",
    );

    // A pergunta que decide se a condensação sobrevive: a função se mantém?
    expect(divergencia?.kind).toBe("rank_scheme");
    expect(divergencia?.functionRemainsStable).toBe(true);
    // Cinco locators: quatro em Rankine e d'Este, um em Dalton. A classificação
    // não é opinião — é o que sustenta chamá-la de esquema em vez de descuido.
    expect(divergencia?.locators.length).toBeGreaterThanOrEqual(5);
  });

  it("recusa conflito declarado sem divergência que o explique", () => {
    const mudo = {
      ...regencyFunctionGraph,
      divergences: [],
    };

    // Colisão muda diz que duas fontes batem de frente e não diz se é grafia,
    // esquema ou erro da fonte — e tratar as três como uma só foi o defeito.
    expect(() => condenseStructuralFunctions(mudo)).toThrow();
  });

  it("reúne Orixá e espírito goético na mesma função sem fundir os panteões", () => {
    const aflicao = groupFor(regencyFunctionGraph, "function:affliction-and-cure");

    // Marbas "cura e causa doenças"; Omolu ocupa a mesma função na Umbanda. A
    // afirmação é posição análoga e nada além disso — as categorias continuam
    // distintas no mesmo grupo, e a relação declarada nunca é identidade.
    expect(aflicao?.relation).toBe("analogous_position");
    expect(aflicao?.entityCategories).toEqual(["goetic_spirit", "orisa"]);
    expect(aflicao?.strength).toBe("corroborated");
    expect(aflicao?.independentFamilyCount).toBe(2);

    // Um grimório solomônico do século XVII e a Umbanda do século XX não se
    // copiaram: a corroboração aqui é entre linhagens de fato independentes.
    expect(new Set(aflicao?.members.flatMap(({ familyIds }) => familyIds))).toEqual(
      new Set(["family:lemegeton", "family:saraceni"]),
    );
  });

  it("mantém separadas as classes que compartilham o mesmo planeta", () => {
    const atracao = groupFor(regencyFunctionGraph, "function:attraction-and-concord");
    const categorias = new Map(
      atracao?.members.map(({ entityId, entityCategory }) => [entityId, entityCategory]),
    );

    // Vênus reúne um arcanjo, um espírito olímpico e uma inteligência planetária,
    // além dos Orixás. Compartilhar planeta é relação, nunca identidade — e sem
    // categorias distintas a condensação convidaria a fundi-los.
    expect(categorias.get("entity:ceremonial:haniel")).toBe("angel");
    expect(categorias.get("entity:ceremonial:hagith")).toBe("olympic_spirit");
    expect(categorias.get("entity:agrippa:hagiel")).toBe("planetary_intelligence");
    expect(atracao?.relation).toBe("analogous_position");
  });

  it("separa os dois livros do Lemegeton sem os contar como duas linhagens", () => {
    const lemegeton = regencyFunctionGraph.assignments.filter(
      ({ sourceFamilyId }) => sourceFamilyId === "family:lemegeton",
    );

    // Goetia, Theurgia e Almadel são três livros de uma compilação: obras
    // distintas, categorias distintas, uma linhagem só.
    expect(new Set(lemegeton.map(({ workId }) => workId)).size).toBe(3);
    expect(new Set(lemegeton.map(({ entityCategory }) => entityCategory))).toEqual(
      new Set(["goetic_spirit", "aerial_spirit", "angel"]),
    );
    const adivinhacao = groupFor(regencyFunctionGraph, "function:divination-and-counsel");
    expect(adivinhacao?.independentFamilyCount).toBe(5);
    expect(adivinhacao?.assignmentCount).toBe(7);
  });
});
