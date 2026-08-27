import { describe, expect, it } from "vitest";

import { normalizeExtractedText } from "./extraction";
import { stripRtf, xmlPartToText } from "./extraction-text";

describe("xmlPartToText", () => {
  it("turns OOXML paragraphs into lines instead of one run-on string", () => {
    const xml =
      '<?xml version="1.0"?><w:document><w:body>' +
      "<w:p><w:r><w:t>Xangô</w:t></w:r></w:p>" +
      "<w:p><w:r><w:t>Oyá</w:t></w:r></w:p>" +
      "</w:body></w:document>";
    expect(normalizeExtractedText(xmlPartToText(xml))).toBe("Xangô\nOyá");
  });

  it("handles the OpenDocument namespace the same way as the Word one", () => {
    const xml =
      "<office:document-content><office:body><office:text>" +
      "<text:p>primeira</text:p><text:p>segunda</text:p>" +
      "</office:text></office:body></office:document-content>";
    expect(normalizeExtractedText(xmlPartToText(xml))).toBe("primeira\nsegunda");
  });

  it("converts explicit tabs and line breaks inside a paragraph", () => {
    const xml = "<w:p><w:t>a</w:t><w:tab/><w:t>b</w:t><w:br/><w:t>c</w:t></w:p>";
    expect(xmlPartToText(xml)).toBe("a\tb\nc\n");
  });

  it("decodes the entities a document actually contains", () => {
    const xml = "<w:p><w:t>Exu &amp; Ogum &lt;irmãos&gt; &#8212; &quot;axé&quot;</w:t></w:p>";
    expect(normalizeExtractedText(xmlPartToText(xml))).toBe('Exu & Ogum <irmãos> — "axé"');
  });

  it("drops comments and embedded binary parts rather than emitting them as text", () => {
    const xml =
      "<w:p><w:t>visível</w:t></w:p><!-- comentário --><office:binary-data>AAAA</office:binary-data>";
    expect(normalizeExtractedText(xmlPartToText(xml))).toBe("visível");
  });

  it("leaves an unknown entity untouched instead of inventing a character", () => {
    expect(xmlPartToText("<w:t>&naoexiste;</w:t>")).toBe("&naoexiste;");
  });
});

describe("stripRtf", () => {
  it("recovers paragraphs and tabs from control words", () => {
    const rtf = "{\\rtf1\\ansi Ogum\\par Oxóssi\\tab caçador\\par}";
    expect(normalizeExtractedText(stripRtf(rtf))).toBe("Ogum\nOxóssi\tcaçador");
  });

  it("skips metadata destinations instead of emitting their contents", () => {
    const rtf =
      "{\\rtf1\\ansi{\\fonttbl{\\f0\\froman Times New Roman;}}" +
      "{\\colortbl;\\red255\\green0\\blue0;}" +
      "{\\info{\\author alguém}}" +
      "corpo real\\par}";
    const text = normalizeExtractedText(stripRtf(rtf));
    expect(text).toBe("corpo real");
    expect(text).not.toContain("Times New Roman");
    expect(text).not.toContain("alguém");
  });

  it("decodes both hex escapes and unicode control words", () => {
    // \'e9 is "é" in Windows-1252; \u237 is "í" by code point.
    const rtf = "{\\rtf1\\ansi ax\\'e9 \\u237 ndio\\par}";
    expect(normalizeExtractedText(stripRtf(rtf))).toBe("axé índio");
  });

  it("unescapes literal braces and backslashes", () => {
    expect(normalizeExtractedText(stripRtf("{\\rtf1 a\\{b\\}c\\\\d}"))).toBe("a{b}c\\d");
  });

  it("ignores raw newlines, which are stream formatting rather than content", () => {
    expect(normalizeExtractedText(stripRtf("{\\rtf1 uma\nlinha\nsó}"))).toBe("umalinhasó");
  });

  it("terminates on a document that never closes its groups", () => {
    expect(() => stripRtf("{\\rtf1{\\fonttbl{\\f0 x;")).not.toThrow();
  });
});
