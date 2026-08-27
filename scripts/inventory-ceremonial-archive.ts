import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

import {
  buildInventoryManifest,
  compareInventoryBaseline,
  inventoryContentFingerprint,
  inventoryEntrySchema,
  type InventoryEntry,
} from "../src/domain/ceremonial/inventory";
import { scanArchive } from "../src/lib/ceremonial/inventory-scan";
import { MissingArchiveRootError, resolveArchiveRoot } from "../src/lib/ceremonial/archive-root";

/**
 * Read-only census of the private archive.
 *
 *   npm run ceremonial:inventory -- <destino.json> [--baseline 801/737/64]
 *
 * Never copies or modifies a source file, and writes a manifest that contains no absolute
 * host path. Progress is checkpointed
 * after each file, so an interrupted run resumes instead of rehashing the whole archive.
 */

const CHECKPOINT_SUFFIX = ".checkpoint.jsonl";

function fail(message: string): never {
  process.stderr.write(`${message}\n`);
  process.exit(1);
}

function parseBaseline(argv: readonly string[]) {
  const index = argv.indexOf("--baseline");
  if (index === -1) return null;
  const raw = argv[index + 1];
  const match = raw?.match(/^(\d+)\/(\d+)\/(\d+)$/);
  if (match === undefined || match === null)
    fail("Uso: --baseline <totalArquivos>/<hashesUnicos>/<duplicatas>, por exemplo 801/737/64.");
  return {
    totalFiles: Number(match[1]),
    uniqueContentHashes: Number(match[2]),
    duplicateFiles: Number(match[3]),
  };
}

/** Reads whatever the previous interrupted run managed to record. */
async function readCheckpoint(path: string): Promise<Map<string, InventoryEntry>> {
  const completed = new Map<string, InventoryEntry>();
  let contents: string;
  try {
    contents = await readFile(path, "utf8");
  } catch {
    return completed;
  }
  for (const line of contents.split("\n")) {
    if (line.trim() === "") continue;
    let candidate: unknown;
    try {
      candidate = JSON.parse(line);
    } catch {
      // A truncated final line from a hard kill is simply re-scanned.
      continue;
    }
    const parsed = inventoryEntrySchema.safeParse(candidate);
    if (parsed.success) completed.set(parsed.data.relativePath, parsed.data);
  }
  return completed;
}

async function main(): Promise<void> {
  let archiveRoot: string;
  try {
    archiveRoot = resolveArchiveRoot();
  } catch (error) {
    if (error instanceof MissingArchiveRootError) fail(error.message);
    throw error;
  }

  const argv = process.argv.slice(2);
  const destination = argv.find((argument) => !argument.startsWith("--"));
  if (destination === undefined)
    fail("Uso: npm run ceremonial:inventory -- <destino.json> [--baseline 801/737/64]");

  const baseline = parseBaseline(argv);
  const manifestPath = resolve(destination);
  const checkpointPath = `${manifestPath}${CHECKPOINT_SUFFIX}`;
  await mkdir(dirname(manifestPath), { recursive: true });

  const completed = await readCheckpoint(checkpointPath);
  if (completed.size > 0)
    process.stderr.write(`Retomando: ${completed.size} arquivo(s) já registrados.\n`);

  let sinceLastReport = 0;
  const entries = await scanArchive({
    archiveRoot,
    completed,
    onEntry: async (entry) => {
      // Append-only checkpoint: one validated entry per line, flushed as we go.
      await writeFile(checkpointPath, `${JSON.stringify(entry)}\n`, { flag: "a", mode: 0o600 });
    },
    onProgress: ({ scanned }) => {
      sinceLastReport += 1;
      if (sinceLastReport < 50) return;
      sinceLastReport = 0;
      process.stderr.write(`  ${scanned} arquivo(s) processados…\n`);
    },
  });

  const manifest = buildInventoryManifest(entries, new Date());
  const fingerprint = inventoryContentFingerprint(manifest);

  // Written atomically so an interrupted write cannot leave a half-manifest behind.
  const temporary = `${manifestPath}.tmp`;
  await writeFile(temporary, `${JSON.stringify(manifest, null, 2)}\n`, { mode: 0o600 });
  await rename(temporary, manifestPath);

  const { summary } = manifest;
  process.stdout.write(
    `${JSON.stringify(
      {
        manifestVersion: manifest.manifestVersion,
        contentFingerprint: fingerprint,
        summary,
        baseline: baseline === null ? null : compareInventoryBaseline(summary, baseline),
      },
      null,
      2,
    )}\n`,
  );
  process.stderr.write(
    `Manifesto gravado. O checkpoint permanece em ${CHECKPOINT_SUFFIX} para auditoria; ` +
      "remova-o manualmente para forçar uma varredura completa.\n",
  );
}

await main();
