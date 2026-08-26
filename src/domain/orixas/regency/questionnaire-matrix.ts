import { regencyMatrixSchema, type RegencyMatrix } from "./contracts";

export const QUESTIONNAIRE_MATRIX_VERSION = "regency-questionnaire-matrix-1.0.0";

const pairs = [
  ["faith", "orisa:oxala", "orisa:logunan"],
  ["love", "orisa:oxum", "orisa:oxumare"],
  ["knowledge", "orisa:oxossi", "orisa:oba"],
  ["justice", "orisa:xango", "orisa:egunita"],
  ["law", "orisa:ogum", "orisa:oya"],
  ["evolution", "orisa:obaluaie", "orisa:nana"],
  ["generation", "orisa:iemanja", "orisa:omolu"],
] as const;

export const regencyQuestionnaireMatrix: RegencyMatrix = regencyMatrixSchema.parse({
  version: QUESTIONNAIRE_MATRIX_VERSION,
  status: "research",
  entities: [
    ...new Map(
      pairs
        .flatMap(([, first, second]) => [entity(first), entity(second)])
        .map((item) => [item.id, item]),
    ).values(),
  ],
  sources: [
    {
      id: "source:saraceni:sete-linhas",
      title: "As Sete Linhas de Umbanda — Rubens Saraceni",
      url: "https://www.madras.com.br/umbanda/sete-linhas-de-umbanda-as",
      locator:
        "Sistema das sete linhas e seus catorze polos; edição Madras e corpus local autorizado",
      evidenceKind: "community_primary",
    },
    {
      id: "source:saraceni:teogonia",
      title: "Orixás — Teogonia de Umbanda — Rubens Saraceni",
      url: "https://www.madras.com.br/umbanda/orixas-teogonia-de-umbanda-5885",
      locator: "Pares de polos e qualidades nas linhas; edição Madras e corpus local autorizado",
      evidenceKind: "community_primary",
    },
  ],
  claims: pairs.flatMap(([lensId, first, second]) => [
    claim(lensId, "first_pole", first),
    claim(lensId, "second_pole", second),
  ]),
});

function claim(lensId: string, value: "first_pole" | "second_pole", targetId: string) {
  return {
    id: `claim:self-report:${lensId}:${value}`,
    targetId,
    schoolId: "umbanda-sagrada-saraceni",
    factor: "self_report" as const,
    values: [value],
    evidenceTrack: "self_report_mapping" as const,
    sourceId: lensId === "law" ? "source:saraceni:teogonia" : "source:saraceni:sete-linhas",
    lensId,
    algorithmWeight: null,
  };
}

function entity(id: string) {
  const names: Record<string, string> = {
    "orisa:oxala": "Oxalá",
    "orisa:logunan": "Logunan",
    "orisa:oxum": "Oxum",
    "orisa:oxumare": "Oxumarê",
    "orisa:oxossi": "Oxóssi",
    "orisa:oba": "Obá",
    "orisa:xango": "Xangô",
    "orisa:egunita": "Egunitá",
    "orisa:ogum": "Ogum",
    "orisa:oya": "Oiá/Iansã",
    "orisa:obaluaie": "Obaluaiê",
    "orisa:nana": "Nanã",
    "orisa:iemanja": "Iemanjá",
    "orisa:omolu": "Omolu",
  };
  return { id, kind: "orisa", canonicalName: names[id], aliases: [], eligibleForRegency: true };
}
