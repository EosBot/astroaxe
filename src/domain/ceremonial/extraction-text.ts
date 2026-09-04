/**
 * Deterministic text transforms for the container formats the archive holds.
 *
 * These are pure on purpose: the container-side adapters only move bytes, and every
 * decision about what counts as text happens here, where it can be tested without
 * poppler, tesseract or libarchive installed. Both transforms are lossy by design — they
 * recover the reading text and discard presentation — so their output is a search and
 * quotation surface, never a faithful reproduction of the original document.
 */

/** XML entities that appear in OOXML and OpenDocument text runs. */
const XML_ENTITIES: ReadonlyMap<string, string> = new Map([
  ["amp", "&"],
  ["lt", "<"],
  ["gt", ">"],
  ["quot", '"'],
  ["apos", "'"],
]);

function decodeXmlEntities(value: string): string {
  return value.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (match, entity: string) => {
    if (entity.startsWith("#x") || entity.startsWith("#X")) {
      const code = Number.parseInt(entity.slice(2), 16);
      return Number.isSafeInteger(code) && code > 0 && code <= 0x10ffff
        ? String.fromCodePoint(code)
        : match;
    }
    if (entity.startsWith("#")) {
      const code = Number.parseInt(entity.slice(1), 10);
      return Number.isSafeInteger(code) && code > 0 && code <= 0x10ffff
        ? String.fromCodePoint(code)
        : match;
    }
    return XML_ENTITIES.get(entity) ?? match;
  });
}

/**
 * Optional namespace prefix: Word writes `w:p`, OpenDocument writes `text:p`.
 *
 * O comprimento é limitado de propósito. Sem teto, um documento com uma
 * sequência longa de caracteres válidos e sem os dois-pontos faz o motor
 * retroceder sobre cada prefixo, e com a flag global isso vira quadrático —
 * arquivo malformado pararia a extração. Prefixo de namespace real tem poucos
 * caracteres.
 */
const NS = String.raw`(?:[a-zA-Z][\w.-]{0,64}:)?`;

const DROPPED_PARTS = new RegExp(
  String.raw`<${NS}(?:binary-data|annotation)\b[\s\S]*?</${NS}(?:binary-data|annotation)>`,
  "g",
);
const TAB_ELEMENT = new RegExp(String.raw`<${NS}tab\b[^>]*/?>`, "g");
const BREAK_ELEMENT = new RegExp(String.raw`<${NS}(?:br|line-break)\b[^>]*/?>`, "g");
const PARAGRAPH_END = new RegExp(`</${NS}(?:p|h|title)>`, "g");

/**
 * Turns an OOXML `word/document.xml` or OpenDocument `content.xml` part into text.
 *
 * Paragraph and line-break elements become newlines before tags are dropped, otherwise
 * every paragraph in the document would collapse into a single unreadable line.
 */
export function xmlPartToText(xml: string): string {
  return decodeXmlEntities(
    xml
      // Parts that carry no reading text but do carry markup that would survive as text.
      .replace(/<\?xml[\s\S]*?\?>/g, "")
      .replace(/<!--[\s\S]*?-->/g, "")
      .replace(DROPPED_PARTS, "")
      .replace(TAB_ELEMENT, "\t")
      .replace(BREAK_ELEMENT, "\n")
      .replace(PARAGRAPH_END, "\n")
      // O quantificador é limitado de propósito. Sem teto, um arquivo com muitos
      // `<` e nenhum `>` faz o motor varrer até o fim a partir de cada posição,
      // e com a flag global isso vira quadrático. Nenhuma tag real tem quatro mil
      // caracteres.
      .replace(/<[^>]{0,4096}>/g, ""),
  );
}

/**
 * Destinations whose contents are metadata rather than body text. Skipped as whole brace
 * groups, otherwise font tables and embedded pictures show up as hex noise in the output.
 */
const SKIPPED_RTF_DESTINATIONS =
  /^(?:fonttbl|colortbl|stylesheet|listtable|listoverridetable|rsidtbl|generator|info|pict|object|themedata|colorschememapping|latentstyles|datastore|xmlnstbl|filetbl|revtbl)$/;

