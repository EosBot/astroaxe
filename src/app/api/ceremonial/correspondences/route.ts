import { NextRequest } from "next/server";

import { regencyFunctionGraph } from "@/domain/orixas/regency/function-graph-data";
import { buildFunctionIndex } from "@/domain/orixas/regency/function-index";
import { buildPublicFunctionGraph } from "@/domain/orixas/regency/public-function-graph";
import { authorizeFeature } from "@/lib/access/guard";
import { apiJson } from "@/lib/security/headers";

/**
 * Índice de correspondências.
 *
 * Ferramenta paga: a porta é `authorizeFeature`, e esta rota não tem regra de
 * acesso própria.
 *
 * O índice é derivado da projeção pública, e não do grafo cru — a projeção já
 * removeu obra, edição, locator e escola. Calcular na borda, e não a cada
 * pedido, seria otimização prematura: são nove funções.
 */
export async function GET(request: NextRequest): Promise<Response> {
  const grant = await authorizeFeature(request, "ceremonial-correspondences", {
    requireSameOrigin: false,
  });
  if (grant instanceof Response) return grant;

  return apiJson(buildFunctionIndex(buildPublicFunctionGraph(regencyFunctionGraph)));
}
