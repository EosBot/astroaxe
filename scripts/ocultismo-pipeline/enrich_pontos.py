#!/usr/bin/env python3
"""
Enriquece o catálogo de pontos cantados com letras conhecidas e busca online.
"""

from __future__ import annotations

import json
import logging
import re
import sys
from pathlib import Path

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger(__name__)

CONTENT_DIR = Path("/home/thalis/Projetos/orixas-mapa-astral/conteudo")
LETRAS_FILE = Path(__file__).parent / "letras_conhecidas.json"
CATALOG_FILE = CONTENT_DIR / "pontos_cantados.jsonl"


def load_letras() -> dict[str, dict[str, str]]:
    data = json.loads(LETRAS_FILE.read_text(encoding="utf-8"))
    return data


def normalize_title(title: str) -> str:
    title = title.lower().strip()
    title = re.sub(r"\s*\d+$", "", title)
    title = re.sub(r"[^\w\sàáâãéêíóôõúç]", "", title)
    title = re.sub(r"\s+", " ", title).strip()
    return title


def find_matching_lyrics(ponto_title: str, letras: dict) -> tuple[str, str]:
    norm = normalize_title(ponto_title)

    for entity, pontos_letras in letras.items():
        for letra_title, letra_text in pontos_letras.items():
            letra_norm = normalize_title(letra_title)
            if norm == letra_norm or letra_norm in norm or norm in letra_norm:
                return letra_text, f"letras_conhecidas:{entity}/{letra_title}"

    return "", ""


def enrich_catalog() -> None:
    letras = load_letras()
    logger.info("Loaded %d entity groups with lyrics", len(letras))

    catalog: list[dict] = []
    with CATALOG_FILE.open("r", encoding="utf-8") as f:
        for line in f:
            catalog.append(json.loads(line))

    enriched = 0
    for ponto in catalog:
        if ponto.get("lyrics"):
            continue
        lyrics, source = find_matching_lyrics(ponto["title"], letras)
        if lyrics:
            ponto["lyrics"] = lyrics
            ponto["lyrics_source"] = source
            enriched += 1

    with CATALOG_FILE.open("w", encoding="utf-8") as f:
        for ponto in catalog:
            f.write(json.dumps(ponto, ensure_ascii=False) + "\n")

    total_with = sum(1 for p in catalog if p.get("lyrics"))
    logger.info(
        "Enriched %d pontos. Total with lyrics: %d/%d",
        enriched, total_with, len(catalog),
    )


if __name__ == "__main__":
    enrich_catalog()
