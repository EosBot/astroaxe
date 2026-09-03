import { z } from "zod";

export const QUIMBANDA_REINOS_VERSION = "quimbanda-reinos-0.3.0-research";

/**
 * Os Sete Reinos da Quimbanda, com suas legiões.
 *
 * Cada Reino é governado por um Exu Rei e uma Pombagira Rainha. Abaixo deles
 * vêm as legiões — também chamadas de povos — cada uma com seu casal de chefes
 * nomeado. A estrutura veio da listagem completa do acervo, lida em sequência
 * no documento de origem, e não montada por busca solta.
 *
 * **A regência planetária não é enfeite.** O material de formação do terreiro
 * associa Reinos a planetas e sephirot — Almas a Marte e Geburah, Cruzeiros a
 * Júpiter e Chesed. É por aí que este domínio encontra o motor de horas
 * planetárias: quem vai trabalhar num Reino pode perguntar ao buscador de
 * janelas quando o céu favorece aquele planeta.
 *
 * ## As correspondências planetárias, todas sustentadas
 *
 * A apostila hermética do terreiro traz a tabela completa: os Sete Reinos
 * correspondem às sete sephirot inferiores e aos sete planetas sagrados, e o
 * material ainda registra a cor de cada um. Kalunga é declarada em texto
 * corrido — "conectando esses princípios à Sephirah Binah (Saturno)" — e não
 * por dedução de posição.
 *
 * Com os sete mapeados, **todo Reino consegue perguntar ao buscador de janelas**
 * quando o céu favorece o seu planeta. A ponte entre a Quimbanda e o motor
 * astrológico deixou de valer para dois Reinos e passou a valer para o sistema
 * inteiro.
 *
 * ## Duas correções que a leitura da fonte impôs
 *
 * A versão anterior tinha "Reino da Praia" e "Reino da Kalunga" como coisas
 * separadas e soltas. A fonte é mais precisa: **Kalunga Pequena é o cemitério e
 * Kalunga Grande é a praia**, e são dois Reinos irmãos pelo nome.
 *
 * E o sétimo Reino, que eu havia declarado pendente, é o **Reino da Lira**. Se
 * eu tivesse chutado, teria escrito "Reino do Lixo" — que existe, mas é uma
 * legião dentro da Lira, não um Reino. É exatamente o erro que ler a fonte
 * evita.
 */

const legionSchema = z
  .object({
    name: z.string().trim().min(1).max(80),
    exu: z.string().trim().min(1).max(120),
    pombagira: z.string().trim().min(1).max(120),
  })
  .strict();

const reinoSchema = z
  .object({
    id: z.string().regex(/^reino:[a-z-]+$/),
    name: z.string().trim().min(1).max(80),
    king: z.string().trim().min(1).max(160),
    queen: z.string().trim().min(1).max(160),
    domain: z.string().trim().min(1).max(600),
    /**
     * Planeta regente, quando o acervo o declara.
     *
     * Nulo quando a associação não está sustentada — supor por analogia seria
     * fabricar correspondência, e correspondência fabricada para entidade real
     * é o pior tipo de erro que este projeto pode cometer.
     */
    planet: z.enum(["sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn"]).nullable(),
    sephirah: z.string().trim().min(1).max(40).nullable(),
    /** Cor litúrgica do Reino, como o material de formação a registra. */
    color: z.string().trim().min(1).max(60).nullable(),
    legions: z.array(legionSchema).max(24),
  })
  .strict();

export type QuimbandaLegion = z.infer<typeof legionSchema>;
export type QuimbandaReino = z.infer<typeof reinoSchema>;

const legion = (name: string, exu: string, pombagira: string) => ({ name, exu, pombagira });

