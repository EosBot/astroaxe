import { NextRequest } from "next/server";

import { buildPublicCorrespondenceTable } from "@/domain/orixas/regency/public-correspondence-table";
import { authorizeFeature } from "@/lib/access/guard";
import { apiJson } from "@/lib/security/headers";

/**
 * Tábua operacional.
 *
 * Reaproveita o recurso `ceremonial-correspondences`: para quem usa, tábua e
 * diretório são a mesma ferramenta vista de dois ângulos, e cobrar por elas
 * separadamente seria fatiar o produto sem que nada mude do lado de fora.
 */
export async function GET(request: NextRequest): Promise<Response> {
  const grant = await authorizeFeature(request, "ceremonial-correspondences", {
    requireSameOrigin: false,
  });
  if (grant instanceof Response) return grant;

  return apiJson(buildPublicCorrespondenceTable());
}
