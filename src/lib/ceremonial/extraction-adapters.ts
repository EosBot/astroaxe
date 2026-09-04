import "server-only";

import { spawn } from "node:child_process";

import type { StdioNull, StdioPipe } from "node:child_process";

import {
  EXTRACTION_LIMITS,
  EXTRACTION_PIPELINE_VERSION,
  countPagesFromFormFeeds,
  type ExtractionAdapter,
  type ExtractionQuarantineReason,
} from "@/domain/ceremonial/extraction";
import { stripRtf, xmlPartToText } from "@/domain/ceremonial/extraction-text";

import type { VerifiedSource } from "./extraction-source";

/**
 * The only place in the pipeline that runs foreign code over archive bytes.
 *
 * Every invocation is deliberately narrow: an argv array with no shell, a fixed minimal
 * environment, a working directory outside the archive, a wall-clock ceiling and a hard
 * cap on accepted output. The source never reaches the child as a path — it arrives as a
 * stream read from the already-verified descriptor — so no child can be redirected by a
 * path swapped in behind us.
 */

/** Only these binaries may be executed. A value outside the map cannot be spawned. */
const ADAPTER_BINARIES = Object.freeze({
  "pdf-text": {
    command: "pdftotext",
    // `-` twice: read the PDF from stdin, write the text to stdout.
    args: ["-q", "-enc", "UTF-8", "-", "-"],
    versionArgs: ["-v"],
  },
  "ocr-image": {
    command: "tesseract",
    // Portuguese first: this archive is Brazilian. A fixed PSM keeps runs comparable.
    args: ["stdin", "stdout", "-l", "por+eng", "--psm", "3"],
    versionArgs: ["--version"],
  },
  // Renders one page of a scanned PDF to PNG on stdout, which tesseract then reads.
  "pdf-ocr": { command: "pdftoppm", args: ["-png", "-r", "300"], versionArgs: ["-v"] },
  ooxml: { command: "bsdtar", args: ["-xOf", "-"], versionArgs: ["--version"] },
  opendocument: { command: "bsdtar", args: ["-xOf", "-"], versionArgs: ["--version"] },
});

/** The document part that actually carries reading text, per container format. */
const DOCUMENT_PARTS: Readonly<Record<string, readonly string[]>> = Object.freeze({
  ooxml: ["word/document.xml", "content.xml"],
  opendocument: ["content.xml", "word/document.xml"],
});

/**
 * The child's entire environment. Nothing is inherited: an adapter has no reason to see
 * a database URL, a session secret or the archive path. `NODE_ENV` is present only
 * because the workspace's augmented `ProcessEnv` requires it.
 */
const ADAPTER_ENVIRONMENT: NodeJS.ProcessEnv = Object.freeze({
  PATH: "/usr/local/bin:/usr/bin:/bin",
  LC_ALL: "C.UTF-8",
  TESSDATA_PREFIX: "/usr/share/tesseract-ocr/5/tessdata",
  NODE_ENV: "production",
});

/**
 * Typed as a tuple so `spawn` resolves to the writable-stdin/readable-stdout overload.
 * stderr is discarded during extraction: a failing adapter is diagnosed by its exit code,
 * and its stderr could quote archive content into a log.
 */
const ADAPTER_STDIO: [StdioPipe, StdioPipe, StdioNull] = ["pipe", "pipe", "ignore"];

/**
 * Version probes are the one case where stderr must be read: poppler prints its banner
 * there and exits non-zero. No archive byte is involved, so nothing sensitive can leak.
 */
const PROBE_STDIO: [StdioPipe, StdioPipe, StdioPipe] = ["pipe", "pipe", "pipe"];

/** A version banner is one short line; anything slower or larger means the wrong binary. */
const PROBE_TIMEOUT_MS = 10_000;
const PROBE_MAX_BYTES = 4096;

export type AdapterResult =
  | {
      readonly ok: true;
      readonly text: string;
      readonly pageCount: number | null;
      readonly adapterVersion: string;
    }
  | { readonly ok: false; readonly reason: ExtractionQuarantineReason };

interface CommandResult {
  readonly ok: boolean;
  readonly stdout: Buffer;
  readonly reason: ExtractionQuarantineReason | null;
}

/**
 * Runs one binary with the verified source as stdin, refusing rather than truncating when
 * output or wall clock runs past the limit. A decompression bomb therefore ends as
 * `OUTPUT_TOO_LARGE`, not as a partial derivative that looks legitimate.
 */
type AdapterInput = VerifiedSource | Buffer | null;

