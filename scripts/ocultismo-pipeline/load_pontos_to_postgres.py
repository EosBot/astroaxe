#!/usr/bin/env python3
"""
Carrega o catálogo de pontos cantados no Postgres.

Entra a **letra**, e não o áudio: foi decisão do dono. O catálogo traz 538
pontos, dos quais 216 com letra validada. Os demais são carregados assim mesmo,
com `lyrics_status` dizendo que a letra falta — sumir da lista esconderia o
tamanho real do acervo, e preencher seria inventar letra de ponto, que é pior.

O campo `file_path` do catálogo aponta para arquivos de áudio no disco de origem
e **não é carregado**: não serve ao produto e seria caminho de máquina alheia
guardado sem motivo.

Uso:
    DATABASE_URL=postgresql://... python load_pontos_to_postgres.py
"""

from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path

import psycopg

CONTENT_DIR = Path(__file__).parent.parent.parent / "conteudo"


def main() -> int:
    parser = argparse.ArgumentParser(description="Carrega pontos cantados no Postgres.")
    parser.add_argument("--content-dir", type=Path, default=CONTENT_DIR)
    args = parser.parse_args()

    database_url = os.environ.get("DATABASE_URL")
    if not database_url:
        print("DATABASE_URL não definida.", file=sys.stderr)
        return 1

    caminho = args.content_dir / "pontos_cantados.jsonl"
    with caminho.open(encoding="utf-8") as handle:
        pontos = [json.loads(line) for line in handle if line.strip()]

    linhas = [
        (
            ponto["ponto_id"],
            ponto["title"][:300],
            ponto["category"][:60],
            (ponto.get("subcategory") or "")[:120],
            (ponto.get("entity_type") or "")[:60],
            (ponto.get("entity_name") or "")[:160],
            ponto.get("lyrics") or None,
            ponto.get("lyrics_source") or None,
            (ponto.get("lyrics_status") or "ausente")[:40],
        )
        for ponto in pontos
    ]

    with psycopg.connect(database_url) as connection:
        with connection.cursor() as cursor:
            cursor.executemany(
                """
                INSERT INTO sung_points
                    (ponto_id, title, category, subcategory, entity_type,
                     entity_name, lyrics, lyrics_source, lyrics_status)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (ponto_id) DO UPDATE SET
                    title = EXCLUDED.title,
                    lyrics = EXCLUDED.lyrics,
                    lyrics_source = EXCLUDED.lyrics_source,
                    lyrics_status = EXCLUDED.lyrics_status
                """,
                linhas,
            )
        connection.commit()

    com_letra = sum(1 for ponto in pontos if ponto.get("lyrics"))
    print(f"{len(pontos)} pontos carregados, {com_letra} com letra.", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
