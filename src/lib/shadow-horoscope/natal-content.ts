import { astrologicalAspectName, astrologicalBodyName } from "@/domain/astrology/labels";

import { signShadowProfile, type SignShadowProfile } from "./sign-profiles";

export const SHADOW_NATAL_VERSION = "shadow-natal-3.0.0";

export type ShadowNatalBody =
  | "sun"
  | "moon"
  | "mercury"
  | "venus"
  | "mars"
  | "jupiter"
  | "saturn"
  | "uranus"
  | "neptune"
  | "pluto";

export type ShadowPlacementInput = {
  readonly body: ShadowNatalBody;
  readonly sign: string;
  readonly degree: number;
  readonly house: number | undefined;
  readonly retrograde: boolean;
};

export type ShadowReadingBlock = {
  readonly label: string;
  readonly text: string;
};

export type ShadowNatalReading = {
  readonly version: typeof SHADOW_NATAL_VERSION;
  readonly title: string;
  readonly position: string;
  readonly blocks: readonly ShadowReadingBlock[];
};

type BodyVoice = {
  readonly title: string;
  readonly glyph: string;
  readonly mechanism: (profile: SignShadowProfile) => string;
  readonly scene: string;
  readonly integration: string;
};

const bodyVoices: Readonly<Record<ShadowNatalBody, BodyVoice>> = {
  sun: {
    title: "A máscara da força",
    glyph: "☉",
    mechanism: (profile) => profile.ego,
    scene:
      "No cotidiano, isso pode virar disputa silenciosa por protagonismo, autoria ou reconhecimento.",
    integration:
      "Faça uma escolha importante sem anunciá-la e observe se ela continua verdadeira sem plateia.",
  },
  moon: {
    title: "A defesa emocional",
    glyph: "☾",
    mechanism: (profile) => profile.emotional,
    scene:
      "No afeto, o padrão pode aparecer como cobrança indireta, retraimento ou expectativa de adivinhação.",
    integration:
      "Troque uma indireta por um pedido simples, específico e possível de ser recusado.",
  },
  mercury: {
    title: "A armadilha da mente",
    glyph: "☿",
    mechanism: (profile) => profile.communication,
    scene:
      "Em discussões, a inteligência pode trabalhar mais para vencer a narrativa do que para compreender o conflito.",
    integration:
      "Resuma sua posição e acrescente, sem ironia, o que você talvez não esteja enxergando.",
  },
  venus: {
    title: "O preço de ser amado",
    glyph: "♀",
    mechanism: (profile) => profile.love,
    scene:
      "Nos vínculos, gentileza e charme podem esconder uma contabilidade precisa do retorno esperado.",
    integration: "Separe o gesto que deseja oferecer do acordo de reciprocidade que precisa pedir.",
  },
  mars: {
    title: "A sombra do desejo",
    glyph: "♂",
    mechanism: (profile) => profile.anger,
    scene:
      "Na briga, a reação pode chegar antes da pergunta sobre o que realmente estava sob ameaça.",
    integration:
      "Nomeie o que deseja proteger antes de escolher a ação; força sem alvo costuma produzir dano lateral.",
  },
  jupiter: {
    title: "A certeza sem medida",
    glyph: "♃",
    mechanism: (profile) => profile.problem,
    scene:
      "Na vida prática, confiança pode crescer até virar promessa excessiva, explicação grandiosa ou certeza sem lastro.",
    integration: "Reduza a promessa ao menor gesto que consiga repetir sem depender de euforia.",
  },
  saturn: {
    title: "O controle responsável demais",
    glyph: "♄",
    mechanism: (profile) => profile.selfSabotage,
    scene:
      "Diante de limite e responsabilidade, prudência pode endurecer até tratar descanso como falha e ajuda como interferência.",
    integration:
      "Escolha um padrão de qualidade suficiente e permita que alguém contribua sem copiar seu método.",
  },
  uranus: {
    title: "A rebeldia automática",
    glyph: "♅",
    mechanism: (profile) => profile.relationship,
    scene:
      "Quando a autonomia parece ameaçada, romper primeiro pode parecer mais seguro do que negociar proximidade.",
    integration:
      "Antes de cortar o vínculo ou a regra, diga qual liberdade concreta precisa ser preservada.",
  },
  neptune: {
    title: "A névoa conveniente",
    glyph: "♆",
    mechanism: (profile) => profile.emotional,
    scene:
      "Quando realidade e desejo divergem, a versão imaginada pode parecer mais acolhedora do que um limite claro.",
    integration: "Separe em duas colunas o que foi observado e o que foi imaginado antes de agir.",
  },
  pluto: {
    title: "O poder que não quer perder",
    glyph: "♇",
    mechanism: (profile) => profile.selfSabotage,
    scene:
      "Em situações de apego e transformação, controlar cada movimento pode substituir o trabalho de atravessar a perda.",
    integration:
      "Identifique o que já terminou e escolha uma ação que não dependa de recuperar controle total.",
  },
};

