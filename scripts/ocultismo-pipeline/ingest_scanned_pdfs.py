#!/usr/bin/env python3
"""
Ingest de PDFs escaneados sem camada de texto: renderiza as páginas, aplica
OCR (easyocr pt+en), chunka, embedda e mescla no corpus existente. Idempotente:
documentos já presentes no índice são pulados.

Uso:
    python ingest_scanned_pdfs.py [--dry-run] [--dpi 150] [--device cuda]
"""

from __future__ import annotations

import argparse
import json
import logging
import sys
import time
from pathlib import Path

import numpy as np
import pymupdf
from sentence_transformers import SentenceTransformer

from corpus_hygiene import is_mostly_garbage
from embed import EMBEDDING_DIM, MODEL_NAME, build_faiss_index
from extract import SOURCE_ROOT, ExtractedDocument, compute_doc_id, extract_pdf, get_category
from normalize import normalize_corpus

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
    stream=sys.stderr,
)
logger = logging.getLogger(__name__)

CONTENT_DIR = Path("/home/thalis/Projetos/orixas-mapa-astral/conteudo")
MIN_TEXT_CHARS = 50
BATCH_SIZE = 8


def find_scanned_pdfs() -> list[Path]:
    """
    PDFs que precisam de OCR.

    Duas condições, não uma. A ausência de camada de texto é a óbvia; a outra é
    a camada de texto *degenerada* — um PDF com fonte embutida sem mapa de
    caracteres devolve muitos caracteres, todos ilegíveis, e passa por qualquer
    teste que meça apenas o tamanho do texto extraído. Foi assim que o Curso
    Básico de Astrologia entrou no índice como 173 chunks de símbolos.
    """
    candidates: list[Path] = []
    for path in sorted(SOURCE_ROOT.rglob("*.pdf")):
        if not path.is_file():
            continue
        text, _ = extract_pdf(path)
        if len(text.strip()) < MIN_TEXT_CHARS or is_mostly_garbage(text):
            candidates.append(path)
    return candidates


def load_existing_doc_ids() -> set[str]:
    import pandas as pd

    parquet_path = CONTENT_DIR / "chunks.parquet"
    if not parquet_path.exists():
        return set()
    df = pd.read_parquet(parquet_path, columns=["doc_id"])
    return set(df["doc_id"].unique())


def ocr_pdf(path: Path, reader, dpi: int) -> ExtractedDocument | None:
    """OCR página a página de um PDF sem camada de texto."""
    try:
        doc = pymupdf.open(str(path))
    except Exception as e:
        logger.error("Cannot open %s: %s", path.name, e)
        return None

    pages: list[str] = []
    total = len(doc)
    for i, page in enumerate(doc, 1):
        try:
            pix = page.get_pixmap(dpi=dpi, alpha=False)
            img = np.frombuffer(pix.samples, dtype=np.uint8).reshape(
                pix.height, pix.width, pix.n
            )
            results = reader.readtext(img, detail=0, paragraph=True)
            page_text = "\n".join(results).strip()
            if page_text:
                pages.append(page_text)
        except Exception as e:
            logger.warning("  Page %d/%d failed: %s", i, total, e)
        if i % 25 == 0 or i == total:
            logger.info("  [%d/%d] páginas OCR (%d com texto)", i, total, len(pages))

    doc.close()

    text = "\n\n".join(pages)
    if len(text.strip()) < MIN_TEXT_CHARS:
        logger.warning("OCR produced no usable text: %s", path.name)
        return None

    category, subcategory = get_category(path)
    return ExtractedDocument(
        doc_id=compute_doc_id(path),
        title=path.stem,
        category=category,
        subcategory=subcategory,
        source_path=str(path),
        file_type="pdf_ocr",
        text=text,
        page_count=len(pages),
        char_count=len(text),
    )


