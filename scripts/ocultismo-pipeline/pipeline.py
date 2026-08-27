#!/usr/bin/env python3
"""
Pipeline completo: extração → normalização → embeddings → índice vetorial.

Uso:
    python pipeline.py [--output-dir conteudo] [--skip-ocr] [--device cuda|cpu]
"""

from __future__ import annotations

import argparse
import logging
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from embed import generate_embeddings, load_model, save_outputs
from extract import ExtractedDocument, SOURCE_ROOT, run_extraction
from normalize import normalize_corpus

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger(__name__)


def main() -> None:
    parser = argparse.ArgumentParser(description="Ocultismo corpus pipeline")
    parser.add_argument(
        "--output-dir",
        type=str,
        default="conteudo",
        help="Output directory (default: conteudo)",
    )
    parser.add_argument(
        "--skip-ocr",
        action="store_true",
        help="Skip OCR processing of images",
    )
    parser.add_argument(
        "--device",
        type=str,
        default="cuda",
        choices=["cuda", "cpu"],
        help="Device for model inference (default: cuda)",
    )
    parser.add_argument(
        "--batch-size",
        type=int,
        default=64,
        help="Embedding batch size (default: 64)",
    )
    args = parser.parse_args()

    output_dir = Path(args.output_dir)
    start = time.time()

    # --- Phase 1: Extract ---
    logger.info("=" * 60)
    logger.info("PHASE 1: Text Extraction")
    logger.info("=" * 60)

    if args.skip_ocr:
        from extract import collect_files, extract_text_file
        text_files, _ = collect_files(SOURCE_ROOT)
        documents: list[ExtractedDocument] = []
        for path in text_files:
            doc = extract_text_file(path)
            if doc:
                documents.append(doc)
        logger.info("Extracted %d documents (OCR skipped)", len(documents))
    else:
        documents = run_extraction(SOURCE_ROOT)

    if not documents:
        logger.error("No documents extracted. Aborting.")
        sys.exit(1)

    # --- Phase 2: Normalize & Chunk ---
    logger.info("=" * 60)
    logger.info("PHASE 2: Normalization & Chunking")
    logger.info("=" * 60)
    chunks = normalize_corpus(documents)

    if not chunks:
        logger.error("No chunks generated. Aborting.")
        sys.exit(1)

    # --- Phase 3: Embeddings ---
    logger.info("=" * 60)
    logger.info("PHASE 3: Embedding Generation")
    logger.info("=" * 60)
    model = load_model(device=args.device)
    embeddings = generate_embeddings(chunks, model, batch_size=args.batch_size)

    # --- Phase 4: Save ---
    logger.info("=" * 60)
    logger.info("PHASE 4: Saving Outputs")
    logger.info("=" * 60)
    save_outputs(chunks, embeddings, output_dir)

    elapsed = time.time() - start
    logger.info("=" * 60)
    logger.info(
        "Pipeline complete in %.1fs: %d chunks → %s",
        elapsed,
        len(chunks),
        output_dir,
    )
    logger.info("=" * 60)


if __name__ == "__main__":
    main()
