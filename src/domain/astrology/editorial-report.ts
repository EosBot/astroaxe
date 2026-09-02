export const EDITORIAL_REPORT_VERSION = "western-editorial-reports-1.0.0";

interface SignLens {
  element: string;
  modality: string;
  instinct: string;
  strength: string;
  excess: string;
  integration: string;
}

const SIGN_LENSES: Readonly<Record<string, SignLens>> = {
  Áries: {
    element: "fogo",
    modality: "cardinal",
    instinct: "abrir caminho antes de possuir todas as respostas",
    strength: "coragem, franqueza e capacidade de iniciar",
    excess: "pressa, confronto ou dificuldade de sustentar o que começou",
    integration: "agir com direção, incluir o tempo do outro e transformar impulso em decisão",
  },
  Touro: {
    element: "terra",
    modality: "fixa",
    instinct: "preservar estabilidade, prazer e recursos concretos",
    strength: "constância, presença e senso de valor",
    excess: "apego, imobilidade ou resistência a mudanças necessárias",
    integration: "distinguir segurança de estagnação e permitir que o corpo participe das escolhas",
  },
  Gêmeos: {
    element: "ar",
    modality: "mutável",
    instinct: "compreender pela pergunta, pela linguagem e pela troca",
    strength: "curiosidade, adaptação e circulação de ideias",
    excess: "dispersão, racionalização ou excesso de versões sem compromisso",
    integration: "escolher uma conversa por vez e transformar informação em entendimento",
  },
  Câncer: {
    element: "água",
    modality: "cardinal",
    instinct: "proteger vínculos, memória e pertencimento",
    strength: "cuidado, sensibilidade e leitura do ambiente",
    excess: "defesa indireta, apego ao passado ou cuidado que vira controle",
    integration: "nomear necessidades sem exigir adivinhação e criar abrigo sem aprisionar",
  },
  Leão: {
    element: "fogo",
    modality: "fixa",
    instinct: "expressar identidade, criatividade e calor pessoal",
    strength: "generosidade, autoria e presença",
    excess: "orgulho ferido, dramatização ou dependência de reconhecimento",
    integration: "criar porque algo é verdadeiro e compartilhar luz sem ocupar todo o palco",
  },
  Virgem: {
    element: "terra",
    modality: "mutável",
    instinct: "observar, ordenar e aperfeiçoar o que pode funcionar melhor",
    strength: "discernimento, técnica e cuidado aplicado",
    excess: "autocrítica, controle de detalhes ou sensação de nunca estar pronto",
    integration: "usar critério a serviço da vida e reconhecer quando o suficiente já é fértil",
  },
  Libra: {
    element: "ar",
    modality: "cardinal",
    instinct: "buscar reciprocidade, proporção e entendimento entre diferenças",
    strength: "diplomacia, senso estético e capacidade de compor",
    excess: "indecisão, apaziguamento ou abandono da própria posição",
    integration: "negociar sem desaparecer e sustentar conflito com respeito e clareza",
  },
  Escorpião: {
    element: "água",
    modality: "fixa",
    instinct: "aprofundar vínculos, investigar motivações e transformar o que perdeu verdade",
    strength: "intensidade, lealdade e poder de regeneração",
    excess: "controle, suspeita ou retenção emocional como teste",
    integration: "trocar vigilância por intimidade consciente e usar poder com transparência",
  },
  Sagitário: {
    element: "fogo",
    modality: "mutável",
    instinct: "ampliar horizonte, buscar sentido e experimentar liberdade",
    strength: "visão, entusiasmo e confiança no aprendizado",
    excess: "exagero, fuga do detalhe ou certeza moral que não escuta",
    integration: "unir horizonte e responsabilidade e deixar que a experiência revise crenças",
  },
  Capricórnio: {
    element: "terra",
    modality: "cardinal",
    instinct: "construir estrutura, competência e resultado durável",
    strength: "responsabilidade, estratégia e resistência",
    excess: "rigidez, autocobrança ou valor pessoal condicionado ao desempenho",
    integration:
      "permitir apoio, celebrar etapas e lembrar que maturidade também inclui sensibilidade",
  },
  Aquário: {
    element: "ar",
    modality: "fixa",
    instinct: "preservar autonomia, originalidade e visão coletiva",
    strength: "invenção, independência e leitura de sistemas",
    excess: "distanciamento, rebeldia automática ou superioridade intelectual",
    integration: "aproximar ideia e afeto e inovar em diálogo com as pessoas afetadas",
  },
  Peixes: {
    element: "água",
    modality: "mutável",
    instinct: "perceber nuances, imaginar possibilidades e dissolver fronteiras rígidas",
    strength: "empatia, imaginação e sensibilidade simbólica",
    excess: "idealização, fuga ou absorção do que pertence ao outro",
    integration:
      "dar forma à intuição, manter limites permeáveis e verificar fantasias na realidade",
  },
};

