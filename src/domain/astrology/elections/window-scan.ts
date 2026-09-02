import { Engine } from "caelus";
import { embeddedData } from "caelus/data-embedded";
import { z } from "zod";

import {
  chaldeanHourRuler,
  planetaryHourWindowAt,
  type ClassicalPlanet,
  type SolarSegment,
} from "@/domain/astrology/planetary-hours";

import type { ElectionProfile } from "./contracts";
import { evaluateElections } from "./index";

export const WINDOW_SCAN_VERSION = "ceremonial-window-scan-1.0.0";

/**
 * Varredura de janelas.
 *
 * A página de tempo responde "este instante atende?". Isso serve para conferir
 * uma hora que alguém já escolheu, e não ajuda quem ainda precisa escolher —
 * que é a situação real de quem planeja. Aqui a pergunta é invertida: dado um
 * período, quais horas atendem a cada critério?
 *
 * A varredura anda de hora planetária em hora planetária, e não de trinta em
 * trinta minutos. A hora planetária é a unidade em que os critérios foram
 * escritos, e amostrar por relógio comum pularia horas curtas de inverno e
 * partiria horas longas de verão em pedaços sem sentido.
 *
 * O passo é por **segmento**, não por hora. Descobrir onde o Sol nasce e se
 * põe custa cerca de vinte e cinco milissegundos, contra dois décimos de
 * milissegundo para posicionar Sol e Lua — e as doze horas de um mesmo dia ou
 * de uma mesma noite nascem daquele único par de eventos. Recalcular a cada
 * hora fazia um mês levar mais de um minuto; derivando as doze de uma vez, o
 * mesmo mês sai em segundos.
 *
 * O resultado é um catálogo, e não uma recomendação: diz quais horas satisfazem
 * o que cada critério pede, sem ordenar por preferência, sem nota e sem sugerir
 * o que fazer nelas. Critérios de tradições diferentes discordam, e a
 * discordância continua sendo o dado.
 */
const engine = new Engine(embeddedData);

/** Teto de horas examinadas numa chamada. Cada hora custa duas efemérides. */
const MAXIMUM_HOURS_SCANNED = 24 * 62;

export const windowScanInputSchema = z
  .object({
    fromJdUt: z.number(),
    toJdUt: z.number(),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    /** Teto de janelas devolvidas, para a página não crescer sem limite. */
    limit: z.number().int().min(1).max(200).default(60),
  })
  .strict()
  .refine(({ fromJdUt, toJdUt }) => toJdUt > fromJdUt, {
    message: "O fim do período precisa vir depois do começo.",
  });

export type WindowScanInput = z.input<typeof windowScanInputSchema>;

export interface CeremonialWindow {
  profileId: string;
  startJdUt: number;
  endJdUt: number;
  dayRuler: ClassicalPlanet;
  hourRuler: ClassicalPlanet;
  hourNumber: number;
  segment: SolarSegment;
  /** O que impediu uma leitura completa desta hora, quando for o caso. */
  limitations: string[];
}

export interface WindowScanResult {
  version: string;
  /** Horas planetárias efetivamente examinadas. */
  hoursScanned: number;
  /** Verdadeiro quando a varredura parou antes do fim do período. */
  truncated: boolean;
  windows: CeremonialWindow[];
}

/**
 * Percorre o período e devolve as horas que atendem a cada critério.
 *
 * Uma hora aparece uma vez por critério que ela satisfaz. Duas tradições que
 * aprovam a mesma hora produzem duas entradas, porque fundi-las esconderia
 * justamente a informação de que houve convergência — e a de que, nas outras
 * horas, não houve.
 */
export function scanCeremonialWindows(input: {
  scan: WindowScanInput;
  profiles: readonly ElectionProfile[];
}): WindowScanResult {
  const scan = windowScanInputSchema.parse(input.scan);
  const windows: CeremonialWindow[] = [];
  let hoursScanned = 0;
  let truncated = false;
  let cursor = scan.fromJdUt;

  while (cursor < scan.toJdUt) {
    if (hoursScanned >= MAXIMUM_HOURS_SCANNED) {
      truncated = true;
      break;
    }

    const anchor = planetaryHourWindowAt({
      jdUt: cursor,
      latitude: scan.latitude,
      longitude: scan.longitude,
    });

    // Sem intervalo solar não há hora planetária neste lugar e data — perto dos
    // polos isso dura meses. Avança um dia em vez de travar o laço.
    if (anchor === null) {
      cursor += 1;
      hoursScanned += 1;
      continue;
    }

    // As doze horas do segmento têm a mesma duração e saem do mesmo par de
    // eventos solares, então bastam aritmética e a sequência caldaica.
    const hourLength = anchor.endJdUt - anchor.startJdUt;
    const segmentStart = anchor.startJdUt - (anchor.hourNumber - 1) * hourLength;

    for (let hourNumber = anchor.hourNumber; hourNumber <= 12; hourNumber += 1) {
      const startJdUt = segmentStart + (hourNumber - 1) * hourLength;
      const endJdUt = startJdUt + hourLength;
      if (startJdUt >= scan.toJdUt) break;
      hoursScanned += 1;

      // O meio da hora representa a hora inteira: avaliar na borda faria a
      // resposta depender de arredondamento.
      const midpoint = startJdUt + hourLength / 2;
      const hourRuler = chaldeanHourRuler(anchor.dayRuler, anchor.segment, hourNumber);

      for (const observation of evaluateElections({
        profiles: [...input.profiles],
        // A hora já é conhecida: passá-la evita que cada critério redescubra o
        // nascer e o pôr do sol por conta própria.
        resolution: {
          method: "observed_solar",
          reading: {
            dayRuler: anchor.dayRuler,
            hourRuler,
            hourNumber,
            segment: anchor.segment,
            intervalProgress: 0.5,
          },
        },
        moment: {
          jdUt: midpoint,
          latitude: scan.latitude,
          longitude: scan.longitude,
          sunLongitude: engine.position("sun", midpoint).lon,
          moonLongitude: engine.position("moon", midpoint).lon,
        },
      })) {
        if (observation.status !== "matched") continue;
        windows.push({
          profileId: observation.profileId,
          startJdUt,
          endJdUt,
          dayRuler: anchor.dayRuler,
          hourRuler,
          hourNumber,
          segment: anchor.segment,
          limitations: [...observation.limitations],
        });
      }

      if (windows.length >= scan.limit) {
        truncated = true;
        break;
      }
    }

    if (truncated) break;

    // Um pulinho além do fim do segmento evita reencontrar a mesma hora por
    // arredondamento de ponto flutuante. Cerca de meio segundo, em dias julianos.
    const segmentEnd = segmentStart + 12 * hourLength;
    cursor = Math.max(segmentEnd + 6e-6, cursor + 6e-6);
  }

  return {
    version: WINDOW_SCAN_VERSION,
    hoursScanned,
    truncated,
    windows: windows.slice(0, scan.limit),
  };
}
