#!/usr/bin/env python3
"""
Consulta semântica ao corpus vetorizado.

Uso:
    python query.py "significado de Oxóssi na Umbanda"
    python query.py "ervas para defumação" --top 10 --category fitoterapia
    python query.py "pontos de Ogum" --format jsonl
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

import faiss
import numpy as np
import pandas as pd
from sentence_transformers import SentenceTransformer

CONTENT_DIR = Path(__file__).parent.parent.parent / "conteudo"
MODEL_NAME = "BAAI/bge-m3"


class CorpusQuery:
    def __init__(self, content_dir: Path = CONTENT_DIR, device: str = "cuda"):
        self.content_dir = content_dir
        self.device = device

        manifest_path = content_dir / "manifest.json"
        if not manifest_path.exists():
            raise FileNotFoundError(
                f"Corpus not found at {content_dir}. Run pipeline.py first."
            )
        self.manifest = json.loads(manifest_path.read_text())

        self.df = pd.read_parquet(content_dir / "chunks.parquet")
        self.index = faiss.read_index(str(content_dir / "index.faiss"))
        self.model = SentenceTransformer(MODEL_NAME, device=device)

    def search(
        self,
        query: str,
        top_k: int = 5,
        category: str | None = None,
    ) -> list[dict]:
        q_embedding = self.model.encode(
            [query], normalize_embeddings=True
        ).astype(np.float32)

        if category:
            mask = self.df["category"] == category
            candidate_ids = self.df[mask].index.tolist()
            if not candidate_ids:
                return []
            subset = np.array(candidate_ids)
            subset_vectors = np.array([
                self.index.reconstruct(int(i)) for i in subset
            ])
            scores = (subset_vectors @ q_embedding.T).flatten()
            top_idx_local = np.argsort(-scores)[:top_k]
            top_idx = subset[top_idx_local]
            top_scores = scores[top_idx_local]
        else:
            top_scores, top_idx = self.index.search(q_embedding, top_k)
            top_scores = top_scores.flatten()
            top_idx = top_idx.flatten()

        results = []
        for score, idx in zip(top_scores, top_idx):
            if idx < 0 or idx >= len(self.df):
                continue
            row = self.df.iloc[int(idx)]
            results.append({
                "score": float(score),
                "chunk_id": row["chunk_id"],
                "title": row["title"],
                "category": row["category"],
                "subcategory": row["subcategory"],
                "text": row["text"],
                "char_count": int(row["char_count"]),
                "source_path": row["source_path"],
            })
        return results


def format_results(results: list[dict], fmt: str) -> str:
    if fmt == "json":
        return json.dumps(results, ensure_ascii=False, indent=2)

    if fmt == "jsonl":
        return "\n".join(json.dumps(r, ensure_ascii=False) for r in results)

    lines = []
    for i, r in enumerate(results, 1):
        lines.append(f"--- [{i}] score={r['score']:.4f} | {r['title']} ({r['category']}) ---")
        preview = r["text"][:500]
        if len(r["text"]) > 500:
            preview += "..."
        lines.append(preview)
        lines.append("")
    return "\n".join(lines)


def main() -> None:
    parser = argparse.ArgumentParser(description="Query the Ocultismo corpus")
    parser.add_argument("query", type=str, help="Search query")
    parser.add_argument("--top", type=int, default=5, help="Number of results")
    parser.add_argument("--category", type=str, default=None, help="Filter by category")
    parser.add_argument(
        "--format", type=str, default="text",
        choices=["text", "json", "jsonl"],
        help="Output format",
    )
    parser.add_argument("--device", type=str, default="cuda", choices=["cuda", "cpu"])
    parser.add_argument(
        "--content-dir", type=str, default=None,
        help="Path to content directory (default: auto-detect)",
    )
    args = parser.parse_args()

    content_dir = Path(args.content_dir) if args.content_dir else CONTENT_DIR
    cq = CorpusQuery(content_dir=content_dir, device=args.device)
    results = cq.search(args.query, top_k=args.top, category=args.category)
    output = format_results(results, args.format)
    sys.stdout.write(output + "\n")


if __name__ == "__main__":
    main()
