import { NextRequest } from "next/server";
import { z } from "zod";

import {
  ADULT_ATTESTATION_TEXT,
  ADULT_ATTESTATION_VERSION,
  adultAttestationInputSchema,
  evaluateAdultAccess,
} from "@/domain/ceremonial/adult-access";
import { parseServerEnv } from "@/lib/env";
import { getPrisma } from "@/lib/prisma";
import { isSameOrigin, resolveAccount } from "@/lib/security/account";
import { apiJson } from "@/lib/security/headers";
import { checkJsonRequest } from "@/lib/security/json-body";

/**
 * Declaração de maioridade do titular da conta.
 *
 * Colhida aqui, e não no cadastro, por minimização: pedir data de nascimento a
 * quem só quer calcular um mapa coletaria dado que o produto não precisa. Quem
 * nunca abrir o planejador nunca é perguntado.
 *
 * O GET devolve o texto vigente e a versão para que a interface mostre
 * exatamente o que será registrado — e não uma paráfrase.
 */
export async function GET(request: NextRequest): Promise<Response> {
  const env = parseServerEnv();
  const account = await resolveAccount(request, env.AUTH_SESSION_SECRET);
  if (account === null) return apiJson({ error: "Entre para continuar." }, { status: 401 });

  const user = await getPrisma().user.findUnique({
    where: { id: account.id },
    select: { birthDate: true, adultAttestedAt: true, adultAttestationVersion: true },
  });

  return apiJson({
    attestationVersion: ADULT_ATTESTATION_VERSION,
    attestationText: ADULT_ATTESTATION_TEXT,
    access: evaluateAdultAccess({
      birthDate: user?.birthDate?.toISOString().slice(0, 10) ?? null,
      attestedAt: user?.adultAttestedAt?.toISOString() ?? null,
      attestationVersion: user?.adultAttestationVersion ?? null,
      on: new Date().toISOString().slice(0, 10),
    }),
  });
}

export async function POST(request: NextRequest): Promise<Response> {
  const body = checkJsonRequest(request);
  if (!body.ok)
    return apiJson(
      { error: body.status === 415 ? "Envie a declaração como JSON." : "Declaração inválida." },
      { status: body.status },
    );

  const env = parseServerEnv();
  if (!isSameOrigin(request, env.SITE_URL))
    return apiJson({ error: "Origem inválida." }, { status: 403 });
  const account = await resolveAccount(request, env.AUTH_SESSION_SECRET);
  if (account === null) return apiJson({ error: "Entre para continuar." }, { status: 401 });

  let declaracao;
  try {
    declaracao = adultAttestationInputSchema.parse(await request.json());
  } catch (error) {
    if (error instanceof z.ZodError)
      return apiJson({ error: "Declaração inválida." }, { status: 400 });
    return apiJson({ error: "Não foi possível ler a declaração." }, { status: 400 });
  }

  const hoje = new Date().toISOString().slice(0, 10);
  const decisao = evaluateAdultAccess({
    birthDate: declaracao.birthDate,
    attestedAt: new Date().toISOString(),
    attestationVersion: declaracao.attestationVersion,
    on: hoje,
  });

  // Menor de idade pela própria data declarada não tem a declaração gravada. Não
  // é punição: guardar data de nascimento de quem não vai usar o recurso seria
  // reter dado sem finalidade.
  if (decisao.status !== "cleared")
    return apiJson(
      { error: "Este recurso é restrito a maiores de 18 anos.", access: decisao },
      { status: 403 },
    );

  await getPrisma().user.update({
    where: { id: account.id },
    data: {
      birthDate: new Date(`${declaracao.birthDate}T00:00:00.000Z`),
      adultAttestedAt: new Date(),
      adultAttestationVersion: declaracao.attestationVersion,
    },
  });

  return apiJson({ access: decisao });
}