const BODY_THEMES: Readonly<Record<string, { name: string; function: string; question: string }>> =
  {
    sun: {
      name: "Sol",
      function: "identidade consciente, vitalidade e autoria",
      question: "O que faz você sentir que está vivendo a própria vida?",
    },
    moon: {
      name: "Lua",
      function: "necessidades emocionais, memória e regulação",
      question: "De que modo você reconhece segurança antes de reagir?",
    },
    mercury: {
      name: "Mercúrio",
      function: "pensamento, linguagem, estudo e decisão",
      question: "Como sua mente transforma experiência em palavra e escolha?",
    },
    venus: {
      name: "Vênus",
      function: "afeto, prazer, valores, atração e reciprocidade",
      question: "O que precisa existir para prazer e vínculo parecerem verdadeiros?",
    },
    mars: {
      name: "Marte",
      function: "desejo, iniciativa, libido, coragem e conflito",
      question: "Como você afirma vontade sem atropelar o próprio limite ou o do outro?",
    },
    jupiter: {
      name: "Júpiter",
      function: "expansão, confiança, estudo e oportunidade",
      question: "Onde crescer exige visão e também medida?",
    },
    saturn: {
      name: "Saturno",
      function: "limite, tempo, compromisso e competência",
      question: "Que responsabilidade pode deixar de ser peso e tornar-se autoridade?",
    },
    uranus: {
      name: "Urano",
      function: "autonomia, ruptura, invenção e mudança",
      question: "O que precisa ser renovado para que liberdade não seja apenas fuga?",
    },
    neptune: {
      name: "Netuno",
      function: "imaginação, ideal, espiritualidade e projeção",
      question: "Como honrar sua sensibilidade sem abandonar discernimento?",
    },
    pluto: {
      name: "Plutão",
      function: "poder, crise, profundidade e regeneração",
      question: "O que pode ser transformado quando controle deixa de ser a única proteção?",
    },
    true_node: {
      name: "Nodo Norte",
      function: "direção de desenvolvimento na astrologia ocidental moderna",
      question: "Que experiência amplia seu repertório justamente por ainda não ser automática?",
    },
    south_node: {
      name: "Nodo Sul",
      function: "repertório familiar e respostas já automatizadas",
      question: "Que competência conhecida pode servir de base sem dirigir toda a vida?",
    },
    mean_lilith: {
      name: "Lilith média",
      function: "desejo recusado, autonomia e conteúdos projetados",
      question:
        "Que parte de sua vontade precisa de linguagem em vez de vergonha ou atuação impulsiva?",
    },
  };

const HOUSE_THEMES = [
  "identidade, corpo, presença e maneira de começar",
  "dinheiro, recursos, valores e sustentação material",
  "aprendizado cotidiano, comunicação, irmãos e ambiente próximo",
  "lar, raízes, família, intimidade e base emocional",
  "criatividade, prazer, romance, expressão e relação com filhos",
  "rotina, trabalho diário, serviço, técnica e cuidado corporal",
  "parcerias, contratos, reciprocidade e projeções no outro",
  "intimidade, recursos compartilhados, crise, poder e transformação",
  "estudos amplos, viagens, crenças, ética e busca de sentido",
  "carreira, responsabilidade pública, reputação e legado",
  "amizades, redes, projetos coletivos e visão de futuro",
  "recolhimento, inconsciente, encerramentos, espiritualidade e bastidores",
] as const;

export interface EditorialReading {
  version: string;
  title: string;
  lead: string;
  mechanics: string;
  dailyLife: string;
  tension: string;
  integration: string;
  reflection: string;
}

