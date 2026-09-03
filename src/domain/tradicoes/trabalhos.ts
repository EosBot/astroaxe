import { z } from "zod";

export const TRABALHOS_CATALOGO_VERSION = "trabalhos-catalogo-0.1.0-research";

/**
 * Catálogo de trabalhos, atravessando tradições.
 *
 * Passo IV do caminho: o preparo em detalhe. Cada trabalho traz o que se usa, a
 * ordem do que se faz, quando fazer, o que aquilo cobra e o que se faz com o
 * que sobra — porque descarte também é parte, e trabalho deixado pela metade é
 * a origem da maior parte do que depois se chama de retorno.
 *
 * O catálogo é organizado por **trabalho**, e não por tradição, de propósito.
 * Quem chega quer descarregar a casa, e não estudar Umbanda: a tradição é a
 * procedência do que se ensina, e aparece como tal.
 *
 * ## O que aqui não se inventa
 *
 * Cada procedimento sai do acervo. Onde o acervo não descreve a etapa, ela não
 * é preenchida por analogia com outra tradição — falta declarada é melhor que
 * fundamento fabricado. Trabalho que o acervo ainda não sustenta não entra
 * neste arquivo, e a lacuna aparece no plano.
 */

const trabalhoSchema = z
  .object({
    id: z.string().regex(/^trabalho:[a-z0-9-]+$/),
    tradicaoId: z.string().regex(/^tradicao:[a-z0-9-]+$/),
    name: z.string().trim().min(1).max(90),
    /** Para que serve, em uma frase que quem chega entende. */
    purpose: z.string().trim().min(30).max(400),
    /**
     * Planeta que rege o trabalho, quando a tradição o declara.
     *
     * É o que permite mandar a pessoa ao buscador de janelas com a pergunta já
     * formada. Nulo quando o trabalho não é regido por hora planetária.
     */
    planet: z.enum(["sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn"]).nullable(),
    /** Quando se faz: dia, fase, hora. */
    when: z.string().trim().min(10).max(300),
    materials: z.array(z.string().trim().min(1).max(120)).min(1).max(24),
    /** A ordem importa: é a sequência do trabalho. */
    steps: z.array(z.string().trim().min(10).max(400)).min(2).max(16),
    /** O que aquilo cobra, ou onde o erro machuca. */
    warnings: z.array(z.string().trim().min(20).max(400)).min(1).max(6),
    /** O que se faz com o que sobra. */
    disposal: z.string().trim().min(20).max(400),
  })
  .strict();

export type Trabalho = z.infer<typeof trabalhoSchema>;

