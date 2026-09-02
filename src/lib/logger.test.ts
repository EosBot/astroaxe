import { afterEach, describe, expect, it, vi } from "vitest";

import { createLogger } from "./logger";

function capturingDestination(): {
  destination: { write(chunk: string): void };
  records: Array<Record<string, unknown>>;
} {
  const records: Array<Record<string, unknown>> = [];
  return {
    destination: {
      write(chunk: string): void {
        records.push(JSON.parse(chunk) as Record<string, unknown>);
      },
    },
    records,
  };
}

describe("createLogger", () => {
  const initialLogLevel = process.env.LOG_LEVEL;

  afterEach(() => {
    vi.unstubAllEnvs();
    if (initialLogLevel === undefined) delete process.env.LOG_LEVEL;
    else process.env.LOG_LEVEL = initialLogLevel;
  });

  it("uses a safe default level and service name", () => {
    vi.stubEnv("LOG_LEVEL", "");
    delete process.env.LOG_LEVEL;
    const { destination, records } = capturingDestination();
    const subject = createLogger(destination);

    subject.info("healthy");

    expect(subject.level).toBe("info");
    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({ service: "astroaxe", msg: "healthy" });
  });

  it("honors the configured log level", () => {
    vi.stubEnv("LOG_LEVEL", "debug");
    const { destination } = capturingDestination();

    expect(createLogger(destination).level).toBe("debug");
  });

  it("redacts credentials and personal data before writing JSON", () => {
    const { destination, records } = capturingDestination();
    const subject = createLogger(destination);

    subject.info({
      password: "raw-password",
      token: "raw-token",
      profile: { email: "person@example.com", birthDate: "2000-01-01" },
      req: { headers: { authorization: "Bearer secret", cookie: "session=secret" } },
      operation: "readiness",
    });

    expect(records[0]).toMatchObject({
      password: "[REDACTED]",
      token: "[REDACTED]",
      profile: { email: "[REDACTED]", birthDate: "[REDACTED]" },
      req: { headers: { authorization: "[REDACTED]", cookie: "[REDACTED]" } },
      operation: "readiness",
    });
    expect(JSON.stringify(records[0])).not.toContain("raw-password");
    expect(JSON.stringify(records[0])).not.toContain("person@example.com");
  });

  it("redacts ceremonial archive locations, keyring material and source text", () => {
    const { destination, records } = capturingDestination();
    const subject = createLogger(destination);

    subject.info({
      archiveRoot: "/srv/synthetic-archive",
      keyringFile: "/run/secrets/synthetic-keyring.json",
      sourceText: "trecho sintético do acervo privado",
      ingest: {
        archiveRoot: "/srv/synthetic-archive",
        keyringFile: "/run/secrets/synthetic-keyring.json",
        sourceText: "trecho sintético do acervo privado",
      },
      operation: "ceremonial-ingest",
    });

    expect(records[0]).toMatchObject({
      archiveRoot: "[REDACTED]",
      keyringFile: "[REDACTED]",
      sourceText: "[REDACTED]",
      ingest: {
        archiveRoot: "[REDACTED]",
        keyringFile: "[REDACTED]",
        sourceText: "[REDACTED]",
      },
      operation: "ceremonial-ingest",
    });
    const serialized = JSON.stringify(records[0]);
    expect(serialized).not.toContain("/srv/synthetic-archive");
    expect(serialized).not.toContain("synthetic-keyring.json");
    expect(serialized).not.toContain("acervo privado");
  });

  it("redige intenção, notas, observação e desfecho dos registros de prática", () => {
    const { destination, records } = capturingDestination();
    const subject = createLogger(destination);

    subject.info({
      intention: "intenção sintética de prática",
      notes: "notas sintéticas da sessão",
      observation: "observação sintética",
      outcome: "desfecho sintético",
      plan: {
        intention: "intenção sintética de prática",
        notes: "notas sintéticas da sessão",
      },
      operation: "ceremonial-plan",
    });

    // São tão sensíveis quanto o diário e podem revelar convicção religiosa.
    // Uma linha de log com qualquer um deles anula a cifragem do banco.
    expect(records[0]).toMatchObject({
      intention: "[REDACTED]",
      notes: "[REDACTED]",
      observation: "[REDACTED]",
      outcome: "[REDACTED]",
      plan: { intention: "[REDACTED]", notes: "[REDACTED]" },
      operation: "ceremonial-plan",
    });
    expect(JSON.stringify(records[0])).not.toContain("sintética");
  });
});
