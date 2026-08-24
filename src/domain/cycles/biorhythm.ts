import { Temporal } from "@js-temporal/polyfill";

export const BIORHYTHM_VERSION = "classical-primary-secondary-alerts-3.0.0";

const cycles = [
  { id: "physical", label: "Físico", period: 23 },
  { id: "emotional", label: "Emocional", period: 28 },
  { id: "intellectual", label: "Intelectual", period: 33 },
] as const;

export interface BiorhythmCycle {
  id: string;
  label: string;
  period: number;
  value: number;
  phase: "alta" | "transição" | "baixa";
}

export interface BiorhythmPoint {
  offset: number;
  physical: number;
  emotional: number;
  intellectual: number;
}

export function calculateBiorhythm(
  birthDate: string,
  referenceDate: string,
): {
  version: string;
  daysLived: number;
  cycles: BiorhythmCycle[];
  secondaryCycles: BiorhythmCycle[];
  timeline: BiorhythmPoint[];
  criticalDays: Array<{ offset: number; cycles: string[] }>;
} {
  const birth = Temporal.PlainDate.from(birthDate);
  const reference = Temporal.PlainDate.from(referenceDate);
  const daysLived = birth.until(reference, { largestUnit: "days" }).days;
  if (daysLived < 0) throw new RangeError("A data de referência deve ser posterior ao nascimento.");
  const primaryCycles = cycles.map((cycle) => cycleAt(cycle, daysLived));
  const [physical, emotional, intellectual] = primaryCycles;
  if (physical === undefined || emotional === undefined || intellectual === undefined)
    throw new Error("biorhythm_cycles_missing");
  return {
    version: BIORHYTHM_VERSION,
    daysLived,
    cycles: primaryCycles,
    secondaryCycles: [
      secondaryCycle("mastery", "Domínio", physical, intellectual),
      secondaryCycle("passion", "Paixão", physical, emotional),
      secondaryCycle("wisdom", "Sabedoria", emotional, intellectual),
    ],
    timeline: Array.from({ length: 61 }, (_, index) => {
      const offset = index - 30;
      return {
        offset,
        physical: valueAt(daysLived + offset, 23),
        emotional: valueAt(daysLived + offset, 28),
        intellectual: valueAt(daysLived + offset, 33),
      };
    }),
    criticalDays: Array.from({ length: 31 }, (_, offset) => ({
      offset,
      cycles: cycles
        .filter(({ period }) => Math.abs(valueAt(daysLived + offset, period)) < 0.08)
        .map(({ label }) => label),
    })).filter(({ cycles: criticalCycles }) => criticalCycles.length > 0),
  };
}

export function calculateBiorhythmCompatibility(
  firstBirthDate: string,
  secondBirthDate: string,
  referenceDate: string,
): { version: string; score: number; cycles: Array<{ label: string; score: number }> } {
  const first = calculateBiorhythm(firstBirthDate, referenceDate).cycles;
  const second = calculateBiorhythm(secondBirthDate, referenceDate).cycles;
  const compatibility = first.map((cycle, index) => ({
    label: cycle.label,
    score: Math.round((1 - Math.abs(cycle.value - (second[index]?.value ?? 0)) / 2) * 100),
  }));
  return {
    version: BIORHYTHM_VERSION,
    score: Math.round(
      compatibility.reduce((sum, cycle) => sum + cycle.score, 0) / compatibility.length,
    ),
    cycles: compatibility,
  };
}

function cycleAt(cycle: (typeof cycles)[number], daysLived: number): BiorhythmCycle {
  const value = valueAt(daysLived, cycle.period);
  return { ...cycle, value, phase: phaseFor(value) };
}

function secondaryCycle(
  id: string,
  label: string,
  first: BiorhythmCycle,
  second: BiorhythmCycle,
): BiorhythmCycle {
  const value = (first.value + second.value) / 2;
  return { id, label, period: 0, value, phase: phaseFor(value) };
}

function valueAt(daysLived: number, period: number): number {
  return Math.sin((2 * Math.PI * daysLived) / period);
}

function phaseFor(value: number): BiorhythmCycle["phase"] {
  if (Math.abs(value) < 0.12) return "transição";
  return value > 0 ? "alta" : "baixa";
}
