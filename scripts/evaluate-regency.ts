import { readFile } from "node:fs/promises";

import {
  runRegencyComparativeBenchmark,
  runRegencyResearchBenchmark,
} from "../src/domain/orixas/regency/benchmark";

const MAX_DATASET_BYTES = 10 * 1024 * 1024;
const comparative = process.argv[2] === "--v2";
const datasetPath = process.argv[comparative ? 3 : 2];

if (datasetPath === undefined)
  fail("Uso: npm run regency:evaluate -- <dataset.json> [ou regency:evaluate-v2]");

try {
  const file = await readFile(datasetPath);
  if (file.byteLength > MAX_DATASET_BYTES) fail("Dataset excede o limite de 10 MiB.");
  const rawDataset: unknown = JSON.parse(file.toString("utf8"));
  const result = comparative
    ? runRegencyComparativeBenchmark(rawDataset)
    : runRegencyResearchBenchmark(rawDataset);
  process.stdout.write(`${JSON.stringify(result, undefined, 2)}\n`);
} catch {
  fail("Não foi possível validar e avaliar o dataset.");
}

function fail(message: string): never {
  process.stderr.write(`${message}\n`);
  process.exit(1);
}
