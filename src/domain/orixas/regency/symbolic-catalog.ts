import {
  extractedSymbolicAttributeSchema,
  generateSymbolicCorrespondences,
  symbolicDerivationRuleSchema,
  type ExtractedSymbolicAttribute,
  type SymbolicDerivationRule,
} from "./correspondence-generation";
import { regencyMatrix } from "./matrix";
import { correspondenceResearchSourceIds } from "./correspondence-research-sources";

const authorialSources = ["source:astroaxe:symbolic-derivation-method"];

const profiles: Record<string, readonly string[]> = {
  exu: ["communication", "crossroads", "movement"],
  ogum: ["iron", "roads", "warfare"],
  oxossi: ["forest", "hunt", "abundance"],
  erinle: ["river", "hunt", "healing"],
  "logun-ede": ["forest", "fresh-water", "beauty", "duality"],
  ossaim: ["leaves", "medicine", "secrecy"],
  xango: ["thunder", "justice", "kingship"],
  oxala: ["creation", "air", "seniority"],
  oduduwa: ["earth", "creation", "ancestry"],
  iemanja: ["ocean", "motherhood", "protection"],
  olokun: ["deep-ocean", "wealth", "mystery"],
  oxum: ["fresh-water", "beauty", "fertility", "wealth"],
  oya: ["wind", "storm", "ancestors", "movement"],
  oba: ["river", "warfare", "loyalty"],
  ewa: ["river", "mist", "vision", "transition"],
  nana: ["mud", "swamp", "ancestry", "seniority"],
  omolu: ["earth", "disease", "healing", "transformation"],
  obaluaie: ["earth", "disease", "healing", "transformation"],
  oxumare: ["rainbow", "cycles", "rain", "movement"],
  ibeji: ["childhood", "duality", "joy"],
  orunmila: ["divination", "wisdom", "destiny", "language"],
  iroko: ["tree", "time", "ancestry"],
  onile: ["earth", "totality", "preservation"],
  "orisa-oko": ["agriculture", "fertility", "abundance"],
  aje: ["wealth", "market", "prosperity"],
  logunan: ["time", "order", "concentration"],
  egunita: ["fire", "justice", "purification"],
};

export const extractedSymbolicAttributes: ExtractedSymbolicAttribute[] = Object.entries(profiles)
  .flatMap(([orisa, values]) =>
    values.map((value) =>
      extractedSymbolicAttributeSchema.parse({
        id: `attribute:${orisa}:${value}`,
        targetId: `orisa:${orisa}`,
        axis: axisFor(value),
        value,
        traditionId: "comparative-afro-brazilian-research",
        sourceIds: sourceIdsFor(orisa),
        status: "extracted_for_review",
      }),
    ),
  )
  .sort((left, right) => left.id.localeCompare(right.id));

