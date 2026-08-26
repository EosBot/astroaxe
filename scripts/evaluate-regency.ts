import { readFile } from "node:fs/promises";

import { z } from "zod";

import {
  runRegencyComparativeBenchmark,
  runRegencyResearchBenchmark,
} from "../src/domain/orixas/regency/benchmark";
import {
  buildRegencyBenchmarkCells,
  detectRegencyBenchmarkDifferencingRisk,
  regencyFeedbackRecordSchema,
  suppressRegencyBenchmarkCells,
} from "../src/domain/orixas/regency/benchmark-release";
import { Prisma } from "../src/generated/prisma/client";
import { disconnectPrisma, getPrisma } from "../src/lib/prisma";

const MAX_DATASET_BYTES = 10 * 1024 * 1024;
const RELEASE_VERSION_PATTERN = /^[a-z0-9][a-z0-9.-]{0,98}[a-z0-9]$/;

const storedCellSchema = z
  .object({
    methodVersion: z.string(),
    matrixVersion: z.string(),
    configVersion: z.string(),
    scorerVersion: z.string(),
    questionnaireVersion: z.string(),
    role: z.enum(["front", "head", "back"]),
    verdict: z.string(),
    confirmationBasis: z.string(),
    directedPair: z.string(),
    count: z.number().int().nonnegative(),
  })
  .strict();

if (process.argv[2] === "--aggregate-release") {
  await runAggregateRelease(process.argv[3]);
} else {
  await runDatasetEvaluation();
}

async function runDatasetEvaluation(): Promise<void> {
  const comparative = process.argv[2] === "--v2";
  const datasetPath = process.argv[comparative ? 3 : 2];

  if (datasetPath === undefined)
    fail(
      "Uso: npm run regency:evaluate -- <dataset.json> [ou regency:evaluate-v2] " +
        "[ou --aggregate-release <versao> para o relatório agregado do banco].",
    );

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
}

/**
 * Reads only the predeclared fixed-dimension columns from RegencyFeedback (no id,
 * comment, birth data, location or timestamp), refuses to publish below the cohort
 * minimum, refuses to publish when a differencing-attack risk is detected against the
 * most recent stored release, and otherwise persists the true cell counts internally
 * while printing only the primary+complementary-suppressed shareable table to stdout.
 * Never accepts a filter argument: the query is always over the complete cohort.
 */
async function runAggregateRelease(releaseVersion: string | undefined): Promise<void> {
  if (releaseVersion === undefined || !RELEASE_VERSION_PATTERN.test(releaseVersion))
    fail(
      "Uso: npm run regency:evaluate -- --aggregate-release <versao-do-release>\n" +
        "A versão deve usar apenas letras minúsculas, dígitos, ponto e hífen.",
    );

  try {
    const prisma = getPrisma();
    const rows = await prisma.regencyFeedback.findMany({
      select: {
        methodVersion: true,
        matrixVersion: true,
        configVersion: true,
        scorerVersion: true,
        questionnaireVersion: true,
        verdict: true,
        confirmationBasis: true,
        predictedTriad: true,
        correctedTriad: true,
      },
    });
    const records = rows.map((row) => regencyFeedbackRecordSchema.parse(row));

    const suppression = suppressRegencyBenchmarkCells(records);
    if (!suppression.ok)
      fail(
        `Amostra insuficiente para publicar: ${suppression.cohortSize} de ` +
          `${suppression.minCohortSize} casos exigidos. Nenhum relatório foi gerado.`,
      );

    const trueCells = buildRegencyBenchmarkCells(records);
    const previousRelease = await prisma.regencyBenchmarkRelease.findFirst({
      orderBy: { generatedAt: "desc" },
    });
    if (previousRelease !== null) {
      const previousCells = z.array(storedCellSchema).parse(previousRelease.cellCounts);
      const risks = detectRegencyBenchmarkDifferencingRisk(previousCells, trueCells);
      if (risks.length > 0)
        fail(
          "Bloqueado por risco de ataque de diferenciação contra o release anterior " +
            `"${previousRelease.releaseVersion}" em ${risks.length} célula(s). ` +
            "Nenhum release foi publicado; revise offline antes de tentar novamente.",
        );
    }

    await prisma.regencyBenchmarkRelease.create({
      data: {
        releaseVersion,
        cohortSize: suppression.cohortSize,
        cellCounts: trueCells,
      },
    });
    process.stdout.write(
      `${JSON.stringify(
        { releaseVersion, cohortSize: suppression.cohortSize, cells: suppression.cells },
        undefined,
        2,
      )}\n`,
    );
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002")
      fail(`Já existe um release com a versão "${releaseVersion}".`);
    fail("Não foi possível gerar o release agregado agora.");
  } finally {
    await disconnectPrisma();
  }
}

function fail(message: string): never {
  process.stderr.write(`${message}\n`);
  process.exit(1);
}