const houseFields = [
  "identidade, aparência e começos",
  "recursos, sustento e valores",
  "comunicação, aprendizado e convivência próxima",
  "lar, família e raízes emocionais",
  "criatividade, prazer e romance",
  "rotina, trabalho diário e cuidado com o corpo",
  "parcerias, contratos e relações a dois",
  "intimidade, recursos compartilhados e transformação",
  "crenças, estudos e ampliação de horizonte",
  "carreira, reputação e presença pública",
  "amizades, grupos e projetos coletivos",
  "recolhimento, inconsciente e vida interior",
] as const;

function sentence(text: string): string {
  const trimmed = text.trim().replace(/[.!?…]+$/u, "");
  return `${trimmed}.`;
}

function houseManifestation(house: number, scene: string): string {
  const field = houseFields[house - 1];
  if (field === undefined) return scene;
  return `Na Casa ${house}, ligada a ${field}, esse mecanismo ganha um palco concreto. ${scene}`;
}

export function shadowNatalMeta(body: ShadowNatalBody): Pick<BodyVoice, "title" | "glyph"> {
  const { title, glyph } = bodyVoices[body];
  return { title, glyph };
}

export function shadowNatalContent(input: ShadowPlacementInput): ShadowNatalReading {
  const profile = signShadowProfile(input.sign);
  const voice = bodyVoices[input.body];
  const body = astrologicalBodyName(input.body);
  const retrograde = input.retrograde ? " · retrógrado" : "";

  const blocks: ShadowReadingBlock[] = [
    {
      label: "Mecanismo",
      text: sentence(voice.mechanism(profile)),
    },
    {
      label: "Manifestação",
      text: sentence(
        input.house === undefined ? voice.scene : houseManifestation(input.house, voice.scene),
      ),
    },
    {
      label: "Custo",
      text: sentence(profile.virtueShadow),
    },
    {
      label: "Integração",
      text: sentence(voice.integration),
    },
  ];

  if (input.retrograde) {
    blocks.push({
      label: "Revisão",
      text: `O movimento retrógrado natal convida a reconhecer esse mecanismo por dentro antes de tentar corrigi-lo apenas na aparência.`,
    });
  }

  return {
    version: SHADOW_NATAL_VERSION,
    title: voice.title,
    position: `${body} em ${input.sign} · ${input.degree.toFixed(2)}°${retrograde}`,
    blocks,
  };
}

type ShadowAngle = "ascendant" | "midheaven";

const angleVoices: Readonly<
  Record<
    ShadowAngle,
    {
      title: string;
      glyph: string;
      label: string;
      mechanism: (profile: SignShadowProfile) => string;
      scene: string;
      integration: string;
    }
  >
