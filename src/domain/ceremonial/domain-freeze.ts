import {
  ELECTION_ENGINE_VERSION,
  ELECTION_PROFILE_SCHEMA_VERSION,
  evaluateElections,
  type ElectionMoment,
  type ElectionProfile,
} from "@/domain/astrology/elections";
import { electionProfileGaps, seededElectionProfiles } from "@/domain/astrology/elections/profiles";
import {
  PLANETARY_HOURS_VERSION,
  resolvePlanetaryHourAt,
  resolvePlanetaryHourInInterval,
} from "@/domain/astrology/planetary-hours";
import { fingerprint } from "@/domain/canonical-json";
import {
  condenseStructuralFunctions,
  REGENCY_FUNCTION_GRAPH_VERSION,
  type ConvergenceStrength,
  type RegencyFunctionGraph,
} from "@/domain/orixas/regency/function-graph";
import { regencyFunctionGraph } from "@/domain/orixas/regency/function-graph-data";
import { STRUCTURAL_FUNCTION_VOCABULARY_VERSION } from "@/domain/orixas/regency/structural-functions";

import {
  frozenGuidanceGoalCategories,
  frozenGuidanceOperations,
  frozenGuidanceTargets,
  frozenWorkspaceKinds,
  goldenCrossSystemRelations,
  goldenElectionMoments,
  goldenEntityRecords,
  goldenTimingCases,
  type FrozenWorkspaceKind,
  type GoldenElectionMoment,
  type GoldenTimingCase,
} from "./domain-freeze-data";
import {
  CEREMONIAL_ENTITY_SCHEMA_VERSION,
  findNameCollisions,
  type CeremonialEntityRecord,
  type CrossSystemRelation,
} from "./entity-records";
import { CEREMONIAL_GUIDANCE_POLICY_VERSION, evaluateGuidancePolicy } from "./guidance-policy";

export const DOMAIN_FREEZE_VERSION = "ceremonial-domain-freeze-0.1.0";

/**
 * Versões que o congelamento observa.
 *
 * Cada módulo declara a sua, e o manifesto as reúne para que uma mudança de
 * comportamento não entre sem que a versão correspondente suba junto.
 */
export const frozenDomainVersions = {
  electionEngine: ELECTION_ENGINE_VERSION,
  electionProfileSchema: ELECTION_PROFILE_SCHEMA_VERSION,
  entityRecords: CEREMONIAL_ENTITY_SCHEMA_VERSION,
  functionGraph: REGENCY_FUNCTION_GRAPH_VERSION,
  guidancePolicy: CEREMONIAL_GUIDANCE_POLICY_VERSION,
  planetaryHours: PLANETARY_HOURS_VERSION,
  structuralFunctions: STRUCTURAL_FUNCTION_VOCABULARY_VERSION,
} as const;

export type FreezeSurfaceId =
  "elections" | "guidance_policy" | "planetary_timing" | "source_variants" | "system_discriminants";

export interface FreezeSurface {
  surfaceId: FreezeSurfaceId;
  caseCount: number;
  fingerprint: string;
}

export interface DomainFreezeManifest {
  freezeVersion: string;
  versions: typeof frozenDomainVersions;
  surfaces: FreezeSurface[];
  fingerprint: string;
}

/**
 * Congela entrada e saída de cada superfície determinística do domínio.
 *
 * O fingerprint cobre o par entrada/saída, não só a saída: se apenas a saída
 * entrasse, dois casos distintos que por acaso produzem o mesmo resultado
 * ficariam indistinguíveis e uma troca de fixture passaria despercebida.
 *
 * Cada superfície tem fingerprint próprio além do global, de modo que uma quebra
 * diga **onde** mudou em vez de apenas que mudou.
 */
