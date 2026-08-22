import { readFile } from "node:fs/promises";

import { Temporal } from "@js-temporal/polyfill";

import { prepareRegencyEvaluationCase } from "../src/domain/orixas/regency/case-preparation";

const MAX_CASE_BYTES = 256 * 1024;
const casePath = process.argv[2];
const secret = process.env.FINGERPRINT_SECRET;

if (casePath === undefined) fail("Uso: npm run regency:prepare-case -- <caso-bruto.json>");
if (secret === undefined || secret.length < 32)
  fail("FINGERPRINT_SECRET válido é obrigatório para preparar o caso.");

try {
  const file = await readFile(casePath);
  if (file.byteLength > MAX_CASE_BYTES) fail("Caso bruto excede o limite de 256 KiB.");
  const prepared = prepareRegencyEvaluationCase(
    JSON.parse(file.toString("utf8")),
    Temporal.Now.plainDateISO("UTC"),
    secret,
  );
  process.stdout.write(`${JSON.stringify(prepared, undefined, 2)}\n`);
} catch {
  fail("Não foi possível validar e preparar o caso.");
}

function fail(message: string): never {
  process.stderr.write(`${message}\n`);
  process.exit(1);
}
