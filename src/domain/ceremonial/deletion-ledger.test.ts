import { describe, expect, it } from "vitest";

import {
  buildDeletionTombstone,
  expiredTombstoneIds,
  TOMBSTONE_RETENTION_DAYS,
  verifyRestoreAgainstLedger,
} from "./deletion-ledger";

const PLANO = "22222222-2222-4222-8222-222222222222";
const SESSAO = "33333333-3333-4333-8333-333333333333";
const DONO = "11111111-1111-4111-8111-111111111111";

function tombstone(recordId: string, deletedAt = "2026-09-02T00:00:00.000Z") {
  return buildDeletionTombstone({
    id: "44444444-4444-4444-8444-444444444444",
    recordKind: "ceremonial_plan",
    recordId,
    userId: DONO,
    deletedAt: new Date(deletedAt),
  });
}

describe("registro de exclusão", () => {
  it("guarda que algo foi apagado, e nunca o que era", () => {
    const marca = tombstone(PLANO);

    // Um tombstone com conteúdo guardaria o dado que a pessoa pediu para
    // remover, num lugar que a exclusão não alcança.
    expect(Object.keys(marca).sort()).toEqual([
      "deletedAt",
      "expiresAt",
      "id",
      "recordId",
      "recordKind",
      "userId",
    ]);
  });

  it("deriva a janela em vez de aceitá-la de quem chama", () => {
    const marca = tombstone(PLANO);
    const dias =
      (Date.parse(marca.expiresAt) - Date.parse(marca.deletedAt)) / (24 * 60 * 60 * 1000);

    // Deixar a janela a cargo do chamador permitiria gravar tombstone que expira
    // antes do backup correspondente.
    expect(dias).toBe(TOMBSTONE_RETENTION_DAYS);
    expect(TOMBSTONE_RETENTION_DAYS).toBeGreaterThan(30);
  });

  it("acusa registro que voltou numa restauração", () => {
    const resultado = verifyRestoreAgainstLedger({
      tombstones: [tombstone(PLANO), tombstone(SESSAO)],
      restoredRecordIds: [PLANO],
      on: "2026-09-10T00:00:00.000Z",
    });

    expect(resultado.status).toBe("resurrected");
    expect(resultado.resurrected).toEqual([{ recordKind: "ceremonial_plan", recordId: PLANO }]);
  });

  it("aprova restauração que não traz nada apagado de volta", () => {
    expect(
      verifyRestoreAgainstLedger({
        tombstones: [tombstone(PLANO)],
        restoredRecordIds: ["55555555-5555-4555-8555-555555555555"],
        on: "2026-09-10T00:00:00.000Z",
      }).status,
    ).toBe("clean");
  });

  it("não acusa por tombstone vencido, porque o backup dele já não existe", () => {
    const antigo = tombstone(PLANO, "2026-01-01T00:00:00.000Z");

    const resultado = verifyRestoreAgainstLedger({
      tombstones: [antigo],
      restoredRecordIds: [PLANO],
      on: "2026-09-10T00:00:00.000Z",
    });

    expect(resultado.status).toBe("clean");
    expect(resultado.expired).toBe(1);
  });

  it("lista para purga só o que passou da janela", () => {
    const vencido = tombstone(PLANO, "2026-01-01T00:00:00.000Z");
    const vigente = tombstone(SESSAO);

    expect(
      expiredTombstoneIds({ tombstones: [vencido, vigente], on: "2026-09-10T00:00:00.000Z" }),
    ).toEqual([vencido.id]);
  });
});
