import "server-only";

import { z } from "zod";

/**
 * The ceremonial laboratory runs in exactly one immutable process mode, decided once at
 * startup from the environment and never from a request, header, cookie or role:
 *
 * - `disabled` (default): no ceremonial surface exists at all.
 * - `public`: serves only a reviewed, rights-eligible publication bundle. Configuring any
 *   local archive/keyring value here is a startup error, not a silently ignored setting.
 * - `local`: serves the complete private corpus, and therefore requires an archive root,
 *   a keyring file and a loopback bind — it must never be reachable off-host.
 */
export const CEREMONIAL_MODES = ["disabled", "public", "local"] as const;
export type CeremonialMode = (typeof CEREMONIAL_MODES)[number];

const LOOPBACK_HOSTS = ["127.0.0.1", "::1", "localhost"] as const;

const absolutePathSchema = z
  .string()
  .min(1)
  .refine((value) => value.startsWith("/"), { message: "deve ser um caminho absoluto" })
  .refine((value) => !value.includes("\0"), { message: "caminho inválido" })
  .refine((value) => !value.split("/").includes(".."), {
    message: "caminho não pode conter segmentos '..'",
  });

const loopbackBindSchema = z
  .string()
  .min(1)
  .refine((value) => (LOOPBACK_HOSTS as readonly string[]).includes(value), {
    message: "o modo local só pode escutar em loopback (127.0.0.1, ::1 ou localhost)",
  });

/** Present-but-forbidden reads better than a bare "expected undefined" from Zod. */
function forbiddenIn(mode: "disabled" | "public") {
  return z.undefined({
    message: `não pode ser configurado no modo ${mode}; é exclusivo do modo local`,
  });
}

function ceremonialEnvSchema() {
  return z.discriminatedUnion("CEREMONIAL_MODE", [
    z.object({
      CEREMONIAL_MODE: z.literal("disabled"),
      CEREMONIAL_ARCHIVE_ROOT: forbiddenIn("disabled"),
      CEREMONIAL_KEYRING_FILE: forbiddenIn("disabled"),
      CEREMONIAL_BIND: forbiddenIn("disabled"),
    }),
    z.object({
      CEREMONIAL_MODE: z.literal("public"),
      CEREMONIAL_ARCHIVE_ROOT: forbiddenIn("public"),
      CEREMONIAL_KEYRING_FILE: forbiddenIn("public"),
      CEREMONIAL_BIND: forbiddenIn("public"),
    }),
    z.object({
      CEREMONIAL_MODE: z.literal("local"),
      CEREMONIAL_ARCHIVE_ROOT: absolutePathSchema,
      CEREMONIAL_KEYRING_FILE: absolutePathSchema,
      CEREMONIAL_BIND: loopbackBindSchema.default("127.0.0.1"),
    }),
  ]);
}

/** Filesystem material that exists only while the process runs in `local` mode. */
export interface CeremonialLocalRuntime {
  readonly archiveRoot: string;
  readonly keyringFile: string;
  readonly bind: string;
}

/**
 * The single object every server route/component consults. Callers branch on these
 * capabilities, never on `process.env.CEREMONIAL_MODE` directly, so there is exactly one
 * place where mode becomes behavior.
 */
export interface CeremonialPolicy {
  readonly mode: CeremonialMode;
  /** The reviewed hybrid-by-rights library may be served and may enter the sitemap. */
  readonly servesPublicLibrary: boolean;
  /** Authenticated local reader/planner surfaces may exist at all. */
  readonly servesLocalArchive: boolean;
  /** Raw private-corpus material. `null` in every mode except `local`. */
  readonly local: CeremonialLocalRuntime | null;
}

/** Only string lookups are needed, so this stays decoupled from Next's ProcessEnv shape. */
type EnvironmentSource = Readonly<Record<string, string | undefined>>;

function emptyAsUndefined(value: string | undefined): string | undefined {
  return value === undefined || value.trim() === "" ? undefined : value;
}

/**
 * Pure, fail-closed parse. An absent `CEREMONIAL_MODE` means `disabled`, but an
 * unrecognized or internally inconsistent configuration throws before any database,
 * Redis, filesystem or network access is attempted.
 */
export function parseCeremonialPolicy(
  source: EnvironmentSource = process.env,
): Readonly<CeremonialPolicy> {
  const parsed = ceremonialEnvSchema().parse({
    CEREMONIAL_MODE: emptyAsUndefined(source.CEREMONIAL_MODE) ?? "disabled",
    CEREMONIAL_ARCHIVE_ROOT: emptyAsUndefined(source.CEREMONIAL_ARCHIVE_ROOT),
    CEREMONIAL_KEYRING_FILE: emptyAsUndefined(source.CEREMONIAL_KEYRING_FILE),
    CEREMONIAL_BIND: emptyAsUndefined(source.CEREMONIAL_BIND),
  });

  if (parsed.CEREMONIAL_MODE === "local")
    return Object.freeze({
      mode: "local" as const,
      servesPublicLibrary: false,
      servesLocalArchive: true,
      local: Object.freeze({
        archiveRoot: parsed.CEREMONIAL_ARCHIVE_ROOT,
        keyringFile: parsed.CEREMONIAL_KEYRING_FILE,
        bind: parsed.CEREMONIAL_BIND,
      }),
    });

  return Object.freeze({
    mode: parsed.CEREMONIAL_MODE,
    servesPublicLibrary: parsed.CEREMONIAL_MODE === "public",
    servesLocalArchive: false,
    local: null,
  });
}

let cachedPolicy: Readonly<CeremonialPolicy> | undefined;

/**
 * Process-wide immutable policy. Resolved once on first use; a later mutation of
 * `process.env` cannot change the mode this process is already running in.
 */
export function getCeremonialPolicy(): Readonly<CeremonialPolicy> {
  cachedPolicy ??= parseCeremonialPolicy();
  return cachedPolicy;
}

/** Test-only reset so a suite can exercise more than one mode in one process. */
export function resetCeremonialPolicyCache(): void {
  cachedPolicy = undefined;
}