async function runBounded(
  command: string,
  args: readonly string[],
  input: AdapterInput,
): Promise<CommandResult> {
  return new Promise((resolve) => {
    const child = spawn(command, [...args], {
      stdio: ADAPTER_STDIO,
      shell: false,
      env: ADAPTER_ENVIRONMENT,
      cwd: "/tmp",
    });

    const chunks: Buffer[] = [];
    let total = 0;
    let settled = false;

    const finish = (result: CommandResult) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      child.kill("SIGKILL");
      resolve(result);
    };

    const timer = setTimeout(
      () => finish({ ok: false, stdout: Buffer.alloc(0), reason: "ADAPTER_TIMEOUT" }),
      EXTRACTION_LIMITS.timeoutMs,
    );

    child.stdout.on("data", (chunk: Buffer) => {
      total += chunk.length;
      if (total > EXTRACTION_LIMITS.maxOutputBytes) {
        finish({ ok: false, stdout: Buffer.alloc(0), reason: "OUTPUT_TOO_LARGE" });
        return;
      }
      chunks.push(chunk);
    });

    child.on("error", () =>
      finish({ ok: false, stdout: Buffer.alloc(0), reason: "ADAPTER_FAILED" }),
    );
    child.on("close", (code) =>
      finish(
        code === 0
          ? { ok: true, stdout: Buffer.concat(chunks), reason: null }
          : { ok: false, stdout: Buffer.alloc(0), reason: "ADAPTER_FAILED" },
      ),
    );

    if (input === null) {
      child.stdin.end();
      return;
    }
    // A child that exits early makes further writes EPIPE; the exit code is the real signal.
    child.stdin.on("error", () => undefined);
    if (Buffer.isBuffer(input)) {
      // An intermediate render, already bounded by the run that produced it.
      child.stdin.end(input);
      return;
    }
    // Positioned reads from the verified descriptor: repeatable, and the offset never moves.
    const stream = input.handle.createReadStream({ start: 0, autoClose: false });
    stream.on("error", () => child.stdin.destroy());
    child.stdin.on("error", () => stream.destroy());
    stream.pipe(child.stdin);
  });
}

/**
 * Resolves the exact tool version, which becomes part of the derivative's identity.
 * `null` means the binary is absent, which the pipeline reports rather than working around.
 */
export async function resolveAdapterVersion(adapter: ExtractionAdapter): Promise<string | null> {
  const binary = ADAPTER_BINARIES[adapter as keyof typeof ADAPTER_BINARIES];
  // Pure adapters have no external tool; the pipeline version is their identity.
  if (binary === undefined) return EXTRACTION_PIPELINE_VERSION;
  const version = await probeVersion(binary.command, binary.versionArgs);
  if (version === null) return null;
  // The scanned-PDF route is two tools chained, so its identity has to name both.
  if (adapter === "pdf-ocr") {
    const ocr = await probeVersion(
      ADAPTER_BINARIES["ocr-image"].command,
      ADAPTER_BINARIES["ocr-image"].versionArgs,
    );
    return ocr === null ? null : `${version} + ${ocr}`;
  }
  return version;
}

/**
 * Asks a binary for its version, reading stdout and stderr together.
 *
 * Separate from `runBounded` on purpose: poppler prints its banner on stderr and exits
 * non-zero, so neither the exit code nor stdout alone can tell "absent" from "present".
 * No archive byte passes through here, so reading stderr risks nothing — during real
 * extraction it stays discarded.
 */
async function probeVersion(command: string, args: readonly string[]): Promise<string | null> {
  return new Promise((resolve) => {
    const child = spawn(command, [...args], {
      stdio: PROBE_STDIO,
      shell: false,
      env: ADAPTER_ENVIRONMENT,
      cwd: "/tmp",
    });

    let banner = "";
    let settled = false;
    const finish = (value: string | null) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      child.kill("SIGKILL");
      resolve(value);
    };

    const timer = setTimeout(() => finish(null), PROBE_TIMEOUT_MS);
    const collect = (chunk: Buffer) => {
      if (banner.length < PROBE_MAX_BYTES) banner += chunk.toString("utf8");
    };

    child.stdout.on("data", collect);
    child.stderr.on("data", collect);
    child.stdin.end();
    child.on("error", () => finish(null));
    child.on("close", () => {
      const line = banner.trim().split("\n")[0]?.trim();
      finish(line === undefined || line === "" ? null : line);
    });
  });
}

async function readSourceBytes(source: VerifiedSource): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of source.handle.createReadStream({ start: 0, autoClose: false }))
    chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks);
}

/**
 * OCRs a scanned PDF one page at a time.
 *
 * Page by page, not whole-document, for two reasons: `pdftoppm` emits concatenated PNGs
 * that tesseract cannot split, and a 200-page book rendered at once would blow past both
 * the output ceiling and the tmpfs. Each page is rendered from the same verified
 * descriptor and handed to tesseract in memory, so no intermediate file is ever written.
 *
 * A page that fails or renders empty contributes nothing and does not abort the document:
 * a blank plate in a scanned book is normal. A budget overrun refuses the whole source,
 * because a partial transcription of a book reads exactly like a complete one.
 */
/**
 * Motivo que derruba o documento inteiro, quando houver.
 *
 * Estouro de tempo ou de tamanho é recusa da fonte toda: insistir nas páginas
 * seguintes seria gastar o mesmo orçamento que já acabou. Falha de outra
 * natureza é só esta página, e o laço segue.
 */
