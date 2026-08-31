import { createHash } from "node:crypto";

/**
 * Serialização estável para fingerprint.
 *
 * Ordena chaves recursivamente para que o resultado não dependa da ordem em que
 * o objeto foi construído. Sem isso, dois valores iguais produzem fingerprints
 * diferentes só porque uma propriedade foi escrita antes da outra — e um
 * congelamento que muda sozinho não congela nada.
 *
 * A ordem de arrays é preservada de propósito: em array, ordem é conteúdo. Quem
 * precisa de independência de ordem ordena antes de chamar.
 */
export function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value !== null && typeof value === "object")
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, item]) => [key, canonicalize(item)]),
    );
  return value;
}

export function canonicalJson(value: unknown): string {
  return JSON.stringify(canonicalize(value));
}

export function fingerprint(value: unknown): string {
  return createHash("sha256").update(canonicalJson(value)).digest("hex");
}
