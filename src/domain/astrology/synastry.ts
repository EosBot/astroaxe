import type { PlanetPosition } from "./western/contracts";

export const SYNASTRY_VERSION = "major-cross-aspects-editorial-2.0.0";

const aspects = [
  { type: "conjunção", angle: 0 },
  { type: "sextil", angle: 60 },
  { type: "quadratura", angle: 90 },
  { type: "trígono", angle: 120 },
  { type: "oposição", angle: 180 },
] as const;

const readableBodies = new Set([
  "sun",
  "moon",
  "mercury",
  "venus",
  "mars",
  "jupiter",
  "saturn",
  "uranus",
  "neptune",
  "pluto",
  "chiron",
  "mean_lilith",
  "true_node",
]);

export interface SynastryAspect {
  firstBody: string;
  secondBody: string;
  firstSign: string;
  secondSign: string;
  type: (typeof aspects)[number]["type"];
  orb: number;
}

export type SynastryThemeId =
  | "identity"
  | "emotions"
  | "communication"
  | "affection"
  | "desire"
  | "expansion"
  | "commitment"
  | "transformation"
  | "healing";

export interface SynastryReading {
  title: string;
  introduction: string;
  supportiveCount: number;
  growthCount: number;
  themes: Array<{
    id: SynastryThemeId;
    title: string;
    subtitle: string;
    introduction: string;
    aspects: SynastryAspectReading[];
  }>;
}

export interface SynastryAspectReading extends SynastryAspect {
  headline: string;
  meaning: string;
  livedExperience: string;
  invitation: string;
  tone: "supportive" | "growth" | "intense";
}

export function calculateSynastry(
  first: PlanetPosition[],
  second: PlanetPosition[],
  maxOrb = 6,
): SynastryAspect[] {
  const matches: SynastryAspect[] = [];
  for (const left of first) {
    if (!readableBodies.has(left.id)) continue;
    for (const right of second) {
      if (!readableBodies.has(right.id)) continue;
      const distance = angularDistance(left.longitude, right.longitude);
      const closest = aspects
        .map((aspect) => ({ ...aspect, orb: Math.abs(distance - aspect.angle) }))
        .toSorted((a, b) => a.orb - b.orb)[0];
      if (closest !== undefined && closest.orb <= maxOrb)
        matches.push({
          firstBody: left.id,
          secondBody: right.id,
          firstSign: left.sign,
          secondSign: right.sign,
          type: closest.type,
          orb: closest.orb,
        });
    }
  }
  return matches.toSorted((a, b) => a.orb - b.orb).slice(0, 36);
}

export function buildSynastryReading(
  firstName: string,
  secondName: string,
  matches: SynastryAspect[],
): SynastryReading {
  const readings = matches.map((aspect) => interpretAspect(firstName, secondName, aspect));
  const supportiveCount = readings.filter(({ tone }) => tone === "supportive").length;
  const growthCount = readings.length - supportiveCount;
  return {
    title: `O céu compartilhado de ${firstName} e ${secondName}`,
    introduction:
      readings.length === 0
        ? "Os corpos e pontos natais analisados não formam aspectos maiores dentro do orbe escolhido. O vínculo segue existindo, mas sua linguagem aparece em camadas mais sutis, como casas, ângulos e aspectos menores."
        : `Esta leitura encontrou ${readings.length} encontros entre planetas e pontos natais. Eles revelam como identidade, afeto, desejo, compromisso, transformação e propósito se entrelaçam nesta relação.`,
    supportiveCount,
    growthCount,
    themes: themeDefinitions.map((theme) => ({
      ...theme,
      aspects: readings.filter(
        (aspect) =>
          bodyTheme[aspect.firstBody] === theme.id || bodyTheme[aspect.secondBody] === theme.id,
      ),
    })),
  };
}

