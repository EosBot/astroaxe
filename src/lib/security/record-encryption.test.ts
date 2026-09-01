import { randomBytes } from "node:crypto";

import { describe, expect, it } from "vitest";

import {
  envelopeCiphertextEquals,
  openRecordField,
  RecordCryptoError,
  recordKeyringSchema,
  retiredKeyIsReferenced,
  rotateRecordField,
  sealRecordField,
  type RecordBinding,
  type RecordKeyring,
} from "./record-encryption";

const BINDING: RecordBinding = {
  userId: "11111111-1111-4111-8111-111111111111",
  recordId: "22222222-2222-4222-8222-222222222222",
  fieldName: "intentionEnvelope",
};

function key(version: number, state: "active" | "retired" = "active") {
  return { version, material: randomBytes(32).toString("base64"), state };
}

const KEYRING: RecordKeyring = { keys: [key(1)] };

describe("cifragem de registros privados de prática", () => {
  it("fecha e abre o campo, e nunca repete o envelope para o mesmo texto", () => {
    const primeiro = sealRecordField({ keyring: KEYRING, binding: BINDING, plaintext: "intenção" });
    const segundo = sealRecordField({ keyring: KEYRING, binding: BINDING, plaintext: "intenção" });

    expect(openRecordField({ keyring: KEYRING, binding: BINDING, envelope: primeiro })).toBe(
      "intenção",
    );
    // IV aleatório por chamada: repetir IV com a mesma chave em GCM quebra
    // confidencialidade e autenticidade de uma vez só.
    expect(primeiro.iv).not.toBe(segundo.iv);
    expect(envelopeCiphertextEquals(primeiro, segundo)).toBe(false);
  });

  it("não deixa o texto em claro aparecer no envelope", () => {
    const envelope = sealRecordField({
      keyring: KEYRING,
      binding: BINDING,
      plaintext: "meu segredo de prática",
    });

    expect(JSON.stringify(envelope)).not.toContain("segredo");
  });

  it("recusa envelope movido para outro usuário, registro ou campo", () => {
    const envelope = sealRecordField({ keyring: KEYRING, binding: BINDING, plaintext: "intenção" });

    // Sem AAD, mover o envelope seria indetectável. Com AAD, mover é adulterar.
    for (const movido of [
      { ...BINDING, userId: "33333333-3333-4333-8333-333333333333" },
      { ...BINDING, recordId: "44444444-4444-4444-8444-444444444444" },
      { ...BINDING, fieldName: "titleEnvelope" },
    ])
      expect(() => openRecordField({ keyring: KEYRING, binding: movido, envelope })).toThrow(
        RecordCryptoError,
      );
  });

  it("recusa tag adulterada sem corromper nada", () => {
    const envelope = sealRecordField({ keyring: KEYRING, binding: BINDING, plaintext: "intenção" });
    const adulterado = { ...envelope, tag: randomBytes(16).toString("base64") };

    try {
      openRecordField({ keyring: KEYRING, binding: BINDING, envelope: adulterado });
      expect.unreachable("deveria ter recusado");
    } catch (error) {
      expect(error).toBeInstanceOf(RecordCryptoError);
      expect((error as RecordCryptoError).failure).toBe("authentication_failed");
    }
  });

  it("recusa chave desconhecida como categoria, sem detalhar", () => {
    const envelope = sealRecordField({ keyring: KEYRING, binding: BINDING, plaintext: "intenção" });
    const outroKeyring: RecordKeyring = { keys: [key(9)] };

    try {
      openRecordField({ keyring: outroKeyring, binding: BINDING, envelope });
      expect.unreachable("deveria ter recusado");
    } catch (error) {
      expect((error as RecordCryptoError).failure).toBe("key_version_unknown");
    }
  });

  it("exige exatamente uma chave ativa e 32 bytes por chave", () => {
    expect(() => recordKeyringSchema.parse({ keys: [key(1), key(2)] })).toThrow();
    expect(() => recordKeyringSchema.parse({ keys: [key(1, "retired")] })).toThrow();
    expect(() =>
      recordKeyringSchema.parse({
        keys: [{ version: 1, material: randomBytes(16).toString("base64"), state: "active" }],
      }),
    ).toThrow();
  });

  it("rotaciona para a chave ativa e é idempotente por versão", () => {
    const antigo = sealRecordField({ keyring: KEYRING, binding: BINDING, plaintext: "intenção" });
    const rotacionado: RecordKeyring = {
      keys: [{ ...KEYRING.keys[0]!, state: "retired" }, key(2)],
    };

    const primeira = rotateRecordField({
      keyring: rotacionado,
      binding: BINDING,
      envelope: antigo,
    });
    expect(primeira.rotated).toBe(true);
    expect(primeira.envelope.keyVersion).toBe(2);
    expect(
      openRecordField({ keyring: rotacionado, binding: BINDING, envelope: primeira.envelope }),
    ).toBe("intenção");

    // Retomar uma rotação interrompida não pode reprocessar o que já passou.
    const segunda = rotateRecordField({
      keyring: rotacionado,
      binding: BINDING,
      envelope: primeira.envelope,
    });
    expect(segunda.rotated).toBe(false);
    expect(segunda.envelope).toEqual(primeira.envelope);
  });

  it("acusa chave aposentada ainda referenciada antes de alguém a remover", () => {
    const antigo = sealRecordField({ keyring: KEYRING, binding: BINDING, plaintext: "intenção" });

    // Apagar uma chave que ainda abre envelopes torna aquele dado ilegível para
    // sempre, e não existe recuperação.
    expect(retiredKeyIsReferenced({ keyVersion: 1, envelopes: [antigo] })).toBe(true);
    expect(retiredKeyIsReferenced({ keyVersion: 2, envelopes: [antigo] })).toBe(false);
  });

  it("trata envelope malformado como categoria própria", () => {
    for (const invalido of [null, {}, { schemaVersion: 1 }, "texto"])
      expect(() =>
        openRecordField({ keyring: KEYRING, binding: BINDING, envelope: invalido }),
      ).toThrow(RecordCryptoError);
  });
});
