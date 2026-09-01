import { readdir, readFile, stat } from "node:fs/promises";
import { join, relative, resolve } from "node:path";

import { scanForPublicLeaks } from "../src/lib/security/leak-scanner";

/**
 * Gate de não-vazamento do insumo nos artefatos de build (task 37).
 *
 * Uso: `npm run release:leak-gate` depois de `npm run build`.
 *
 * Varre **o que o público de fato recebe**: os bundles servidos ao navegador, as
 * páginas pré-renderizadas e os arquivos estáticos. O bundle de servidor fica de
 * fora de propósito — ele importa o grafo bruto para projetá-lo em tempo de build
 * e nunca é entregue a ninguém. Incluí-lo faria o gate acusar todo build, e num
 * gate que sempre falha ninguém confia.
 */
const ROOTS = [
  { path: ".next/static", extensions: [".js", ".css", ".json"] },
  { path: ".next/server/app", extensions: [".html", ".rsc", ".json"] },
  { path: "public", extensions: [".js", ".css", ".json", ".txt", ".xml", ".svg"] },
];

const MAX_BYTES = 8 * 1024 * 1024;

async function collect(root: string, extensions: readonly string[]): Promise<string[]> {
  let entries;
  try {
    entries = await readdir(root, { withFileTypes: true });
  } catch {
    // Raiz ausente não é falha: nem todo build produz todas elas.
    return [];
  }

  const files: string[] = [];
  for (const entry of entries) {
    const full = join(root, entry.name);
    if (entry.isDirectory()) files.push(...(await collect(full, extensions)));
    else if (extensions.some((extension) => entry.name.endsWith(extension))) files.push(full);
  }
  return files;
}

async function main(): Promise<void> {
  const artifacts: { source: string; content: string }[] = [];

  for (const root of ROOTS)
    for (const file of await collect(resolve(root.path), root.extensions)) {
      const info = await stat(file);
      if (info.size > MAX_BYTES) continue;
      artifacts.push({
        source: relative(process.cwd(), file),
        content: await readFile(file, "utf8"),
      });
    }

  if (artifacts.length === 0) {
    process.stderr.write("Nenhum artefato de build encontrado. Rode `npm run build` antes.\n");
    process.exitCode = 2;
    return;
  }

  const findings = scanForPublicLeaks(artifacts);
  if (findings.length > 0) {
    process.stderr.write(
      `O insumo vazou para ${findings.length} ponto(s) do que é servido ao público:\n`,
    );
    for (const finding of findings)
      process.stderr.write(`  ${finding.source}: ${finding.marker} — …${finding.excerpt}…\n`);
    process.exitCode = 1;
    return;
  }

  process.stdout.write(
    `Gate de vazamento aprovado: ${artifacts.length} artefato(s) públicos sem marcador de acervo.\n`,
  );
}

await main();
