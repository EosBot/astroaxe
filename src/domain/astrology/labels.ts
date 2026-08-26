const bodyNames: Readonly<Record<string, string>> = {
  sun: "Sol",
  moon: "Lua",
  mercury: "Mercúrio",
  venus: "Vênus",
  mars: "Marte",
  jupiter: "Júpiter",
  saturn: "Saturno",
  uranus: "Urano",
  neptune: "Netuno",
  pluto: "Plutão",
  chiron: "Quíron",
  true_node: "Nodo Norte",
  south_node: "Nodo Sul",
  mean_lilith: "Lilith média",
};

const aspectNames: Readonly<Record<string, string>> = {
  conjunction: "conjunção",
  sextile: "sextil",
  square: "quadratura",
  trine: "trígono",
  opposition: "oposição",
};

const masculineAspects = new Set(["sextile", "trine"]);

export function astrologicalBodyName(body: string): string {
  return bodyNames[body.toLowerCase()] ?? "corpo celeste";
}

export function astrologicalAspectName(aspect: string): string {
  return aspectNames[aspect.toLowerCase()] ?? "aspecto astrológico";
}

export function astrologicalAspectWithArticle(aspect: string): string {
  const normalized = aspect.toLowerCase();
  const article = masculineAspects.has(normalized) ? "um" : "uma";
  return `${article} ${astrologicalAspectName(normalized)}`;
}

export function transitTechnicalSummary(input: {
  transitingBody: string;
  natalBody: string;
  type: string;
  orb: number;
  relativeIntensity: number;
}): string {
  return `${astrologicalBodyName(input.transitingBody)} em trânsito forma ${astrologicalAspectWithArticle(input.type)} com ${astrologicalBodyName(input.natalBody)} natal. O orbe é de ${input.orb.toFixed(2)}°, e o aspecto está a ${Math.round(input.relativeIntensity * 100)}% do pico geométrico.`;
}
