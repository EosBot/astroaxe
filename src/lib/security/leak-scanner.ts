export const PUBLIC_LEAK_SCANNER_VERSION = "public-leak-scanner-1.0.0";

/**
 * Marcadores que nunca podem aparecer no que o público recebe.
 *
 * A fronteira que isto protege é a do `BLUEPRINT` §5.0: o site publica a **obra**
 * e nunca o **insumo**. Cada marcador é a assinatura de algo que pertence à camada
 * de baixo — o caminho do acervo, o locator que aponta para o corpus, o
 * identificador interno de escola, obra ou atribuição.
 *
 * A lista é de marcadores estruturais e não de palavras do assunto: procurar por
 * "Exu" ou "Heptameron" acusaria a própria obra, que legitimamente os nomeia.
 *
 * Os identificadores do grafo entram como **forma completa** e não como prefixo
 * solto. A primeira versão procurava `family:` e acusava `font-family:` do CSS em
 * todo build — e um gate que sempre falha é um gate em que ninguém confia. O que
 * se procura é `family:` seguido do slug e precedido de fronteira, que é o formato
 * que só o identificador interno tem.
 */
export const PUBLIC_LEAK_MARKERS: readonly (string | RegExp)[] = [
  /** Prefixo dos locators que apontam para o corpus. */
  "Corpus local",
  /** Raiz do acervo no host. */
  "/mnt/e/Ocultismo",
  /** Prefixo dos arquivos extraídos do acervo. */
  "_texto_",
  /** Identificadores internos do grafo de funções, na forma que só eles têm. */
  /(?<![\w-])school:[a-z0-9-]+/,
  /(?<![\w-])family:[a-z0-9-]+/,
  /(?<![\w-])assignment:[a-z0-9-]+/,
  /(?<![\w-])source-system:[a-z0-9-]+/,
  /** Campos internos que nunca são projetados. */
  "extractionConfidence",
  "claimSchoolId",
  "sourceFamilyId",
  /**
   * Nomes de obra e de autor do acervo de pesquisa.
   *
   * Diferente dos demais marcadores, estes não são identificadores internos: são
   * o próprio acervo. Publicá-los entregaria a curadoria que dá vantagem ao
   * método e exporia obra de terceiro que apenas serviu de insumo.
   *
   * Entraram depois de um vazamento real: o registro público de correções citava
   * duas escolas pelo nome, e só apareceu quando uma jornada varreu o texto
   * renderizado. Nome de entidade — Michael, Hagiel, Omolu — continua publicável;
   * o que não sai é de qual obra ele veio.
   */
  /(?<![\w-])Trithemius(?![\w-])/,
  /(?<![\w-])Agrippa(?![\w-])/,
  /(?<![\w-])Arbatel(?![\w-])/,
  /(?<![\w-])Heptameron(?![\w-])/,
  /(?<![\w-])Lemegeton(?![\w-])/,
  /(?<![\w-])Saraceni(?![\w-])/,
];

export interface LeakFinding {
  marker: string;
  source: string;
  /** Trecho ao redor, para localizar o problema sem abrir o artefato inteiro. */
  excerpt: string;
}

/**
 * Varre artefatos públicos atrás dos marcadores.
 *
 * Recebe o conteúdo já lido, e não caminhos: assim a decisão é pura e testável, e
 * a leitura de disco fica na fronteira. O trecho devolvido é curto de propósito —
 * o achado precisa localizar o problema, não reproduzir o vazamento no log.
 */
export function scanForPublicLeaks(
  artifacts: readonly { source: string; content: string }[],
  markers: readonly (string | RegExp)[] = PUBLIC_LEAK_MARKERS,
): LeakFinding[] {
  const findings: LeakFinding[] = [];

  for (const artifact of artifacts)
    for (const marker of markers) {
      const hit = locate(artifact.content, marker);
      if (hit === null) continue;
      findings.push({
        marker: typeof marker === "string" ? marker : marker.source,
        source: artifact.source,
        excerpt: artifact.content.slice(Math.max(0, hit.at - 40), hit.at + hit.length + 40),
      });
    }

  return findings.sort(
    (left, right) =>
      left.source.localeCompare(right.source) || left.marker.localeCompare(right.marker),
  );
}

function locate(content: string, marker: string | RegExp): { at: number; length: number } | null {
  if (typeof marker === "string") {
    const at = content.indexOf(marker);
    return at < 0 ? null : { at, length: marker.length };
  }
  const match = marker.exec(content);
  return match === null ? null : { at: match.index, length: match[0].length };
}