const themeDefinitions: ReadonlyArray<{
  id: SynastryThemeId;
  title: string;
  subtitle: string;
  introduction: string;
}> = [
  {
    id: "identity",
    title: "Essência e direção",
    subtitle: "O encontro dos Sóis",
    introduction:
      "O Sol fala da identidade, da vitalidade e do caminho que cada pessoa deseja iluminar. Aqui observamos como uma presença encoraja, desafia ou reposiciona a expressão da outra.",
  },
  {
    id: "emotions",
    title: "Mundo emocional",
    subtitle: "Lua, cuidado e pertencimento",
    introduction:
      "A Lua descreve necessidades de acolhimento, memória afetiva e reações espontâneas. Seus contatos revelam como o vínculo pode oferecer abrigo — e quais sensibilidades precisam ser tratadas com delicadeza.",
  },
  {
    id: "communication",
    title: "Pontes de comunicação",
    subtitle: "Mercúrio e a linguagem do encontro",
    introduction:
      "Mercúrio mostra como cada pessoa organiza ideias, pergunta, escuta e dá nome ao que vive. Uma boa ponte mental não exige concordância constante; exige tradução, curiosidade e espaço para reparar mal-entendidos.",
  },
  {
    id: "affection",
    title: "Afeto e reciprocidade",
    subtitle: "Vênus e as formas de amar",
    introduction:
      "Vênus fala do que encanta, dos gestos que fazem alguém se sentir valorizado e do ritmo da aproximação. Estes contatos ajudam a reconhecer linguagens de afeto parecidas ou diferentes.",
  },
  {
    id: "desire",
    title: "Desejo e movimento",
    subtitle: "Marte, iniciativa e limites",
    introduction:
      "Marte representa impulso, coragem, sexualidade e a maneira de enfrentar conflitos. Na sinastria, ele mostra onde surge magnetismo e onde a energia precisa de acordos claros para não virar disputa.",
  },
  {
    id: "expansion",
    title: "Expansão e confiança",
    subtitle: "Júpiter e os horizontes compartilhados",
    introduction:
      "Júpiter amplia aquilo que toca. Seus contatos mostram onde o vínculo recupera esperança, estimula crescimento e convida as duas pessoas a enxergar uma vida maior — cuidando apenas para que entusiasmo não vire promessa sem medida.",
  },
  {
    id: "commitment",
    title: "Compromisso e maturidade",
    subtitle: "Saturno, tempo e construção",
    introduction:
      "Saturno mostra o que pede consistência, responsabilidade e tempo. Na sinastria, ele pode sustentar projetos duradouros e também revelar medos, cobranças ou testes que precisam ser transformados em acordos adultos.",
  },
  {
    id: "transformation",
    title: "Mudança e profundidade",
    subtitle: "Urano, Netuno e Plutão",
    introduction:
      "Os planetas transpessoais revelam forças que ultrapassam a rotina: Urano desperta liberdade, Netuno dissolve fronteiras e Plutão conduz ao núcleo do desejo, do poder e da regeneração.",
  },
  {
    id: "healing",
    title: "Feridas, sombra e destino",
    subtitle: "Quíron, Lilith e Nodo Norte",
    introduction:
      "Quíron toca vulnerabilidades capazes de se tornar sabedoria; Lilith revela desejo indomado e partes recusadas; o Nodo Norte aponta experiências que puxam o vínculo para crescimento e futuro.",
  },
];

const bodyTheme: Readonly<Record<string, SynastryThemeId>> = {
  sun: "identity",
  moon: "emotions",
  mercury: "communication",
  venus: "affection",
  mars: "desire",
  jupiter: "expansion",
  saturn: "commitment",
  uranus: "transformation",
  neptune: "transformation",
  pluto: "transformation",
  chiron: "healing",
  mean_lilith: "healing",
  true_node: "healing",
};