function fatalReason(result: {
  ok: boolean;
  reason?: string | null;
}): "ADAPTER_TIMEOUT" | "OUTPUT_TOO_LARGE" | null {
  if (result.ok) return null;
  if (result.reason === "ADAPTER_TIMEOUT") return "ADAPTER_TIMEOUT";
  if (result.reason === "OUTPUT_TOO_LARGE") return "OUTPUT_TOO_LARGE";
  return null;
}

export async function runPdfOcr(
  source: VerifiedSource,
  pageCount: number,
  adapterVersion: string,
): Promise<AdapterResult> {
  if (pageCount > EXTRACTION_LIMITS.maxOcrPages)
    return { ok: false, reason: "OCR_BUDGET_EXCEEDED" };

  const render = ADAPTER_BINARIES["pdf-ocr"];
  const ocr = ADAPTER_BINARIES["ocr-image"];
  const pages: string[] = [];
  let total = 0;
  // The per-run timeout bounds one page; this bounds the document, so a long book cannot
  // hold the container indefinitely without any single run ever timing out.
  const deadline = Date.now() + EXTRACTION_LIMITS.ocrDocumentTimeoutMs;

  for (let page = 1; page <= pageCount; page += 1) {
    if (Date.now() > deadline) return { ok: false, reason: "ADAPTER_TIMEOUT" };
    const rendered = await runBounded(
      render.command,
      [...render.args, "-f", String(page), "-l", String(page), "-", "-"],
      source,
    );
    const rejeitaRender = fatalReason(rendered);
    if (rejeitaRender !== null) return { ok: false, reason: rejeitaRender };
    if (!rendered.ok || rendered.stdout.length === 0) continue;

    const text = await runBounded(ocr.command, ocr.args, rendered.stdout);
    const rejeitaOcr = fatalReason(text);
    if (rejeitaOcr !== null) return { ok: false, reason: rejeitaOcr };
    if (!text.ok) continue;

    total += text.stdout.length;
    if (total > EXTRACTION_LIMITS.maxOutputBytes) return { ok: false, reason: "OUTPUT_TOO_LARGE" };
    pages.push(text.stdout.toString("utf8"));
  }

  // Page breaks are preserved so the page count stays meaningful downstream.
  return { ok: true, text: pages.join("\f"), pageCount, adapterVersion };
}

/** Texto puro e RTF: o próprio arquivo já é a fonte, sem processo externo. */
async function readTextSource(
  adapter: "plain-text" | "rtf",
  source: VerifiedSource,
  adapterVersion: string,
): Promise<AdapterResult> {
  let bytes: Buffer;
  try {
    bytes = await readSourceBytes(source);
  } catch {
    return { ok: false, reason: "SOURCE_UNREADABLE" };
  }
  if (bytes.length > EXTRACTION_LIMITS.maxOutputBytes)
    return { ok: false, reason: "OUTPUT_TOO_LARGE" };

  const decoded = bytes.toString("utf8");
  return {
    ok: true,
    text: adapter === "rtf" ? stripRtf(decoded) : decoded,
    pageCount: null,
    adapterVersion,
  };
}

/** Adaptadores que rodam um binário e leem a saída padrão. */
async function runSingleBinary(
  adapter: "pdf-text" | "ocr-image",
  source: VerifiedSource,
  adapterVersion: string,
): Promise<AdapterResult> {
  const binary = ADAPTER_BINARIES[adapter];
  const result = await runBounded(binary.command, binary.args, source);
  if (!result.ok) return { ok: false, reason: result.reason ?? "ADAPTER_FAILED" };

  const text = result.stdout.toString("utf8");
  return {
    ok: true,
    text,
    pageCount: adapter === "pdf-text" ? countPagesFromFormFeeds(text) : null,
    adapterVersion,
  };
}

export async function runExtractionAdapter(
  adapter: ExtractionAdapter,
  source: VerifiedSource,
  adapterVersion: string,
): Promise<AdapterResult> {
  if (adapter === "plain-text" || adapter === "rtf")
    return await readTextSource(adapter, source, adapterVersion);

  if (adapter === "pdf-text" || adapter === "ocr-image")
    return await runSingleBinary(adapter, source, adapterVersion);

  // A ZIP container is only usable if it holds a known document part. Each candidate gets
  // a fresh stream from the same descriptor, so trying one does not consume the source.
  const binary = ADAPTER_BINARIES[adapter];
  for (const part of DOCUMENT_PARTS[adapter] ?? []) {
    const result = await runBounded(binary.command, [...binary.args, part], source);
    if (!result.ok) {
      // A limit breach is a refusal for the whole source; a missing part is just the
      // next candidate.
      if (result.reason === "ADAPTER_TIMEOUT" || result.reason === "OUTPUT_TOO_LARGE")
        return { ok: false, reason: result.reason };
      continue;
    }
    const xml = result.stdout.toString("utf8");
    if (xml.trim() === "") continue;
    return { ok: true, text: xmlPartToText(xml), pageCount: null, adapterVersion };
  }
  // A plain ZIP that is not a document: refused, and recorded as such.
  return { ok: false, reason: "ADAPTER_FAILED" };
}
