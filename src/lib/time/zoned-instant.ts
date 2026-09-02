/**
 * Converte hora de relógio de parede em instante absoluto.
 *
 * A página de tempo cerimonial exigia que a pessoa digitasse
 * `2026-06-21T15:00:00-03:00` à mão. Ninguém sabe o próprio deslocamento de
 * cabeça, e quem sabe erra no horário de verão — que é justamente quando errar
 * muda a hora planetária. Como a busca de cidades já devolve o fuso, dá para
 * pedir data e hora comuns e descobrir o deslocamento a partir do lugar.
 *
 * O cálculo usa `Intl`, presente em todo navegador atual, em vez de carregar um
 * polyfill de datas no cliente só para isto.
 */

/**
 * Deslocamento do fuso, em minutos, no instante indicado.
 *
 * Formata o instante no fuso pedido, lê os componentes de volta como se fossem
 * UTC e compara com o original: a diferença é o deslocamento vigente naquele
 * momento, com horário de verão já aplicado.
 */
function offsetMinutesAt(epochMs: number, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(new Date(epochMs));

  const field = (type: string): number =>
    Number(parts.find((part) => part.type === type)?.value ?? "0");

  const asIfUtc = Date.UTC(
    field("year"),
    field("month") - 1,
    field("day"),
    // `hour12: false` produz 24 para meia-noite em alguns ambientes.
    field("hour") % 24,
    field("minute"),
    field("second"),
  );

  return (asIfUtc - epochMs) / 60_000;
}

export interface WallClockMoment {
  /** Data local, no formato `AAAA-MM-DD`. */
  date: string;
  /** Hora local, no formato `HH:MM`. */
  time: string;
  /** Identificador IANA do fuso, como devolvido pela busca de cidades. */
  timeZone: string;
}

/**
 * Instante ISO em UTC correspondente à hora local informada.
 *
 * Duas passagens: a primeira estima o deslocamento tratando a hora de parede
 * como se fosse UTC, a segunda corrige usando o deslocamento vigente no
 * instante estimado. Isso acerta as viradas de horário de verão, em que o
 * deslocamento do dia difere do da véspera.
 *
 * Nas duas horas patológicas do ano o resultado é uma escolha, e não uma
 * verdade: a hora que não existe (relógio adiantado) cai na hora seguinte, e a
 * hora repetida (relógio atrasado) resolve pela primeira ocorrência. Não há
 * resposta certa nesses dois casos; o que importa é a escolha ser sempre a mesma.
 */
export function instantFromWallClock(moment: WallClockMoment): string {
  const naive = Date.parse(`${moment.date}T${moment.time}:00Z`);
  if (Number.isNaN(naive)) throw new Error("wall_clock_invalid");

  const firstGuess = naive - offsetMinutesAt(naive, moment.timeZone) * 60_000;
  const corrected = naive - offsetMinutesAt(firstGuess, moment.timeZone) * 60_000;

  return new Date(corrected).toISOString();
}