/**
 * Recovers the plain text of an RTF document.
 *
 * RTF interleaves text with control words, control symbols and brace groups, so this
 * walks the stream once, tracking brace depth to know when a skipped destination ends.
 */
/**
 * O que uma palavra de controle produz como texto.
 *
 * Fora do laço porque ali o que importa é a máquina de estados — profundidade,
 * destino ignorado, avanço do índice — e aqui o que importa é a tabela de
 * significados. Palavra desconhecida não produz nada, que é o comportamento
 * certo: inventar caractere para controle não reconhecido sujaria o texto.
 */
function textForControlWord(word: string | undefined, parameter: string | undefined): string {
  if (word === "par" || word === "line" || word === "sect") return "\n";
  if (word === "tab") return "\t";
  if (word === "u" && parameter !== undefined) {
    // \uN emite um ponto de código; valor negativo é a codificação de 16 bits
    // com sinal, e volta somando 0x10000.
    const code = Number(parameter);
    if (Number.isSafeInteger(code)) return String.fromCodePoint(code < 0 ? code + 0x10000 : code);
  }
  return "";
}

/**
 * O que vem depois de uma barra invertida, e quanto ela consome.
 *
 * Sai do laço principal porque ali o que importa é a máquina de estados —
 * profundidade de chaves e destinos ignorados — enquanto aqui o que importa é a
 * gramática do RTF: palavra de controle, byte hexadecimal ou literal escapado.
 *
 * A função não decide sozinha o que ignorar: devolve se abriu um destino a ser
 * pulado, e quem mantém a pilha é o laço.
 */
function readBackslash(
  rtf: string,
  index: number,
  skipping: boolean,
): { consumed: number; text: string; startsSkippedDestination: boolean } {
  const resto = rtf.slice(index);

  const control = /^\\([a-zA-Z]+)(-?\d+)? ?/.exec(resto);
  if (control !== null) {
    const [matched, word, parameter] = control;
    if (skipping) return { consumed: matched.length, text: "", startsSkippedDestination: false };
    if (word !== undefined && SKIPPED_RTF_DESTINATIONS.test(word))
      return { consumed: matched.length, text: "", startsSkippedDestination: true };
    return {
      consumed: matched.length,
      text: textForControlWord(word, parameter),
      startsSkippedDestination: false,
    };
  }

  // Símbolo de controle: `\'` introduz um byte hexadecimal, e o resto é literal
  // escapado.
  const hex = /^\\'([0-9a-fA-F]{2})/.exec(resto);
  if (hex !== null)
    return {
      consumed: hex[0].length,
      // Windows-1252 é o padrão prático do RTF da época do acervo; ASCII passa
      // direto.
      text: skipping ? "" : Buffer.from(hex[1] ?? "", "hex").toString("latin1"),
      startsSkippedDestination: false,
    };

  const escaped = rtf[index + 1];
  const literal =
    !skipping && escaped !== undefined && String.raw`\{}`.includes(escaped) ? escaped : "";
  return { consumed: 2, text: literal, startsSkippedDestination: false };
}

export function stripRtf(rtf: string): string {
  let output = "";
  let depth = 0;
  const skipFromDepth: number[] = [];
  let index = 0;

  while (index < rtf.length) {
    const character = rtf[index];

    if (character === "{") {
      depth += 1;
      index += 1;
      continue;
    }

    if (character === "}") {
      // A chave que fecha o destino ignorado devolve a saída ao texto normal.
      if (skipFromDepth.at(-1) === depth) skipFromDepth.pop();
      depth -= 1;
      index += 1;
      continue;
    }

    if (character === "\\") {
      const passo = readBackslash(rtf, index, skipFromDepth.length > 0);
      index += passo.consumed;
      if (passo.startsSkippedDestination) skipFromDepth.push(depth);
      output += passo.text;
      continue;
    }

    index += 1;
    if (skipFromDepth.length === 0) output += literalCharacter(character);
  }

  return output;
}

/**
 * Caractere comum do fluxo, já filtrado.
 *
 * Quebra de linha crua em RTF é formatação do arquivo, e não conteúdo: quem
 * marca parágrafo é a palavra de controle, não o byte.
 */
function literalCharacter(character: string | undefined): string {
  if (character === undefined) return "";
  if (character === "\n" || character === "\r") return "";
  return character;
}
