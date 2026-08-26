import "server-only";

import { regencyMatrixSchema, type RegencyMatrix } from "./contracts";
import { experimentalRegencyMatrix } from "./experimental-matrix";
import { numerologyResearchMatrix } from "./numerology-matrix";
import { regencyQuestionnaireMatrix } from "./questionnaire-matrix";

export const REGENCY_V2_MATRIX_VERSION = "regency-matrix-0.5.0-v3-questionnaire-research";

const baseClaimIds = new Set(experimentalRegencyMatrix.claims.map(({ id }) => id));
const baseSourceIds = new Set(experimentalRegencyMatrix.sources.map(({ id }) => id));

/** Matriz composta usada somente no servidor; o cliente recebe um DTO público reduzido. */
export const regencyV2Matrix: RegencyMatrix = regencyMatrixSchema.parse({
  ...experimentalRegencyMatrix,
  version: REGENCY_V2_MATRIX_VERSION,
  sources: [
    ...experimentalRegencyMatrix.sources,
    ...numerologyResearchMatrix.sources.filter(({ id }) => !baseSourceIds.has(id)),
    ...regencyQuestionnaireMatrix.sources.filter(({ id }) => !baseSourceIds.has(id)),
  ],
  claims: [
    ...experimentalRegencyMatrix.claims,
    ...numerologyResearchMatrix.claims.filter(({ id }) => !baseClaimIds.has(id)),
    ...regencyQuestionnaireMatrix.claims.filter(({ id }) => !baseClaimIds.has(id)),
  ],
});
