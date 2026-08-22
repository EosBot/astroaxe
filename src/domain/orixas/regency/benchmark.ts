import { regencyEvaluationDatasetSchema, evaluateRegencyConfig } from "./calibration";
import { experimentalRegencyConfig } from "./experimental-config";
import { experimentalRegencyMatrix } from "./experimental-matrix";
import { regencyMatrix } from "./matrix";
import { regencyResearchConfig } from "./research-config";
import { assessRegencyPromotion, createRegencyDatasetManifest } from "./dataset-freeze";

export function runRegencyResearchBenchmark(rawDataset: unknown) {
  const dataset = regencyEvaluationDatasetSchema.parse(rawDataset);
  return evaluateVersions(dataset, regencyMatrix, regencyResearchConfig);
}

export function runRegencyComparativeBenchmark(rawDataset: unknown) {
  const dataset = regencyEvaluationDatasetSchema.parse(rawDataset);
  const baseline = evaluateVersions(dataset, regencyMatrix, regencyResearchConfig);
  const experimental = evaluateVersions(
    dataset,
    experimentalRegencyMatrix,
    experimentalRegencyConfig,
  );
  return {
    dataset: createRegencyDatasetManifest(dataset),
    baseline,
    experimental,
    promotionAssessment: assessRegencyPromotion({
      baseline: baseline.validation,
      experimental: experimental.validation,
    }),
  };
}

function evaluateVersions(
  dataset: ReturnType<typeof regencyEvaluationDatasetSchema.parse>,
  matrix: typeof regencyMatrix,
  config: typeof regencyResearchConfig,
) {
  return {
    matrixVersion: matrix.version,
    configVersion: config.version,
    calibration: evaluateRegencyConfig({
      matrix,
      config,
      datasetVersion: dataset.version,
      cases: dataset.cases,
      partition: "calibration",
    }),
    validation: evaluateRegencyConfig({
      matrix,
      config,
      datasetVersion: dataset.version,
      cases: dataset.cases,
      partition: "validation",
    }),
  };
}
