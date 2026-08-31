import type { ElectionMoment } from "@/domain/astrology/elections";
import type {
  PlanetaryHourInterval,
  PlanetaryHourLocation,
} from "@/domain/astrology/planetary-hours";
import {
  regencyFunctionGraphSchema,
  REGENCY_FUNCTION_GRAPH_VERSION,
} from "@/domain/orixas/regency/function-graph";

import {
  ceremonialEntityRecordSchema,
  crossSystemRelationSchema,
  type CeremonialEntityRecord,
  type CrossSystemRelation,
} from "./entity-records";

/**
 * Fixtures golden do congelamento de domínio (task 21).
 *
 * Tudo aqui é sintético e escrito para o teste. Nenhum registro descreve uma
 * pessoa, e os locators dizem isso literalmente — o acervo real não atravessa
 * esta fronteira.
 */

/**
 * Enumerações congeladas.
 *
 * Estão escritas à mão de propósito: derivá-las do schema faria o congelamento
 * acompanhar silenciosamente qualquer valor novo, que é exatamente o que ele
 * deve impedir. O teste confronta estas listas com os schemas e falha quando
 * divergem, obrigando a decisão a ser explícita.
 */
export const frozenWorkspaceKinds = [
  "AFRO_DIASPORIC",
  "ANGELICAL",
  "GOETIA",
  "OLYMPIC_SPIRITS",
  "PLANETARY_INTELLIGENCES",
  "THEURGIA_GOETIA",
] as const;

export const frozenGuidanceGoalCategories = [
  "coercion",
  "financial_promise",
  "illegal_activity",
  "medical_promise",
  "personal_routine",
  "reflection",
  "remembrance",
  "sacrifice",
  "self_harm",
  "study",
  "violence",
] as const;

export const frozenGuidanceOperations = ["create", "export", "update"] as const;

export const frozenGuidanceTargets = [
  "consenting_adult",
  "non_consenting_person",
  "none",
  "self",
] as const;

export type FrozenWorkspaceKind = (typeof frozenWorkspaceKinds)[number];

/**
 * Um registro por discriminante de sistema, mais duas variantes deliberadas.
 *
 * `Bethor` aparece em dois sistemas para exercitar o homônimo — o caso que mais
 * convida à fusão indevida. `Bael` aparece em duas edições da mesma obra para
 * exercitar a variante de edição, que não é entidade nova nem confirmação
 * independente.
 */
