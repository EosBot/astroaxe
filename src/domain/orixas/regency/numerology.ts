import { z } from "zod";

export const REGENCY_NUMEROLOGY_VERSION = "regency-numerology-0.1.0-research";

export const numerologyLensIdSchema = z.enum([
  "date-digit-sum-1-16-repeated",
  "date-digital-root-1-9",
]);

export const regencyNumerologyInputSchema = z
  .object({
    birthDate: z.iso.date(),
  })
  .strict();

export const regencyNumerologicalFeatureSchema = z
  .object({
    key: z.string().regex(/^numerology:[a-z0-9-]+:[a-z0-9-]+$/),
    category: z.literal("birth_number"),
    value: z.string().regex(/^([1-9]|1[0-6])$/),
    strength: z.number().min(0).max(1),
    requiresBirthTime: z.literal(false),
    lensId: numerologyLensIdSchema,
    rawDigitSum: z.number().int().nonnegative().max(100),
    reductionSteps: z.array(z.number().int().nonnegative().max(100)).min(1).max(8),
  })
  .strict();

export type RegencyNumerologicalFeature = z.infer<typeof regencyNumerologicalFeatureSchema>;

export function extractRegencyNumerologicalFeatures(input: {
  birthDate: string;
}): RegencyNumerologicalFeature[] {
  const { birthDate } = regencyNumerologyInputSchema.parse(input);
  assertCalendarDate(birthDate);
  const rawDigitSum = digitSum(birthDate.replaceAll("-", ""));
  return [
    feature("date-digit-sum-1-16-repeated", rawDigitSum, 16),
    feature("date-digital-root-1-9", rawDigitSum, 9),
  ];
}

function feature(
  lensId: z.infer<typeof numerologyLensIdSchema>,
  rawDigitSum: number,
  maximum: 9 | 16,
): RegencyNumerologicalFeature {
  const reductionSteps = reduceToMaximum(rawDigitSum, maximum);
  const value = String(reductionSteps.at(-1));
  return regencyNumerologicalFeatureSchema.parse({
    key: `numerology:${lensId}:${value}`,
    category: "birth_number",
    value,
    strength: 1,
    requiresBirthTime: false,
    lensId,
    rawDigitSum,
    reductionSteps,
  });
}

function reduceToMaximum(value: number, maximum: number): number[] {
  const steps = [value];
  while ((steps.at(-1) ?? 0) > maximum) steps.push(digitSum(String(steps.at(-1))));
  return steps;
}

function digitSum(value: string): number {
  return [...value].reduce((total, digit) => total + Number(digit), 0);
}

function assertCalendarDate(value: string): void {
  const [yearText, monthText, dayText] = value.split("-");
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  )
    throw new RangeError("Birth date must be a valid calendar date.");
}