const mappings: Record<string, readonly [SymbolicDerivationRule["factor"], string[]]> = {
  communication: ["planet", ["mercury"]],
  crossroads: ["modality", ["mutable"]],
  movement: ["planet", ["mercury", "uranus"]],
  iron: ["planet", ["mars"]],
  roads: ["house", ["3"]],
  warfare: ["zodiac_sign", ["aries"]],
  forest: ["element", ["earth"]],
  hunt: ["zodiac_sign", ["sagittarius"]],
  abundance: ["planet", ["jupiter"]],
  river: ["element", ["water"]],
  healing: ["zodiac_sign", ["virgo"]],
  "fresh-water": ["planet", ["venus"]],
  beauty: ["planet", ["venus"]],
  duality: ["zodiac_sign", ["gemini"]],
  leaves: ["element", ["earth"]],
  medicine: ["planet", ["mercury"]],
  secrecy: ["house", ["12"]],
  thunder: ["planet", ["jupiter"]],
  justice: ["zodiac_sign", ["libra"]],
  kingship: ["zodiac_sign", ["leo"]],
  creation: ["planet", ["sun"]],
  air: ["element", ["air"]],
  seniority: ["planet", ["saturn"]],
  earth: ["element", ["earth"]],
  ancestry: ["house", ["4"]],
  ocean: ["planet", ["moon"]],
  motherhood: ["zodiac_sign", ["cancer"]],
  protection: ["house", ["4"]],
  "deep-ocean": ["planet", ["neptune"]],
  wealth: ["house", ["2"]],
  mystery: ["zodiac_sign", ["pisces"]],
  fertility: ["planet", ["venus", "moon"]],
  wind: ["element", ["air"]],
  storm: ["planet", ["uranus"]],
  loyalty: ["modality", ["fixed"]],
  mist: ["planet", ["neptune"]],
  vision: ["house", ["9"]],
  transition: ["modality", ["mutable"]],
  mud: ["element", ["earth", "water"]],
  swamp: ["element", ["earth", "water"]],
  disease: ["house", ["6"]],
  transformation: ["house", ["8"]],
  rainbow: ["planet", ["uranus"]],
  cycles: ["modality", ["mutable"]],
  rain: ["element", ["water"]],
  childhood: ["planet", ["mercury"]],
  joy: ["planet", ["jupiter"]],
  divination: ["house", ["9"]],
  wisdom: ["planet", ["jupiter"]],
  destiny: ["house", ["9"]],
  language: ["planet", ["mercury"]],
  tree: ["element", ["earth"]],
  time: ["planet", ["saturn"]],
  totality: ["house", ["1"]],
  preservation: ["modality", ["fixed"]],
  agriculture: ["element", ["earth"]],
  market: ["planet", ["mercury"]],
  prosperity: ["planet", ["venus", "jupiter"]],
  order: ["planet", ["saturn"]],
  concentration: ["modality", ["fixed"]],
  fire: ["element", ["fire"]],
  purification: ["house", ["8"]],
};

export const symbolicDerivationRules: SymbolicDerivationRule[] = Object.entries(mappings)
  .map(([attributeValue, [factor, values]]) => {
    const factorId = factor.replaceAll("_", "-");
    return symbolicDerivationRuleSchema.parse({
      id: `derivation:${attributeValue}:${factorId}`,
      requiredAttributeValues: [attributeValue],
      factor,
      values,
      rationale: `Hipótese AstroAxe: traduz o atributo ${attributeValue} para a linguagem ${factor} da astrologia ocidental.`,
      structuralSourceIds: authorialSources,
      status: "authorial_hypothesis",
    });
  })
  .sort((left, right) => left.id.localeCompare(right.id));

const compositeMappings: Array<{
  id: string;
  attributes: string[];
  factor: SymbolicDerivationRule["factor"];
  values: string[];
}> = [
  composite("communication-crossroads", ["communication", "crossroads"], "planet", ["mercury"]),
  composite("iron-warfare", ["iron", "warfare"], "planet", ["mars"]),
  composite("forest-hunt", ["forest", "hunt"], "zodiac_sign", ["sagittarius"]),
  composite("river-healing", ["river", "healing"], "zodiac_sign", ["virgo"]),
  composite("fresh-water-beauty", ["fresh-water", "beauty"], "zodiac_sign", ["libra"]),
  composite("leaves-medicine", ["leaves", "medicine"], "zodiac_sign", ["virgo"]),
  composite("thunder-kingship", ["thunder", "kingship"], "zodiac_sign", ["leo"]),
  composite("earth-creation", ["earth", "creation"], "zodiac_sign", ["capricorn"]),
  composite("ocean-motherhood", ["ocean", "motherhood"], "zodiac_sign", ["cancer"]),
  composite("deep-ocean-mystery", ["deep-ocean", "mystery"], "zodiac_sign", ["pisces"]),
  composite("wind-storm", ["wind", "storm"], "zodiac_sign", ["aquarius"]),
  composite("river-warfare", ["river", "warfare"], "zodiac_sign", ["scorpio"]),
  composite("river-mist-transition", ["river", "mist", "transition"], "zodiac_sign", ["pisces"]),
  composite("mud-ancestry", ["mud", "ancestry"], "planet", ["saturn"]),
  composite("earth-disease-healing", ["earth", "disease", "healing"], "house", ["6", "8"]),
  composite("rainbow-cycles", ["rainbow", "cycles"], "zodiac_sign", ["aquarius"]),
  composite("childhood-duality", ["childhood", "duality"], "zodiac_sign", ["gemini"]),
  composite("divination-wisdom-destiny", ["divination", "wisdom", "destiny"], "house", ["9"]),
  composite("tree-time", ["tree", "time"], "zodiac_sign", ["capricorn"]),
  composite("agriculture-fertility", ["agriculture", "fertility"], "zodiac_sign", ["taurus"]),
  composite("wealth-market-prosperity", ["wealth", "market", "prosperity"], "house", ["2"]),
];

