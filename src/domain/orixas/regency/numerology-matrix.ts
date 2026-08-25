import type { RegencyMatrix } from "./contracts";
import { regencyMatrixSchema } from "./contracts";
import { regencyMatrix } from "./matrix";

export const NUMEROLOGY_REGENCY_MATRIX_VERSION = "regency-matrix-0.3.0-numerology-research";
export const ASTROCENTRO_NUMEROLOGY_LENS_ID = "date-digit-sum-1-16-repeated";

const mappings: ReadonlyArray<readonly [number, readonly string[]]> = [
  [1, ["orisa:exu"]],
  [2, ["orisa:ibeji", "orisa:ogum"]],
  [3, ["orisa:ogum", "orisa:obaluaie"]],
  [4, ["orisa:oya", "orisa:iemanja"]],
  [5, ["orisa:oxum", "orisa:logun-ede"]],
  [6, ["orisa:oxossi", "orisa:xango"]],
  [7, ["orisa:omolu", "orisa:exu"]],
  [8, ["orisa:oxala", "orisa:ogum", "orisa:xango"]],
  [9, ["orisa:iemanja", "orisa:oya"]],
  [10, ["orisa:oxala"]],
  [11, ["orisa:oya", "orisa:ogum", "orisa:exu"]],
  [12, ["orisa:xango"]],
  [13, ["orisa:nana", "orisa:obaluaie"]],
  [14, ["orisa:oxumare"]],
  [15, ["orisa:ogum", "orisa:iemanja", "orisa:omolu", "orisa:oba"]],
  [16, ["orisa:oxala", "orisa:orunmila"]],
];

export const numerologyResearchMatrix: RegencyMatrix = regencyMatrixSchema.parse({
  ...regencyMatrix,
  version: NUMEROLOGY_REGENCY_MATRIX_VERSION,
  sources: [
    ...regencyMatrix.sources,
    {
      id: "source:astrocentro:numerologia-orixas-2026",
      title: "Numerologia dos Orixás: o que é Odú e como calcular o seu",
      url: "https://www.astrocentro.com.br/blog/numerologia/numerologia-dos-orixas/",
      locator: "Seção ‘Os 16 Odús: tabela-resumo’, atualização de julho de 2026",
      evidenceKind: "product_editorial",
    },
  ],
  claims: [
    ...regencyMatrix.claims,
    ...mappings.flatMap(([number, targetIds]) =>
      targetIds.map((targetId) => ({
        id: `claim:astrocentro:numerology:${number}:${targetId.replace("orisa:", "")}`,
        targetId,
        schoolId: "astrocentro-date-sum-2026",
        factor: "birth_number" as const,
        values: [String(number)],
        evidenceTrack: "numerological_mapping" as const,
        sourceId: "source:astrocentro:numerologia-orixas-2026",
        lensId: ASTROCENTRO_NUMEROLOGY_LENS_ID,
        algorithmWeight: null,
        ...(number === 8 && targetId === "orisa:oxala"
          ? {
              manifestation: {
                facetId: "oxaguian",
                label: "Oxaguiã",
                description:
                  "Qualidade nomeada pela fonte para o número 8; normalizada sob Oxalá sem apagar a manifestação.",
              },
            }
          : {}),
      })),
    ),
  ],
});
