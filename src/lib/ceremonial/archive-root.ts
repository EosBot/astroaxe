import "server-only";

/**
 * Where the private archive lives on this machine.
 *
 * This replaces the `disabled|public|local` runtime mode that used to guard it. That mode
 * existed to keep a rights-filtered public surface separate from a complete private one —
 * a split the project no longer has. There is one runtime, and the archive is simply an
 * input to authoring: the tools that read it need a path, nothing more.
 *
 * The path itself stays out of the database, out of manifests and out of logs. Only
 * relative paths and content hashes travel anywhere.
 */
export class MissingArchiveRootError extends Error {
  constructor() {
    super(
      "CEREMONIAL_ARCHIVE_ROOT não está configurado ou não é um caminho absoluto.\n" +
        "Aponte-o para o acervo local; ele nunca é versionado nem enviado a lugar algum.",
    );
    this.name = "MissingArchiveRootError";
  }
}

export function resolveArchiveRoot(
  source: Readonly<Record<string, string | undefined>> = process.env,
): string {
  const root = source.CEREMONIAL_ARCHIVE_ROOT?.trim();
  if (root === undefined || root === "") throw new MissingArchiveRootError();
  // Absolute only: a relative root would resolve differently depending on where the
  // command was invoked from, and these tools walk whatever they are pointed at.
  if (!root.startsWith("/") || root.includes("\0") || root.split("/").includes(".."))
    throw new MissingArchiveRootError();
  return root;
}
