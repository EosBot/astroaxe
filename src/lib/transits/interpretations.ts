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

const transitVoices: Readonly<Record<string, { title: string; force: string; practice: string }>> =
  {
    sun: {
      title: "Reposicione sua presença",
      force: "vitalidade, identidade e escolhas visíveis",
      practice: "escolha uma ação que represente quem você está se tornando",
    },
    moon: {
      title: "Escute o movimento emocional",
      force: "sensibilidade, hábitos e necessidade de pertencimento",
      practice: "nomeie a emoção antes de transformá-la em reação",
    },
    mercury: {
      title: "Dê precisão às palavras",
      force: "pensamento, conversas, contratos e decisões",
      practice: "revise uma mensagem importante antes de enviá-la",
    },
    venus: {
      title: "Reveja valor e reciprocidade",
      force: "afetos, alianças, prazer e recursos",
      practice: "observe onde existe troca real e onde há esforço para merecer afeto",
    },
    mars: {
      title: "Direcione sua potência",
      force: "desejo, coragem, conflito e iniciativa",
      practice: "transforme impulso em uma atitude clara, sem ultrapassar limites",
    },
    jupiter: {
      title: "Cresça com medida",
      force: "confiança, oportunidades, visão e expansão",
      practice: "aceite uma oportunidade que também possa ser sustentada",
    },
    saturn: {
      title: "Construa o que precisa durar",
      force: "limites, responsabilidade, medo e maturidade",
      practice: "defina um compromisso pequeno que você consiga repetir",
    },
  };

const natalFields: Readonly<Record<string, string>> = {
  sun: "sua identidade e direção de vida",
  moon: "seu mundo emocional e sua intimidade",
  mercury: "sua maneira natal de pensar e comunicar",
  venus: "seus valores, afetos e linguagem amorosa",
  mars: "seu desejo, sua iniciativa e sua forma de lutar",
  jupiter: "sua confiança e capacidade de ampliar horizontes",
  saturn: "seus compromissos, receios e estruturas",
  uranus: "sua autonomia e necessidade de renovação",
  neptune: "seus sonhos, ideais e fronteiras sensíveis",
  pluto: "seu poder profundo e sua capacidade de regeneração",
  chiron: "uma ferida que pode amadurecer em sabedoria",
  mean_lilith: "sua sombra indomada e sua autonomia",
  true_node: "seu caminho de desenvolvimento",
};

const aspectVoices: Readonly<Record<string, { movement: string; counsel: string }>> = {
  conjunction: {
    movement: "concentra as duas forças e torna o tema impossível de ignorar",
    counsel: "Intensidade pede consciência para não virar identificação total.",
  },
  sextile: {
    movement: "abre uma oportunidade fértil, ativada quando você participa conscientemente",
    counsel: "Facilidade cresce quando é convertida em gesto concreto.",
  },
  square: {
    movement: "cria pressão entre necessidades diferentes e exige uma nova forma de agir",
    counsel: "O atrito não é castigo: ele revela o ajuste que já não pode ser adiado.",
  },
  trine: {
    movement: "faz a energia circular com naturalidade e oferece apoio reconhecível",
    counsel: "Valorize o que flui para que o talento não permaneça adormecido.",
  },
  opposition: {
    movement: "coloca duas forças frente a frente e pede integração dos extremos",
    counsel: "Evite projetar um polo nos outros; recupere os dois lados dentro das suas escolhas.",
  },
};

function builtInInterpretation(
  transit: TransitSnapshot["aspects"][number],
): z.infer<typeof transitInterpretationSchema> {
  const voice = transitVoices[transit.transitingBody] ?? transitVoices.sun!;
  const aspect = aspectVoices[transit.type] ?? aspectVoices.conjunction!;
  const natalField = natalFields[transit.natalBody] ?? `o campo natal de ${transit.natalBody}`;
  const phase = transit.applying
    ? "Como o aspecto ainda se aproxima do pico, acontecimentos e percepções tendem a ganhar nitidez."
    : "Como o aspecto já se afasta do pico, o momento favorece compreender consequências e consolidar aprendizados.";
  return transitInterpretationSchema.parse({
    transit,
    content: {
      title: voice.title,
      opening: `Este trânsito movimenta ${voice.force} e alcança diretamente ${natalField}. ${aspect.movement}.`,
      deepening: `${phase} Observe onde esse tema já aparece na rotina, nas relações e nas decisões práticas. ${aspect.counsel} Você não precisa responder a toda pressão imediatamente, mas precisa reconhecer o que o período está tornando visível.`,
      technicalWhy: transitTechnicalSummary(transit),
      reflectionPrompt: `Em que situação ${natalField} pede uma resposta mais consciente agora?`,
      practice: voice.practice,
      version: "built-in-transits-2.0.2",
      generationMethod: "HUMAN",
      author: {
        displayName: "AstroAxé Editorial",
        attributionLine: "Matriz pré-escrita e versionada",
      },
      reviewer: {
        displayName: "Engine editorial AstroAxé",
        attributionLine: "Composição determinística por corpo, aspecto e fase",
      },
    },
  });
}
