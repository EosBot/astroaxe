import type { EditorialTransitionResult } from "@/lib/editorial/workflow";
import { apiJson } from "@/lib/security/headers";

export function editorialTransitionResponse(result: EditorialTransitionResult): Response {
  if (result.status === "updated") return apiJson(result);
  if (result.status === "forbidden")
    return apiJson({ error: "Você não pode executar esta transição." }, { status: 403 });
  if (result.status === "not_found")
    return apiJson({ error: "Verbete não encontrado." }, { status: 404 });
  if (result.status === "missing_claims")
    return apiJson({ error: "O verbete precisa de claims rastreáveis." }, { status: 409 });
  if (result.status === "ineligible_sources")
    return apiJson(
      { error: "Toda claim ativa precisa de fonte habilitada e localização verificável." },
      { status: 409 },
    );
  return apiJson({ error: "O verbete não está no estado esperado." }, { status: 409 });
}
