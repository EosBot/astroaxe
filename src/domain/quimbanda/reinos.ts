import { z } from "zod";

export const QUIMBANDA_REINOS_VERSION = "quimbanda-reinos-0.1.0-research";

/**
 * Os Reinos da Quimbanda.
 *
 * Cada Reino é um campo vibracional governado por um Exu Rei e uma Pombagira
 * Rainha, com chefes de legião abaixo e povos que compõem cada legião. A
 * estrutura é setenária, e o acervo do projeto a documenta em duas frentes que
 * concordam entre si: os livros dedicados e as apostilas de formação
 * kimbandeira do Templo da Pena.
 *
 * **A regência planetária não é enfeite.** O material do terreiro associa cada
 * Reino a um planeta e a uma sephirah — Almas a Marte e Geburah, Cruzeiros a
 * Júpiter e Chesed. É por aí que este domínio encontra o motor de horas
 * planetárias que já existe: quem vai trabalhar num Reino pode perguntar ao
 * buscador de janelas quando o céu favorece aquele planeta.
 *
 * ## O que este módulo não faz
 *
 * Não inventa Reino, regente nem domínio. O sétimo Reino aparece na literatura
 * com nomes que variam entre casas, e o acervo ainda não deu base suficiente
 * para descrevê-lo — está declarado como pendente, e não preenchido com
 * suposição. Fundamento inventado para entidade real é pior que lacuna
 * assumida.
 */

const reinoSchema = z
  .object({
    id: z.string().regex(/^reino:[a-z-]+$/),
    name: z.string().trim().min(1).max(80),
    /** Exu Rei que rege o Reino, pelo nome que o acervo registra. */
    king: z.string().trim().min(1).max(120),
    /** Pombagira Rainha que rege o Reino. */
    queen: z.string().trim().min(1).max(120),
    /** O que o Reino governa, em linguagem de quem vai trabalhar nele. */
    domain: z.string().trim().min(1).max(600),
    /**
     * Planeta regente, quando o acervo o declara.
     *
     * É o que liga o Reino ao buscador de janelas. Nulo quando a associação não
     * está sustentada — supor por analogia seria fabricar correspondência.
     */
    planet: z.enum(["sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn"]).nullable(),
    /** Sephirah correspondente na leitura hermética do terreiro, quando há. */
    sephirah: z.string().trim().min(1).max(40).nullable(),
    /** Legiões ou povos nomeados no acervo. Vazio quando ainda não levantados. */
    legions: z.array(z.string().trim().min(1).max(80)).max(24),
  })
  .strict();

export type QuimbandaReino = z.infer<typeof reinoSchema>;

export const quimbandaReinos: readonly QuimbandaReino[] = [
  reinoSchema.parse({
    id: "reino:encruzilhadas",
    name: "Reino das Encruzilhadas",
    king: "Exu Rei das Sete Encruzilhadas",
    queen: "Pombagira Rainha das Sete Encruzilhadas",
    domain:
      "O ponto onde os caminhos se cruzam e a decisão acontece. Abertura e fechamento de caminhos, escolha, movimento e tudo que depende de uma passagem entre estados. É por onde se começa, e a saudação aos senhores dos caminhos pertence a ele.",
    planet: null,
    sephirah: null,
    legions: [],
  }),
  reinoSchema.parse({
    id: "reino:almas",
    name: "Reino das Almas",
    king: "Exu das Almas",
    queen: "Pombagira das Almas",
    domain:
      "A lei cármica, a batalha, a demanda e a justiça executora. É a força da severidade e do rigor da lei: a capacidade de cortar o que é injusto e de enfrentar o que precisa ser enfrentado. Exu Caveira aparece aqui em seu aspecto justiceiro.",
    planet: "mars",
    sephirah: "Geburah",
    legions: [],
  }),
  reinoSchema.parse({
    id: "reino:cruzeiros",
    name: "Reino dos Cruzeiros",
    king: "Exu Rei dos Sete Cruzeiros",
    queen: "Pombagira Rainha dos Sete Cruzeiros",
    domain:
      "A lei, a ordem, a fé, a expansão e a proteção. O cruzeiro é o ponto onde a lei se firma, e também a intersecção entre a vida e a morte — o cruzeiro das almas. Reino de grande força e poder de ação, procurado em demanda e em justiça.",
    planet: "jupiter",
    sephirah: "Chesed",
    legions: [],
  }),
  reinoSchema.parse({
    id: "reino:matas",
    name: "Reino das Matas",
    king: "Exu Rei das Matas",
    queen: "Pombagira Rainha das Matas",
    domain:
      "A cura pelas ervas e o conhecimento da natureza. A mata também é Kalunga: nela repousam cemitérios indígenas e animais, e por isso guarda relação estreita com o Reino da Kalunga. Reino de quem trabalha com folha, banho e defumação.",
    planet: null,
    sephirah: null,
    legions: ["Povo das Árvores"],
  }),
  reinoSchema.parse({
    id: "reino:praia",
    name: "Reino da Praia",
    king: "Exu Rei da Praia",
    queen: "Pombagira Rainha da Praia",
    domain:
      "A evolução e a saída dos labirintos da psique. Cura enfermidades e abre caminhos novos, e é procurado em assunto sentimental porque a água manifesta emoção — ainda que as entidades do Reino operem sem sentimento, cumprindo o que lhes cabe.",
    planet: null,
    sephirah: null,
    legions: [],
  }),
  reinoSchema.parse({
    id: "reino:kalunga",
    name: "Reino da Kalunga",
    king: "Exu Rei da Kalunga",
    queen: "Pombagira Rainha da Kalunga",
    domain:
      "O mistério da morte e o portal da ancestralidade. O cemitério é a Kalunga Pequena e o mar é a Kalunga Grande — travessia, e não fim. Reino de quem trabalha ancestralidade, encerramento de ciclo e o que precisa ser entregue à terra.",
    planet: null,
    sephirah: null,
    legions: [],
  }),
];

/**
 * Reinos que a estrutura setenária prevê e o acervo ainda não sustenta.
 *
 * Fica declarado no código, e não escondido: quem for completar sabe exatamente
 * o que falta, e a interface pode dizer que falta em vez de exibir seis como se
 * fossem sete.
 */
export const REINOS_PENDING_RESEARCH = 7 - quimbandaReinos.length;

export function reinoById(id: string): QuimbandaReino | undefined {
  return quimbandaReinos.find((reino) => reino.id === id);
}

/** Reinos cuja regência planetária permite consultar o buscador de janelas. */
export function reinosWithPlanetaryRegency(): QuimbandaReino[] {
  return quimbandaReinos.filter((reino) => reino.planet !== null);
}
