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
});
