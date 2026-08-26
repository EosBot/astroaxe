import { z } from "zod";

export const REGENCY_BENCHMARK_RELEASE_ENGINE_VERSION = "regency-benchmark-release-0.1.0";

export const MIN_COHORT_SIZE = 30;
export const PRIMARY_SUPPRESSION_THRESHOLD = 10;

const ROLES = ["front", "head", "back"] as const;
type Role = (typeof ROLES)[number];

const orisaIdOrNullSchema = z
  .string()
  .regex(/^orisa:[a-z0-9-]+$/)
  .nullable();

const triadSchema = z
  .object({
    front: orisaIdOrNullSchema,
    head: orisaIdOrNullSchema,
    back: orisaIdOrNullSchema,
  })
  .strict();

export const regencyFeedbackRecordSchema = z
  .object({
    methodVersion: z.string(),
    matrixVersion: z.string(),
    configVersion: z.string(),
    scorerVersion: z.string(),
    questionnaireVersion: z.string(),
    verdict: z.string(),
    confirmationBasis: z.string(),
    predictedTriad: triadSchema,
    correctedTriad: triadSchema.nullable(),
  })
  .strict();

export type RegencyFeedbackRecord = z.infer<typeof regencyFeedbackRecordSchema>;

export interface RegencyBenchmarkCellKey {
  methodVersion: string;
  matrixVersion: string;
  configVersion: string;
  scorerVersion: string;
  questionnaireVersion: string;
  role: Role;
  verdict: string;
  confirmationBasis: string;
  directedPair: string;
}

export interface RegencyBenchmarkCell extends RegencyBenchmarkCellKey {
  count: number;
}

export interface RegencyBenchmarkSuppressedCell extends RegencyBenchmarkCellKey {
  count: number | null;
  suppressed: boolean;
  suppressionReason?: "primary" | "complementary";
}

export type RegencyBenchmarkSuppressionResult =
  | { ok: false; reason: "insufficient_cohort"; cohortSize: number; minCohortSize: number }
  | { ok: true; cohortSize: number; cells: RegencyBenchmarkSuppressedCell[] };

export interface DifferencingRisk {
  cellKey: RegencyBenchmarkCellKey;
}

/**
 * A "directed pair" identifies whether the predicted Orixá for a role was later
 * confirmed, corrected to a different Orixá, or left unspecified. It never carries
 * a comment, birth date, location, timestamp or any row identifier.
 */
export function directedPairId(
  predicted: string | null,
  corrected: string | null | undefined,
): string {
  if (predicted === null) return "unresolved";
  if (corrected === undefined || corrected === null) return "unspecified";
  return `${predicted}->${corrected}`;
}

/**
 * Builds the identity string from only the nine predeclared dimensions, explicitly, so
 * passing a cell that also carries `count`/`suppressed`/`suppressionReason` (as every
 * caller in this module does) can never change which partition or prior-release cell it
 * matches against.
 */
function cellKeyId(key: RegencyBenchmarkCellKey): string {
  return JSON.stringify({
    methodVersion: key.methodVersion,
    matrixVersion: key.matrixVersion,
    configVersion: key.configVersion,
    scorerVersion: key.scorerVersion,
    questionnaireVersion: key.questionnaireVersion,
    role: key.role,
    verdict: key.verdict,
    confirmationBasis: key.confirmationBasis,
    directedPair: key.directedPair,
  });
}

/** Groups every role of every record into the fixed, predeclared dimension tuple. */
export function buildRegencyBenchmarkCells(
  records: readonly RegencyFeedbackRecord[],
): RegencyBenchmarkCell[] {
  const counts = new Map<string, RegencyBenchmarkCell>();
  for (const record of records) {
    for (const role of ROLES) {
      const key: RegencyBenchmarkCellKey = {
        methodVersion: record.methodVersion,
        matrixVersion: record.matrixVersion,
        configVersion: record.configVersion,
        scorerVersion: record.scorerVersion,
        questionnaireVersion: record.questionnaireVersion,
        role,
        verdict: record.verdict,
        confirmationBasis: record.confirmationBasis,
        directedPair: directedPairId(record.predictedTriad[role], record.correctedTriad?.[role]),
      };
      const id = cellKeyId(key);
      const existing = counts.get(id);
      if (existing === undefined) counts.set(id, { ...key, count: 1 });
      else existing.count += 1;
    }
  }
  return [...counts.values()].sort((a, b) => cellKeyId(a).localeCompare(cellKeyId(b)));
}

