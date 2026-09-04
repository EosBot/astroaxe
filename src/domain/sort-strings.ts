/**
 * Comparador de strings por unidade de código.
 *
 * Existe por dois motivos, e o segundo é o que importa.
 *
 * O primeiro: `sort()` sem comparador ordena por conversão para string, o que é
 * implícito e some numa revisão. Declarar o critério deixa a intenção à vista.
 *
 * O segundo: **a ordem precisa ser exatamente a de antes.** Boa parte destas
 * listas alimenta impressões digitais de congelamento, e trocar por
 * `localeCompare` mudaria a ordenação — o fingerprint mudaria junto, e um
 * congelamento que muda sozinho deixa de detectar aquilo que existe para
 * detectar. Este comparador reproduz o comportamento padrão para strings.
 */
export function compareStrings(left: string, right: string): number {
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}
