import { Temporal } from "@js-temporal/polyfill";

import { birthDataSchema, type SanitizedBirthData } from "@/domain/astrology/western/contracts";

const INVISIBLE_CHARACTERS =
  /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\u200B-\u200D\u2060\uFEFF]/g;

export function sanitizeBirthData(raw: unknown, today: Temporal.PlainDate): SanitizedBirthData {
  const parsed = birthDataSchema.parse(raw);
  const date = Temporal.PlainDate.from(parsed.date);

  if (Temporal.PlainDate.compare(date, Temporal.PlainDate.from("1900-01-01")) < 0) {
    throw new RangeError("A data de nascimento deve ser igual ou posterior a 1900-01-01.");
  }
  if (Temporal.PlainDate.compare(date, today) > 0) {
    throw new RangeError("A data de nascimento nao pode estar no futuro.");
  }

  Temporal.ZonedDateTime.from(`2000-01-01T00:00:00[${parsed.timezone}]`);
  const location = parsed.location
    .replace(INVISIBLE_CHARACTERS, "")
    .normalize("NFC")
    .trim()
    .replace(/\s+/g, " ");
  if (location.length < 2)
    throw new RangeError("O local normalizado deve ter ao menos dois caracteres.");

  return {
    ...parsed,
    location,
    quality: { timeKnown: parsed.timePrecision === "known", normalized: true },
  };
}
