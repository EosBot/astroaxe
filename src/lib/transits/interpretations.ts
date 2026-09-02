import type { PrismaClient } from "@/generated/prisma/client";
import { z } from "zod";

import type { TransitSnapshot } from "@/domain/astrology/transits/contracts";
import { transitSnapshotSchema } from "@/domain/astrology/transits/contracts";
import { transitTechnicalSummary } from "@/domain/astrology/labels";

export const transitInterpretationSchema = z.object({
  transit: z.object({
    transitingBody: z.string(),
    natalBody: z.string(),
    type: z.string(),
    orb: z.number(),
    applying: z.boolean(),
    relativeIntensity: z.number(),
  }),
  content: z.object({
    title: z.string(),
    opening: z.string(),
    deepening: z.string(),
    technicalWhy: z.string(),
    reflectionPrompt: z.string(),
    practice: z.string(),
    version: z.string(),
    generationMethod: z.enum(["HUMAN", "AI_ASSISTED"]),
    author: z.object({ displayName: z.string(), attributionLine: z.string() }),
    reviewer: z.object({ displayName: z.string(), attributionLine: z.string() }),
  }),
});

export const transitReadingResponseSchema = z
  .object({
    snapshot: transitSnapshotSchema,
    interpretations: z.array(transitInterpretationSchema),
  })
  .strict();

export type TransitReadingResponse = z.infer<typeof transitReadingResponseSchema>;

export async function selectPublishedTransitInterpretations(
  prisma: PrismaClient,
  snapshot: TransitSnapshot,
  locale: string,
  now: Date,
): Promise<z.infer<typeof transitInterpretationSchema>[]> {
  const selected = await Promise.all(
    snapshot.aspects.slice(0, 5).map(async (transit) => {
      const content = await prisma.transitInterpretationTemplate.findFirst({
        where: {
          transitingBody: transit.transitingBody,
          natalBody: transit.natalBody,
          aspectType: transit.type,
          locale,
          status: "PUBLISHED",
          publishedAt: { lte: now },
        },
        orderBy: { publishedAt: "desc" },
        include: { author: true, reviewer: true },
      });
      if (!content?.reviewer) return builtInInterpretation(transit);
      return transitInterpretationSchema.parse({
        transit,
        content: {
          title: content.title,
          opening: content.opening,
          deepening: content.deepening,
          technicalWhy: content.technicalWhy,
          reflectionPrompt: content.reflectionPrompt,
          practice: content.practice,
          version: content.version,
          generationMethod: content.generationMethod,
          author: content.author,
          reviewer: content.reviewer,
        },
      });
    }),
  );
  return selected.filter((item): item is NonNullable<typeof item> => item !== null);
}

/**
 * A voz de cada corpo em trânsito.
 *
 * `image` é a porta de entrada: uma imagem antes do conceito, porque quem chega
 * ao próprio mapa não chega procurando vocabulário técnico. `force` nomeia o que
 * se move, `invitation` diz o que fazer com isso, e `practice` cabe num dia comum.
 */
const transitVoices: Readonly<
  Record<
    string,
    { title: string; image: string; force: string; invitation: string; practice: string }
  >
