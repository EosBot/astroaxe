import { regencyMatrixSchema, type RegencyMatrix } from "./contracts";

export const REGENCY_MATRIX_VERSION = "regency-matrix-0.1.0-research";

export const regencyMatrix: RegencyMatrix = regencyMatrixSchema.parse({
  version: REGENCY_MATRIX_VERSION,
  status: "research",
  entities: [
    orisa("orisa:exu", "Exu"),
    orisa("orisa:ogum", "Ogum"),
    orisa("orisa:oxossi", "Oxóssi", ["Oxossi"]),
    orisa("orisa:erinle", "Erinlé", ["Erinle", "Inlé", "Inle"]),
    orisa("orisa:logun-ede", "Logunedé", ["Logun Edé", "Logun Ede"]),
    orisa("orisa:ossaim", "Ossaim", ["Osanyin"]),
    orisa("orisa:xango", "Xangô", ["Xango", "Sango"]),
    orisa("orisa:oxala", "Oxalá", ["Oxala", "Orixalá"]),
    orisa("orisa:oduduwa", "Odùduwà", ["Oduduwa"]),
    orisa("orisa:iemanja", "Iemanjá", ["Iemanja", "Yemanjá"]),
    orisa("orisa:olokun", "Olókun", ["Olokun"]),
    orisa("orisa:oxum", "Oxum", ["Oshun"]),
    orisa("orisa:oya", "Oiá/Iansã", ["Oiá", "Oya", "Iansã", "Iansa"]),
    orisa("orisa:oba", "Obá", ["Oba"]),
    orisa("orisa:ewa", "Euá", ["Ewá", "Ewa", "Yewá", "Yewa"]),
    orisa("orisa:nana", "Nanã", ["Nana"]),
    orisa("orisa:omolu", "Omolu"),
    orisa("orisa:obaluaie", "Obaluaiê", ["Obaluaie"]),
    orisa("orisa:oxumare", "Oxumarê", ["Oxumare"]),
    orisa("orisa:ibeji", "Ibeji", ["Ìbejì"]),
    orisa("orisa:orunmila", "Orunmilá", ["Orunmila"]),
    orisa("orisa:iroko", "Iroko"),
    orisa("orisa:onile", "Onílẹ̀", ["Onile"]),
    orisa("orisa:orisa-oko", "Òrìṣà Oko", ["Orisa Oko"]),
    orisa("orisa:aje", "Ajé", ["Aje"]),
    orisa("orisa:logunan", "Logunan", ["Oiá Tempo", "Oyá Tempo"]),
    orisa("orisa:egunita", "Egunitá", ["Egunita", "Oroiná", "Oroina"]),
    umbandaLine("umbanda-line:yori", "Yori"),
    umbandaLine("umbanda-line:yorima", "Yorimá", ["Yorima"]),
    nkisi("nkisi:tempo", "Tempo", ["Kitembo"]),
  ],
  sources: [
    {
      id: "source:oliveira-2019-matta-e-silva",
      title: "A escrita do sagrado na obra de Matta e Silva",
      url: "https://klineeditora.com/revistajesushistorico/arquivos22/3-JOSE-HENRIQUE-OLIVEIRA.pdf",
      locator: "Tabela 2 e análise, pp. 59–60 do artigo (pp. 16–17 do PDF)",
      evidenceKind: "scholarly_analysis",
    },
    templeSource("exu", "Exu"),
    templeSource("ogum", "Ogum"),
    templeSource("oxossi", "Oxossi"),
    templeSource("oxumare", "Oxumarê", "oxumar%C3%AA"),
    templeSource("oxala", "Oxalá", "oxal%C3%A1"),
    templeSource("nana", "Nanã", "nan%C3%A3"),
    templeSource("oxum", "Oxum"),
    templeSource("omolu", "Omolu"),
    templeSource("ossaim", "Ossayin", "ossayin"),
    templeSource("oya", "Yansã", "yans%C3%A3"),
    templeSource("iemanja", "Yemanjá", "yemanj%C3%A1"),
    templeSource("xango", "Xangô", "xang%C3%B4"),
    templeSource("tempo", "Tempo"),
  ],
  claims: [
    published("oxala-planet", "orisa:oxala", "planet", ["sun"]),
    published("oxala-sign", "orisa:oxala", "zodiac_sign", ["leo"]),
    published("iemanja-planet", "orisa:iemanja", "planet", ["moon"]),
    published("iemanja-sign", "orisa:iemanja", "zodiac_sign", ["cancer"]),
    published("yori-planet", "umbanda-line:yori", "planet", ["mercury"]),
    published("yori-sign", "umbanda-line:yori", "zodiac_sign", ["gemini", "virgo"]),
    published("ogum-planet", "orisa:ogum", "planet", ["mars"]),
    published("ogum-sign", "orisa:ogum", "zodiac_sign", ["aries", "scorpio"]),
    published("oxossi-planet", "orisa:oxossi", "planet", ["venus"]),
    published("oxossi-sign", "orisa:oxossi", "zodiac_sign", ["taurus", "libra"]),
    published("xango-planet", "orisa:xango", "planet", ["jupiter"]),
    published("xango-sign", "orisa:xango", "zodiac_sign", ["sagittarius", "pisces"]),
    published("yorima-planet", "umbanda-line:yorima", "planet", ["saturn"]),
    published("yorima-sign", "umbanda-line:yorima", "zodiac_sign", ["capricorn", "aquarius"]),
    templePlanet("exu", "orisa:exu", "mercury"),
    templePlanet("ogum", "orisa:ogum", "mars"),
    templePlanet("oxossi", "orisa:oxossi", "mercury"),
    templePlanet("oxumare", "orisa:oxumare", "uranus"),
    templePlanet("oxala", "orisa:oxala", "sun"),
    templePlanet("nana", "orisa:nana", "saturn"),
    templePlanet("oxum", "orisa:oxum", "venus"),
    templePlanet("omolu", "orisa:omolu", "saturn"),
    templePlanet("ossaim", "orisa:ossaim", "mercury"),
    templePlanet("oya", "orisa:oya", "jupiter"),
    templePlanet("iemanja", "orisa:iemanja", "moon"),
    templePlanet("xango", "orisa:xango", "jupiter"),
    templePlanet("tempo", "nkisi:tempo", "pluto"),
  ],
});

