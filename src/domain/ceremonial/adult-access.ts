import { z } from "zod";

export const ADULT_ATTESTATION_VERSION = "adult-attestation-1.0.0";

export const ADULT_MINIMUM_AGE = 18;

/**
 * O texto exato que a pessoa vê ao declarar.
 *
 * Vive em código e é versionado porque o que importa é **o que foi mostrado**, e
 * não o que passou a estar escrito depois. O registro guarda a versão; mudar o
 * texto exige versão nova, e declarações antigas continuam apontando para o texto
 * que de fato apareceu.
 */
export const ADULT_ATTESTATION_TEXT =
  "Declaro que a data de nascimento acima é minha e que sou maior de 18 anos. " +
  "Esta é uma declaração sua: o AstroAxe não verifica documentos e não tem como " +
  "conferir se ela é verdadeira.";

export const adultAttestationInputSchema = z
  .object({
    /** Data de nascimento do titular da conta, não do sujeito de um mapa. */
    birthDate: z.iso.date(),
    /** Confirma que a versão exibida é a que este código descreve. */
    attestationVersion: z.literal(ADULT_ATTESTATION_VERSION),
    accepted: z.literal(true),
  })
  .strict();

export type AdultAttestationInput = z.infer<typeof adultAttestationInputSchema>;

export type AdultAccessStatus =
  | "cleared"
  /** Nunca declarou. */
  | "missing_declaration"
  /** Declarou e é menor de 18 pela própria data. */
  | "under_age"
  /** Declarou sob um texto que não é mais o vigente. */
  | "stale_attestation";

export interface AdultAccessDecision {
  status: AdultAccessStatus;
  /**
   * O que se pode afirmar, e o teto disso.
   *
   * Nunca diz "idade verificada": é declaração da pessoa, e chamar isso de
   * verificação seria emprestar ao registro uma autoridade que ele não tem.
   */
  basis: "self_declaration";
}

/**
 * Decide se a conta pode usar o planejador cifrado.
 *
 * Atestação, e não verificação. Não existe caminho gratuito para verificar idade
 * — documento, estimativa facial e gov.br por convênio custam por consulta —, e o
 * produto escolheu a declaração registrada em vez de nada. O que ela faz é criar
 * registro e deslocar responsabilidade; o que ela não faz é provar.
 *
 * Declaração sob texto antigo **não vale**: se o texto mudou, a pessoa concordou
 * com outra coisa, e tratar como equivalente apagaria a diferença que a versão
 * existe para preservar.
 */
export function evaluateAdultAccess(input: {
  birthDate: string | null;
  attestedAt: string | null;
  attestationVersion: string | null;
  on: string;
}): AdultAccessDecision {
  if (input.birthDate === null || input.attestedAt === null || input.attestationVersion === null)
    return { status: "missing_declaration", basis: "self_declaration" };

  if (input.attestationVersion !== ADULT_ATTESTATION_VERSION)
    return { status: "stale_attestation", basis: "self_declaration" };

  return {
    status: ageOn(input.birthDate, input.on) >= ADULT_MINIMUM_AGE ? "cleared" : "under_age",
    basis: "self_declaration",
  };
}

/**
 * Idade em anos completos.
 *
 * Comparação por componentes de data, e não por diferença de milissegundos:
 * dividir por 365,25 erra em aniversários próximos e em anos bissextos, e aqui um
 * erro de um dia decide se alguém entra ou não.
 */
export function ageOn(birthDate: string, on: string): number {
  const [nascimentoAno, nascimentoMes, nascimentoDia] = birthDate.split("-").map(Number);
  const [hojeAno, hojeMes, hojeDia] = on.split("-").map(Number);
  if (
    nascimentoAno === undefined ||
    nascimentoMes === undefined ||
    nascimentoDia === undefined ||
    hojeAno === undefined ||
    hojeMes === undefined ||
    hojeDia === undefined
  )
    return -1;

  const aindaNaoFezAniversario =
    hojeMes < nascimentoMes || (hojeMes === nascimentoMes && hojeDia < nascimentoDia);
  return hojeAno - nascimentoAno - (aindaNaoFezAniversario ? 1 : 0);
}
