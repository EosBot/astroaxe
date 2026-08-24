import { readFileSync, statSync } from "node:fs";

const MAX_SECRET_BYTES = 64 * 1024;

type EnvironmentSource = Readonly<Record<string, string | undefined>>;

function readSecretFile(variableName: string, path: string): string {
  let size: number;
  try {
    const stat = statSync(path);
    if (!stat.isFile()) throw new Error("not_regular_file");
    size = stat.size;
  } catch {
    throw new Error(`Não foi possível ler o arquivo configurado por ${variableName}_FILE.`);
  }

  if (size === 0 || size > MAX_SECRET_BYTES) {
    throw new Error(`O arquivo configurado por ${variableName}_FILE possui tamanho inválido.`);
  }

  let value: string;
  try {
    value = readFileSync(path, "utf8");
  } catch {
    throw new Error(`Não foi possível ler o arquivo configurado por ${variableName}_FILE.`);
  }

  const normalized = value.replace(/\r?\n$/, "");
  if (normalized.length === 0 || normalized.includes("\0")) {
    throw new Error(`O arquivo configurado por ${variableName}_FILE possui conteúdo inválido.`);
  }
  return normalized;
}

export function resolveSecretValue(
  source: EnvironmentSource,
  variableName: string,
): string | undefined {
  const directValue = source[variableName];
  const filePath = source[`${variableName}_FILE`];

  if (directValue !== undefined && filePath !== undefined) {
    throw new Error(`Configure somente ${variableName} ou ${variableName}_FILE.`);
  }
  if (filePath === undefined) return directValue;
  if (filePath.length === 0) {
    throw new Error(`${variableName}_FILE não pode ser vazio.`);
  }
  return readSecretFile(variableName, filePath);
}

export function materializeSecretFiles(
  source: EnvironmentSource,
  variableNames: readonly string[],
): Record<string, string | undefined> {
  const resolved = { ...source };
  for (const variableName of variableNames) {
    resolved[variableName] = resolveSecretValue(source, variableName);
    delete resolved[`${variableName}_FILE`];
  }
  return resolved;
}