function partitionKeyId(cell: RegencyBenchmarkCellKey): string {
  return JSON.stringify({
    methodVersion: cell.methodVersion,
    matrixVersion: cell.matrixVersion,
    configVersion: cell.configVersion,
    scorerVersion: cell.scorerVersion,
    questionnaireVersion: cell.questionnaireVersion,
    role: cell.role,
    verdict: cell.verdict,
  });
}

/**
 * Refuses to produce a shareable table below the cohort minimum; otherwise primary-
 * suppresses every cell under the threshold and applies complementary suppression so a
 * lone suppressed cell in a partition can never be recovered by subtracting its visible
 * siblings from a marginal total published elsewhere.
 */
export function suppressRegencyBenchmarkCells(
  records: readonly RegencyFeedbackRecord[],
  options: { minCohortSize?: number; primaryThreshold?: number } = {},
): RegencyBenchmarkSuppressionResult {
  const minCohortSize = options.minCohortSize ?? MIN_COHORT_SIZE;
  const primaryThreshold = options.primaryThreshold ?? PRIMARY_SUPPRESSION_THRESHOLD;
  const cohortSize = records.length;
  if (cohortSize < minCohortSize)
    return { ok: false, reason: "insufficient_cohort", cohortSize, minCohortSize };

  const cells: RegencyBenchmarkSuppressedCell[] = buildRegencyBenchmarkCells(records).map((cell) =>
    cell.count < primaryThreshold
      ? { ...cell, count: null, suppressed: true, suppressionReason: "primary" }
      : { ...cell, suppressed: false },
  );

  const partitions = new Map<string, RegencyBenchmarkSuppressedCell[]>();
  for (const cell of cells) {
    const key = partitionKeyId(cell);
    const bucket = partitions.get(key);
    if (bucket === undefined) partitions.set(key, [cell]);
    else bucket.push(cell);
  }
  for (const partition of partitions.values()) {
    const suppressedCount = partition.filter((cell) => cell.suppressed).length;
    if (suppressedCount !== 1 || partition.length <= 1) continue;
    const visible = partition.filter((cell) => !cell.suppressed);
    let smallest = visible[0];
    for (const cell of visible)
      if (smallest === undefined || (cell.count ?? Number.POSITIVE_INFINITY) < (smallest.count ?? Number.POSITIVE_INFINITY))
        smallest = cell;
    if (smallest === undefined) continue;
    smallest.count = null;
    smallest.suppressed = true;
    smallest.suppressionReason = "complementary";
  }

  return { ok: true, cohortSize, cells };
}

/**
 * Compares true (unsuppressed) per-cell counts between the previous stored release and
 * the current one. A nonzero delta smaller than the primary-suppression threshold can
 * isolate the handful of individuals who joined between releases, so any such cell
 * blocks publication rather than being silently re-suppressed.
 */
export function detectRegencyBenchmarkDifferencingRisk(
  previousCells: readonly RegencyBenchmarkCell[],
  currentCells: readonly RegencyBenchmarkCell[],
  primaryThreshold: number = PRIMARY_SUPPRESSION_THRESHOLD,
): DifferencingRisk[] {
  const previousByKey = new Map(previousCells.map((cell) => [cellKeyId(cell), cell.count]));
  const risks: DifferencingRisk[] = [];
  for (const cell of currentCells) {
    const previousCount = previousByKey.get(cellKeyId(cell));
    if (previousCount === undefined) continue;
    const delta = Math.abs(cell.count - previousCount);
    if (delta > 0 && delta < primaryThreshold) risks.push({ cellKey: cell });
  }
  return risks;
}
