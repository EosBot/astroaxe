import { Readable } from "node:stream";

import { NextRequest } from "next/server";
import { z } from "zod";

import { evaluateCeremonialAccess } from "@/domain/ceremonial/access-policy";
import { openVerifiedArtifact, parseByteRange } from "@/lib/ceremonial/artifact-storage";
import { getCeremonialPolicy } from "@/lib/ceremonial/mode";
import { parseServerEnv } from "@/lib/env";
import { getPrisma } from "@/lib/prisma";
import { resolveAccount } from "@/lib/security/account";
import { API_SECURITY_HEADERS, apiJson } from "@/lib/security/headers";

const paramsSchema = z.object({ artifactId: z.uuid() });

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ artifactId: string }> },
): Promise<Response> {
  const runtimePolicy = getCeremonialPolicy();
  if (!runtimePolicy.servesLocalArchive || runtimePolicy.local === null)
    return apiJson({ error: "Recurso não encontrado." }, { status: 404 });

  const account = await resolveAccount(request, parseServerEnv().AUTH_SESSION_SECRET);
  if (account === null)
    return apiJson({ error: "Entre para abrir este arquivo." }, { status: 401 });

  const parsedParams = paramsSchema.safeParse(await context.params);
  if (!parsedParams.success) return apiJson({ error: "Recurso não encontrado." }, { status: 404 });

  const prisma = getPrisma();
  const artifact = await prisma.ceremonialArtifact.findUnique({
    where: { id: parsedParams.data.artifactId },
    select: {
      id: true,
      relativePath: true,
      mimeType: true,
      rights: true,
      access: true,
      sensitivity: true,
    },
  });
  if (artifact === null) return apiJson({ error: "Recurso não encontrado." }, { status: 404 });

  const reviews = await prisma.ceremonialReview.findMany({
    where: { subjectType: "ARTIFACT", subjectId: artifact.id },
    select: {
      reviewKind: true,
      decision: true,
      facetScope: true,
      decidedAt: true,
      expiresAt: true,
      revokedAt: true,
    },
  });
  const capabilities = evaluateCeremonialAccess({
    mode: runtimePolicy.mode,
    authenticated: true,
    rights: artifact.rights,
    access: artifact.access,
    sensitivity: artifact.sensitivity,
    reviews: reviews.map((review) => ({
      ...review,
      facetScope: review.facetScope,
    })),
    safety: { derivedGuidanceAllowed: true },
    now: new Date(),
  });
  if (capabilities.mediaDownload.decision === "deny")
    return apiJson({ error: "Recurso não encontrado." }, { status: 404 });

  let opened;
  try {
    opened = await openVerifiedArtifact(
      runtimePolicy.local.archiveRoot,
      artifact.relativePath,
      artifact.mimeType,
    );
  } catch {
    return apiJson({ error: "Recurso indisponível." }, { status: 404 });
  }

  let range;
  try {
    range = parseByteRange(request.headers.get("range"), opened.size);
  } catch {
    await opened.handle.close();
    return new Response(null, {
      status: 416,
      headers: {
        ...API_SECURITY_HEADERS,
        "Accept-Ranges": "bytes",
        "Content-Range": `bytes */${opened.size}`,
      },
    });
  }

  const nodeStream = opened.handle.createReadStream({
    start: range.start,
    end: range.end,
    autoClose: true,
  });
  return new Response(Readable.toWeb(nodeStream) as ReadableStream, {
    status: range.partial ? 206 : 200,
    headers: {
      ...API_SECURITY_HEADERS,
      "Accept-Ranges": "bytes",
      "Content-Disposition": `attachment; filename="artifact-${artifact.id}"`,
      "Content-Length": String(range.length),
      "Content-Type": opened.mimeType,
      ...(range.partial
        ? { "Content-Range": `bytes ${range.start}-${range.end}/${opened.size}` }
        : {}),
    },
  });
}
