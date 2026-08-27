#!/usr/bin/env python3
"""
Refina letras que vieram como página inteira (vários pontos numerados):
segmenta pelos marcadores 'N-' e mantém o segmento que casa com o título.
Idempotente — pode rodar depois de cada coleta.

Uso:
    python refine_lyrics.py [--dry-run]
"""

from __future__ import annotations

import argparse
import json
import logging
import re
import sys
import unicodedata
from pathlib import Path

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
    stream=sys.stderr,
)
logger = logging.getLogger(__name__)

CONTENT_DIR = Path("/home/thalis/Projetos/orixas-mapa-astral/conteudo")
CATALOG_FILE = CONTENT_DIR / "pontos_cantados.jsonl"

_PONTO_MARKER = re.compile(r"^\d{1,3}\s*-\s*$", re.MULTILINE)


def fold(text: str) -> str:
    text = unicodedata.normalize("NFD", text.lower())
    return "".join(c for c in text if unicodedata.category(c) != "Mn")


def title_words(title: str) -> list[str]:
    clean = re.sub(r"\s*\d+$", "", title).strip()
    clean = re.sub(r"\s*-\s*Pout Pourri$", "", clean)
    words = re.split(r"\W+", fold(clean))
    return [w for w in words if len(w) >= 4]


def segment_lyrics(text: str) -> list[str]:
    parts = _PONTO_MARKER.split(text)
    return [p.strip() for p in parts if p and len(p.strip()) >= 30]


def best_segment(text: str, title: str, entity_name: str) -> str | None:
    """Retorna o segmento que casa com o título, ou None se nenhum casa."""
    words = title_words(title)
    entity_folded = fold(entity_name) if entity_name else ""
    segments = segment_lyrics(text)
    if len(segments) < 2:
        return None

    best: str | None = None
    best_score = 0
    for seg in segments:
        seg_folded = fold(seg)
        if words and all(w in seg_folded for w in words):
            score = len(words) * 100 + len(seg)
        elif words and sum(1 for w in words if w in seg_folded) >= max(1, len(words) - 1) and entity_folded and entity_folded in seg_folded:
            score = len(words) * 50 + len(seg)
        else:
            continue
        if score > best_score:
            best_score = score
            best = seg

    return best


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    rows = [json.loads(l) for l in CATALOG_FILE.open(encoding="utf-8")]
    refined = 0
    kept_full = 0

    for r in rows:
        lyrics = (r.get("lyrics") or "").strip()
        if not lyrics or "#refinada" in (r.get("lyrics_source") or ""):
            continue
        if not _PONTO_MARKER.search(lyrics):
            continue

        seg = best_segment(lyrics, r["title"], r.get("entity_name", ""))
        if seg:
            refined += 1
            logger.info("  ✓ %s → segmento de %d chars", r["title"], len(seg))
            if not args.dry_run:
                r["lyrics"] = seg[:3000]
                r["lyrics_source"] = (r.get("lyrics_source") or "") + "#refinada"
        else:
            kept_full += 1
            logger.info("  = %s: nenhum segmento casa, mantém página inteira", r["title"])

    if not args.dry_run:
        with CATALOG_FILE.open("w", encoding="utf-8") as f:
            for r in rows:
                f.write(json.dumps(r, ensure_ascii=False) + "\n")

    logger.info("Refinadas: %d | mantidas inteiras: %d (dry_run=%s)", refined, kept_full, args.dry_run)


if __name__ == "__main__":
    main()