export function createDomainFreezeManifest(
  input: {
    records?: readonly CeremonialEntityRecord[];
    relations?: readonly CrossSystemRelation[];
    timingCases?: readonly GoldenTimingCase[];
    moments?: readonly GoldenElectionMoment[];
    profiles?: readonly ElectionProfile[];
  } = {},
): DomainFreezeManifest {
  const records = input.records ?? goldenEntityRecords;
  const relations = input.relations ?? goldenCrossSystemRelations;
  const timingCases = input.timingCases ?? goldenTimingCases;
  const moments = input.moments ?? goldenElectionMoments;
  const profiles = input.profiles ?? seededElectionProfiles;

  const surfaces: FreezeSurface[] = [
    surface("elections", frozenElections(moments, profiles)),
    surface("guidance_policy", frozenGuidancePolicy()),
    surface("planetary_timing", frozenTiming(timingCases)),
    surface("source_variants", frozenSourceVariants(records, relations)),
    surface("system_discriminants", frozenDiscriminants(records)),
  ].sort((left, right) => left.surfaceId.localeCompare(right.surfaceId));

  return {
    freezeVersion: DOMAIN_FREEZE_VERSION,
    versions: frozenDomainVersions,
    surfaces,
    fingerprint: fingerprint({
      freezeVersion: DOMAIN_FREEZE_VERSION,
      versions: frozenDomainVersions,
      surfaces,
    }),
  };
}

export interface SourceCoverageReport {
  reportVersion: string;
  entities: {
    total: number;
    verified: number;
    byWorkspaceKind: Record<FrozenWorkspaceKind, number>;
    bySourceSystem: { sourceSystemId: string; entityCount: number }[];
  };
  works: {
    total: number;
    editions: number;
    editionsPerWork: { workId: string; editionCount: number }[];
  };
  correspondences: {
    total: number;
    withLocator: number;
    byTargetKind: { targetKind: string; count: number }[];
  };
  crossSystemRelations: { total: number; byRelation: { relation: string; count: number }[] };
  consensus: {
    functionId: string;
    assignmentCount: number;
    independentFamilyCount: number;
    schoolCount: number;
    strength: ConvergenceStrength;
    /**
     * Famílias que contribuíram com mais de uma atribuição para esta função.
     *
     * É a repetição de linhagem tornada visível: as obras listadas aqui somam
     * material, não somam concordância.
     */
    collapsedWorkGroups: { familyId: string; workIds: string[] }[];
  }[];
  timing: {
    profileId: string;
    sourceSystemId: string;
    conditionCount: number;
    nonComputableConditions: number;
    fullyComputable: boolean;
  }[];
  timingGaps: { sourceSystemId: string; reason: string }[];
}

/**
 * Completude do que o domínio conhece hoje.
 *
 * Registros de entidade e relações vêm das fixtures golden porque **ainda não
 * existe base de registros**: são as tasks 22-26 que vão povoá-la. O grafo de
 * funções, ao contrário, já é dado real e entra como tal — misturar os dois numa
 * contagem única anunciaria uma cobertura que ninguém tem.
 */
export function createSourceCoverageReport(
  input: {
    records?: readonly CeremonialEntityRecord[];
    relations?: readonly CrossSystemRelation[];
    graph?: RegencyFunctionGraph;
    profiles?: readonly ElectionProfile[];
  } = {},
): SourceCoverageReport {
  const records = input.records ?? goldenEntityRecords;
  const relations = input.relations ?? goldenCrossSystemRelations;
  const graph = input.graph ?? regencyFunctionGraph;
  const profiles = input.profiles ?? seededElectionProfiles;

  const correspondences = records.flatMap((record) => record.correspondences);
  const editionsPerWork = new Map<string, Set<string>>();
  for (const record of records)
    editionsPerWork.set(
      record.workId,
      (editionsPerWork.get(record.workId) ?? new Set<string>()).add(record.editionId),
    );

  return {
    reportVersion: DOMAIN_FREEZE_VERSION,
    entities: {
      total: records.length,
      verified: records.filter(({ reviewStatus }) => reviewStatus === "verified").length,
      byWorkspaceKind: Object.fromEntries(
        frozenWorkspaceKinds.map((kind) => [
          kind,
          records.filter(({ workspaceKind }) => workspaceKind === kind).length,
        ]),
      ) as Record<FrozenWorkspaceKind, number>,
      bySourceSystem: countBy(records, ({ sourceSystemId }) => sourceSystemId).map(
        ([sourceSystemId, entityCount]) => ({ sourceSystemId, entityCount }),
      ),
    },
    works: {
      total: editionsPerWork.size,
      editions: [...editionsPerWork.values()].reduce((total, set) => total + set.size, 0),
      editionsPerWork: [...editionsPerWork.entries()]
        .map(([workId, editions]) => ({ workId, editionCount: editions.size }))
        .sort((left, right) => left.workId.localeCompare(right.workId)),
    },
    correspondences: {
      total: correspondences.length,
      withLocator: correspondences.filter(({ locator }) => locator.trim().length > 0).length,
      byTargetKind: countBy(correspondences, ({ targetKind }) => targetKind).map(
        ([targetKind, count]) => ({ targetKind, count }),
      ),
    },
    crossSystemRelations: {
      total: relations.length,
      byRelation: countBy(relations, (relation) => relation.relation).map(([relation, count]) => ({
        relation,
        count,
      })),
    },
    consensus: consensusOf(graph),
    timing: profiles
      .map((profile) => {
        const conditions = [
          ...profile.conditions.required,
          ...profile.conditions.forbidden,
          ...profile.conditions.preferred,
        ];
        const nonComputableConditions = conditions.filter(
          ({ kind }) => kind === "source_requirement",
        ).length;
        return {
          profileId: profile.id,
          sourceSystemId: profile.sourceSystemId,
          conditionCount: conditions.length,
          nonComputableConditions,
          fullyComputable: nonComputableConditions === 0,
        };
      })
      .sort((left, right) => left.profileId.localeCompare(right.profileId)),
    timingGaps: electionProfileGaps
      .map(({ sourceSystemId, missing }) => ({ sourceSystemId, reason: missing }))
      .sort((left, right) => left.sourceSystemId.localeCompare(right.sourceSystemId)),
  };
}