def merge_into_corpus(chunks) -> None:
    """Mescla chunks novos ao corpus existente (padrão do integrate_pontos)."""
    import faiss
    import pandas as pd

    parquet_path = CONTENT_DIR / "chunks.parquet"
    npy_path = CONTENT_DIR / "embeddings.npy"
    faiss_path = CONTENT_DIR / "index.faiss"
    manifest_path = CONTENT_DIR / "manifest.json"

    df = pd.read_parquet(parquet_path)
    embeddings = np.load(npy_path)
    manifest = json.loads(manifest_path.read_text())
    logger.info("Existing corpus: %d chunks, shape %s", len(df), embeddings.shape)

    model = SentenceTransformer(MODEL_NAME, device="cuda")
    new_embeddings = model.encode(
        [c.text for c in chunks],
        batch_size=BATCH_SIZE,
        show_progress_bar=True,
        normalize_embeddings=True,
    )

    records = []
    for chunk in chunks:
        records.append({
            "chunk_id": chunk.chunk_id,
            "doc_id": chunk.doc_id,
            "title": chunk.title,
            "category": chunk.category,
            "subcategory": chunk.subcategory,
            "source_path": chunk.source_path,
            "file_type": chunk.file_type,
            "chunk_index": chunk.chunk_index,
            "text": chunk.text,
            "char_count": chunk.char_count,
            "metadata": json.dumps(chunk.metadata, ensure_ascii=False),
        })

    combined_df = pd.concat([df, pd.DataFrame(records)], ignore_index=True)
    combined_embeddings = np.vstack([embeddings, new_embeddings])

    index = build_faiss_index(combined_embeddings.astype(np.float32))
    cpu_index = index
    if faiss.get_num_gpus() > 0:
        cpu_index = faiss.index_gpu_to_cpu(index)

    combined_df.to_parquet(parquet_path, index=False, engine="pyarrow")
    np.save(npy_path, combined_embeddings)
    faiss.write_index(cpu_index, str(faiss_path))

    # O JSONL sai do parquet a cada gravação. Quando o merge não o regerava, ele
    # ficava atrás do índice — foi assim que a primeira leva de OCR deixou 1280
    # chunks fora do arquivo usado para fine-tuning.
    from clean_corpus import write_jsonl

    write_jsonl(combined_df, CONTENT_DIR / "chunks.jsonl")

    manifest["total_chunks"] = len(combined_df)
    manifest["total_docs"] = int(combined_df["doc_id"].nunique())
    if "pdf_ocr" not in manifest["file_types"]:
        manifest["file_types"].append("pdf_ocr")
        manifest["file_types"].sort()
    for category in sorted(set(combined_df["category"]) - set(manifest["categories"])):
        manifest["categories"].append(category)
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2))

    logger.info(
        "Merged %d chunks (%d docs). New corpus: %d chunks, shape %s",
        len(chunks), len({c.doc_id for c in chunks}),
        len(combined_df), combined_embeddings.shape,
    )


def main() -> None:
    parser = argparse.ArgumentParser(description="OCR de PDFs escaneados")
    parser.add_argument("--dry-run", action="store_true", help="Só lista candidatos")
    parser.add_argument("--dpi", type=int, default=150)
    args = parser.parse_args()

    logger.info("Scanning %s for scanned PDFs...", SOURCE_ROOT)
    candidates = find_scanned_pdfs()
    logger.info("Found %d scanned PDFs", len(candidates))

    existing = load_existing_doc_ids()
    pending = [p for p in candidates if compute_doc_id(p) not in existing]
    skipped = len(candidates) - len(pending)
    if skipped:
        logger.info("Already indexed: %d (idempotência)", skipped)

    if not pending:
        logger.info("Nothing to do.")
        return

    total_pages = 0
    for path in pending:
        try:
            n = pymupdf.open(str(path)).page_count
        except Exception:
            n = 0
        total_pages += n
        logger.info("  candidato: %s (%d páginas)", path.name, n)

    if args.dry_run:
        logger.info("Dry run: %d PDFs, ~%d páginas para OCR.", len(pending), total_pages)
        return

    logger.info("Loading EasyOCR reader (pt + en, GPU)...")
    import easyocr

    reader = easyocr.Reader(["pt", "en"], gpu=True)

    documents: list[ExtractedDocument] = []
    start = time.time()
    for i, path in enumerate(pending, 1):
        logger.info("[%d/%d] OCR: %s", i, len(pending), path.name)
        doc = ocr_pdf(path, reader, args.dpi)
        if doc:
            documents.append(doc)
            logger.info("  %d páginas com texto, %.1f mil chars",
                        doc.page_count, doc.char_count / 1000)

    logger.info("OCR complete in %.0fs: %d documentos", time.time() - start, len(documents))

    if not documents:
        logger.warning("No usable OCR output. Nothing to merge.")
        sys.exit(0)

    chunks = normalize_corpus(documents)
    if not chunks:
        logger.warning("No chunks generated. Nothing to merge.")
        sys.exit(0)

    merge_into_corpus(chunks)


if __name__ == "__main__":
    main()