> = {
  ascendant: {
    title: "A defesa que chega primeiro",
    glyph: "ASC",
    label: "Ascendente",
    mechanism: (profile) => profile.socialVersion,
    scene:
      "Essa é a estratégia que tende a entrar na sala antes de você decidir conscientemente como deseja aparecer.",
    integration:
      "Perceba quando a primeira reação ainda protege uma situação antiga que já não está acontecendo.",
  },
  midheaven: {
    title: "A reputação que cobra pedágio",
    glyph: "MC",
    label: "Meio do Céu",
    mechanism: (profile) => profile.ego,
    scene:
      "Na vida pública, sustentar uma imagem competente pode esconder medo de errar, depender ou mudar de direção.",
    integration:
      "Defina sucesso por uma entrega concreta, não pela tentativa de controlar como todos interpretarão sua trajetória.",
  },
};

export function shadowAngleContent(
  angle: ShadowAngle,
  longitude: number,
): ShadowNatalReading & { readonly glyph: string } {
  const normalized = ((longitude % 360) + 360) % 360;
  const signs = [
    "Áries",
    "Touro",
    "Gêmeos",
    "Câncer",
    "Leão",
    "Virgem",
    "Libra",
    "Escorpião",
    "Sagitário",
    "Capricórnio",
    "Aquário",
    "Peixes",
  ] as const;
  const sign = signs[Math.floor(normalized / 30)] ?? "Áries";
  const degree = normalized % 30;
  const profile = signShadowProfile(sign);
  const voice = angleVoices[angle];

  return {
    version: SHADOW_NATAL_VERSION,
    glyph: voice.glyph,
    title: voice.title,
    position: `${voice.label} em ${sign} · ${degree.toFixed(2)}°`,
    blocks: [
      { label: "Máscara", text: sentence(voice.mechanism(profile)) },
      { label: "Manifestação", text: sentence(voice.scene) },
      { label: "Integração", text: sentence(voice.integration) },
    ],
  };
}

export type ShadowAspectInput = {
  readonly a: string;
  readonly b: string;
  readonly type: string;
  readonly orb: number;
  readonly strength: number;
};

const aspectMechanisms: Readonly<Record<string, string>> = {
  conjunction:
    "As duas funções se misturam, e o impulso de uma pode parecer inseparável da identidade da outra.",
  sextile:
    "A facilidade abre uma oportunidade discreta para que as duas funções colaborem também na defesa.",
  square:
    "O atrito força duas necessidades a disputar espaço e aumenta a tentação de encontrar um culpado externo.",
  trine:
    "A fluidez deixa o automatismo confortável o bastante para passar por talento ou bom senso.",
  opposition:
    "A polaridade favorece projeção: uma função parece morar apenas no outro enquanto a complementar age sem ser reconhecida.",
};

export function shadowAspectContent(input: ShadowAspectInput): ShadowNatalReading {
  const first = astrologicalBodyName(input.a);
  const second = astrologicalBodyName(input.b);
  const aspect = astrologicalAspectName(input.type);
  const mechanism =
    aspectMechanisms[input.type.toLowerCase()] ??
    "O contato aproxima duas funções e torna visível a defesa que costuma operar entre elas.";
  const strength =
    input.strength >= 0.75
      ? "A força calculada torna essa dinâmica especialmente nítida."
      : input.strength >= 0.4
        ? "A força calculada é intermediária; procure repetição, não uma cena obrigatória."
        : "A força calculada é sutil e não deve ser tratada como característica dominante.";

  return {
    version: SHADOW_NATAL_VERSION,
    title: `${first} e ${second}: o ponto cego do encontro`,
    position: `${aspect} · orbe ${input.orb.toFixed(2)}°`,
    blocks: [
      { label: "Dinâmica", text: sentence(mechanism) },
      { label: "Intensidade", text: sentence(strength) },
      {
        label: "Integração",
        text: `Nomeie o pedido de ${first} e o pedido de ${second} separadamente antes de decidir qual deles deve conduzir a resposta.`,
      },
    ],
  };
}