export const goldenEntityRecords: readonly CeremonialEntityRecord[] = [
  {
    id: "entity-record:angelical-trithemius:bethor",
    sourceSystemId: "source-system:angelical-trithemius",
    workspaceKind: "ANGELICAL",
    workId: "work:trithemius-steganographia",
    editionId: "edition:trithemius-testemunho-a",
    names: [{ value: "Bethor", isPrimary: true }],
    rankOrOffice: "Príncipe atribuído à esfera de Júpiter",
    correspondences: [
      {
        targetKind: "planet",
        targetId: "jupiter",
        relation: "governs",
        locator: "Fixture sintética, livro I, verbete de exemplo",
      },
    ],
    reviewStatus: "verified",
  },
  {
    id: "entity-record:arbatel:bethor",
    sourceSystemId: "source-system:arbatel",
    workspaceKind: "OLYMPIC_SPIRITS",
    workId: "work:ars-arbatel",
    editionId: "edition:arbatel-testemunho-a",
    names: [{ value: "Bethor", isPrimary: true }],
    rankOrOffice: "Espírito olímpico de Júpiter",
    correspondences: [
      {
        targetKind: "planet",
        targetId: "jupiter",
        relation: "governs",
        locator: "Fixture sintética, aforismo de exemplo",
      },
    ],
    reviewStatus: "verified",
  },
  {
    id: "entity-record:goetia:bael",
    sourceSystemId: "source-system:goetia",
    workspaceKind: "GOETIA",
    workId: "work:lemegeton-goetia",
    editionId: "edition:goetia-testemunho-a",
    names: [{ value: "Bael", isPrimary: true }],
    rankOrOffice: "Primeiro rei",
    correspondences: [
      {
        targetKind: "weekday",
        targetId: "sunday",
        relation: "attributed_to",
        locator: "Fixture sintética, testemunho A, verbete 1",
      },
    ],
    reviewStatus: "verified",
  },
  {
    id: "entity-record:goetia:bael-testemunho-b",
    sourceSystemId: "source-system:goetia",
    workspaceKind: "GOETIA",
    // Mesma obra, edição diferente: variante, não entidade nova. Duas edições de
    // um mesmo texto continuam sendo uma única testemunha.
    workId: "work:lemegeton-goetia",
    editionId: "edition:goetia-testemunho-b",
    names: [{ value: "Bael", isPrimary: true }],
    rankOrOffice: "Primeiro rei, com selo em variante",
    correspondences: [
      {
        targetKind: "weekday",
        targetId: "sunday",
        relation: "attributed_to",
        locator: "Fixture sintética, testemunho B, verbete 1",
      },
    ],
    reviewStatus: "candidate",
  },
  {
    id: "entity-record:theurgia-goetia:carnesiel",
    sourceSystemId: "source-system:theurgia-goetia",
    workspaceKind: "THEURGIA_GOETIA",
    workId: "work:lemegeton-theurgia",
    editionId: "edition:theurgia-testemunho-a",
    names: [{ value: "Carnesiel", isPrimary: true }],
    rankOrOffice: "Imperador do oriente",
    correspondences: [
      {
        targetKind: "element",
        targetId: "air",
        relation: "governs",
        locator: "Fixture sintética, hierarquia aérea, verbete de exemplo",
      },
    ],
    reviewStatus: "candidate",
  },
  {
    id: "entity-record:agrippa:hismael",
    sourceSystemId: "source-system:agrippa",
    workspaceKind: "PLANETARY_INTELLIGENCES",
    workId: "work:occulta-philosophia",
    editionId: "edition:agrippa-testemunho-a",
    names: [{ value: "Hismael", isPrimary: true }],
    rankOrOffice: "Espírito de Júpiter, distinto da inteligência do mesmo planeta",
    correspondences: [
      {
        targetKind: "planet",
        targetId: "jupiter",
        relation: "attributed_to",
        locator: "Fixture sintética, livro II, tábua de exemplo",
      },
    ],
    reviewStatus: "verified",
  },
  {
    id: "entity-record:umbanda-sagrada:ogum",
    sourceSystemId: "source-system:umbanda-sagrada",
    workspaceKind: "AFRO_DIASPORIC",
    workId: "work:teogonia-umbanda",
    editionId: "edition:teogonia-testemunho-a",
    names: [
      { value: "Ogum", isPrimary: true },
      { value: "Ògún", script: "yoruba", isPrimary: false },
    ],
    rankOrOffice: "Orixá do ferro e do ofício da guerra",
    correspondences: [
      {
        targetKind: "planet",
        targetId: "mars",
        relation: "attributed_to",
        locator: "Fixture sintética, capítulo de exemplo",
      },
    ],
    reviewStatus: "verified",
  },
].map((record) => ceremonialEntityRecordSchema.parse(record));

/**
 * A única ponte entre sistemas nestas fixtures, e ela é `shares_name`.
 *
 * Os dois Bethor compartilham o nome e o planeta, e ainda assim continuam dois
 * registros: afirmar identidade exigiria uma fonte que a sustentasse.
 */
export const goldenCrossSystemRelations: readonly CrossSystemRelation[] = [
  {
    id: "relation:bethor-homonimo",
    leftRecordId: "entity-record:angelical-trithemius:bethor",
    rightRecordId: "entity-record:arbatel:bethor",
    relation: "shares_name",
    locator: "Fixture sintética, nota comparativa de exemplo",
  },
].map((relation) => crossSystemRelationSchema.parse(relation));

export type GoldenTimingCase =
  | { caseId: string; kind: "interval"; interval: PlanetaryHourInterval }
  | { caseId: string; kind: "location"; location: PlanetaryHourLocation };

/**
 * Casos golden de hora planetária.
 *
 * Os de intervalo são puros e não tocam efemérides. Os de localização usam um
 * instante fixo e existem para congelar os três desfechos possíveis: leitura
 * observada, recusa polar estrita e proxy equinocial rotulado.
 */