export const trabalhos: readonly Trabalho[] = [
  trabalhoSchema.parse({
    id: "trabalho:banho-descarrego",
    tradicaoId: "tradicao:fitoterapia",
    name: "Banho de descarrego",
    purpose:
      "Tirar de cima o que ficou grudado — cansaço que não passa com sono, peso depois de ambiente carregado, olhar pesado de gente. Limpa o campo antes de qualquer outro trabalho.",
    planet: null,
    when: "À noite, antes de dormir, e não antes de sair. O corpo fica aberto depois do banho, e por isso a recomendação é permanecer em casa por cerca de seis horas — o que na prática significa dormir em seguida.",
    materials: [
      "arruda",
      "guiné",
      "espada-de-são-jorge",
      "água limpa",
      "bacia ou balde usado só para isso",
    ],
    steps: [
      "Ferver a água e desligar o fogo antes de pôr a folha: erva fervida junto perde o que se quer dela.",
      "Macerar as folhas na água quente com as mãos, sem faca e sem liquidificador, até a água tomar cor e cheiro.",
      "Abafar e deixar amornar até dar para despejar no corpo sem queimar.",
      "Tomar o banho de higiene primeiro, com sabão, e sair do chuveiro limpo.",
      "Coar e despejar do pescoço para baixo, de uma vez, sem esfregar e sem enxaguar depois.",
      "Não usar toalha onde o banho caiu: deixar secar no corpo, vestindo roupa limpa e clara.",
      "Deitar em seguida e não sair de casa pelas horas seguintes.",
    ],
    warnings: [
      "Do pescoço para baixo, e não na cabeça. Banho de cabeça é outro trabalho, tem fundamento próprio e não se improvisa.",
      "Algumas ervas exigem cuidado até no manuseio — comigo-ninguém-pode é a mais conhecida — e desencadeiam reação desagradável em quem tem pele sensível. Na dúvida, não usar.",
      "Erva errada ou quantidade errada faz dano físico, e não apenas espiritual. Banho não substitui tratamento de saúde: quem tem condição clínica precisa cuidar dela também.",
    ],
    disposal:
      "O resto do banho e as folhas usadas vão para fora de casa — jardim, terra, pé de planta ou lixo comum, nunca de volta ao chuveiro. O que saiu de cima de você não fica dentro de casa.",
  }),
  trabalhoSchema.parse({
    id: "trabalho:defumacao-casa",
    tradicaoId: "tradicao:fitoterapia",
    name: "Defumação da casa",
    purpose:
      "Limpar o ambiente inteiro: casa que ficou pesada depois de briga, doença, visita ruim ou tempo demais fechada. Trabalha o espaço, e não a pessoa.",
    planet: null,
    when: "Com a casa arrumada e as janelas abertas. Fim de tarde ou noite, e nunca com pressa: defumação apressada é defumação que pula cômodo.",
    materials: [
      "carvão vegetal e um defumador ou incensário de mão",
      "arruda",
      "guiné",
      "espada-de-são-jorge em pedacinhos",
      "barba-de-velho",
      "incenso em grão",
      "pó de enxofre, opcional e em pouquíssima quantidade",
    ],
    steps: [
      "Abrir todas as janelas e portas antes de acender: a fumaça precisa de para onde levar o que recolher.",
      "Acender o carvão e esperar cobrir de cinza branca antes de pôr a erva, senão queima e amarga.",
      "Começar pelos fundos da casa e caminhar em direção à porta da rua, e não o contrário.",
      "Em cada cômodo, cruzar o ambiente em forma de X com o defumador, alcançando os quatro cantos.",
      "Não pular cômodo nenhum, incluindo banheiro, área de serviço e corredor — cômodo pulado é onde fica o que se quer tirar.",
      "Terminar na porta da frente, defumando a soleira de dentro para fora.",
      "Deixar o restante queimando junto ao portão, do lado de dentro, até apagar sozinho.",
    ],
    warnings: [
      "Sempre dos fundos para a saída. Defumar da porta para dentro empurra para o fundo da casa exatamente o que se queria pôr para fora.",
      "Fumaça em ambiente fechado faz mal a quem tem asma, bronquite ou problema respiratório, e a criança pequena e animal. Tirar todo mundo antes e só voltar depois de arejar.",
      "Enxofre em quantidade produz gás irritante e cheiro que impregna. Se usar, é pitada, e nunca em ambiente sem circulação.",
    ],
    disposal:
      "Cinza e restos vão para fora de casa, na terra ou no lixo da rua. Não se reaproveita carvão de defumação, e não se guarda o que sobrou dentro de casa.",
  }),
  trabalhoSchema.parse({
    id: "trabalho:oferenda-exu",
    tradicaoId: "tradicao:quimbanda",
    name: "Oferenda a Exu ou Pombagira",
    purpose:
      "Servir a entidade com quem se trabalha: agradecer, firmar pedido, abrir caminho ou pagar o que foi combinado. É o trabalho mais comum da Quimbanda e o que sustenta todos os outros.",
    planet: null,
    when: "Segunda-feira para Exu, sexta-feira para Pombagira, de preferência à meia-noite. O local depende do Reino com quem se trabalha: encruzilhada, cemitério, mata ou praia.",
    materials: [
      "vela — a cor pede o Reino e a entidade",
      "pemba para riscar o ponto",
      "cachaça ou a bebida que a entidade toma",
      "azeite de dendê",
      "fumo de rolo, charuto ou cigarro",
      "farofa de dendê, milho frito no dendê, pimenta",
      "obi vermelho de quatro gomos, quando houver",
    ],
    steps: [
      "Ir ao local que pertence ao Reino: encruzilhada, cemitério, mata ou praia, conforme com quem se trabalha.",
      "Saudar antes de qualquer coisa, em voz alta, pedindo licença para trabalhar naquele ponto.",
      "Riscar o ponto da entidade com a pemba, no chão limpo.",
      "Acender a vela sobre o ponto riscado.",
      "Oferecer a bebida despejando uma parte no chão, junto ao ponto.",
      "Colocar a comida no ponto: a farofa, o milho, o obi, o que a entidade come.",
      "Acender o charuto ou o cigarro e deixá-lo no ponto, aceso.",
      "Fazer o pedido em voz alta, com respeito, dizendo o que se quer e o que se oferece em troca.",
      "Agradecer, virar as costas e ir embora sem olhar para trás.",
    ],
    warnings: [
      "Pedido feito em voz alta é compromisso assumido. O que se prometeu em troca será cobrado, e quem não pretende cumprir não deveria oferecer.",
      "Não se leva nada de volta para casa: nem o que sobrou, nem o recipiente, nem a vela. O que foi entregue foi entregue.",
      "Vela acesa em mato seco, em cemitério ou junto a lixo é risco de incêndio real. Escolher chão limpo, de terra ou pedra, e não deixar fogo sem controle.",
      "Vidro quebrado e resto de comida em encruzilhada machucam pessoa e animal que passam depois. Usar louça de barro ou material que se degrada, e nunca deixar caco.",
    ],
    disposal:
      "A oferenda fica onde foi entregue e não se recolhe. Louça de barro, alimento e vela se degradam sozinhos. Só se recolhe o que causaria dano a quem passa — sacola, plástico e vidro nunca deveriam ter ido junto.",
  }),
];

export function trabalhoById(id: string): Trabalho | undefined {
  return trabalhos.find((trabalho) => trabalho.id === id);
}

export function trabalhosPorTradicao(tradicaoId: string): Trabalho[] {
  return trabalhos.filter((trabalho) => trabalho.tradicaoId === tradicaoId);
}
