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
      .replace(/<[^>]*>/g, ""),
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
export function stripRtf(rtf: string): string {
  let output = "";
  let depth = 0;
  const skipFromDepth: number[] = [];
  let index = 0;

  const skipping = () => skipFromDepth.length > 0;

  while (index < rtf.length) {
    const character = rtf[index];

    if (character === "{") {
      depth += 1;
      index += 1;
      continue;
    }

    if (character === "}") {
      if (skipFromDepth.at(-1) === depth) skipFromDepth.pop();
      depth -= 1;
      index += 1;
      continue;
    }

    if (character === "\\") {
      const control = /^\\([a-zA-Z]+)(-?\d+)? ?/.exec(rtf.slice(index));
      if (control !== null) {
        const [matched, word, parameter] = control;
        index += matched.length;
        if (skipping()) continue;

        if (word !== undefined && SKIPPED_RTF_DESTINATIONS.test(word)) {
          skipFromDepth.push(depth);
          continue;
        }
        if (word === "par" || word === "line" || word === "sect") output += "\n";
        else if (word === "tab") output += "\t";
        else if (word === "u" && parameter !== undefined) {
          // \uN emits a code point; a negative value is the 16-bit signed encoding.
          const code = Number(parameter);
          if (Number.isSafeInteger(code))
            output += String.fromCodePoint(code < 0 ? code + 0x10000 : code);
        }
        continue;
      }

      // Control symbol: \' introduces a hex byte, anything else is an escaped literal.
      const hex = /^\\'([0-9a-fA-F]{2})/.exec(rtf.slice(index));
      if (hex !== null) {
        index += hex[0].length;
        // Windows-1252 is the practical default for archive-era RTF; ASCII passes through.
        if (!skipping()) output += Buffer.from(hex[1] ?? "", "hex").toString("latin1");
        continue;
      }
      const escaped = rtf[index + 1];
      index += 2;
      if (!skipping() && escaped !== undefined && "\\{}".includes(escaped)) output += escaped;
      continue;
    }

    index += 1;
    if (skipping()) continue;
    // Raw newlines in an RTF stream are formatting, not content.
    if (character === "\n" || character === "\r") continue;
    if (character !== undefined) output += character;
  }

  return output;
}
