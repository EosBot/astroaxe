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
