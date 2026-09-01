import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

import { z } from "zod";

export const RECORD_ENVELOPE_SCHEMA_VERSION = 1;

const KEY_BYTES = 32;
const IV_BYTES = 12;
const TAG_BYTES = 16;

/**
 * Chave do keyring.
 *
 * `active` é a chave com que se escreve; as aposentadas continuam no keyring
 * apenas para **ler** o que ainda não foi rotacionado. Remover uma aposentada
 * antes de rotacionar tudo o que a referencia torna aquele dado ilegível para
 * sempre — não existe recuperação, e por isso a remoção é bloqueada.
 */
const keyEntrySchema = z
  .object({
    version: z.number().int().positive(),
    /** 32 bytes em base64. Qualquer outro tamanho é recusado, não truncado. */
    material: z.string().min(1),
    state: z.enum(["active", "retired"]),
  })
  .strict()
  .superRefine((entry, context) => {
    if (Buffer.from(entry.material, "base64").byteLength !== KEY_BYTES)
      context.addIssue({
        code: "custom",
        path: ["material"],
        message: `a chave precisa ter ${KEY_BYTES} bytes.`,
      });
  });

export const recordKeyringSchema = z
  .object({ keys: z.array(keyEntrySchema).min(1).max(32) })
  .strict()
  .superRefine(({ keys }, context) => {
    const ativas = keys.filter(({ state }) => state === "active");
    if (ativas.length !== 1)
      context.addIssue({
        code: "custom",
        path: ["keys"],
        message: "o keyring precisa de exatamente uma chave ativa.",
      });
    if (new Set(keys.map(({ version }) => version)).size !== keys.length)
      context.addIssue({
        code: "custom",
        path: ["keys"],
        message: "versões de chave não podem repetir.",
      });
  });

export type RecordKeyring = z.infer<typeof recordKeyringSchema>;

export const recordEnvelopeSchema = z
  .object({
    schemaVersion: z.literal(RECORD_ENVELOPE_SCHEMA_VERSION),
    keyVersion: z.number().int().positive(),
    iv: z.string().min(1),
    tag: z.string().min(1),
    ciphertext: z.string(),
  })
  .strict();

export type RecordEnvelope = z.infer<typeof recordEnvelopeSchema>;

/**
 * O que amarra o envelope ao lugar dele.
 *
 * Sem AAD, um envelope válido continuaria válido se alguém o movesse para outro
 * usuário, outro registro ou outro campo. Com AAD, mover é adulterar: a tag não
 * fecha e a leitura falha de forma tipada.
 */
export interface RecordBinding {
  userId: string;
  recordId: string;
  fieldName: string;
}

export type RecordCryptoFailure =
  "key_version_unknown" | "authentication_failed" | "envelope_malformed";

export class RecordCryptoError extends Error {
  constructor(readonly failure: RecordCryptoFailure) {
    super(`record_crypto_${failure}`);
    this.name = "RecordCryptoError";
  }
}

function additionalData(binding: RecordBinding, keyVersion: number): Buffer {
  return Buffer.from(
    JSON.stringify({
      schemaVersion: RECORD_ENVELOPE_SCHEMA_VERSION,
      keyVersion,
      userId: binding.userId,
      recordId: binding.recordId,
      fieldName: binding.fieldName,
    }),
    "utf8",
  );
}

function keyFor(keyring: RecordKeyring, version: number): Buffer {
  const entry = keyring.keys.find((key) => key.version === version);
  if (entry === undefined) throw new RecordCryptoError("key_version_unknown");
  return Buffer.from(entry.material, "base64");
}

function activeKey(keyring: RecordKeyring): { version: number; material: Buffer } {
  const entry = keyring.keys.find(({ state }) => state === "active");
  // O schema já garante exatamente uma ativa; isto é a rede sob o trapézio.
  if (entry === undefined) throw new RecordCryptoError("key_version_unknown");
  return { version: entry.version, material: Buffer.from(entry.material, "base64") };
}

