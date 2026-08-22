import { analyzeGeneratedCorrespondences } from "../src/domain/orixas/regency/correspondence-generation";
import { regencyMatrix } from "../src/domain/orixas/regency/matrix";
import { generatedSymbolicCorrespondences } from "../src/domain/orixas/regency/symbolic-catalog";

const report = analyzeGeneratedCorrespondences({
  entities: regencyMatrix.entities,
  correspondences: generatedSymbolicCorrespondences,
});

process.stdout.write(`${JSON.stringify(report, undefined, 2)}\n`);
