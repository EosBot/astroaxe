import { describe, expect, it } from "vitest";

import {
  ceremonialEntityRecordSchema,
  crossSystemRelationSchema,
  findNameCollisions,
  type CeremonialEntityRecord,
} from "./entity-records";

const base = {
  id: "entity-record:heptameron:michael",
  sourceSystemId: "source-system:heptameron",
  workspaceKind: "ANGELICAL" as const,
  workId: "work:heptameron",
  editionId: "edition:heptameron:esoteric-archives",
  names: [{ value: "Michael", script: "latin" as const, isPrimary: true }],
  rankOrOffice: "Anjo regente do domingo",
  correspondences: [
    {
      targetKind: "weekday" as const,
      targetId: "sunday",
      relation: "governs" as const,
      locator: "Tabela dos anjos dos dias, seção I",
    },
  ],
  reviewStatus: "candidate" as const,
};

const outroSistema: CeremonialEntityRecord = ceremonialEntityRecordSchema.parse({
  ...base,
  id: "entity-record:agrippa:michael",
  sourceSystemId: "source-system:agrippa",
  workId: "work:agrippa-occult-philosophy",
  editionId: "edition:agrippa:livro-iii",
  correspondences: [
    {
      targetKind: "planet",
      targetId: "sun",
      relation: "attributed_to",
      locator: "Livro III, ordens celestes",
    },
  ],
});

describe("registros de entidade ligados à fonte", () => {
  it("aceita um registro completo com sistema, obra, edição e locator", () => {
    expect(() => ceremonialEntityRecordSchema.parse(base)).not.toThrow();
  });

  it("recusa correspondência sem locator", () => {
    // Sem posição citável não há como reestudar o ponto quando a leitura falhar.
    expect(() =>
      ceremonialEntityRecordSchema.parse({
        ...base,
        correspondences: [{ targetKind: "planet", targetId: "sun", relation: "governs" }],
      }),
    ).toThrow();
  });

  it("exige exatamente um nome primário", () => {
    expect(() => ceremonialEntityRecordSchema.parse({ ...base, names: [] })).toThrow();
    expect(() =>
      ceremonialEntityRecordSchema.parse({
        ...base,
        names: [
          { value: "Michael", script: "latin", isPrimary: true },
          { value: "Mikhael", script: "hebrew", isPrimary: true },
        ],
      }),
    ).toThrow();
  });

  it("exige que o identificador carregue o sistema de origem", () => {
    // Assim nenhuma consulta perde o discriminante pelo caminho.
    expect(() =>
      ceremonialEntityRecordSchema.parse({ ...base, id: "entity-record:agrippa:michael" }),
    ).toThrow();
  });

  it("homônimos entre sistemas permanecem registros separados", () => {
    const heptameron = ceremonialEntityRecordSchema.parse(base);
    const colisoes = findNameCollisions([heptameron, outroSistema]);
    expect(colisoes).toHaveLength(1);
    expect(colisoes[0]?.name).toBe("michael");
    expect(colisoes[0]?.records.map((r) => r.sourceSystemId)).toEqual([
      "source-system:agrippa",
      "source-system:heptameron",
    ]);
    // A colisão é relatada, não resolvida: nada aqui funde os dois.
    expect(colisoes[0]?.records).toHaveLength(2);
  });

  it("não relata colisão quando o nome só existe num sistema", () => {
    expect(findNameCollisions([ceremonialEntityRecordSchema.parse(base)])).toEqual([]);
  });

  it("a relação entre sistemas exige tipo e locator", () => {
    expect(() =>
      crossSystemRelationSchema.parse({
        id: "relation:michael-heptameron-agrippa",
        leftRecordId: "entity-record:heptameron:michael",
        rightRecordId: "entity-record:agrippa:michael",
        relation: "shares_name",
        locator: "Comparação registrada na pesquisa AstroAxe",
      }),
    ).not.toThrow();
    expect(() =>
      crossSystemRelationSchema.parse({
        id: "relation:sem-locator",
        leftRecordId: "entity-record:heptameron:michael",
        rightRecordId: "entity-record:agrippa:michael",
        relation: "shares_name",
      }),
    ).toThrow();
  });

  it("não existe relação que afirme identidade entre entes", () => {
    expect(() =>
      crossSystemRelationSchema.parse({
        id: "relation:identidade",
        leftRecordId: "entity-record:heptameron:michael",
        rightRecordId: "entity-record:agrippa:michael",
        relation: "same_entity",
        locator: "qualquer",
      }),
    ).toThrow();
  });

  it("recusa relação de um registro consigo mesmo ou dentro do mesmo sistema", () => {
    const comum = {
      id: "relation:x",
      relation: "analogous_position" as const,
      locator: "Comparação registrada na pesquisa AstroAxe",
    };
    expect(() =>
      crossSystemRelationSchema.parse({
        ...comum,
        leftRecordId: "entity-record:heptameron:michael",
        rightRecordId: "entity-record:heptameron:michael",
      }),
    ).toThrow();
    expect(() =>
      crossSystemRelationSchema.parse({
        ...comum,
        leftRecordId: "entity-record:heptameron:michael",
        rightRecordId: "entity-record:heptameron:gabriel",
      }),
    ).toThrow();
  });
});