export function eligibleRegencyEntities(matrix: RegencyMatrix = regencyMatrix) {
  return matrix.entities.filter((entity) => entity.eligibleForRegency);
}

export function publishedCoverage(matrix: RegencyMatrix = regencyMatrix): {
  coveredCandidateIds: string[];
  uncoveredCandidateIds: string[];
} {
  const candidates = eligibleRegencyEntities(matrix);
  const targets = new Set(matrix.claims.map((claim) => claim.targetId));
  return {
    coveredCandidateIds: candidates.filter((entity) => targets.has(entity.id)).map(({ id }) => id),
    uncoveredCandidateIds: candidates
      .filter((entity) => !targets.has(entity.id))
      .map(({ id }) => id),
  };
}

function orisa(id: `orisa:${string}`, canonicalName: string, aliases: string[] = []) {
  return { id, kind: "orisa" as const, canonicalName, aliases, eligibleForRegency: true };
}

function umbandaLine(id: `umbanda-line:${string}`, canonicalName: string, aliases: string[] = []) {
  return { id, kind: "umbanda_line" as const, canonicalName, aliases, eligibleForRegency: false };
}

function nkisi(id: `nkisi:${string}`, canonicalName: string, aliases: string[] = []) {
  return { id, kind: "nkisi" as const, canonicalName, aliases, eligibleForRegency: false };
}

function published(
  suffix: string,
  targetId: string,
  factor: "planet" | "zodiac_sign",
  values: string[],
) {
  return {
    id: `claim:matta-e-silva:${suffix}`,
    targetId,
    schoolId: "umbanda-esoterica-matta-e-silva",
    factor,
    values,
    evidenceTrack: "published_correspondence" as const,
    sourceId: "source:oliveira-2019-matta-e-silva",
    algorithmWeight: null,
  };
}

function templeSource(key: string, name: string, path = key) {
  return {
    id: `source:templo-vale-sol-lua:${key}`,
    title: `${name} | Orixás | Templo do Vale do Sol e da Lua`,
    url: `https://www.templodovaledosoledalua.org.br/orixas/${path}`,
    locator: "Campo ‘Astro Canalizador’",
    evidenceKind: "community_primary" as const,
  };
}

function templePlanet(key: string, targetId: string, planet: string) {
  return {
    id: `claim:templo-vale-sol-lua:${key}-planet`,
    targetId,
    schoolId: "umbanda-templo-vale-sol-lua",
    factor: "planet" as const,
    values: [planet],
    evidenceTrack: "published_correspondence" as const,
    sourceId: `source:templo-vale-sol-lua:${key}`,
    algorithmWeight: null,
  };
}
