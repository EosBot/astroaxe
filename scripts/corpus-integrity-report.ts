import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import {
  buildCorpusIntegrityReport,
  type CorpusDocument,
} from "../src/domain/ceremonial/corpus-integrity";
import { buildInventoryManifest, type InventoryEntry } from "../src/domain/ceremonial/inventory";

/**
 * Relatório de integridade do corpus (task 16).
 *
 * Uso:
 *   npm run ceremonial:corpus-report -- <chunks.jsonl> [manifesto-inventario.json] [saida.json]
 *
 * O manifesto do inventário é opcional porque ele não é versionado — contém
 * caminhos do acervo e é gerado sob demanda por `npm run ceremonial:inventory`.
 * Sem ele o relatório ainda soma, agrupa duplicatas e lista metadado por resolver;
 * o que ele não consegue é reconciliar, e diz isso em vez de fingir que reconciliou.
 *
 * A agregação acontece aqui, na fronteira. A decisão vive em
 * `src/domain/ceremonial/corpus-integrity.ts`, que é puro e testado.
 */
async function main(): Promise<void> {
  const [chunksPath, inventoryPath, outputPath] = process.argv.slice(2);
  if (chunksPath === undefined) {
    process.stderr.write(
      "uso: corpus-integrity-report.ts <chunks.jsonl> [manifesto-inventario.json] [saida.json]\n",
    );
    process.exitCode = 1;
    return;
  }

  const documents = await readDerivedDocuments(resolve(chunksPath));
  const inventory =
    inventoryPath === undefined
      ? buildInventoryManifest([], new Date(0))
      : await readInventory(resolve(inventoryPath));

  const report = buildCorpusIntegrityReport({ documents, inventory });
  const serialized = `${JSON.stringify(report, null, 2)}\n`;

  if (outputPath === undefined) process.stdout.write(serialized);
  else await writeFile(resolve(outputPath), serialized, { mode: 0o600 });
}

/**
 * Agrega os chunks em documentos.
 *
 * O JSONL é uma linha por chunk; o relatório raciocina por obra. `source_path` e o
 * hash só entram quando o pipeline os preservou — quando não preservou, o campo
 * fica nulo e o relatório o lista como metadado por resolver, que é a informação
 * honesta em vez de um caminho inventado.
 */
async function readDerivedDocuments(path: string): Promise<CorpusDocument[]> {
  const raw = await readFile(path, "utf8");
  const agregado = new Map<string, CorpusDocument>();

  for (const line of raw.split("\n")) {
    if (line.trim().length === 0) continue;
    const chunk = JSON.parse(line) as {
      title?: unknown;
      category?: unknown;
      char_count?: unknown;
      source_path?: unknown;
      content_hash?: unknown;
      derived_at?: unknown;
      illegible?: unknown;
    };
    const title = typeof chunk.title === "string" ? chunk.title : "";
    if (title.length === 0) continue;

    const anterior = agregado.get(title);
    agregado.set(title, {
      title,
      category:
        typeof chunk.category === "string" && chunk.category.length > 0
          ? chunk.category
          : "sem_categoria",
      chunkCount: (anterior?.chunkCount ?? 0) + 1,
      charCount:
        (anterior?.charCount ?? 0) + (typeof chunk.char_count === "number" ? chunk.char_count : 0),
      illegibleChunks: (anterior?.illegibleChunks ?? 0) + (chunk.illegible === true ? 1 : 0),
      sourcePath:
        anterior?.sourcePath ?? (typeof chunk.source_path === "string" ? chunk.source_path : null),
      contentHash:
        anterior?.contentHash ??
        (typeof chunk.content_hash === "string" ? chunk.content_hash : null),
      derivedAt:
        anterior?.derivedAt ??
        (typeof chunk.derived_at === "string" ? chunk.derived_at : new Date(0).toISOString()),
    });
  }

  return [...agregado.values()];
}

async function readInventory(path: string) {
  const parsed = JSON.parse(await readFile(path, "utf8")) as {
    entries?: readonly InventoryEntry[];
    generatedAt?: string;
  };
  return buildInventoryManifest(
    parsed.entries ?? [],
    new Date(parsed.generatedAt ?? new Date(0).toISOString()),
  );
}

await main();
