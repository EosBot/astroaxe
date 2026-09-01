import { describe, expect, it } from "vitest";

import {
  buildCorpusIntegrityReport,
  CORPUS_INTEGRITY_REPORT_VERSION,
  type CorpusDocument,
} from "./corpus-integrity";
import { buildInventoryManifest, type InventoryEntry } from "./inventory";

const HASH_A = "a".repeat(64);
const HASH_B = "b".repeat(64);

describe("relatório de integridade do corpus", () => {
  it("soma totais por categoria e conta a extração ilegível em vez de escondê-la", () => {
    const report = buildCorpusIntegrityReport({
      documents: [
        documento({ title: "obra-a", category: "livros", chunkCount: 10, illegibleChunks: 3 }),
        documento({ title: "obra-b", category: "livros", chunkCount: 5 }),
        documento({
          title: "obra-c",
          category: "magia_angelical",
          chunkCount: 7,
          sourcePath: "Angelical/obra-c.pdf",
          contentHash: HASH_B,
        }),
      ],
      inventory: inventario([]),
    });

    expect(report.reportVersion).toBe(CORPUS_INTEGRITY_REPORT_VERSION);
    expect(report.totals).toMatchObject({ documents: 3, chunks: 22, illegibleChunks: 3 });
    expect(report.byCategory).toEqual([
      { category: "livros", documents: 2, chunks: 15 },
      { category: "magia_angelical", documents: 1, chunks: 7 },
    ]);
  });

  it("agrupa cópias da mesma obra por hash", () => {
    const report = buildCorpusIntegrityReport({
      documents: [
        documento({ title: "lemegeton-copia-2", contentHash: HASH_A }),
        documento({ title: "lemegeton", contentHash: HASH_A }),
        documento({ title: "outra-obra", contentHash: HASH_B }),
      ],
      inventory: inventario([]),
    });

    // Cópia da mesma obra não é segunda testemunha. O grafo de funções depende de
    // que isso apareça aqui antes de virar convergência lá.
    expect(report.duplicateWorks).toEqual([
      { contentHash: HASH_A, titles: ["lemegeton", "lemegeton-copia-2"] },
    ]);
  });

  it("nomeia cada ausência e reconcilia quando todas estão explicadas", () => {
    const report = buildCorpusIntegrityReport({
      documents: [documento({ title: "obra-a", sourcePath: "Livros/obra-a.pdf" })],
      inventory: inventario([
        entrada({ relativePath: "Livros/obra-a.pdf" }),
        entrada({
          relativePath: "Livros/ilegivel.pdf",
          state: "QUARANTINED",
          quarantineReason: "UNSUPPORTED_TYPE",
        }),
      ]),
    });

    // Quarentena explicada na origem não impede a reconciliação; o que impede é
    // lacuna sem nome.
    expect(report.reconciliation).toMatchObject({
      inventoryIndexed: 1,
      inventoryQuarantined: 1,
      derivedMatched: 1,
      status: "reconciled",
    });
    expect(report.reconciliation.gaps).toEqual([
      { relativePath: "Livros/ilegivel.pdf", reason: "quarantined_in_inventory" },
    ]);
  });

  it("recusa reconciliar quando um item indexado não foi derivado", () => {
    const report = buildCorpusIntegrityReport({
      documents: [],
      inventory: inventario([entrada({ relativePath: "Livros/obra-a.pdf" })]),
    });

    expect(report.reconciliation.gaps).toEqual([
      { relativePath: "Livros/obra-a.pdf", reason: "indexed_but_not_derived" },
    ]);
    expect(report.reconciliation.status).toBe("gaps_found");
  });

  it("recusa reconciliar quando o corpus tem documento que o inventário não viu", () => {
    const report = buildCorpusIntegrityReport({
      documents: [
        documento({ title: "conhecida", sourcePath: "Livros/obra-a.pdf" }),
        documento({ title: "orfao", sourcePath: "Livros/nunca-inventariado.pdf" }),
      ],
      inventory: inventario([entrada({ relativePath: "Livros/obra-a.pdf" })]),
    });

    expect(report.reconciliation.unmatchedInCorpus).toEqual(["orfao"]);
    expect(report.reconciliation.status).toBe("gaps_found");
  });

  it("aponta derivado anterior à última modificação do arquivo", () => {
    const report = buildCorpusIntegrityReport({
      documents: [
        documento({
          title: "obra-mudou",
          sourcePath: "Livros/obra-a.pdf",
          derivedAt: "2026-08-20T00:00:00.000Z",
        }),
        documento({
          title: "obra-em-dia",
          sourcePath: "Livros/obra-b.pdf",
          derivedAt: "2026-08-27T00:00:00.000Z",
        }),
      ],
      inventory: inventario([
        entrada({ relativePath: "Livros/obra-a.pdf", modifiedAt: "2026-08-25T00:00:00.000Z" }),
        entrada({ relativePath: "Livros/obra-b.pdf", modifiedAt: "2026-08-25T00:00:00.000Z" }),
      ]),
    });

    // O derivado descreve uma versão do arquivo que não é mais a que está lá.
    expect(report.staleDerivatives).toEqual([
      {
        title: "obra-mudou",
        derivedAt: "2026-08-20T00:00:00.000Z",
        sourceModifiedAt: "2026-08-25T00:00:00.000Z",
      },
    ]);
  });

  it("lista o que ficou rastreável pela metade", () => {
    const report = buildCorpusIntegrityReport({
      documents: [documento({ title: "sem-nada", sourcePath: null, contentHash: null })],
      inventory: inventario([]),
    });

    expect(report.unresolvedMetadata).toEqual([
      { title: "sem-nada", missing: ["sourcePath", "contentHash"] },
    ]);
  });

  it("é determinístico e independente da ordem de entrada", () => {
    const documentos = [
      documento({ title: "obra-c", category: "livros" }),
      documento({ title: "obra-a", category: "magia_angelical" }),
      documento({ title: "obra-b", category: "livros" }),
    ];
    const inventory = inventario([entrada({ relativePath: "Livros/obra-a.pdf" })]);

    const direto = buildCorpusIntegrityReport({ documents: documentos, inventory });
    const invertido = buildCorpusIntegrityReport({
      documents: [...documentos].reverse(),
      inventory,
    });

    // Sem relógio, sem disco e sem estado de sessão: duas execuções só diferem se
    // os dados diferirem, e é isso que torna o relatório comparável em CI.
    expect(JSON.stringify(invertido)).toBe(JSON.stringify(direto));
  });

  it("recusa documento com mais chunks ilegíveis do que chunks", () => {
    expect(() =>
      buildCorpusIntegrityReport({
        documents: [documento({ chunkCount: 2, illegibleChunks: 3 })],
        inventory: inventario([]),
      }),
    ).toThrow();
  });

  it("não chama de reconciliado o que não era reconciliável", () => {
    const semInventario = buildCorpusIntegrityReport({
      documents: [documento({ title: "obra-a" })],
      inventory: inventario([]),
    });
    const semVinculo = buildCorpusIntegrityReport({
      documents: [documento({ title: "obra-a", sourcePath: null })],
      inventory: inventario([entrada({ relativePath: "Livros/obra-a.pdf" })]),
    });

    // Foi o defeito que o corpus real expôs na primeira execução: com inventário
    // ausente e nenhum documento carregando caminho de origem, um booleano diria
    // "reconciliado" para o caso em que não havia o que reconciliar.
    expect(semInventario.reconciliation.status).toBe("not_reconcilable");
    expect(semVinculo.reconciliation.status).toBe("not_reconcilable");
  });
});

function documento(overrides: Partial<CorpusDocument> = {}): CorpusDocument {
  return {
    title: "obra",
    category: "livros",
    chunkCount: 4,
    charCount: 1_000,
    illegibleChunks: 0,
    sourcePath: null,
    contentHash: null,
    derivedAt: "2026-08-27T00:00:00.000Z",
    ...overrides,
  };
}

function entrada(overrides: Partial<InventoryEntry> = {}): InventoryEntry {
  return {
    relativePath: "Livros/obra.pdf",
    byteSize: 1_024,
    modifiedAt: "2026-08-01T00:00:00.000Z",
    contentHash: HASH_A,
    mimeType: "application/pdf",
    state: "INDEXED",
    quarantineReason: null,
    ...overrides,
  };
}

function inventario(entries: readonly InventoryEntry[]) {
  return buildInventoryManifest(entries, new Date("2026-08-27T00:00:00.000Z"));
}
