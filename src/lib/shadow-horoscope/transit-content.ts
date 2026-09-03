import {
  astrologicalAspectName,
  astrologicalBodyName,
  transitTechnicalSummary,
} from "@/domain/astrology/labels";
import type { TransitReadingResponse } from "@/lib/transits/interpretations";

type Transit = TransitReadingResponse["interpretations"][number]["transit"];
type TransitContent = TransitReadingResponse["interpretations"][number]["content"];

type ShadowTransitVoice = {
  readonly title: string;
  readonly mechanism: string;
  readonly scene: string;
  readonly hiddenMotive: string;
  readonly practice: string;
};

const transitVoices: Readonly<Record<string, ShadowTransitVoice>> = {
  sun: {
    title: "O ego pediu iluminação de palco",
    mechanism:
      "a necessidade de ser reconhecido pode vestir qualquer escolha de autenticidade, mesmo quando o objetivo real é não passar despercebido",
    scene:
      "Você apresenta uma preferência como princípio inegociável e só percebe a encenação quando alguém não aplaude.",
    hiddenMotive:
      "Por baixo da pose de convicção, existe o receio de que não ser o centro da decisão signifique não ter importância.",
    practice:
      "faça uma escolha importante sem anunciá-la e observe se ela ainda parece verdadeira sem plateia",
  },
  moon: {
    title: "A carência assumiu o controle remoto",
    mechanism:
      "uma necessidade legítima de acolhimento pode virar teste emocional, silêncio carregado ou expectativa de adivinhação",
    scene:
      "Você responde que está tudo bem com a precisão de quem espera que a outra pessoa tenha treinamento em perícia afetiva.",
    hiddenMotive:
      "A cobrança indireta tenta garantir cuidado sem correr o risco de pedi-lo e ouvir uma resposta que você não controla.",
    practice: "troque uma indireta por um pedido simples, específico e possível de ser recusado",
  },
  mercury: {
    title: "A mente abriu uma firma de advocacia",
    mechanism:
      "a inteligência pode trabalhar menos para compreender e mais para produzir uma versão impecável na qual você nunca esteve errado",
    scene:
      "A conversa termina, mas você continua redigindo mentalmente a réplica definitiva para um julgamento que só existe na sua cabeça.",
    hiddenMotive:
      "Explicar tudo até a exaustão evita o instante mais desconfortável: admitir dúvida, contradição ou responsabilidade.",
    practice:
      "resuma sua posição em duas frases e acrescente uma terceira dizendo o que você talvez não esteja enxergando",
  },
  venus: {
    title: "O afeto começou a emitir fatura",
    mechanism:
      "gentileza, sedução e disponibilidade podem esconder uma contabilidade precisa do retorno que você espera receber",
    scene:
      "Você diz que fez porque quis, mas guarda recibos emocionais suficientes para uma auditoria completa no próximo conflito.",
    hiddenMotive:
      "A generosidade condicionada tenta comprar segurança afetiva sem precisar negociar reciprocidade de forma explícita.",
    practice:
      "separe o gesto que você quer oferecer do acordo que precisa pedir; não use um como cobrança secreta do outro",
  },
  mars: {
    title: "A irritação encontrou um megafone",
    mechanism:
      "coragem e iniciativa podem virar licença para reagir antes de distinguir ameaça real, frustração comum e orgulho ferido",
    scene:
      "Você chama de resolver logo o que todos ao redor descrevem como entrar na sala já discutindo com a resposta.",
    hiddenMotive:
      "A pressa de atacar tenta impedir que alguém perceba medo, impotência ou desejo antes que você consiga organizá-los.",
    practice:
      "nomeie o que quer proteger antes de escolher a ação; força sem alvo costuma acertar quem não estava atacando",
  },
  jupiter: {
    title: "A certeza cresceu além do orçamento",
    mechanism:
      "confiança e visão podem inflar até transformar entusiasmo em promessa excessiva, opinião em doutrina e desejo em destino",
    scene:
      "O plano ainda não tem primeiro passo, mas você já está explicando como ele mudará sua vida e, se houver tempo, a humanidade.",
    hiddenMotive:
      "A grandiosidade protege do medo de começar pequeno, encontrar limites e descobrir que sentido também exige manutenção.",
    practice:
      "reduza a promessa ao menor gesto que possa ser repetido por quatro semanas sem depender de euforia",
  },
  saturn: {
    title: "O controle vestiu uniforme de responsabilidade",
    mechanism:
      "disciplina e prudência podem endurecer até tratar descanso como falha, vulnerabilidade como desorganização e mudança como ameaça",
    scene:
      "Você assume tudo, reclama que ninguém ajuda e rejeita a ajuda porque ela não segue o manual que nunca mostrou a ninguém.",
    hiddenMotive:
      "O excesso de controle tenta evitar a vergonha de precisar, falhar ou depender de algo que não obedece ao seu cronograma.",
    practice:
      "entregue uma responsabilidade com critério suficiente, não perfeito, e tolere que outra pessoa faça diferente",
  },
};

