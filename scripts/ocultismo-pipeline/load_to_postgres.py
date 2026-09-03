#!/usr/bin/env python3
"""
Carrega o acervo vetorizado no Postgres.

Até aqui o corpus só existia como arquivos que a pipeline Python sabia ler:
`chunks.jsonl` para o texto e `embeddings.npy` para os vetores. A aplicação não
alcançava nada disso, e sem alcance qualquer conteúdo ritual escrito no produto
seria invenção de quem programa.

Este script é carga, e não serviço: roda à mão, uma vez por versão do acervo. Em
produção não há Python — a aplicação consulta `corpus_chunks` por similaridade,
em SQL puro, usando vetores de assunto calculados fora do ar.

Uso:
    DATABASE_URL=postgresql://... python load_to_postgres.py
    DATABASE_URL=postgresql://... python load_to_postgres.py --batch 500
"""

from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path

import numpy as np
import psycopg

CONTENT_DIR = Path(__file__).parent.parent.parent / "conteudo"
EXPECTED_DIMENSIONS = 1024


def vector_literal(row: np.ndarray) -> str:
    """Formato textual que o pgvector aceita: `[0.1,0.2,...]`."""
    return "[" + ",".join(f"{value:.7f}" for value in row) + "]"


def load_chunks(content_dir: Path) -> list[dict]:
    with (content_dir / "chunks.jsonl").open(encoding="utf-8") as handle:
        return [json.loads(line) for line in handle if line.strip()]


def main() -> int:
    parser = argparse.ArgumentParser(description="Carrega chunks e vetores no Postgres.")
    parser.add_argument("--batch", type=int, default=500, help="linhas por lote")
    parser.add_argument("--content-dir", type=Path, default=CONTENT_DIR)
    args = parser.parse_args()

    database_url = os.environ.get("DATABASE_URL")
    if not database_url:
        print("DATABASE_URL não definida.", file=sys.stderr)
        return 1

    embeddings = np.load(args.content_dir / "embeddings.npy")
    chunks = load_chunks(args.content_dir)

    # Um desalinhamento aqui produziria trechos com o vetor de outro texto, e a
    # busca passaria a devolver coisa plausível e errada — o pior modo de falhar.
    if len(chunks) != len(embeddings):
        print(
            f"chunks ({len(chunks)}) e vetores ({len(embeddings)}) não batem.",
            file=sys.stderr,
        )
        return 1
    if embeddings.shape[1] != EXPECTED_DIMENSIONS:
        print(
            f"esperava {EXPECTED_DIMENSIONS} dimensões, veio {embeddings.shape[1]}.",
            file=sys.stderr,
        )
        return 1

    inserted = 0
    with psycopg.connect(database_url) as connection:
        with connection.cursor() as cursor:
            for start in range(0, len(chunks), args.batch):
                lote = chunks[start : start + args.batch]
                vetores = embeddings[start : start + args.batch]
                cursor.executemany(
                    """
                    INSERT INTO corpus_chunks
                        (chunk_id, doc_id, title, category, subcategory,
                         chunk_index, text, char_count, embedding)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (chunk_id) DO UPDATE SET
                        text = EXCLUDED.text,
                        embedding = EXCLUDED.embedding,
                        title = EXCLUDED.title,
                        category = EXCLUDED.category,
                        subcategory = EXCLUDED.subcategory,
                        char_count = EXCLUDED.char_count
                    """,
                    [
                        (
                            chunk["id"],
                            # `id` tem a forma `<documento>_<índice>`: o documento
                            # e a posição saem dele sem inventar nada.
                            chunk["id"].rsplit("_", 1)[0],
                            chunk["title"][:400],
                            chunk["category"][:60],
                            (chunk.get("subcategory") or "")[:60],
                            int(chunk["id"].rsplit("_", 1)[1]),
                            chunk["text"],
                            len(chunk["text"]),
                            vector_literal(vetor),
                        )
                        for chunk, vetor in zip(lote, vetores)
                    ],
                )
                inserted += len(lote)
                print(f"  {inserted}/{len(chunks)}", end="\r", file=sys.stderr)
        connection.commit()

    print(f"\n{inserted} trechos carregados.", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