export const quimbandaReinos: readonly QuimbandaReino[] = [
  reinoSchema.parse({
    id: "reino:encruzilhadas",
    name: "Reino das Encruzilhadas",
    king: "Exu Rei das Sete Encruzilhadas",
    queen: "Pombagira Rainha das Sete Encruzilhadas",
    domain:
      "O ponto onde os caminhos se cruzam e a decisão acontece: abertura e fechamento de caminhos, escolha e movimento. A encruzilhada é o portal que permite a Exu estar em qualquer lugar, e por isso é onde se chama e onde se oferenda.",
    planet: "mercury",
    sephirah: "Hod",
    color: "Laranja e cores múltiplas",
    legions: [
      legion(
        "Encruzilhada da Rua",
        "Exu Tranca Ruas das Encruzilhadas",
        "Maria Padilha das Encruzilhadas",
      ),
      legion("Encruzilhada de Lira", "Exu Sete Encruzilhadas", "Pombagira das Sete Encruzilhadas"),
      legion("Encruzilhada da Lomba", "Exu das Almas", "Pombagira das Almas"),
      legion("Encruzilhada dos Trilhos", "Exu Marabô", "Pombagira Maria dos Trilhos"),
      legion("Encruzilhada da Mata", "Exu Tiriri das Matas", "Pombagira das Sete Encruzilhadas"),
      legion("Encruzilhada da Kalunga", "Exu Veludo", "Pombagira das Sete Encruzilhadas"),
      legion("Encruzilhada da Praça", "Exu Quebra Galho", "Pombagira Quebra Galho"),
      legion("Encruzilhada do Espaço", "Exu Sete Gargalhadas", "Pombagira Sete Gargalhadas"),
      legion("Encruzilhada da Praia", "Exu da Barra", "Pombagira das Sete Encruzilhadas"),
    ],
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
    color: "Azul",
    legions: [
      legion("Cruzeiro da Rua", "Exu Tranca Tudo das Almas", "Pombagira dos Sete Cruzeiros"),
      legion("Cruzeiro de Lira", "Exu Sete Cruzeiros", "Pombagira dos Sete Cruzeiros"),
      legion("Cruzeiro da Lomba", "Exu Sete Campas", "Pombagira dos Sete Cruzeiros"),
      legion("Cruzeiro das Almas", "Exu Tranca Rua das Almas", "Maria Padilha das Almas"),
      legion("Cruzeiro da Mata", "Exu Lobo", "Pombagira da Figueira"),
      legion("Cruzeiro da Kalunga", "Exu Kaminaloá", "Pombagira Maria Mulambo do Cruzeiro"),
      legion("Cruzeiro da Praça", "Exu Kirombó", "Pombagira dos Sete Cruzeiros"),
      legion("Cruzeiro do Espaço", "Exu Sete Portas", "Pombagira Sete Portas"),
      legion("Cruzeiro da Praia", "Exu Meia Noite", "Pombagira dos Sete Cruzeiros"),
    ],
  }),
  reinoSchema.parse({
    id: "reino:matas",
    name: "Reino das Matas",
    king: "Exu Rei das Matas",
    queen: "Pombagira Rainha das Matas",
    domain:
      "A cura pelas ervas e o conhecimento da natureza. A mata também é Kalunga — nela repousam cemitérios indígenas e animais —, e por isso guarda relação estreita com o Reino do cemitério. Reino de quem trabalha folha, banho e defumação.",
    planet: "moon",
    sephirah: "Yesod",
    color: "Violeta e prata",
    legions: [
      legion("Árvores", "Exu das Matas", "Pombagira das Matas"),
      legion("Campinas", "Exu das Campinas", "Pombagira das Matas"),
      legion("Serranias", "Exu Serra Negra", "Pombagira das Matas"),
      legion("Minas", "Exu Sete Pedras", "Pombagira das Sete Pedreiras"),
      legion("Cobras", "Exu Cobra", "Pombagira das Cobras"),
      legion("Panteras", "Exu Pantera Negra", "Pombagira da Pantera Negra"),
      legion("Flores", "Exu do Cheiro", "Pombagira Rosa Vermelha"),
      legion("Raízes", "Exu Arranca Toco", "Pombagira das Matas"),
    ],
  }),
  reinoSchema.parse({
    id: "reino:kalunga-pequena",
    name: "Reino da Kalunga Pequena",
    king: "Exu Rei da Kalunga, também Rei do Cemitério e Exu Omulu Rei",
    queen: "Pombagira Rainha da Kalunga, também Rainha do Cemitério",
    domain:
      "O cemitério: o mistério da morte e o portal da ancestralidade. Não é fim, e sim travessia. Reino de quem trabalha ancestralidade, encerramento de ciclo e o que precisa ser entregue à terra.",
    planet: "saturn",
    sephirah: "Binah",
    color: "Preto e índigo",
    legions: [
      legion("Portas da Kalunga", "Exu Sete Porteiras", "Pombagira das Sete Porteiras"),
      legion("Catacumbas", "Exu Sete Catacumbas", "Maria Padilha das Sete Catacumbas"),
      legion("Tumbas", "Exu Sete Tumbas", "Pombagira da Kalunga"),
      legion("Forno", "Exu Brasa", "Pombagira do Forno"),
      legion("Caveiras", "Exu Caveira", "Pombagira Rosa Caveira"),
      legion("Kalunga da Mata", "Exu Pimenta", "Pombagira Maria Pimenta"),
      legion("Lomba", "Exu Corcunda", "Pombagira da Lomba"),
      legion("Covas", "Exu Sete Covas", "Pombagira Maria Sete Covas"),
      legion("Mironga", "Exu Malê", "Pombagira Mirongueira"),
      legion("Trevas", "Exu Rei das Trevas", "Pombagira Rainha do Inferno"),
    ],
  }),
  reinoSchema.parse({
    id: "reino:almas",
    name: "Reino das Almas",
    king: "Exu Rei das Almas",
    queen: "Pombagira Rainha das Almas",
    domain:
      "A lei cármica, a batalha, a demanda e a justiça executora. É a força da severidade e do rigor da lei: a capacidade de cortar o que é injusto e de enfrentar o que precisa ser enfrentado. Exu Caveira aparece aqui em seu aspecto justiceiro.",
    planet: "mars",
    sephirah: "Geburah",
    color: "Vermelho",
    legions: [
      legion("Almas da Lomba", "Exu Sete Lombas", "Maria Mulambo das Sete Lombas"),
      legion("Almas do Cativeiro", "Exu Pemba", "Pombagira das Almas"),
      legion("Almas dos Velórios", "Exu Marabá", "Pombagira Rainha das Almas"),
      legion("Almas dos Hospitais", "Exu Curador", "Pombagira das Almas"),
      legion("Almas dos Templos Religiosos", "Exu Nove Luzes", "Pombagira Alteza"),
      legion("Almas do Mato", "Exu das Sete Montanhas", "Pombagira das Sete Montanhas"),
      legion("Almas da Kalunga Pequena", "Exu Tata Caveira", "Pombagira Tata Caveira"),
      legion("Almas da Kalunga Grande", "Exu das Almas", "Pombagira das Almas"),
      legion("Almas do Oriente", "Exu Sete Poeiras", "Pombagira Sete Poeiras"),
      legion("Almas dos Campos de Guerra", "Exu Sete Candeeiros", "Pombagira Maria Quitéria"),
    ],
  }),
  reinoSchema.parse({
    id: "reino:lira",
    name: "Reino da Lira",
    king: "Exu Rei das Sete Liras",
    queen: "Pombagira Rainha das Sete Liras",
    domain:
      "O Reino da vida que corre solta: festa, prazer, dinheiro, malandragem e sedução. Abriga desde os cabarés e os malandros até o ouro e o comércio, e é onde a Quimbanda trata daquilo que a moral costuma preferir não olhar de frente.",
    planet: "sun",
    sephirah: "Tiphereth",
    color: "Amarelo e dourado",
    legions: [
      legion("Inferno", "Exu dos Sete Infernos", "Maria Padilha dos Infernos"),
      legion("Cabarés", "Exu dos Cabarés", "Pombagira dos Cabarés"),
      legion("Lira", "Exu Sete Liras", "Pombagira Sete Saias"),
      legion("Ciganos", "Exu Cigano", "Pombagira Cigana"),
      legion("Malandros", "Exu Zé Pilintra", "Pombagira Maria Navalha"),
      legion("Oriente", "Exu Pagão", "Pombagira Pagã"),
      legion("Lixo", "Exu Mulambo", "Pombagira Mulambo"),
      legion("Luar", "Exu Lua Negra", "Pombagira do Luar"),
      legion("Ouro", "Exu do Ouro", "Pombagira do Ouro"),
      legion("Comércio", "Exu Chama Dinheiro", "Maria Padilha Rica"),
    ],
  }),
  reinoSchema.parse({
    id: "reino:kalunga-grande",
    name: "Reino da Kalunga Grande",
    king: "Exu Rei das Praias",
    queen: "Pombagira Rainha das Praias",
    domain:
      "O mar e a praia: evolução e saída dos labirintos da psique. Cura enfermidades e abre caminhos novos, e é procurado em assunto sentimental porque a água manifesta emoção — ainda que as entidades operem sem sentimento, cumprindo o que lhes cabe.",
    planet: "venus",
    sephirah: "Netzach",
    color: "Verde",
    legions: [
      legion("Rios", "Exu dos Rios", "Pombagira dos Rios"),
      legion("Cachoeiras", "Exu Sete Cachoeiras", "Pombagira das Sete Cachoeiras"),
      legion("Pedras Costeiras", "Exu da Pedra Preta", "Pombagira das Sete Pedreiras"),
      legion("Marinheiros", "Exu Marinheiro", "Pombagira da Praia"),
      legion("Piratas", "Exu Pirata", "Pombagira Maria do Cais"),
      legion("Lodo", "Exu do Lodo", "Pombagira do Lodo"),
    ],
  }),
];

export function reinoById(id: string): QuimbandaReino | undefined {
  return quimbandaReinos.find((reino) => reino.id === id);
}

/** Reinos cuja regência planetária permite consultar o buscador de janelas. */
export function reinosWithPlanetaryRegency(): QuimbandaReino[] {
  return quimbandaReinos.filter((reino) => reino.planet !== null);
}

/** Toda entidade nomeada do catálogo, para busca por nome. */
export function namedEntities(): { name: string; role: string; reino: string; legion: string }[] {
  return quimbandaReinos.flatMap((reino) => [
    { name: reino.king, role: "Exu Rei", reino: reino.name, legion: "" },
    { name: reino.queen, role: "Pombagira Rainha", reino: reino.name, legion: "" },
    ...reino.legions.flatMap((item) => [
      { name: item.exu, role: "chefe de legião", reino: reino.name, legion: item.name },
      { name: item.pombagira, role: "chefe de legião", reino: reino.name, legion: item.name },
    ]),
  ]);
}