const natalFields: Readonly<Record<string, { field: string; shadow: string }>> = {
  sun: {
    field: "sua identidade e sua necessidade de reconhecimento",
    shadow: "provar valor antes mesmo que alguém o tenha colocado em dúvida",
  },
  moon: {
    field: "seu mundo emocional e sua busca por pertencimento",
    shadow: "transformar necessidade de cuidado em cobrança, retraimento ou teste",
  },
  mercury: {
    field: "seu pensamento e sua maneira de contar o que aconteceu",
    shadow: "confundir uma narrativa convincente com uma narrativa honesta",
  },
  venus: {
    field: "seus afetos, valores e acordos de reciprocidade",
    shadow: "oferecer para merecer, agradar para controlar ou desejar para possuir",
  },
  mars: {
    field: "seu desejo, sua raiva e sua capacidade de agir",
    shadow: "usar urgência para não investigar o que realmente está defendendo",
  },
  jupiter: {
    field: "suas crenças, expectativas e promessas de crescimento",
    shadow: "aumentar a história até que a realidade pareça pequena demais",
  },
  saturn: {
    field: "seus limites, medos e compromissos",
    shadow: "chamar rigidez de maturidade e sobrecarga de competência",
  },
  uranus: {
    field: "sua autonomia e sua relação com rupturas",
    shadow: "romper antes que proximidade, constância ou negociação limitem suas opções",
  },
  neptune: {
    field: "seus ideais, fantasias e fronteiras sensíveis",
    shadow: "preferir a versão imaginada quando a realidade pede limite e definição",
  },
  pluto: {
    field: "seu poder, seus apegos e sua capacidade de transformação",
    shadow: "controlar a mudança para nunca ocupar o lugar de quem pode perder",
  },
  chiron: {
    field: "uma ferida antiga e as defesas construídas ao redor dela",
    shadow: "usar a dor conhecida como identidade ou credencial para prever nova dor",
  },
  mean_lilith: {
    field: "sua recusa mais indomada e o que você não aceita domesticar",
    shadow: "tratar toda negociação como submissão e toda frustração como censura",
  },
  true_node: {
    field: "o caminho de desenvolvimento que ainda não virou hábito",
    shadow: "idealizar o futuro para não suportar a incompetência temporária de quem aprende",
  },
  south_node: {
    field: "os recursos antigos que você domina e repete sem esforço",
    shadow: "voltar ao conhecido mesmo quando ele já não resolve o problema presente",
  },
};