export const goldenTimingCases: readonly GoldenTimingCase[] = [
  {
    caseId: "timing:intervalo-diurno",
    kind: "interval",
    interval: {
      instant: "2026-06-21T09:00:00+00:00",
      intervalStart: "2026-06-21T06:00:00+00:00",
      intervalEnd: "2026-06-21T18:00:00+00:00",
      segment: "day",
      dayRuler: "sun",
    },
  },
  {
    caseId: "timing:intervalo-noturno",
    kind: "interval",
    interval: {
      instant: "2026-06-21T22:00:00+00:00",
      intervalStart: "2026-06-21T18:00:00+00:00",
      intervalEnd: "2026-06-22T06:00:00+00:00",
      segment: "night",
      dayRuler: "sun",
    },
  },
  {
    caseId: "timing:latitude-temperada",
    kind: "location",
    location: { jdUt: 2461213, latitude: -23.55, longitude: -46.63, polarFallback: "strict" },
  },
  {
    caseId: "timing:polar-estrito",
    kind: "location",
    location: { jdUt: 2461213, latitude: 78.22, longitude: 15.63, polarFallback: "strict" },
  },
  {
    caseId: "timing:polar-proxy",
    kind: "location",
    location: {
      jdUt: 2461213,
      latitude: 78.22,
      longitude: 15.63,
      polarFallback: "equinoctial_local_solar",
    },
  },
];

export interface GoldenElectionMoment extends ElectionMoment {
  momentId: string;
}

/**
 * Instantes golden para as eleições.
 *
 * O primeiro existe para que perfis discordem sobre o mesmo céu, que é a
 * situação que a task manda deixar observável.
 */
export const goldenElectionMoments: readonly GoldenElectionMoment[] = [
  {
    momentId: "moment:lua-nova",
    jdUt: 2461213,
    latitude: -23.55,
    longitude: -46.63,
    sunLongitude: 90,
    moonLongitude: 90,
  },
  {
    momentId: "moment:lua-crescente",
    jdUt: 2461213,
    latitude: -23.55,
    longitude: -46.63,
    sunLongitude: 90,
    moonLongitude: 150,
  },
  {
    momentId: "moment:lua-desconhecida",
    jdUt: 2461213,
    latitude: -23.55,
    longitude: -46.63,
  },
];

/**
 * Grafo adversarial: repetição de linhagem e divergência declarada.
 *
 * Três obras distintas de uma única família respondem à mesma função. Se a
 * condensação contasse obras, isso viraria `convergent` e o produto anunciaria
 * uma concordância que nunca houve — é o mesmo autor três vezes.
 */
export const duplicateLineageGraph = regencyFunctionGraphSchema.parse({
  version: REGENCY_FUNCTION_GRAPH_VERSION,
  status: "research",
  assignments: [
    assignment("saraceni-a", "path-opening", "exu-mirim", "work:saraceni-a"),
    assignment("saraceni-b", "path-opening", "exu-tranca-ruas", "work:saraceni-b"),
    assignment("saraceni-c", "path-opening", "exu-veludo", "work:saraceni-c"),
    {
      ...assignment("conflito-a", "iron-and-war-craft", "ogum-a", "work:linhagem-a"),
      sourceFamilyId: "family:linhagem-a",
      claimSchoolId: "school:linhagem-a",
      conflictsWith: ["assignment:conflito-b"],
    },
    {
      ...assignment("conflito-b", "iron-and-war-craft", "ogum-b", "work:linhagem-b"),
      sourceFamilyId: "family:linhagem-b",
      claimSchoolId: "school:linhagem-b",
      conflictsWith: ["assignment:conflito-a"],
    },
  ],
});

function assignment(slug: string, functionSlug: string, entitySlug: string, workId: string) {
  return {
    id: `assignment:${slug}`,
    functionId: `function:${functionSlug}`,
    entityId: `entity:sintetica:${entitySlug}`,
    entityCategory: "guide_entity" as const,
    traditionId: "tradition:sintetica",
    workId,
    sourceFamilyId: "family:saraceni",
    claimSchoolId: "school:saraceni",
    locator: "Fixture sintética, verbete de exemplo",
    extractionMethod: "manual_review" as const,
    extractionConfidence: 0.9,
    reviewStatus: "verified" as const,
    conflictsWith: [] as string[],
  };
}
