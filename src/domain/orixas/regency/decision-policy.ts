import { z } from "zod";

const decisionSourceSchema = z
  .object({
    id: z.string().regex(/^source:[a-z0-9-:]+$/),
    title: z.string().trim().min(1).max(300),
    url: z.url(),
    locator: z.string().trim().min(1).max(200),
    evidenceKind: z.enum(["institutional-inventory", "ethnography", "scholarly-analysis"]),
  })
  .strict();

/**
 * Protocolo público de decisão. Ele registra quando o software deve se abster;
 * não representa nem serializa fundamentos iniciáticos ou conteúdo reservado.
 */
export const regencyDecisionPolicySchema = z
  .object({
    id: z.string().regex(/^policy:[a-z0-9-:]+$/),
    version: z.string().trim().min(1).max(80),
    status: z.literal("research"),
    scope: z
      .object({
        traditionId: z.string().trim().min(1).max(120),
        subtraditionId: z.string().trim().min(1).max(120).optional(),
        houseOrLineageId: z.string().trim().min(1).max(120).optional(),
        divinationMethod: z.string().trim().min(1).max(120),
      })
      .strict(),
    tieHandling: z.literal("require_tradition_confirmation"),
    ancestralRole: z.literal("optional"),
    requiresPractitionerReview: z.literal(true),
    restrictedDetailsOmitted: z.literal(true),
    publicSources: z.array(decisionSourceSchema).min(1).max(20),
  })
  .strict()
  .superRefine((policy, context) => {
    const ids = new Set<string>();
    policy.publicSources.forEach((source, index) => {
      if (ids.has(source.id))
        context.addIssue({
          code: "custom",
          path: ["publicSources", index, "id"],
          message: "A fonte pública deve aparecer uma única vez.",
        });
      ids.add(source.id);
    });
  });

export type RegencyDecisionPolicy = z.infer<typeof regencyDecisionPolicySchema>;

export const astroAxePublicDecisionPolicy: RegencyDecisionPolicy =
  regencyDecisionPolicySchema.parse({
    id: "policy:astroaxe:public-confirmation",
    version: "regency-decision-policy-0.1.0-research",
    status: "research",
    scope: {
      traditionId: "afro-brazilian-plural",
      divinationMethod: "astrological-symbolic-research",
    },
    tieHandling: "require_tradition_confirmation",
    ancestralRole: "optional",
    requiresPractitionerReview: true,
    restrictedDetailsOmitted: true,
    publicSources: [
      {
        id: "source:iphan:terreiros-df",
        title: "Inventário dos terreiros do Distrito Federal e Entorno",
        url: "https://portal.iphan.gov.br/uploads/publicacao/inventario_dos_terreiros_do_df_e_entorno.pdf",
        locator: "Ofícios especializados e consulta por jogo de búzios",
        evidenceKind: "institutional-inventory",
      },
      {
        id: "source:scielo:enredo-candomble-bahia",
        title: "Relações e narrativas: o enredo no candomblé da Bahia",
        url: "https://www.scielo.br/j/rs/a/BQZmgvKQLQNp9Z6vYCxbHcD/?lang=pt",
        locator: "Composição da cabeça e consulta pelo jogo de búzios",
        evidenceKind: "ethnography",
      },
      {
        id: "source:usp:segredos-orunmila",
        title: "Os segredos de Orunmilá.com",
        url: "https://teses.usp.br/teses/disponiveis/27/27153/tde-24022021-154629/pt-br.html",
        locator: "A divinação como processo técnico, dialógico e contextual",
        evidenceKind: "scholarly-analysis",
      },
    ],
  });
