#!/usr/bin/env python3
"""
Aplica a higiene do corpus aos artefatos já indexados, sem recalcular embeddings.

Os portões de `corpus_hygiene` valem para execuções futuras do pipeline; este
script os aplica retroativamente ao índice existente, selecionando linhas em vez
de reprocessar o acervo. Reembeddar 33 mil chunks para descartar 11% deles seria
uma hora de GPU para chegar ao mesmo resultado.

Uso:
    python clean_corpus.py [--dry-run]
"""

from __future__ import annotations

import argparse
import json
import logging
import sys
from pathlib import Path

import numpy as np
import pandas as pd

sys.path.insert(0, str(Path(__file__).parent))

import faiss

from corpus_hygiene import (
    find_redundant_by_embedding,
    is_mostly_garbage,
    is_out_of_scope,
)
from embed import EMBEDDING_DIM, MODEL_NAME, build_faiss_index

logging.basicConfig(
    level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s", datefmt="%H:%M:%S"
)
logger = logging.getLogger(__name__)

CONTENT_DIR = Path(__file__).parent.parent.parent / "conteudo"


def write_jsonl(df: pd.DataFrame, path: Path) -> None:
    """
    Reescreve o JSONL a partir do parquet.

    O parquet é a fonte de verdade: o JSONL anterior ficou 1280 chunks atrás do
    índice porque foi gravado antes do passe de OCR e nunca regenerado.
    """
    with path.open("w", encoding="utf-8") as handle:
        for row in df.itertuples(index=False):
            metadata = row.metadata
            if isinstance(metadata, str):
                metadata = json.loads(metadata)
            handle.write(
                json.dumps(
                    {
                        "id": row.chunk_id,
                        "title": row.title,
                        "category": row.category,
                        "subcategory": row.subcategory,
                        "text": row.text,
                        "metadata": metadata,
                    },
                    ensure_ascii=False,
                )
                + "\n"
            )


def main() -> None:
    parser = argparse.ArgumentParser(description="Higiene retroativa do corpus")
    parser.add_argument("--dry-run", action="store_true", help="Só relata, não grava")
    args = parser.parse_args()

    df = pd.read_parquet(CONTENT_DIR / "chunks.parquet")
    embeddings = np.load(CONTENT_DIR / "embeddings.npy")
    logger.info("Corpus atual: %d chunks, %d docs", len(df), df.doc_id.nunique())

    drop_docs: dict[str, str] = {}

    # Os pontos cantados têm validação própria (estrutura de verso e âncora de
    # título) e não passam pelos portões de texto corrido.
    corpus = df[df.file_type != "ponto_letra"]

    for doc_id, group in corpus.groupby("doc_id"):
        title = group.title.iloc[0]
        if (reason := is_out_of_scope(title)):
            drop_docs[doc_id] = f"fora do escopo: {reason}"
        elif is_mostly_garbage("\n".join(group.text.tolist())):
            drop_docs[doc_id] = "extração degenerada"

    survivors = corpus[~corpus.doc_id.isin(drop_docs)]
    rows = {d: g.index.values for d, g in survivors.groupby("doc_id")}
    weights = {d: int(g.char_count.sum()) for d, g in survivors.groupby("doc_id")}

    logger.info("Comparando %d documentos por cobertura de chunk...", len(rows))
    redundant, borderline = find_redundant_by_embedding(rows, embeddings, weights)

    titles = df.drop_duplicates("doc_id").set_index("doc_id").title.to_dict()
    for doc_id, keeper in redundant.items():
        drop_docs[doc_id] = f"cópia de {titles[keeper]!r}"

    chunk_counts = df.groupby("doc_id").size().to_dict()
    removed = sum(chunk_counts[d] for d in drop_docs)

    logger.info("=" * 68)
    for doc_id, reason in sorted(drop_docs.items(), key=lambda kv: -chunk_counts[kv[0]]):
        logger.info("  −%4d chunks  %-56s %s", chunk_counts[doc_id], titles[doc_id][:56], reason)
    logger.info("=" * 68)
    logger.info("Descarte: %d documentos, %d chunks (%.1f%%)", len(drop_docs), removed, removed / len(df) * 100)

    if borderline:
        logger.info("Limítrofes, mantidos para decisão humana:")
        for doc_id, keeper, coverage in borderline:
            logger.info(
                "  %.2f cobertura  %s  ~  %s", coverage, titles[doc_id][:44], titles[keeper][:44]
            )

    if args.dry_run:
        logger.info("Dry run: nada gravado.")
        return

    keep = ~df.doc_id.isin(drop_docs)
    clean_df = df[keep].reset_index(drop=True)
    clean_embeddings = embeddings[keep.values]
    assert len(clean_df) == len(clean_embeddings)

    index = build_faiss_index(clean_embeddings.astype(np.float32))
    if faiss.get_num_gpus() > 0:
        index = faiss.index_gpu_to_cpu(index)

    clean_df.to_parquet(CONTENT_DIR / "chunks.parquet", index=False, engine="pyarrow")
    np.save(CONTENT_DIR / "embeddings.npy", clean_embeddings)
    faiss.write_index(index, str(CONTENT_DIR / "index.faiss"))
    write_jsonl(clean_df, CONTENT_DIR / "chunks.jsonl")

    manifest = {
        "model": MODEL_NAME,
        "embedding_dim": EMBEDDING_DIM,
        "total_chunks": len(clean_df),
        "total_docs": int(clean_df.doc_id.nunique()),
        "categories": sorted(clean_df.category.unique()),
        "file_types": sorted(clean_df.file_type.unique()),
        "normalized_embeddings": True,
        "similarity_metric": "inner_product",
    }
    (CONTENT_DIR / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2))

    logger.info(
        "Corpus limpo: %d chunks, %d docs, shape %s",
        len(clean_df), clean_df.doc_id.nunique(), clean_embeddings.shape,
    )


if __name__ == "__main__":
    main()
