const ZODIAC_SIGNS_PT_BR = [
  "Áries",
  "Touro",
  "Gêmeos",
  "Câncer",
  "Leão",
  "Virgem",
  "Libra",
  "Escorpião",
  "Sagitário",
  "Capricórnio",
  "Aquário",
  "Peixes",
] as const;

function normalizeLongitude(longitude: number): number {
  return ((longitude % 360) + 360) % 360;
}

export function zodiacPlacement(longitude: number): { sign: string; signDegree: number } {
  const normalized = normalizeLongitude(longitude);
  return {
    sign: ZODIAC_SIGNS_PT_BR[Math.floor(normalized / 30)] ?? "—",
    signDegree: normalized % 30,
  };
}
