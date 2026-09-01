import pino, { type DestinationStream, type Logger, type LoggerOptions } from "pino";

const redactedPaths = [
  "password",
  "token",
  "authorization",
  "cookie",
  "email",
  "birthdate",
  "birthDate",
  "*.password",
  "*.token",
  "*.authorization",
  "*.cookie",
  "*.email",
  "*.birthdate",
  "*.birthDate",
  "req.headers.authorization",
  "req.headers.cookie",
  // Ceremonial laboratory: archive locations, keyring material and extracted source text
  // are as sensitive as credentials and must never reach a log line.
  "archiveRoot",
  "keyringFile",
  "sourceText",
  "*.archiveRoot",
  "*.keyringFile",
  "*.sourceText",
  // Registros privados de prática: intenção, notas, observações e desfechos são
  // tão sensíveis quanto o diário, e podem revelar informação religiosa.
  "intention",
  "notes",
  "observation",
  "outcome",
  "*.intention",
  "*.notes",
  "*.observation",
  "*.outcome",
];

function loggerOptions(): LoggerOptions {
  return {
    level: process.env.LOG_LEVEL ?? "info",
    redact: { paths: redactedPaths, censor: "[REDACTED]" },
    base: { service: "astroaxe" },
  };
}

export function createLogger(destination?: DestinationStream): Logger {
  const options = loggerOptions();
  return destination ? pino(options, destination) : pino(options);
}

export const logger = createLogger();