> = {
  sun: {
    title: "Sua luz pede um lugar",
    image:
      "O Sol é aquele que ilumina sem pedir licença. Quando ele passa por um ponto do seu mapa, o que estava na penumbra fica visível — para você primeiro, e depois para quem convive com você.",
    force: "vitalidade, identidade e as escolhas que aparecem",
    invitation:
      "Este não é um período de se explicar. É de se mostrar, e de reparar em como você se sente quando é visto sem disfarce.",
    practice: "Escolha um gesto pequeno que represente quem você está se tornando, e faça hoje.",
  },
  moon: {
    title: "A maré interna subiu",
    image:
      "A Lua governa o que sobe e desce sem avisar. Ela não traz assunto novo: traz à tona o que já estava no fundo, do jeito que a maré devolve à praia o que o mar guardava.",
    force: "sensibilidade, hábitos antigos e a necessidade de pertencer",
    invitation:
      "Sentir muito não é fraqueza nem sinal de que algo deu errado. É informação chegando por um caminho que não passa pela razão.",
    practice: "Dê nome à emoção antes de transformá-la em resposta. Só isso, e já é bastante.",
  },
  mercury: {
    title: "As palavras ganham peso",
    image:
      "Mercúrio é o mensageiro que atravessa fronteiras — entre pessoas, entre o que você pensa e o que consegue dizer. Quando ele toca seu mapa, a travessia fica mais movimentada.",
    force: "pensamento, conversas, acordos e a decisão que depende de clareza",
    invitation:
      "O que for dito agora tende a ficar. Vale a pena escolher as palavras como quem escolhe um caminho, e não como quem descarrega um peso.",
    practice: "Releia uma mensagem importante antes de enviar. Uma vez, com calma.",
  },
  venus: {
    title: "O afeto pede reciprocidade",
    image:
      "Vênus não pergunta se você é amado. Pergunta se a troca é real — se o que você dá volta em alguma forma, ou se sai por uma porta que nunca devolve.",
    force: "afetos, alianças, prazer e o valor que você atribui às coisas",
    invitation:
      "Reveja onde existe troca e onde existe esforço para merecer. A diferença entre as duas costuma aparecer justamente agora.",
    practice: "Repare numa relação em que você dá mais do que recebe, e diga isso em voz alta.",
  },
  mars: {
    title: "Há força querendo direção",
    image:
      "Marte é fogo que não pede permissão. Ele não escolhe onde queimar — quem escolhe é você. Sem direção, ele encontra a primeira porta aberta, e nem sempre é a certa.",
    force: "desejo, coragem, conflito e a iniciativa que estava parada",
    invitation:
      "A energia está aí de qualquer jeito. A pergunta não é se você vai agir, é onde. Impulso vira potência quando encontra alvo.",
    practice:
      "Transforme a irritação de hoje em uma atitude clara, sem ultrapassar o limite de ninguém.",
  },
  jupiter: {
    title: "O horizonte se alarga",
    image:
      "Júpiter é o que abre espaço. Portas aparecem, convites chegam, o mundo parece maior. Mas espaço aberto não se sustenta sozinho — alguém precisa segurar o teto.",
    force: "confiança, oportunidades, sentido e crescimento",
    invitation:
      "Nem toda oportunidade é sua. A generosa é aquela que você consegue sustentar depois que o entusiasmo passar.",
    practice: "Aceite uma oportunidade que você conseguiria manter daqui a seis meses.",
  },
  saturn: {
    title: "O que é para durar está sendo testado",
    image:
      "Saturno é o mestre severo que ninguém escolhe e todo mundo agradece depois. Ele tira o que estava frouxo. Dói na hora, e o que sobra fica de pé.",
    force: "limites, responsabilidade, medo antigo e maturidade",
    invitation:
      "Isto não é castigo. É a estrutura sendo conferida antes que você construa mais um andar sobre ela.",
    practice: "Assuma um compromisso pequeno que você consiga repetir toda semana.",
  },
};

/**
 * O campo natal que o trânsito alcança.
 *
 * Escrito em segunda pessoa e no possessivo — é sobre a pessoa que lê, e não
 * sobre um arquétipo genérico.
 */
const natalFields: Readonly<Record<string, string>> = {
  sun: "sua identidade e a direção que você deu à sua vida",
  moon: "seu mundo emocional e o que você guarda para pouca gente",
  mercury: "seu jeito de pensar e de colocar em palavras",
  venus: "seus valores, seus afetos e sua linguagem de amor",
  mars: "seu desejo, sua iniciativa e sua maneira de brigar",
  jupiter: "sua confiança e sua capacidade de imaginar mais longe",
  saturn: "seus compromissos, seus receios e o que você construiu para durar",
  uranus: "sua autonomia e sua necessidade de romper com o que aperta",
  neptune: "seus sonhos, seus ideais e suas fronteiras mais sensíveis",
  pluto: "seu poder profundo e sua capacidade de renascer",
  chiron: "uma ferida antiga que pode amadurecer em sabedoria",
  mean_lilith: "sua sombra indomada e o que em você não se dobra",
  true_node: "o caminho que você veio desenvolver",
};

/**
 * O gesto do aspecto.
 *
 * `texture` descreve como o encontro se sente; `movement` diz o que ele faz;
 * `counsel` entrega o conselho sem sermão.
 */
const aspectVoices: Readonly<
  Record<string, { texture: string; movement: string; counsel: string }>