/**
 * Cifra um campo com a chave ativa.
 *
 * O IV é aleatório a cada chamada, e é isso que impede que dois textos iguais
 * produzam o mesmo envelope — repetir IV com a mesma chave em GCM quebra a
 * confidencialidade e a autenticidade de uma vez só.
 */
export function sealRecordField(input: {
  keyring: RecordKeyring;
  binding: RecordBinding;
  plaintext: string;
}): RecordEnvelope {
  const keyring = recordKeyringSchema.parse(input.keyring);
  const { version, material } = activeKey(keyring);
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv("aes-256-gcm", material, iv, { authTagLength: TAG_BYTES });
  cipher.setAAD(additionalData(input.binding, version));

  const ciphertext = Buffer.concat([
    cipher.update(Buffer.from(input.plaintext, "utf8")),
    cipher.final(),
  ]);

  return {
    schemaVersion: RECORD_ENVELOPE_SCHEMA_VERSION,
    keyVersion: version,
    iv: iv.toString("base64"),
    tag: cipher.getAuthTag().toString("base64"),
    ciphertext: ciphertext.toString("base64"),
  };
}

/**
 * Abre um envelope, exigindo que ele pertença a este lugar.
 *
 * Falha tipada e sem detalhe: distinguir "tag errada" de "chave errada" na
 * mensagem entregaria ao atacante o que ele quer saber. Quem chama recebe a
 * categoria; quem opera olha o log.
 */
export function openRecordField(input: {
  keyring: RecordKeyring;
  binding: RecordBinding;
  envelope: unknown;
}): string {
  const keyring = recordKeyringSchema.parse(input.keyring);
  const parsed = recordEnvelopeSchema.safeParse(input.envelope);
  if (!parsed.success) throw new RecordCryptoError("envelope_malformed");
  const envelope = parsed.data;

  const iv = Buffer.from(envelope.iv, "base64");
  const tag = Buffer.from(envelope.tag, "base64");
  if (iv.byteLength !== IV_BYTES || tag.byteLength !== TAG_BYTES)
    throw new RecordCryptoError("envelope_malformed");

  const decipher = createDecipheriv("aes-256-gcm", keyFor(keyring, envelope.keyVersion), iv, {
    authTagLength: TAG_BYTES,
  });
  decipher.setAAD(additionalData(input.binding, envelope.keyVersion));
  decipher.setAuthTag(tag);

  try {
    return Buffer.concat([
      decipher.update(Buffer.from(envelope.ciphertext, "base64")),
      decipher.final(),
    ]).toString("utf8");
  } catch {
    throw new RecordCryptoError("authentication_failed");
  }
}

/**
 * Reescreve um envelope com a chave ativa.
 *
 * Idempotente por versão: um envelope já na chave ativa volta inalterado, de modo
 * que uma rotação interrompida possa ser retomada sem reprocessar o que já passou.
 */
export function rotateRecordField(input: {
  keyring: RecordKeyring;
  binding: RecordBinding;
  envelope: unknown;
}): { envelope: RecordEnvelope; rotated: boolean } {
  const keyring = recordKeyringSchema.parse(input.keyring);
  const parsed = recordEnvelopeSchema.safeParse(input.envelope);
  if (!parsed.success) throw new RecordCryptoError("envelope_malformed");
  if (parsed.data.keyVersion === activeKey(keyring).version)
    return { envelope: parsed.data, rotated: false };

  const plaintext = openRecordField({ ...input, keyring });
  return {
    envelope: sealRecordField({ keyring, binding: input.binding, plaintext }),
    rotated: true,
  };
}

/**
 * Diz se uma chave aposentada ainda é referenciada.
 *
 * Existe para que a remoção seja decisão informada: apagar uma chave que ainda
 * abre envelopes torna aquele dado ilegível para sempre.
 */
export function retiredKeyIsReferenced(input: {
  keyVersion: number;
  envelopes: readonly unknown[];
}): boolean {
  return input.envelopes.some((envelope) => {
    const parsed = recordEnvelopeSchema.safeParse(envelope);
    return parsed.success && parsed.data.keyVersion === input.keyVersion;
  });
}
