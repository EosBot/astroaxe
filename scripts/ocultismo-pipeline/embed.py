"""
Geração de embeddings com BAAI/bge-m3 e criação de índice FAISS-GPU.
"""

from __future__ import annotations

import json
import logging
from pathlib import Path

import numpy as np
import pandas as pd
from sentence_transformers import SentenceTransformer

from normalize import TextChunk

logger = logging.getLogger(__name__)

MODEL_NAME = "BAAI/bge-m3"
EMBEDDING_DIM = 1024
BATCH_SIZE = 64


def load_model(device: str = "cuda") -> SentenceTransformer:
    logger.info("Loading %s on %s...", MODEL_NAME, device)
    model = SentenceTransformer(MODEL_NAME, device=device)
    logger.info("Model loaded. Embedding dim: %d", model.get_sentence_embedding_dimension())
    return model


def generate_embeddings(
    chunks: list[TextChunk],
    model: SentenceTransformer,
    batch_size: int = BATCH_SIZE,
) -> np.ndarray:
    texts = [c.text for c in chunks]
    logger.info("Generating embeddings for %d chunks (batch_size=%d)...", len(texts), batch_size)

    embeddings = model.encode(
        texts,
        batch_size=batch_size,
        show_progress_bar=True,
        normalize_embeddings=True,
    )

    logger.info("Embeddings shape: %s", embeddings.shape)
    return embeddings


def build_faiss_index(embeddings: np.ndarray) -> "faiss.Index":
    import faiss

    dim = embeddings.shape[1]
    index = faiss.IndexFlatIP(dim)

    if faiss.get_num_gpus() > 0:
        logger.info("Moving FAISS index to GPU...")
        res = faiss.StandardGpuResources()
        index = faiss.index_cpu_to_gpu(res, 0, index)

    index.add(embeddings.astype(np.float32))
    logger.info("FAISS index built with %d vectors", index.ntotal)
    return index


def save_outputs(
    chunks: list[TextChunk],
    embeddings: np.ndarray,
    output_dir: Path,
) -> None:
    output_dir.mkdir(parents=True, exist_ok=True)

    # --- Parquet (chunks + metadados) ---
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

    df = pd.DataFrame(records)
    parquet_path = output_dir / "chunks.parquet"
    df.to_parquet(parquet_path, index=False, engine="pyarrow")
    logger.info("Parquet saved: %s (%d rows)", parquet_path, len(df))

    # --- JSONL (uma linha por chunk, ideal para fine-tuning) ---
    jsonl_path = output_dir / "chunks.jsonl"
    with jsonl_path.open("w", encoding="utf-8") as f:
        for chunk in chunks:
            entry = {
                "id": chunk.chunk_id,
                "title": chunk.title,
                "category": chunk.category,
                "subcategory": chunk.subcategory,
                "text": chunk.text,
                "metadata": chunk.metadata,
            }
            f.write(json.dumps(entry, ensure_ascii=False) + "\n")
    logger.info("JSONL saved: %s", jsonl_path)

    # --- Embeddings (.npy) ---
    npy_path = output_dir / "embeddings.npy"
    np.save(npy_path, embeddings)
    logger.info("Embeddings saved: %s", npy_path)

    # --- FAISS index ---
    import faiss

    index = build_faiss_index(embeddings)

    # Save CPU version for portability
    cpu_index = index
    if faiss.get_num_gpus() > 0:
        cpu_index = faiss.index_gpu_to_cpu(index)

    faiss_path = output_dir / "index.faiss"
    faiss.write_index(cpu_index, str(faiss_path))
    logger.info("FAISS index saved: %s", faiss_path)

    # --- Manifest ---
    manifest = {
        "model": MODEL_NAME,
        "embedding_dim": EMBEDDING_DIM,
        "total_chunks": len(chunks),
        "total_docs": len({c.doc_id for c in chunks}),
        "categories": sorted({c.category for c in chunks}),
        "file_types": sorted({c.file_type for c in chunks}),
        "normalized_embeddings": True,
        "similarity_metric": "inner_product",
    }
    manifest_path = output_dir / "manifest.json"
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2))
    logger.info("Manifest saved: %s", manifest_path)
