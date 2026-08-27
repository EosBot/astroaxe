import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

import { z } from "zod";

import {
  buildExtractionManifest,
  extractionRecordSchema,
  sanitizeExtractionManifest,
  type ExtractionRecord,
} from "../src/domain/ceremonial/extraction";
import { inventoryEntrySchema } from "../src/domain/ceremonial/inventory";
import {
  MissingAdapterToolsError,
  extractInventoriedArchive,
  resolveExtractionToolchain,
} from "../src/lib/ceremonial/extraction-pipeline";
import { DerivativeStoreUnavailableError } from "../src/lib/ceremonial/derivative-store";
import { parseCeremonialPolicy } from "../src/lib/ceremonial/mode";

/**
 * Local-only extraction of the private archive into text derivatives.
 *
 *   npm run ceremonial:extract -- <inventario.json> <destino.json> [--sanitized <arquivo.json>]
 *
 * Refuses to run outside `CEREMONIAL_MODE=local`. Sources are opened read-only and only
 * after their bytes are re-verified against the inventory; nothing in the archive is
 * written, moved or copied. Progress is checkpointed per row, so an interrupted run
 * resumes instead of re-running OCR over the whole archive.
 *
 * The full manifest lists one relative path per row and therefore describes the owner's
 * shelf: it stays local. `--sanitized` writes the shareable counts-only view.
 */

const CHECKPOINT_SUFFIX = ".checkpoint.jsonl";
const DEFAULT_DERIVATIVE_ROOT = "/var/lib/ceremonial/derivatives";

const inventoryManifestSchema = z.object({ entries: z.array(inventoryEntrySchema) }).loose();

function fail(message: string): never {
  process.stderr.write(`${message}\n`);
  process.exit(1);
}

function flagValue(argv: readonly string[], flag: string): string | null {
  const index = argv.indexOf(flag);
  if (index === -1) return null;
  const value = argv[index + 1];
  if (value === undefined || value.startsWith("--")) fail(`Uso: ${flag} <caminho>`);
  return value;
}

/** Reads whatever a previous interrupted run recorded, ignoring a truncated final line. */
async function readCheckpoint(path: string): Promise<Map<string, ExtractionRecord>> {
  const completed = new Map<string, ExtractionRecord>();
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
      continue;
    }
    const parsed = extractionRecordSchema.safeParse(candidate);
    if (parsed.success) completed.set(parsed.data.relativePath, parsed.data);
  }
  return completed;
}

async function writeAtomic(path: string, value: unknown): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  const temporary = `${path}.tmp`;
  await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, { mode: 0o600 });
  await rename(temporary, path);
}

async function main(): Promise<void> {
  const policy = parseCeremonialPolicy();
  if (!policy.servesLocalArchive || policy.local === null)
    fail(
      "A extração só roda em CEREMONIAL_MODE=local com acervo configurado.\n" +
        "Use compose.ingest.yml; a stack pública não tem acesso ao acervo.",
    );

  const argv = process.argv.slice(2);
  // A positional argument is one that is neither a flag nor the value following a flag.
  const positional = argv.filter(
    (argument, index) => !argument.startsWith("--") && !(argv[index - 1] ?? "").startsWith("--"),
  );
  const [inventoryPath, destination] = positional;
  if (inventoryPath === undefined || destination === undefined)
    fail(
      "Uso: npm run ceremonial:extract -- <inventario.json> <destino.json> " +
        "[--sanitized <arquivo.json>]",
    );

  const derivativeRoot = resolve(process.env.CEREMONIAL_DERIVATIVE_ROOT ?? DEFAULT_DERIVATIVE_ROOT);
  const manifestPath = resolve(destination);
  const checkpointPath = `${manifestPath}${CHECKPOINT_SUFFIX}`;

  const inventory = inventoryManifestSchema.parse(
    JSON.parse(await readFile(resolve(inventoryPath), "utf8")),
  );

  let toolchain;
  try {
    toolchain = await resolveExtractionToolchain();
  } catch (error) {
    if (error instanceof MissingAdapterToolsError)
      fail(
        `${error.message}\nRode dentro da imagem de ingest (compose.ingest.yml); ` +
          "o host não tem as ferramentas fixadas.",
      );
    throw error;
  }

  try {
    await mkdir(derivativeRoot, { recursive: true, mode: 0o700 });
  } catch (error) {
    fail(
      `Não foi possível preparar o volume de derivados em ${derivativeRoot}: ` +
        `${(error as Error).message}`,
    );
  }
  await mkdir(dirname(checkpointPath), { recursive: true });

  const completed = await readCheckpoint(checkpointPath);
  if (completed.size > 0)
    process.stderr.write(`Retomando: ${completed.size} registro(s) já processados.\n`);

  let sinceLastReport = 0;
  let records;
  try {
    records = await extractInventoriedArchive({
      archiveRoot: policy.local.archiveRoot,
      derivativeRoot,
      entries: inventory.entries,
      toolchain,
      completed,
      onRecord: async (record) => {
        await writeFile(checkpointPath, `${JSON.stringify(record)}\n`, { flag: "a", mode: 0o600 });
      },
      onProgress: ({ processed }) => {
        sinceLastReport += 1;
        if (sinceLastReport < 25) return;
        sinceLastReport = 0;
        process.stderr.write(`  ${processed} registro(s) processados…\n`);
      },
    });
  } catch (error) {
    // An unwritable volume is a configuration failure, not 801 corrupt files. Failing here
    // keeps a broken mount from being written up as a census of a broken archive.
    if (error instanceof DerivativeStoreUnavailableError)
      fail(
        `${error.message}: ${derivativeRoot}\n` +
          "Confira o volume de derivados e a propriedade do diretório (uid 1000).",
      );
    throw error;
  }

  const manifest = buildExtractionManifest(records, new Date(), toolchain);
  await writeAtomic(manifestPath, manifest);

  const sanitized = sanitizeExtractionManifest(manifest);
  const sanitizedPath = flagValue(argv, "--sanitized");
  if (sanitizedPath !== null) await writeAtomic(resolve(sanitizedPath), sanitized);

  // Only the sanitized view reaches stdout: a path here would name the owner's shelf.
  process.stdout.write(`${JSON.stringify(sanitized, null, 2)}\n`);
  process.stderr.write(
    `Manifesto completo gravado (local-only). O checkpoint permanece em ${CHECKPOINT_SUFFIX} ` +
      "para auditoria; remova-o manualmente para forçar uma extração completa.\n",
  );
}

await main();