export function interpretPlacement(input: {
  body: string;
  sign: string;
  degree: number;
  house?: number;
  context: string;
}): EditorialReading {
  const sign = SIGN_LENSES[input.sign] ?? SIGN_LENSES.Áries;
  if (sign === undefined) throw new Error("editorial_sign_missing");
  const body = BODY_THEMES[input.body] ?? {
    name: input.body,
    function: "uma função simbólica do mapa",
    question: "Como essa qualidade procura expressão consciente?",
  };
  const houseTheme = input.house === undefined ? undefined : HOUSE_THEMES[input.house - 1];
  const houseTitle = input.house === undefined ? "" : ` na Casa ${input.house}`;
  return {
    version: EDITORIAL_REPORT_VERSION,
    title: `${body.name} em ${input.sign}${houseTitle}`,
    lead: `${body.name} é, no seu mapa, ${body.function}. Ele nasceu em ${input.sign} — signo de ${sign.element}, modalidade ${sign.modality} —, e é por isso que essa parte de você costuma ${sign.instinct}. O grau exato, ${input.degree.toFixed(2)}°, é o que garante que esta leitura seja sobre o seu céu, e não sobre um céu parecido com o seu.`,
    mechanics: `${input.context} A força que mora aqui aparece como ${sign.strength}. Isso não é a sua personalidade inteira, e nem age sozinho: o resto do mapa mostra onde essa qualidade encontra apoio, onde encontra atrito e onde tem chance de amadurecer. Um mapa é uma conversa entre partes, não uma sentença.`,
    dailyLife:
      houseTheme === undefined
        ? `No dia a dia, repare onde você tenta ${sign.instinct} sem nem pensar. É ali que esse símbolo vive. Como sua hora de nascimento não está confirmada, não vamos chutar em que área da vida isso se concentra — a leitura por signo continua inteira, e preferimos dizer o que sabemos a inventar o que falta.`
        : `Na Casa ${input.house}, esse tema ganha palco em ${houseTheme}. É nesse território que a vida costuma pedir a linguagem de ${input.sign} — nas escolhas, nos vínculos, nos hábitos pequenos. Quando você reconhece o símbolo acontecendo ali, ele deixa de ser abstração e vira algo com que dá para trabalhar.`,
    tension: `Quando age no automático, esse mesmo recurso aparece como ${sign.excess}. E aqui vale dizer com carinho: o objetivo não é se livrar de ${input.sign}. É perceber quando uma estratégia que funcionou muito bem passou a responder a todas as situações do mesmo jeito, inclusive às que pediam outra coisa.`,
    integration: `A versão madura disso pede ${sign.integration}. Uma prática simples ajuda: separe o impulso, a necessidade e a ação. Primeiro dê nome ao que surgiu, depois olhe o que a situação de fato é, e só então escolha a resposta. São três segundos, e mudam bastante.`,
    reflection: body.question,
  };
}

export function interpretHouse(input: {
  house: number;
  sign: string;
  degree: number;
  context: string;
}): EditorialReading {
  const lens = signLens(input.sign);
  const theme = houseTheme(input.house);
  return {
    version: EDITORIAL_REPORT_VERSION,
    title: `Casa ${input.house} em ${input.sign}`,
    lead: `A Casa ${input.house} é o território de ${theme}. A porta dela abre a ${input.degree.toFixed(2)}° de ${input.sign}, e isso quer dizer que você entra nessa área da vida falando a língua de ${input.sign} — signo de ${lens.element}, modalidade ${lens.modality}. É a primeira coisa que acontece quando o assunto surge, antes mesmo de você decidir alguma coisa.`,
    mechanics: `${input.context} A casa diz onde a experiência acontece; o signo diz como você chega nela. Planetas que morem dentro dessa casa e aspectos à cúspide acrescentam camadas por cima — mas não apagam esta porta de entrada, que continua sendo por onde você passa.`,
    dailyLife: `Você reconhece isso quando assuntos de ${theme} pedem que você consiga ${lens.instinct}. Vale procurar o símbolo em coisas concretas: uma decisão recente, uma conversa que se repete, um hábito que você tem sem saber por quê. Rótulo abstrato não ajuda ninguém; exemplo da sua própria vida, sim.`,
    tension: `A potência daqui está em ${lens.strength}. Quando aperta, pode virar ${lens.excess} — e isso não condena esta área da sua vida. Só mostra qual estratégia anda no automático e merece voltar a ser escolha.`,
    integration: `A integração pede ${lens.integration}. Repare em quem mais participa desse território, qual necessidade está realmente em jogo, e que atitude concreta respeita ao mesmo tempo a sua verdade e o que a situação de fato é. Os dois cabem, quase sempre.`,
    reflection: `Em ${theme}, o que dá para fazer com mais consciência nesta fase da sua vida?`,
  };
}

export function houseForLongitude(longitude: number, cusps: number[]): number {
  if (cusps.length !== 12) throw new RangeError("São necessárias doze cúspides.");
  const point = normalize(longitude);
  for (let index = 0; index < cusps.length; index += 1) {
    const start = normalize(cusps[index] ?? 0);
    const end = normalize(cusps[(index + 1) % cusps.length] ?? 0);
    const inside = start <= end ? point >= start && point < end : point >= start || point < end;
    if (inside) return index + 1;
  }
  throw new Error("Não foi possível localizar a casa astrológica.");
}

export function houseTheme(house: number): string {
  return HOUSE_THEMES[house - 1] ?? "um campo específico da experiência";
}

export function signLens(sign: string): SignLens {
  return (
    SIGN_LENSES[sign] ??
    SIGN_LENSES.Áries ?? {
      element: "",
      modality: "",
      instinct: "",
      strength: "",
      excess: "",
      integration: "",
    }
  );
}

function normalize(value: number): number {
  return ((value % 360) + 360) % 360;
}
