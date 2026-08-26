import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import { buildPublicBundle } from "../src/domain/ceremonial/public-bundle";

async function main(): Promise<void> {
  const [inputPath, outputDirectory, generatedAtText] = process.argv.slice(2);
  if (inputPath === undefined || outputDirectory === undefined || generatedAtText === undefined)
    throw new Error(
      "usage: ceremonial:bundle <sanitized-input.json> <output-directory> <generated-at-iso>",
    );
  const generatedAt = new Date(generatedAtText);
  if (Number.isNaN(generatedAt.getTime()) || generatedAt.toISOString() !== generatedAtText)
    throw new Error("generated-at must be an exact UTC ISO instant");

  const rawInput: unknown = JSON.parse(await readFile(resolve(inputPath), "utf8"));
  const built = buildPublicBundle(rawInput, generatedAt);
  const output = resolve(outputDirectory);
  await mkdir(output, { recursive: false });
  await Promise.all([
    writeFile(resolve(output, "manifest.json"), `${built.canonicalJson}\n`, {
      flag: "wx",
      mode: 0o600,
    }),
    writeFile(resolve(output, "manifest.sha256"), `${built.manifestHash}  manifest.json\n`, {
      flag: "wx",
      mode: 0o600,
    }),
    writeFile(resolve(output, "exclusions.json"), `${JSON.stringify(built.excluded, null, 2)}\n`, {
      flag: "wx",
      mode: 0o600,
    }),
  ]);
  process.stdout.write(
    JSON.stringify({
      manifestHash: built.manifestHash,
      records: built.manifest.records.length,
      excluded: built.excluded.length,
      storageNamespace: `bundle-${built.manifestHash.slice(0, 32)}`,
    }) + "\n",
  );
}

main().catch((error: unknown) => {
  process.stderr.write(error instanceof Error ? `${error.message}\n` : "bundle build failed\n");
  process.exitCode = 1;
});