const bodyNames: Readonly<Record<string, string>> = {
  sun: "Sol",
  moon: "Lua",
  mercury: "Mercúrio",
  venus: "Vênus",
  mars: "Marte",
  jupiter: "Júpiter",
  saturn: "Saturno",
  uranus: "Urano",
  neptune: "Netuno",
  pluto: "Plutão",
  chiron: "Quíron",
  mean_lilith: "Lilith média",
  true_node: "Nodo Norte",
};

const aspectMeanings: Readonly<
  Record<SynastryAspect["type"], { tone: SynastryAspectReading["tone"]; meaning: string }>
> = {
  conjunção: {
    tone: "intense",
    meaning:
      "A conjunção reúne duas forças no mesmo ponto do zodíaco. A percepção tende a ser imediata e intensa: uma energia desperta a outra, para acolher ou incomodar.",
  },
  sextil: {
    tone: "supportive",
    meaning:
      "O sextil abre uma oportunidade de cooperação. A facilidade existe, mas cresce quando as duas pessoas escolhem participar e transformar afinidade em gesto concreto.",
  },
  quadratura: {
    tone: "growth",
    meaning:
      "A quadratura cria atrito entre necessidades diferentes. Não é sentença de conflito: é um convite insistente para negociar ritmos, reconhecer limites e construir uma terceira possibilidade.",
  },
  trígono: {
    tone: "supportive",
    meaning:
      "O trígono indica circulação espontânea entre as duas energias. Há reconhecimento e fluidez, embora aquilo que parece natural também precise ser valorizado para não passar despercebido.",
  },
  oposição: {
    tone: "growth",
    meaning:
      "A oposição coloca duas forças frente a frente. Pode produzir fascínio e polarização; sua potência aparece quando o vínculo troca a lógica de disputa pela complementaridade.",
  },
};

function interpretAspect(
  firstName: string,
  secondName: string,
  aspect: SynastryAspect,
): SynastryAspectReading {
  const firstBody = bodyNames[aspect.firstBody] ?? aspect.firstBody;
  const secondBody = bodyNames[aspect.secondBody] ?? aspect.secondBody;
  const definition = aspectMeanings[aspect.type];
  return {
    ...aspect,
    tone: definition.tone,
    headline: `${firstBody} de ${firstName} em ${aspect.type} com ${secondBody} de ${secondName}`,
    meaning: definition.meaning,
    livedExperience: livedExperience(firstName, secondName, aspect),
    invitation: invitationFor(aspect),
  };
}

function livedExperience(firstName: string, secondName: string, aspect: SynastryAspect): string {
  const firstBody = bodyNames[aspect.firstBody] ?? aspect.firstBody;
  const secondBody = bodyNames[aspect.secondBody] ?? aspect.secondBody;
  const pairKey = `${aspect.firstBody}-${aspect.secondBody}`;
  const pairMeaning =
    pairMeanings[pairKey] ?? composePairMeaning(aspect.firstBody, aspect.secondBody);
  return `Com o ${firstBody} de ${firstName} em ${aspect.firstSign} encontrando o ${secondBody} de ${secondName} em ${aspect.secondSign}, ${pairMeaning}. O orbe de ${aspect.orb.toFixed(2)}° torna este um dos fios reconhecíveis da relação.`;
}