symbolicDerivationRules.push(
  ...compositeMappings.map(({ id, attributes, factor, values }) =>
    symbolicDerivationRuleSchema.parse({
      id: `derivation:composite:${id}`,
      requiredAttributeValues: attributes,
      factor,
      values,
      rationale: `Hipótese AstroAxe composta: a convergência ${attributes.join(" + ")} reforça ${factor} ${values.join("/")}.`,
      structuralSourceIds: authorialSources,
      status: "authorial_hypothesis",
    }),
  ),
);
symbolicDerivationRules.sort((left, right) => left.id.localeCompare(right.id));

export const generatedSymbolicCorrespondences = generateSymbolicCorrespondences({
  entities: regencyMatrix.entities,
  attributes: extractedSymbolicAttributes,
  rules: symbolicDerivationRules,
});

function axisFor(value: string): ExtractedSymbolicAttribute["axis"] {
  if (
    [
      "air",
      "deep-ocean",
      "earth",
      "forest",
      "fresh-water",
      "leaves",
      "mist",
      "mud",
      "ocean",
      "rain",
      "rainbow",
      "river",
      "storm",
      "swamp",
      "thunder",
      "tree",
      "wind",
    ].includes(value)
  )
    return "natural_domain";
  if (["cycles", "movement", "time", "transition"].includes(value)) return "temporal_quality";
  if (["iron"].includes(value)) return "material_symbol";
  if (["duality", "secrecy", "seniority"].includes(value)) return "movement_quality";
  if (["ancestors", "childhood", "creation", "destiny", "fertility", "mystery"].includes(value))
    return "mythic_motif";
  return "social_function";
}

function sourceIdsFor(orisa: string): string[] {
  const specialized: Partial<Record<string, string[]>> = {
    aje: ["source:nico:aje-wealth", "source:yoruba-library:aje"],
    oduduwa: ["source:scielo:oduduwa-creation"],
    orunmila: ["source:scielo:orunmila-divination"],
    "orisa-oko": ["source:ijssass:orisa-oko", "source:sacred-texts:orisa-oko"],
    logunan: ["source:saraceni:sete-linhas", "source:saraceni:teogonia"],
    egunita: ["source:saraceni:sete-linhas", "source:saraceni:teogonia"],
  };
  const ids = specialized[orisa] ?? [
    "source:scielo:geodiversity",
    "source:scielo:contemporary-orixas",
    "source:puc-campinas:cantigas-ketu",
    "source:worldhistory:orisha",
  ];
  for (const id of ids) {
    if (!correspondenceResearchSourceIds.has(id))
      throw new RangeError(`Unknown correspondence research source: ${id}`);
  }
  return ids;
}

function composite(
  id: string,
  attributes: string[],
  factor: SymbolicDerivationRule["factor"],
  values: string[],
) {
  return { id, attributes, factor, values };
}
