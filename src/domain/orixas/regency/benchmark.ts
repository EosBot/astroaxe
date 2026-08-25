import { regencyEvaluationDatasetSchema, evaluateRegencyConfig } from "./calibration";
import { regencyV2Config } from "./v2-config";
import { regencyV2Matrix } from "./v2-matrix";
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
  const candidate = evaluateVersions(dataset, regencyV2Matrix, regencyV2Config);
  return {
    dataset: createRegencyDatasetManifest(dataset),
    baseline,
    candidate,
    promotionAssessment: assessRegencyPromotion({
      baseline: baseline.validation,
      experimental: candidate.validation,
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