export interface DomainConflictReport {
  reportVersion: string;
  /** Divergências declaradas entre atribuições. Não existe campo para resolvê-las. */
  functionConflicts: { functionId: string; left: string; right: string }[];
  electionDivergences: {
    momentId: string;
    matched: string[];
    conflicted: string[];
    unavailable: string[];
  }[];
  nameCollisions: { name: string; records: { id: string; sourceSystemId: string }[] }[];
}

/**
 * O que discorda, mostrado como discordância.
 *
 * O tipo não oferece vencedor, média nem resolução — não por esquecimento, mas
 * porque conciliar aqui apagaria justamente o dado que interessa. Um perfil que
 * proíbe e outro que permite o mesmo instante é informação sobre as fontes.
 *
 * Só identificadores, versões e contagens saem daqui: o relatório é publicável e
 * nenhuma coordenada ou instante do momento observado atravessa.
 */
export function createDomainConflictReport(
  input: {
    records?: readonly CeremonialEntityRecord[];
    graph?: RegencyFunctionGraph;
    moments?: readonly GoldenElectionMoment[];
    profiles?: readonly ElectionProfile[];
  } = {},
): DomainConflictReport {
  const records = input.records ?? goldenEntityRecords;
  const graph = input.graph ?? regencyFunctionGraph;
  const moments = input.moments ?? goldenElectionMoments;
  const profiles = input.profiles ?? seededElectionProfiles;

  return {
    reportVersion: DOMAIN_FREEZE_VERSION,
    functionConflicts: condenseStructuralFunctions(graph)
      .flatMap((group) =>
        group.conflicts.map(({ left, right }) => ({ functionId: group.functionId, left, right })),
      )
      .sort((left, right) =>
        `${left.functionId}|${left.left}`.localeCompare(`${right.functionId}|${right.left}`),
      ),
    electionDivergences: [...moments]
      .sort((left, right) => left.momentId.localeCompare(right.momentId))
      .map((golden) => {
        const observations = evaluateElections({
          profiles: [...profiles],
          moment: momentOf(golden),
        });
        const ids = (status: "matched" | "conflicted" | "unavailable") =>
          observations
            .filter((observation) => observation.status === status)
            .map(({ profileId }) => profileId)
            .sort();
        return {
          momentId: golden.momentId,
          matched: ids("matched"),
          conflicted: ids("conflicted"),
          unavailable: ids("unavailable"),
        };
      }),
    nameCollisions: findNameCollisions(records),
  };
}

