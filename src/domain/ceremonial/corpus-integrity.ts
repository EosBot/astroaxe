import { z } from "zod";

import { compareStrings } from "@/domain/sort-strings";

import {
  inventoryRelativePathSchema,
  type InventoryEntry,
  type InventoryManifest,
} from "./inventory";

export const CORPUS_INTEGRITY_REPORT_VERSION = "ceremonial-corpus-integrity-1.0.0";

const sha256Schema = z.string().regex(/^[a-f0-9]{64}$/);

/**
 * Um documento do corpus derivado, como o pipeline de condensação o produz.
 *
 * O corpus derivado e o inventário do acervo são duas contagens do mesmo material
 * feitas por caminhos diferentes, e é por isso que compará-las detecta erro: se
 * batem, a derivação cobriu o que o inventário viu; se não batem, a diferença
 * precisa ter nome.
 */
export const corpusDocumentSchema = z
  .object({
    title: z.string().trim().min(1).max(300),
    category: z.string().trim().min(1).max(80),
    chunkCount: z.number().int().positive(),
    charCount: z.number().int().nonnegative(),
    /**
     * Chunks que a higiene marcou como extração ilegível.
     *
     * Contados em vez de descartados em silêncio: um documento cuja extração
     * falhou em metade dos chunks está no corpus, e quem consulta precisa saber.
     */
    illegibleChunks: z.number().int().nonnegative(),
    /** Caminho no acervo, quando o pipeline o preservou. */
    sourcePath: inventoryRelativePathSchema.nullable(),
    contentHash: sha256Schema.nullable(),
    /** ISO 8601 em UTC. Quando o documento foi derivado. */
    derivedAt: z.iso.datetime(),
  })
  .strict()
  .superRefine((document, context) => {
    if (document.illegibleChunks > document.chunkCount)
      context.addIssue({
        code: "custom",
        path: ["illegibleChunks"],
        message: "não pode haver mais chunks ilegíveis do que chunks.",
      });
  });

export type CorpusDocument = z.infer<typeof corpusDocumentSchema>;

/** Por que um item do inventário não aparece no corpus derivado. */
export type CorpusGapReason =
  /** O inventário o pôs em quarentena; a ausência está explicada na origem. */
  | "quarantined_in_inventory"
  /** Indexado e sem derivado correspondente. É a lacuna que exige ação. */
  | "indexed_but_not_derived";

export interface CorpusIntegrityReport {
  reportVersion: string;
  totals: {
    documents: number;
    chunks: number;
    characters: number;
    illegibleChunks: number;
    categories: number;
  };
  byCategory: { category: string; documents: number; chunks: number }[];
  /**
   * Obras presentes mais de uma vez no corpus derivado, agrupadas por hash.
   *
   * Cópia da mesma obra não é segunda testemunha — é a mesma voz contada duas
   * vezes, e o grafo de funções depende de que isso apareça aqui antes de virar
   * convergência lá.
   */
  duplicateWorks: { contentHash: string; titles: string[] }[];
  /** Documentos sem caminho ou sem hash: rastreáveis pela metade. */
  unresolvedMetadata: { title: string; missing: ("sourcePath" | "contentHash")[] }[];
  /**
   * Derivados anteriores à última modificação do arquivo no acervo.
   *
   * O derivado descreve uma versão do arquivo que não é mais a que está lá.
   */
  staleDerivatives: { title: string; derivedAt: string; sourceModifiedAt: string }[];
  reconciliation: {
    inventoryIndexed: number;
    inventoryQuarantined: number;
    derivedMatched: number;
    /** Cada ausência com o seu motivo; nenhuma fica sem nome. */
    gaps: { relativePath: string; reason: CorpusGapReason }[];
    /** Derivados sem entrada correspondente no inventário. */
    unmatchedInCorpus: string[];
    /**
     * Três estados, e não um booleano.
     *
     * Um booleano obrigaria a chamar de reconciliado o caso em que **não havia o
     * que reconciliar** — inventário ausente, ou derivação que não preservou o
     * caminho de origem. Isso é o oposto de reconciliar: é não ter como.
     * `not_reconcilable` existe para que a ausência de vínculo apareça como
     * ausência, em vez de passar por sucesso.
     */
    status: "reconciled" | "gaps_found" | "not_reconcilable";
  };
}

/**
 * Reconcilia o corpus derivado com o inventário do acervo.
 *
 * Função pura: as mesmas entradas produzem o mesmo relatório, sem relógio, sem
 * disco e sem estado de sessão. É o que permite rodá-la em CI e comparar duas
 * execuções sem que a diferença seja do ambiente.
 *
 * O relatório **não** classifica direitos nem sensibilidade. Essas colunas saíram
 * do banco na migration `20260826140000` e o modelo que as exigia foi descartado
 * em 26 de agosto; recriá-las aqui reintroduziria pela porta dos fundos um aparato
 * que o produto decidiu não ter.
 */
