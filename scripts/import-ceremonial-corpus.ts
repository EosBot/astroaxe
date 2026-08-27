import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

import { PrismaPg } from "@prisma/adapter-pg";
import { z } from "zod";

import {
  IMPORT_PIPELINE_VERSION,
  importMappingFileSchema,
  proposeCorpusImport,
  type ImportCandidate,
} from "../src/domain/ceremonial/import";
import { PrismaClient } from "../src/generated/prisma/client";
import { applyCorpusImport } from "../src/lib/ceremonial/import-store";

/**
 * Maps an extraction manifest into a citable lineage.
 *
 *   npm run ceremonial:import -- <extraction.json> [--mappings <arquivo.json>]
 *                                [--apply] [--sanitized <saida.json>]
 *
 * Reports by default and writes only with `--apply`, because the first useful thing this
 * produces is a count of how much of the archive nobody has identified yet — and that is
 * worth reading before anything touches the database.
 *
 * Only the sanitized view reaches stdout: the plan itself carries one relative path per
 * artifact, and in this archive a path is the title of a book the owner possesses.
 */

const extractionManifestSchema = z
  .object({
    records: z.array(
      z
        .object({
          relativePath: z.string(),
          sourceHash: z.string().nullable(),
          sourceMimeType: z.string().nullable(),
          outcome: z.string(),
          pageCount: z.number().int().nullable(),
        })
        .loose(),
    ),
  })
  .loose();

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

async function readJson(path: string): Promise<unknown> {
  try {
    return JSON.parse(await readFile(resolve(path), "utf8"));
  } catch (error) {
    fail(`Não foi possível ler ${path}: ${(error as Error).message}`);
  }
}

async function writeAtomic(path: string, value: unknown): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  const temporary = `${path}.tmp`;
  await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, { mode: 0o600 });
  await rename(temporary, path);
}

/**
 * An extraction row becomes an import candidate only when its bytes were verified and its
 * type is known. A row the extraction quarantined is not a source, and a row it never
 * identified has no mime type to record.
 */
function toCandidates(manifest: z.infer<typeof extractionManifestSchema>): ImportCandidate[] {
  const candidates: ImportCandidate[] = [];
  for (const record of manifest.records) {
    if (record.sourceHash === null || record.sourceMimeType === null) continue;
    if (record.outcome === "QUARANTINED") continue;
    candidates.push({
      relativePath: record.relativePath,
      contentHash: record.sourceHash,
      mimeType: record.sourceMimeType,
      byteSize: typeof record.byteSize === "number" ? record.byteSize : 0,
      pageCount: record.pageCount,
      hasExtractedText: record.outcome === "EXTRACTED",
    });
  }
  return candidates;
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const positional = argv.filter(
    (argument, index) => !argument.startsWith("--") && !(argv[index - 1] ?? "").startsWith("--"),
  );
  const [manifestPath] = positional;
  if (manifestPath === undefined)
    fail(
      "Uso: npm run ceremonial:import -- <extraction.json> [--mappings <arquivo.json>] " +
        "[--apply] [--sanitized <saida.json>]",
    );

  const manifest = extractionManifestSchema.parse(await readJson(manifestPath));
  const mappingsPath = flagValue(argv, "--mappings");
  const mappingFile =
    mappingsPath === null
      ? { pipelineVersion: IMPORT_PIPELINE_VERSION, mappings: [] }
      : importMappingFileSchema.parse(await readJson(mappingsPath));

  const plan = proposeCorpusImport(toCandidates(manifest), mappingFile.mappings);
  const report: {
    pipelineVersion: string;
    summary: typeof plan.summary;
    applied: false | Record<string, number>;
  } = { pipelineVersion: plan.pipelineVersion, summary: plan.summary, applied: false };

  if (argv.includes("--apply")) {
    const databaseUrl = process.env.DATABASE_URL;
    if (databaseUrl === undefined || databaseUrl === "")
      fail("--apply exige DATABASE_URL apontando para o banco do runtime local.");

    const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });
    try {
      report.applied = { ...(await applyCorpusImport(prisma, plan)) };
    } finally {
      await prisma.$disconnect();
    }
  }

  const sanitizedPath = flagValue(argv, "--sanitized");
  if (sanitizedPath !== null) await writeAtomic(resolve(sanitizedPath), report);

  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  if (report.applied === false)
    process.stderr.write(
      "Nada foi gravado. Releia os números acima e use --apply quando eles fizerem sentido.\n",
    );
}

await main();
