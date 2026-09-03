import { NextRequest } from "next/server";

import { tradicoes } from "@/domain/tradicoes/catalogo";
import { todosOsTrabalhos } from "@/domain/tradicoes/trabalhos";
import { authorizeFeature } from "@/lib/access/guard";
import { apiJson } from "@/lib/security/headers";

/**
 * Trabalhos, com a tradição de cada um resolvida pelo nome.
 *
 * O cliente não precisa cruzar dois catálogos para saber que a defumação vem
 * das ervas: a rota já entrega o nome da tradição junto. Nada aqui vem do
 * acervo em texto cru — é obra derivada, e é o que pode ser publicado.
 */
export async function GET(request: NextRequest): Promise<Response> {
  const grant = await authorizeFeature(request, "ceremonial-correspondences", {
    requireSameOrigin: false,
  });
  if (grant instanceof Response) return grant;

  const nomes = new Map(tradicoes.map((tradicao) => [tradicao.id, tradicao.name]));

  return apiJson({
    trabalhos: todosOsTrabalhos.map((trabalho) => ({
      ...trabalho,
      tradicaoNome: nomes.get(trabalho.tradicaoId) ?? "",
    })),
  });
}
