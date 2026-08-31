#!/usr/bin/env python3
"""
Integra pontos cantados (com letras) ao corpus vetorizado.
Adiciona os pontos como documentos adicionais ao Parquet e índice FAISS.
"""

from __future__ import annotations

import json
import logging
import sys
from pathlib import Path

import faiss
import numpy as np
import pandas as pd
from sentence_transformers import SentenceTransformer

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger(__name__)

CONTENT_DIR = Path(__file__).parent.parent.parent / "conteudo"
MODEL_NAME = "BAAI/bge-m3"


def load_pontos_with_lyrics(catalog_path: Path) -> list[dict]:
    """
    Pontos cujo campo `lyrics` passou pela validação de `validate_lyrics.py`.

    O comprimento mínimo não basta como critério: um artigo de blog tem milhares
    de caracteres e não é letra. O catálogo carrega `lyrics_status` desde a
    validação, e só o que está validado ou recuperado entra no índice.
    """
    accepted = {"validada", "recuperada por segmentação"}
    pontos = []
    with catalog_path.open("r", encoding="utf-8") as f:
        for line in f:
            ponto = json.loads(line)
            lyrics = (ponto.get("lyrics") or "").strip()
            status = ponto.get("lyrics_status")
            if not lyrics:
                continue
            if status is not None and status not in accepted:
                continue
            pontos.append(ponto)
    logger.info("Found %d pontos with validated lyrics", len(pontos))
    return pontos


def integrate_pontos(device: str = "cuda") -> None:
    catalog_path = CONTENT_DIR / "pontos_cantados.jsonl"
    parquet_path = CONTENT_DIR / "chunks.parquet"
    npy_path = CONTENT_DIR / "embeddings.npy"
    faiss_path = CONTENT_DIR / "index.faiss"
    manifest_path = CONTENT_DIR / "manifest.json"

    if not parquet_path.exists():
        logger.error("Corpus not found. Run pipeline.py first.")
        sys.exit(1)

    pontos = load_pontos_with_lyrics(catalog_path)
    if not pontos:
        logger.info("No pontos with lyrics to integrate.")
        return

    # Load existing corpus
    df = pd.read_parquet(parquet_path)
    embeddings = np.load(npy_path)
    index = faiss.read_index(str(faiss_path))
    manifest = json.loads(manifest_path.read_text())

    logger.info("Existing corpus: %d chunks, embedding shape %s", len(df), embeddings.shape)

    # Idempotência: o catálogo é reescrito a cada validação, então os pontos já
    # indexados saem antes de os novos entrarem. Sem isso, cada execução
    # acrescentaria uma segunda cópia de cada letra ao índice.
    stale = (df.file_type == "ponto_letra").values
    if stale.any():
        logger.info("Removendo %d chunks de pontos já indexados", int(stale.sum()))
        df = df[~stale].reset_index(drop=True)
        embeddings = embeddings[~stale]

    # Prepare ponto texts for embedding
    ponto_texts = []
    ponto_records = []
    for i, ponto in enumerate(pontos):
        text = f"Ponto de {ponto['entity_name']} - {ponto['title']}\n\n{ponto['lyrics']}"
        ponto_texts.append(text)

        doc_id = f"ponto_{ponto['ponto_id']}"
        chunk_id = f"{doc_id}_0000"
        ponto_records.append({
            "chunk_id": chunk_id,
            "doc_id": doc_id,
            "title": ponto["title"],
            "category": "pontos_cantados",
            "subcategory": ponto.get("subcategory", ""),
            "source_path": ponto.get("file_path", ""),
            "file_type": "ponto_letra",
            "chunk_index": 0,
            "text": text,
            "char_count": len(text),
            "metadata": json.dumps({
                "entity_type": ponto.get("entity_type", ""),
                "entity_name": ponto.get("entity_name", ""),
                "lyrics_source": ponto.get("lyrics_source", ""),
            }, ensure_ascii=False),
        })

    # Generate embeddings for pontos
    logger.info("Generating embeddings for %d pontos...", len(ponto_texts))
    model = SentenceTransformer(MODEL_NAME, device=device)
    ponto_embeddings = model.encode(
        ponto_texts,
        batch_size=32,
        show_progress_bar=True,
        normalize_embeddings=True,
    )

    # Append to corpus
    new_df = pd.DataFrame(ponto_records)
    combined_df = pd.concat([df, new_df], ignore_index=True)
    combined_embeddings = np.vstack([embeddings, ponto_embeddings])

    # Rebuild FAISS index
    new_index = faiss.IndexFlatIP(combined_embeddings.shape[1])
    if faiss.get_num_gpus() > 0:
        res = faiss.StandardGpuResources()
        new_index = faiss.index_cpu_to_gpu(res, 0, new_index)
    new_index.add(combined_embeddings.astype(np.float32))

    # Save
    combined_df.to_parquet(parquet_path, index=False, engine="pyarrow")
    np.save(npy_path, combined_embeddings)

    cpu_index = new_index
    if faiss.get_num_gpus() > 0:
        cpu_index = faiss.index_gpu_to_cpu(new_index)
    faiss.write_index(cpu_index, str(faiss_path))

    # Update manifest
    manifest["total_chunks"] = len(combined_df)
    manifest["total_docs"] = len({r["doc_id"] for r in combined_df.to_dict("records")})
    if "pontos_cantados" not in manifest["categories"]:
        manifest["categories"].append("pontos_cantados")
    manifest["categories"] = sorted(combined_df.category.unique())
    manifest["file_types"] = sorted(combined_df.file_type.unique())
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2))

    from clean_corpus import write_jsonl

    write_jsonl(combined_df, CONTENT_DIR / "chunks.jsonl")

    logger.info(
        "Integrated %d pontos. New corpus: %d chunks, embedding shape %s",
        len(pontos), len(combined_df), combined_embeddings.shape,
    )


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--device", default="cuda", choices=["cuda", "cpu"])
    args = parser.parse_args()
    integrate_pontos(device=args.device)