const pairMeanings: Readonly<Record<string, string>> = {
  "sun-sun":
    "as identidades procuram reconhecimento mútuo e revelam como os dois projetos de vida podem dividir o mesmo horizonte",
  "sun-moon":
    "a direção consciente de uma pessoa toca diretamente a necessidade emocional da outra, unindo propósito e pertencimento",
  "sun-mercury":
    "identidade e pensamento se estimulam; as palavras de uma pessoa ajudam a outra a compreender e afirmar quem é",
  "sun-venus":
    "admiração, encanto e validação aquecem o vínculo, fazendo a presença de uma pessoa despertar prazer na outra",
  "sun-mars":
    "vitalidade e iniciativa se acendem, criando coragem compartilhada, magnetismo e uma forte vontade de agir",
  "moon-sun":
    "o mundo íntimo de uma pessoa responde ao brilho da outra, criando uma busca profunda por acolhimento e reconhecimento",
  "moon-moon":
    "duas memórias emocionais se encontram e mostram com clareza onde existe abrigo instintivo ou diferença de ritmo afetivo",
  "moon-mercury":
    "sentimento e palavra se aproximam; uma pessoa dá voz ao que a outra percebe antes mesmo de conseguir explicar",
  "moon-venus":
    "cuidado e afeto falam uma linguagem delicada, favorecendo ternura, intimidade doméstica e prazer em estar perto",
  "moon-mars":
    "sensibilidade e impulso se provocam, produzindo química imediata e reações emocionais que pedem tato",
  "mercury-sun":
    "as ideias de uma pessoa iluminam a identidade da outra, fortalecendo aprendizado, curiosidade e direção conjunta",
  "mercury-moon":
    "a mente encontra o território das emoções e pode traduzir sentimentos — ou racionalizá-los antes que sejam acolhidos",
  "mercury-mercury":
    "os estilos mentais entram em diálogo e definem o ritmo das conversas, decisões e reparações do vínculo",
  "mercury-venus":
    "palavra e encanto se combinam; afeto circula por conversas, humor, elogios e interesses compartilhados",
  "mercury-mars":
    "pensamento e ação ganham velocidade, tornando o diálogo estimulante, direto e por vezes competitivo",
  "venus-sun":
    "a forma de amar de uma pessoa reconhece e embeleza a identidade da outra, alimentando admiração e autoestima",
  "venus-moon":
    "o afeto encontra uma necessidade emocional profunda, criando gestos de cuidado que podem ser sentidos como lar",
  "venus-mercury":
    "gosto e inteligência se cortejam; conversar, criar e descobrir referências juntos fortalece a aproximação",
  "venus-venus":
    "os códigos de prazer, beleza e reciprocidade se espelham e mostram como cada pessoa gosta de oferecer e receber amor",
  "venus-mars":
    "atração e desejo formam um campo magnético, revelando o ritmo da conquista, da sensualidade e da iniciativa",
  "mars-sun":
    "a ação de uma pessoa desperta a potência da outra, incentivando coragem e conquista, mas também disputas por direção",
  "mars-moon":
    "o impulso alcança o campo emocional sem pedir licença, gerando desejo, proteção e reações intensas",
  "mars-mercury":
    "a iniciativa encontra a mente, acelerando decisões e debates e exigindo cuidado para que franqueza não vire ataque",
  "mars-venus":
    "desejo e afeto se reconhecem corporalmente, formando uma dança entre quem se aproxima e quem recebe",
  "mars-mars":
    "dois modos de agir medem força e ritmo, criando potência para objetivos comuns e necessidade de acordos nos conflitos",
  "saturn-venus":
    "o compromisso encontra o afeto: existe força para tornar o amor concreto, embora carinho não deva ser confundido com obrigação ou aprovação",
  "saturn-moon":
    "a realidade toca o mundo emocional, oferecendo continência e permanência, mas pedindo cuidado para que proteção não seja sentida como frieza",
  "pluto-venus":
    "afeto e profundidade se magnetizam, trazendo paixão transformadora e exigindo consciência sobre apego, ciúme e jogos de poder",
  "uranus-venus":
    "o amor é eletrizado pela novidade; a atração pede liberdade, autenticidade e espaço para que o vínculo continue vivo sem se tornar imprevisível",
  "neptune-venus":
    "romance e imaginação se misturam, criando delicadeza e inspiração, com o chamado de amar a pessoa real para além da idealização",
  "chiron-moon":
    "uma vulnerabilidade antiga encontra o campo do cuidado, tornando possível acolher dores profundas sem transformar uma pessoa em salvadora da outra",
  "mean_lilith-mars":
    "desejo indomado e impulso se reconhecem com intensidade, revelando magnetismo, coragem e temas de autonomia, consentimento e poder",
  "true_node-sun":
    "o caminho de crescimento encontra a identidade, produzindo uma sensação marcante de direção e convocando escolhas que façam o vínculo evoluir",
};

