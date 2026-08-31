import { z } from "zod";

/**
 * Registros de entidade ligados à fonte.
 *
 * Uma entidade só existe aqui **dentro de um sistema de origem**. Nome, ofício,
 * grau e correspondência pertencem a uma obra e a uma edição, nunca ao ar. É o
 * que impede que "Michael" do Heptameron e "Michael" de uma escola moderna
 * virem o mesmo registro só porque partilham o nome.
 *
 * Relação com o grafo de funções: `src/domain/orixas/regency/function-graph.ts`
 * afirma **posição análoga** entre entidades de tradições diferentes. Este
 * módulo guarda o que cada tradição diz sobre a sua própria entidade. Um é a
 * ponte, o outro é a margem — e a ponte nunca funde as margens.
 */
export const CEREMONIAL_ENTITY_SCHEMA_VERSION = "ceremonial-entity-records-0.1.0-research";

/**
 * Agrupamento amplo. Sistemas diferentes podem cair no mesmo agrupamento sem
 * que isso os torne compatíveis — o discriminante que importa é o sistema.
 */
export const workspaceKindSchema = z.enum([
  "ANGELICAL",
  "GOETIA",
  "THEURGIA_GOETIA",
  "OLYMPIC_SPIRITS",
  "PLANETARY_INTELLIGENCES",
  "AFRO_DIASPORIC",
]);

export const entityNameSchema = z
  .object({
    value: z.string().trim().min(1).max(160),
    /** Grafia como a fonte registra. Normalizar é para busca, não para o registro. */
    script: z.enum(["latin", "hebrew", "greek", "yoruba", "other"]).default("latin"),
    isPrimary: z.boolean(),
  })
  .strict();

export const entityCorrespondenceSchema = z
  .object({
    /** Aquilo a que a entidade é ligada: planeta, dia, elemento, número. */
    targetKind: z.enum(["planet", "weekday", "element", "number", "zodiac_sign", "hour"]),
    targetId: z.string().trim().min(1).max(80),
    relation: z.enum(["governs", "attributed_to", "assists", "opposes"]),
    /**
     * Posição citável dentro da obra. Correspondência sem locator não entra: é
     * ela que permite reestudar o ponto quando a leitura se mostra errada.
     */
    locator: z.string().trim().min(1).max(240),
  })
  .strict();

export const ceremonialEntityRecordSchema = z
  .object({
    id: z.string().regex(/^entity-record:[a-z0-9-]+:[a-z0-9-]+$/),
    /** `source-system:<slug>`. É o discriminante que nunca pode faltar. */
    sourceSystemId: z.string().regex(/^source-system:[a-z0-9-]+$/),
    workspaceKind: workspaceKindSchema,
    workId: z.string().regex(/^work:[a-z0-9-:]+$/),
    editionId: z.string().regex(/^edition:[a-z0-9-:]+$/),
    names: z.array(entityNameSchema).min(1).max(12),
    rankOrOffice: z.string().trim().max(240).optional(),
    correspondences: z.array(entityCorrespondenceSchema).max(24),
    /** Referência a um selo desenhado por nós, quando houver. Nunca um recorte de scan. */
    sealRef: z
      .string()
      .regex(/^seal:[a-z0-9-]+$/)
      .optional(),
    reviewStatus: z.enum(["candidate", "verified"]),
  })
  .strict()
  .superRefine((record, context) => {
    if (record.names.filter(({ isPrimary }) => isPrimary).length !== 1)
      context.addIssue({
        code: "custom",
        path: ["names"],
        message: "O registro precisa de exatamente um nome primário.",
      });
    // O id carrega o sistema para que nenhuma consulta possa perdê-lo pelo caminho.
    const sistemaDoId = record.id.split(":")[1];
    const sistema = record.sourceSystemId.split(":")[1];
    if (sistemaDoId !== sistema)
      context.addIssue({
        code: "custom",
        path: ["id"],
        message: "O identificador precisa começar pelo sistema de origem do registro.",
      });
  });

export type CeremonialEntityRecord = z.infer<typeof ceremonialEntityRecordSchema>;
export type EntityCorrespondence = z.infer<typeof entityCorrespondenceSchema>;

/**
 * Relação explícita entre registros de sistemas diferentes.
 *
 * É o único caminho pelo qual dois sistemas se tocam, e o tipo obriga a dizer
 * **que tipo de relação** é. Não existe fusão por alias: dois registros com o
 * mesmo nome continuam dois registros até que alguém declare a relação e cite a
 * fonte que a sustenta.
 */
export const crossSystemRelationSchema = z
  .object({
    id: z.string().regex(/^relation:[a-z0-9-]+$/),
    leftRecordId: z.string().regex(/^entity-record:[a-z0-9-]+:[a-z0-9-]+$/),
    rightRecordId: z.string().regex(/^entity-record:[a-z0-9-]+:[a-z0-9-]+$/),
    /**
     * `shares_name` e `analogous_position` são observações. `same_entity` não
     * existe como opção: nenhuma fonte a sustenta e afirmá-la derrubaria o
     * método junto.
     */
    relation: z.enum(["shares_name", "analogous_position", "derived_from", "contradicts"]),
    locator: z.string().trim().min(1).max(240),
  })
  .strict()
  .superRefine((relation, context) => {
    if (relation.leftRecordId === relation.rightRecordId)
      context.addIssue({
        code: "custom",
        path: ["rightRecordId"],
        message: "Um registro não se relaciona consigo mesmo.",
      });
    const sistema = (id: string) => id.split(":")[1];
    if (
      relation.relation !== "contradicts" &&
      sistema(relation.leftRecordId) === sistema(relation.rightRecordId)
    )
      context.addIssue({
        code: "custom",
        path: ["relation"],
        message:
          "Relação entre sistemas exige sistemas distintos; dentro de um mesmo sistema use o registro da obra.",
      });
  });

export type CrossSystemRelation = z.infer<typeof crossSystemRelationSchema>;

/**
 * Agrupa registros por nome primário, **sem os fundir**.
 *
 * Serve para enxergar homônimos entre sistemas — o caso que mais convida ao
 * erro. Devolve os registros lado a lado com seus sistemas, para que a decisão
 * de relacioná-los seja humana e citada.
 */
export function findNameCollisions(
  records: readonly CeremonialEntityRecord[],
): { name: string; records: { id: string; sourceSystemId: string }[] }[] {
  const porNome = new Map<string, { id: string; sourceSystemId: string }[]>();
  for (const record of records) {
    const primario = record.names.find(({ isPrimary }) => isPrimary);
    if (primario === undefined) continue;
    const chave = primario.value.trim().toLowerCase();
    const lista = porNome.get(chave) ?? [];
    lista.push({ id: record.id, sourceSystemId: record.sourceSystemId });
    porNome.set(chave, lista);
  }
  return [...porNome.entries()]
    .filter(([, lista]) => new Set(lista.map((r) => r.sourceSystemId)).size > 1)
    .map(([name, records]) => ({ name, records: records.sort((a, b) => a.id.localeCompare(b.id)) }))
    .sort((a, b) => a.name.localeCompare(b.name));
}