export function buildCorpusIntegrityReport(input: {
  documents: readonly unknown[];
  inventory: InventoryManifest;
}): CorpusIntegrityReport {
  const documents = input.documents.map((document) => corpusDocumentSchema.parse(document));
  const entries = input.inventory.entries;

  const porCaminho = new Map<string, InventoryEntry>(
    entries.map((entry) => [entry.relativePath, entry]),
  );
  const derivadosPorCaminho = new Map<string, CorpusDocument>();
  const unmatchedInCorpus: string[] = [];
  for (const document of documents) {
    if (document.sourcePath === null) continue;
    if (porCaminho.has(document.sourcePath)) derivadosPorCaminho.set(document.sourcePath, document);
    else unmatchedInCorpus.push(document.title);
  }

  const gaps = entries
    .filter((entry) => !derivadosPorCaminho.has(entry.relativePath))
    .map((entry) => ({
      relativePath: entry.relativePath,
      reason: (entry.state === "QUARANTINED"
        ? "quarantined_in_inventory"
        : "indexed_but_not_derived") as CorpusGapReason,
    }))
    .sort((left, right) => left.relativePath.localeCompare(right.relativePath));

  const porHash = new Map<string, string[]>();
  for (const document of documents) {
    if (document.contentHash === null) continue;
    porHash.set(document.contentHash, [
      ...(porHash.get(document.contentHash) ?? []),
      document.title,
    ]);
  }

  const staleDerivatives = documents
    .flatMap((document) => {
      if (document.sourcePath === null) return [];
      const entry = porCaminho.get(document.sourcePath);
      if (entry === undefined) return [];
      if (Date.parse(document.derivedAt) >= Date.parse(entry.modifiedAt)) return [];
      return [
        {
          title: document.title,
          derivedAt: document.derivedAt,
          sourceModifiedAt: entry.modifiedAt,
        },
      ];
    })
    .sort((left, right) => left.title.localeCompare(right.title));

  const categorias = countByCategory(documents);

  return {
    reportVersion: CORPUS_INTEGRITY_REPORT_VERSION,
    totals: {
      documents: documents.length,
      chunks: sum(documents, ({ chunkCount }) => chunkCount),
      characters: sum(documents, ({ charCount }) => charCount),
      illegibleChunks: sum(documents, ({ illegibleChunks }) => illegibleChunks),
      categories: categorias.length,
    },
    byCategory: categorias,
    duplicateWorks: [...porHash.entries()]
      .filter(([, titles]) => titles.length > 1)
      .map(([contentHash, titles]) => ({
        contentHash,
        titles: [...titles].sort(compareStrings),
      }))
      .sort((left, right) => left.contentHash.localeCompare(right.contentHash)),
    unresolvedMetadata: documents
      .flatMap((document) => {
        const missing: ("sourcePath" | "contentHash")[] = [];
        if (document.sourcePath === null) missing.push("sourcePath");
        if (document.contentHash === null) missing.push("contentHash");
        return missing.length === 0 ? [] : [{ title: document.title, missing }];
      })
      .sort((left, right) => left.title.localeCompare(right.title)),
    staleDerivatives,
    reconciliation: {
      inventoryIndexed: entries.filter(({ state }) => state === "INDEXED").length,
      inventoryQuarantined: entries.filter(({ state }) => state === "QUARANTINED").length,
      derivedMatched: derivadosPorCaminho.size,
      gaps,
      unmatchedInCorpus: [...unmatchedInCorpus].sort((left, right) =>
        left < right ? -1 : left > right ? 1 : 0,
      ),
      status: reconciliationStatus({
        inventorySize: entries.length,
        linkableDocuments: documents.filter(({ sourcePath }) => sourcePath !== null).length,
        totalDocuments: documents.length,
        unmatched: unmatchedInCorpus.length,
        gaps,
      }),
    },
  };
}

function reconciliationStatus(input: {
  inventorySize: number;
  linkableDocuments: number;
  totalDocuments: number;
  unmatched: number;
  gaps: readonly { reason: CorpusGapReason }[];
}): CorpusIntegrityReport["reconciliation"]["status"] {
  // Sem inventário não há contra o que reconciliar; e um corpus com documentos
  // dos quais nenhum preservou o caminho de origem não é reconciliável ainda que
  // o inventário exista.
  if (input.inventorySize === 0) return "not_reconcilable";
  if (input.totalDocuments > 0 && input.linkableDocuments === 0) return "not_reconcilable";
  if (input.unmatched > 0) return "gaps_found";
  return input.gaps.every(({ reason }) => reason === "quarantined_in_inventory")
    ? "reconciled"
    : "gaps_found";
}

function sum<Item>(items: readonly Item[], value: (item: Item) => number): number {
  return items.reduce((total, item) => total + value(item), 0);
}

function countByCategory(
  documents: readonly CorpusDocument[],
): { category: string; documents: number; chunks: number }[] {
  const counts = new Map<string, { documents: number; chunks: number }>();
  for (const document of documents) {
    const entry = counts.get(document.category) ?? { documents: 0, chunks: 0 };
    counts.set(document.category, {
      documents: entry.documents + 1,
      chunks: entry.chunks + document.chunkCount,
    });
  }
  return [...counts.entries()]
    .map(([category, entry]) => ({ category, ...entry }))
    .sort((left, right) => left.category.localeCompare(right.category));
}