function consensusOf(graph: RegencyFunctionGraph): SourceCoverageReport["consensus"] {
  const byFunction = new Map<string, Map<string, { works: Set<string>; count: number }>>();
  for (const assignment of graph.assignments) {
    const families =
      byFunction.get(assignment.functionId) ??
      new Map<string, { works: Set<string>; count: number }>();
    const entry = families.get(assignment.sourceFamilyId) ?? { works: new Set<string>(), count: 0 };
    entry.works.add(assignment.workId);
    entry.count += 1;
    families.set(assignment.sourceFamilyId, entry);
    byFunction.set(assignment.functionId, families);
  }

  return condenseStructuralFunctions(graph).map((group) => ({
    functionId: group.functionId,
    assignmentCount: group.assignmentCount,
    independentFamilyCount: group.independentFamilyCount,
    schoolCount: group.schoolCount,
    strength: group.strength,
    collapsedWorkGroups: [...(byFunction.get(group.functionId)?.entries() ?? [])]
      .filter(([, entry]) => entry.count > 1)
      .map(([familyId, entry]) => ({ familyId, workIds: [...entry.works].sort() }))
      .sort((left, right) => left.familyId.localeCompare(right.familyId)),
  }));
}

function frozenElections(
  moments: readonly GoldenElectionMoment[],
  profiles: readonly ElectionProfile[],
): unknown[] {
  return [...moments]
    .sort((left, right) => left.momentId.localeCompare(right.momentId))
    .map((golden) => ({
      momentId: golden.momentId,
      moment: momentOf(golden),
      observations: evaluateElections({ profiles: [...profiles], moment: momentOf(golden) }),
    }));
}

function frozenGuidancePolicy(): unknown[] {
  return frozenGuidanceOperations.flatMap((operation) =>
    frozenGuidanceGoalCategories.flatMap((goalCategory) =>
      frozenGuidanceTargets.map((target) => ({
        input: { operation, goalCategory, target },
        decision: evaluateGuidancePolicy({ operation, goalCategory, target }),
      })),
    ),
  );
}

function frozenTiming(cases: readonly GoldenTimingCase[]): unknown[] {
  return [...cases]
    .sort((left, right) => left.caseId.localeCompare(right.caseId))
    .map((golden) =>
      golden.kind === "interval"
        ? {
            caseId: golden.caseId,
            input: golden.interval,
            reading: resolvePlanetaryHourInInterval(golden.interval),
          }
        : {
            caseId: golden.caseId,
            input: golden.location,
            resolution: resolvePlanetaryHourAt(golden.location),
          },
    );
}

function frozenSourceVariants(
  records: readonly CeremonialEntityRecord[],
  relations: readonly CrossSystemRelation[],
): unknown[] {
  return [
    ...[...records].sort((left, right) => left.id.localeCompare(right.id)),
    ...[...relations].sort((left, right) => left.id.localeCompare(right.id)),
  ];
}

function frozenDiscriminants(records: readonly CeremonialEntityRecord[]): unknown[] {
  return frozenWorkspaceKinds.map((workspaceKind) => ({
    workspaceKind,
    recordIds: records
      .filter((record) => record.workspaceKind === workspaceKind)
      .map(({ id }) => id)
      .sort(),
  }));
}

function surface(surfaceId: FreezeSurfaceId, cases: unknown[]): FreezeSurface {
  return { surfaceId, caseCount: cases.length, fingerprint: fingerprint(cases) };
}

/**
 * Descarta o rótulo do caso e devolve só o momento astronômico.
 *
 * Os opcionais entram por spread condicional porque `exactOptionalPropertyTypes`
 * distingue "ausente" de "presente e indefinido", e o avaliador lê essa
 * diferença: longitude lunar ausente vira condição indeterminada, não zero.
 */
function momentOf(golden: GoldenElectionMoment): ElectionMoment {
  return {
    jdUt: golden.jdUt,
    latitude: golden.latitude,
    longitude: golden.longitude,
    ...(golden.polarFallback === undefined ? {} : { polarFallback: golden.polarFallback }),
    ...(golden.sunLongitude === undefined ? {} : { sunLongitude: golden.sunLongitude }),
    ...(golden.moonLongitude === undefined ? {} : { moonLongitude: golden.moonLongitude }),
    ...(golden.operationPlanet === undefined ? {} : { operationPlanet: golden.operationPlanet }),
  };
}

function countBy<Item>(items: readonly Item[], key: (item: Item) => string): [string, number][] {
  const counts = new Map<string, number>();
  for (const item of items) counts.set(key(item), (counts.get(key(item)) ?? 0) + 1);
  return [...counts.entries()].sort(([left], [right]) => left.localeCompare(right));
}