const aspectShadows: Readonly<Record<string, { movement: string; risk: string }>> = {
  conjunction: {
    movement: "mistura as duas funções até parecer que impulso e identidade são a mesma coisa",
    risk: "O automatismo ganha força porque fica difícil observar o padrão de fora.",
  },
  sextile: {
    movement: "abre uma oportunidade discreta para o padrão conseguir exatamente o que quer",
    risk: "A armadilha aqui é colaborar com a própria defesa e chamar a facilidade de coincidência.",
  },
  square: {
    movement: "cria atrito entre duas necessidades que não aceitam dividir o mesmo espaço",
    risk: "A pressão procura culpado depressa; integração começa quando você suporta o conflito sem terceirizá-lo.",
  },
  trine: {
    movement:
      "faz o padrão correr com tanta facilidade que ele quase não produz resistência consciente",
    risk: "O que flui bem também pode sabotar bem: conforto não é prova de lucidez.",
  },
  opposition: {
    movement:
      "projeta um polo no ambiente e deixa você convencido de que o problema chegou exclusivamente de fora",
    risk: "Quanto mais irritante o outro polo parecer, mais útil é procurar onde ele também opera em você.",
  },
};

function shadowIntensityNote(relativeIntensity: number): string {
  if (relativeIntensity >= 0.66) {
    return "A proximidade do pico deixa pouco espaço para fingir que foi só um detalhe.";
  }
  if (relativeIntensity >= 0.33) {
    return "A intensidade intermediária faz o padrão alternar entre evidência e disfarce.";
  }
  return "A intensidade é sutil; procure repetição e clima, não um grande acontecimento obrigatório.";
}

export function shadowTransitContent(transit: Transit): TransitContent {
  const transitingBody = astrologicalBodyName(transit.transitingBody);
  const natalBody = astrologicalBodyName(transit.natalBody);
  const aspect = astrologicalAspectName(transit.type);
  const voice = transitVoices[transit.transitingBody.toLowerCase()] ?? {
    title: `${transitingBody} trouxe um mecanismo para a luz`,
    mechanism: "uma qualidade útil pode operar no automático até se transformar em defesa",
    scene: "O padrão aparece em decisões repetidas que parecem inevitáveis enquanto acontecem.",
    hiddenMotive: "A reação tenta proteger uma necessidade que ainda não ganhou linguagem direta.",
    practice: "registre gatilho, impulso e necessidade antes de decidir como responder",
  };
  const natal = natalFields[transit.natalBody.toLowerCase()] ?? {
    field: `o campo natal ligado a ${natalBody}`,
    shadow: "repetir uma defesa antiga antes de conferir se ela ainda é necessária",
  };
  const aspectVoice = aspectShadows[transit.type.toLowerCase()] ?? {
    movement: "coloca as duas funções em contato",
    risk: "Observe o que se repete sem transformar a leitura em veredito.",
  };
  const phaseNote = transit.applying
    ? "O aspecto ainda se aproxima do pico: os sinais tendem a ficar mais nítidos, então vale reconhecê-los antes que virem justificativa pronta."
    : "O pico já passou: agora a sombra aparece menos como presságio e mais como rastro — consequências, conversas e escolhas que podem ser revistas.";
  const intensityNote = shadowIntensityNote(transit.relativeIntensity);

  return {
    title: voice.title,
    opening: `${transitingBody} em ${aspect} com ${natalBody} ativa ${natal.field}. A versão menos elegante dessa combinação é ${voice.mechanism}.`,
    deepening: [
      `${aspectVoice.movement}. ${aspectVoice.risk}`,
      `${voice.scene} Neste campo, a tendência é ${natal.shadow}.`,
      `${voice.hiddenMotive} ${intensityNote}`,
      phaseNote,
      "Isto descreve uma possibilidade simbólica do trânsito, não uma sentença sobre seu caráter. Se não houver correspondência com a sua experiência, não force o encaixe.",
    ].join("\n\n"),
    technicalWhy: transitTechnicalSummary(transit),
    reflectionPrompt: `Onde você pode estar usando ${natal.shadow} para não admitir o que realmente precisa neste encontro entre ${transitingBody} e ${natalBody}?`,
    practice: voice.practice,
    version: "shadow-transits-2.0.0",
    generationMethod: "HUMAN",
    author: {
      displayName: "AstroAxé Editorial",
      attributionLine: "Matriz sombria pré-escrita e versionada",
    },
    reviewer: {
      displayName: "Engine editorial AstroAxé",
      attributionLine:
        "Composição determinística por corpo, campo natal, aspecto, fase e intensidade",
    },
  };
}