const relationalRoles: Readonly<Record<string, string>> = {
  sun: "a identidade e o propósito de uma pessoa iluminam",
  moon: "as necessidades emocionais e os instintos de cuidado de uma pessoa sensibilizam",
  mercury: "a mente, a escuta e a linguagem de uma pessoa traduzem",
  venus: "a forma de amar, atrair e reconhecer valor de uma pessoa envolve",
  mars: "o desejo, a coragem e a iniciativa de uma pessoa mobilizam",
  jupiter: "a confiança, a visão de futuro e o impulso de expansão de uma pessoa ampliam",
  saturn: "a maturidade, os limites e o compromisso de uma pessoa estruturam",
  uranus: "a necessidade de liberdade e renovação de uma pessoa desperta",
  neptune: "a imaginação, a empatia e os ideais de uma pessoa permeiam",
  pluto: "a intensidade, o poder regenerador e os conteúdos profundos de uma pessoa transformam",
  chiron: "a vulnerabilidade e a sabedoria conquistada através dela alcançam",
  mean_lilith: "o desejo soberano e a parte que recusa submissão de uma pessoa provocam",
  true_node: "o chamado de crescimento e futuro de uma pessoa orienta",
};

const receptiveRoles: Readonly<Record<string, string>> = {
  sun: "a autoestima, a vitalidade e a direção existencial da outra",
  moon: "a intimidade, a memória afetiva e a necessidade de segurança da outra",
  mercury: "o pensamento, as decisões e a maneira de conversar da outra",
  venus: "os valores, o prazer e a linguagem amorosa da outra",
  mars: "a sexualidade, a iniciativa e a forma de enfrentar conflitos da outra",
  jupiter: "a fé, os horizontes e a capacidade de confiar da outra",
  saturn: "os compromissos, os receios e a construção de longo prazo da outra",
  uranus: "a autonomia, a originalidade e a necessidade de mudança da outra",
  neptune: "os sonhos, a sensibilidade e as fronteiras emocionais da outra",
  pluto: "o desejo profundo, as defesas e o poder de regeneração da outra",
  chiron: "as feridas sensíveis e o potencial de cura da outra",
  mean_lilith: "a sombra, a autonomia e os desejos que a outra não aceita domesticar",
  true_node: "o caminho evolutivo e as experiências que fazem a outra avançar",
};

function composePairMeaning(firstBody: string, secondBody: string): string {
  const action =
    relationalRoles[firstBody] ?? `a expressão de ${bodyNames[firstBody] ?? firstBody} encontra`;
  const field =
    receptiveRoles[secondBody] ?? `a linguagem de ${bodyNames[secondBody] ?? secondBody}`;
  return `${action} ${field}, dando a essa combinação uma assinatura específica no vínculo`;
}

function invitationFor(aspect: SynastryAspect): string {
  if (aspect.type === "trígono" || aspect.type === "sextil")
    return "Cultivem conscientemente essa facilidade: nomeiem o que funciona e transformem sintonia em cuidado recorrente.";
  if (aspect.type === "conjunção")
    return "Observem quando a identificação aproxima e quando mistura demais as necessidades. Intimidade também precisa de espaço individual.";
  if (aspect.type === "quadratura")
    return "Antes de reagir, traduzam a necessidade por trás da tensão. A diferença pode amadurecer o vínculo quando não vira cobrança ou competição.";
  return "Evitem colocar uma pessoa em cada extremo. Perguntem o que cada lado protege e procurem uma escolha que honre as duas perspectivas.";
}

function angularDistance(left: number, right: number): number {
  const distance = Math.abs((((left - right) % 360) + 360) % 360);
  return Math.min(distance, 360 - distance);
}
