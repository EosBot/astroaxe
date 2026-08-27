import "server-only";

import type { CorpusImportPlan, ImportProposal } from "@/domain/ceremonial/import";
import type { Prisma, PrismaClient } from "@/generated/prisma/client";

/**
 * Persisting an import plan.
 *
 * Re-running must be idempotent: the importer runs again after every extraction, and a
 * second pass over an unchanged corpus must not fork editions.
 *
 * Identity is keyed on the artifact's content hash throughout, so byte-identical files
 * under different names converge on one lineage instead of forking it.
 */

export interface CorpusImportResult {
  readonly sourceSystems: number;
  readonly works: number;
  readonly editions: number;
  readonly artifacts: number;
  readonly locators: number;
}

/**
 * Ten minutes. Long for a transaction, and deliberately so: the alternative is committing
 * a half-written lineage, where artifacts point at editions that do not describe them.
 */
const IMPORT_TRANSACTION_TIMEOUT_MS = 600_000;

/** Written for a source system the operator has not named yet; never a real tradition. */
const UNASSIGNED_TRADITION = "não atribuída";

interface LineageResult {
  readonly editionId: string;
  readonly artifactId: string;
  readonly createdWork: boolean;
  readonly createdEdition: boolean;
}

async function upsertLineage(
  tx: Prisma.TransactionClient,
  proposal: ImportProposal,
): Promise<LineageResult> {
  const sourceSystem = await tx.ceremonialSourceSystem.upsert({
    where: { slug: proposal.sourceSystemSlug },
    update: {},
    create: {
      slug: proposal.sourceSystemSlug,
      displayName: proposal.sourceSystemSlug,
      tradition: UNASSIGNED_TRADITION,
    },
    select: { id: true },
  });

  const existingWork = await tx.ceremonialWork.findUnique({
    where: { sourceSystemId_title: { sourceSystemId: sourceSystem.id, title: proposal.workTitle } },
    select: { id: true },
  });
  const work =
    existingWork ??
    (await tx.ceremonialWork.create({
      data: {
        sourceSystemId: sourceSystem.id,
        title: proposal.workTitle,
        authorLabel: proposal.authorLabel,
      },
      select: { id: true },
    }));

  const existingEdition = await tx.ceremonialEdition.findUnique({
    where: {
      workId_label_language: {
        workId: work.id,
        label: proposal.editionLabel,
        language: proposal.language,
      },
    },
    select: { id: true },
  });
  const edition =
    existingEdition ??
    (await tx.ceremonialEdition.create({
      data: {
        workId: work.id,
        label: proposal.editionLabel,
        language: proposal.language,
        publishedAt: proposal.publishedYear,
      },
      select: { id: true },
    }));

  const artifact = await tx.ceremonialArtifact.upsert({
    where: { contentHash: proposal.contentHash },
    // The path may change between runs — a file is renamed, a duplicate wins the sort —
    // but the bytes are the identity, so the row follows them.
    update: { relativePath: proposal.relativePath, pageCount: proposal.pageCount },
    create: {
      editionId: edition.id,
      relativePath: proposal.relativePath,
      contentHash: proposal.contentHash,
      byteSize: BigInt(proposal.byteSize),
      mimeType: proposal.mimeType,
      extractionState: "EXTRACTED",
      pageCount: proposal.pageCount,
    },
    select: { id: true },
  });

  return {
    editionId: edition.id,
    artifactId: artifact.id,
    createdWork: existingWork === null,
    createdEdition: existingEdition === null,
  };
}

/**
 * Applies the plan in one transaction. A partially written lineage would leave artifacts
 * pointing at editions that do not describe them, which is worse than not importing.
 */
export async function applyCorpusImport(
  prisma: PrismaClient,
  plan: CorpusImportPlan,
): Promise<CorpusImportResult> {
  return prisma.$transaction(
    async (tx) => {
      const sourceSystems = new Set<string>();
      let works = 0;
      let editions = 0;
      let locators = 0;

      for (const proposal of plan.proposals) {
        sourceSystems.add(proposal.sourceSystemSlug);
        const lineage = await upsertLineage(tx, proposal);
        if (lineage.createdWork) works += 1;
        if (lineage.createdEdition) editions += 1;

        // One statement per edition rather than two round trips per position. A scanned
        // book contributes hundreds of page locators, and the archive contributed 21.005 in
        // total — inserting those one at a time exhausted the transaction before finishing.
        // `skipDuplicates` leans on the unique constraint for idempotency instead of a
        // preceding lookup, which is both faster and race-free.
        const created = await tx.ceremonialLocator.createMany({
          data: proposal.locators.map((locator) => ({
            editionId: lineage.editionId,
            artifactId: lineage.artifactId,
            kind: locator.kind,
            reference: locator.reference,
          })),
          skipDuplicates: true,
        });
        locators += created.count;
      }

      return {
        sourceSystems: sourceSystems.size,
        works,
        editions,
        artifacts: plan.proposals.length,
        locators,
      };
    },
    {
      // A first import over an uncatalogued archive still costs a few round trips per
      // artifact even with the batched writes above, and the default five seconds is a
      // limit meant for request handlers, not for a one-shot catalogue build.
      timeout: IMPORT_TRANSACTION_TIMEOUT_MS,
      maxWait: 30_000,
    },
  );
}