> = {
  conjunction: {
    texture: "As duas forças ocupam o mesmo lugar e falam com uma voz só",
    movement: "concentra tudo num ponto e torna o tema impossível de ignorar",
    counsel:
      "Intensidade assim pede um passo atrás de vez em quando. Você está vivendo o tema, e é fácil confundir viver com ser.",
  },
  sextile: {
    texture: "Há uma porta encostada, e ela só abre se você empurrar",
    movement: "oferece uma abertura fértil, que se realiza quando você participa",
    counsel:
      "Facilidade que não vira gesto se dissolve. Vale converter em algo concreto enquanto a janela está aberta.",
  },
  square: {
    texture: "Duas necessidades legítimas puxam para lados diferentes",
    movement: "cria pressão e cobra uma forma nova de agir",
    counsel:
      "O atrito não é castigo. Ele mostra o ajuste que já vinha sendo adiado, e mostra agora porque agora dá para fazer.",
  },
  trine: {
    texture: "A energia corre sem obstáculo, como água encontrando o próprio leito",
    movement: "faz o tema fluir e oferece apoio que dá para reconhecer",
    counsel:
      "O que vem fácil costuma ser subestimado. Repare no talento antes que ele adormeça de tão confortável.",
  },
  opposition: {
    texture: "Duas forças se olham de frente, cada uma com sua razão",
    movement: "coloca os extremos cara a cara e pede que ambos caibam",
    counsel:
      "Quando um polo incomoda demais nos outros, costuma ser porque ele também é seu. Recolher os dois lados é o trabalho.",
  },
};

/**
 * Compõe a leitura de um trânsito.
 *
 * O texto é montado por partes versionadas, e não improvisado: a mesma
 * configuração devolve sempre a mesma leitura. O que muda entre uma pessoa e
 * outra é a configuração do céu, não a inspiração de quem escreveu.
 *
 * A leitura tem corpo de propósito. Um parágrafo solto devolve ao leitor o
 * trabalho que era nosso — dizer o que aquilo significa na vida dele.
 */
function builtInInterpretation(
  transit: TransitSnapshot["aspects"][number],
): z.infer<typeof transitInterpretationSchema> {
  const voice = transitVoices[transit.transitingBody] ?? transitVoices.sun!;
  const aspect = aspectVoices[transit.type] ?? aspectVoices.conjunction!;
  const natalField = natalFields[transit.natalBody] ?? `o campo natal de ${transit.natalBody}`;

  const fase = transit.applying
    ? "O encontro ainda está se aproximando do ponto máximo. É a fase em que as coisas ganham nitidez: o que estava difuso começa a ter nome, e situações aparecem quase como se tivessem sido convocadas. Não precisa correr atrás de conclusão — ela vem."
    : "O ponto máximo já passou, e o que resta agora é a parte que ninguém fotografa: entender o que aconteceu. Esta fase é boa para consolidar, guardar o aprendizado e reparar no que mudou sem que você percebesse na hora.";

  const intensidade =
    transit.relativeIntensity >= 0.66
      ? "Este é um dos trânsitos mais fortes do seu momento, e provavelmente você já vinha sentindo antes de ler isto aqui."
      : transit.relativeIntensity >= 0.33
        ? "A intensidade é média: aparece com clareza em alguns dias e some em outros, e isso é normal."
        : "A intensidade é sutil. Costuma agir como pano de fundo, mais no clima do período do que num acontecimento específico.";

  const opening = `${voice.image}\n\nDesta vez ele alcança ${natalField}. ${aspect.texture}, e isso ${aspect.movement}.`;

  const deepening = [
    `${fase} ${intensidade}`,
    `O que se move aqui é ${voice.force}. Repare onde esse tema já está aparecendo — na rotina, nas conversas que se repetem, nas decisões que você vem adiando. Trânsito raramente inventa assunto: ele costuma iluminar o que já estava ali, esperando hora.`,
    `${voice.invitation} ${aspect.counsel}`,
    "Você não precisa dar conta de tudo isso de uma vez, e ninguém dá. O céu não cobra prazo — ele abre um período, e o período tem começo, meio e fim. O que vale é reconhecer o que está sendo tornado visível, e escolher uma coisa por onde começar.",
    "E se nada disso ressoar, tudo bem também. Esta é uma leitura possível do movimento do céu, não um veredito sobre você. Quem conhece a própria vida é você.",
  ].join("\n\n");

  return transitInterpretationSchema.parse({
    transit,
    content: {
      title: voice.title,
      opening,
      deepening,
      technicalWhy: transitTechnicalSummary(transit),
      reflectionPrompt: `Onde ${natalField} vem pedindo uma resposta mais consciente da sua parte?`,
      practice: voice.practice,
      version: "built-in-transits-3.0.0",
      generationMethod: "HUMAN",
      author: {
        displayName: "AstroAxé Editorial",
        attributionLine: "Matriz pré-escrita e versionada",
      },
      reviewer: {
        displayName: "Engine editorial AstroAxé",
        attributionLine: "Composição determinística por corpo, aspecto, fase e intensidade",
      },
    },
  });
}
