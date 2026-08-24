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
    lead: `${body.name} simboliza ${body.function}. Em ${input.sign}, signo de ${sign.element} e modalidade ${sign.modality}, essa função tende a ${sign.instinct}. O grau ${input.degree.toFixed(2)}° localiza com precisão o posicionamento usado nesta leitura.`,
    mechanics: `${input.context} A força disponível aparece como ${sign.strength}. Isso não descreve uma personalidade inteira nem age isoladamente: o restante do mapa mostra onde essa qualidade encontra apoio, tensão e oportunidade de amadurecimento.`,
    dailyLife:
      houseTheme === undefined
        ? `Na vida cotidiana, observe onde você espontaneamente tenta ${sign.instinct}. Sem hora natal confiável, não atribuímos essa energia a uma casa específica; a interpretação por signo continua válida.`
        : `Na Casa ${input.house}, o tema encontra palco em ${houseTheme}. É nesse campo que situações concretas costumam pedir a linguagem de ${input.sign}, tornando o símbolo reconhecível em escolhas, vínculos e hábitos.`,
    tension: `Quando opera sem consciência, o mesmo recurso pode aparecer como ${sign.excess}. O desafio não é eliminar ${input.sign}, mas perceber quando uma estratégia útil passou a responder a toda situação do mesmo modo.`,
    integration: `A expressão madura pede ${sign.integration}. Uma prática útil é separar impulso, necessidade e ação: primeiro nomeie o que surgiu, depois verifique o contexto e só então escolha como responder.`,
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
    lead: `A Casa ${input.house} organiza experiências ligadas a ${theme}. Sua cúspide a ${input.degree.toFixed(2)}° de ${input.sign} indica que esse campo começa pela linguagem de ${input.sign}, um signo de ${lens.element} e modalidade ${lens.modality}.`,
    mechanics: `${input.context} A casa mostra onde a experiência acontece; o signo descreve como você tende a entrar nesse território. Planetas dentro da casa e aspectos à cúspide acrescentam camadas, sem apagar esta porta de entrada.`,
    dailyLife: `Você reconhece essa combinação quando temas de ${theme} pedem que você possa ${lens.instinct}. O símbolo se torna útil quando é ligado a decisões, conversas e hábitos observáveis, em vez de ser tratado como um rótulo abstrato.`,
    tension: `A potência está em ${lens.strength}. Sob pressão, pode surgir ${lens.excess}; isso não condena o campo da Casa ${input.house}, apenas mostra a estratégia que merece mais escolha e menos automatismo.`,
    integration: `A integração pede ${lens.integration}. Observe quem participa desse campo, qual necessidade está em jogo e que ação concreta respeita tanto sua verdade quanto a realidade da situação.`,
    reflection: `Em ${theme}, o que você pode fazer de modo mais consciente nesta fase da vida?`,
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
