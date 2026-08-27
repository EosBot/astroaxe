#!/usr/bin/env python3
"""
Catálogo de pontos cantados de Umbanda com busca de letras online.
Gera JSONL estruturado para inclusão no corpus vetorizado.

Uso:
    python pontos_catalog.py --output ../../conteudo/pontos_cantados.jsonl
"""

from __future__ import annotations

import argparse
import json
import logging
import re
import sys
import time
from dataclasses import asdict, dataclass, field
from pathlib import Path
from urllib.parse import quote_plus

import requests

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger(__name__)

PONTOS_ROOT = Path("/mnt/e/Ocultismo/Pontos")
HEADERS = {
    "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
}
REQUEST_DELAY = 2.0


@dataclass
class PontoCantado:
    ponto_id: str
    title: str
    category: str
    subcategory: str
    entity_type: str
    entity_name: str
    file_path: str
    lyrics: str = ""
    lyrics_source: str = ""
    metadata: dict = field(default_factory=dict)


def classify_entity(subcategory: str) -> tuple[str, str]:
    orixas = {
        "Mãe Egunitá", "Mãe Ewá", "Mãe Iansã", "Mãe Iemanjá",
        "Mãe Nanã Buruquê", "Mãe Obá", "Mãe Oxum", "Mãe Oyá",
        "Pai Obaluaiê", "Pai Ogum", "Pai Omolu", "Pai Oxalá",
        "Pai Oxumarê", "Pai Oxóssi", "Pai Xangô",
    }
    guias_map = {
        "Baianos": "baiano",
        "Boiadeiros": "boiadeiro",
        "Caboclos": "caboclo",
        "Ciganos": "cigano",
        "Erês": "erê",
        "Esquerda": "exu_pombagira",
        "Marinheiros": "marinheiro",
        "Pretos Velhos": "preto_velho",
    }

    if subcategory in orixas:
        return "orixá", subcategory
    for key, entity_type in guias_map.items():
        if key in subcategory:
            return entity_type, subcategory
    return "geral", subcategory


def collect_pontos(root: Path) -> list[PontoCantado]:
    pontos: list[PontoCantado] = []

    for mp3 in sorted(root.rglob("*.mp3")):
        rel = mp3.relative_to(root)
        parts = rel.parts
        subcategory = parts[0] if len(parts) > 1 else "Geral"
        entity_type, entity_name = classify_entity(subcategory)
        title = mp3.stem

        ponto_id = f"ponto_{len(pontos):04d}"
        pontos.append(
            PontoCantado(
                ponto_id=ponto_id,
                title=title,
                category="pontos_cantados",
                subcategory=subcategory,
                entity_type=entity_type,
                entity_name=entity_name,
                file_path=str(mp3),
            )
        )

    logger.info("Cataloged %d pontos cantados", len(pontos))
    return pontos


def search_lyrics_online(title: str, entity_name: str) -> tuple[str, str]:
    """Try to find lyrics from known Umbanda lyrics sites."""
    clean_title = re.sub(r"\s*\d+$", "", title).strip()
    search_query = f"{clean_title} ponto umbanda letra"

    # Strategy: search Google for the lyrics text
    search_urls = [
        f"https://www.google.com/search?q={quote_plus(search_query)}&num=3",
    ]

    for url in search_urls:
        try:
            resp = requests.get(url, headers=HEADERS, timeout=10)
            if resp.status_code != 200:
                continue

            text = resp.text
            # Extract snippets that look like lyrics (multi-line, with common Umbanda words)
            umbanda_keywords = [
                "oxalá", "ogum", "oxóssi", "xangô", "oxum", "iansã",
                "iemanjá", "nanã", "obaluaiê", "exu", "pombagira",
                "aruanda", "gira", "terreiro", "congá", "pemba",
                "saravá", "salve", "orixá", "guia", "caboclo",
                "preto velho", "baiano", "boiadeiro", "marinheiro",
                "erê", "ibei", "ponto", "canto",
            ]
            text_lower = text.lower()
            keyword_hits = sum(1 for kw in umbanda_keywords if kw in text_lower)

            if keyword_hits >= 3:
                # Extract readable text snippets
                snippets = re.findall(r">([^<]{40,300})<", text)
                relevant = [
                    s for s in snippets
                    if any(kw in s.lower() for kw in umbanda_keywords)
                    and not s.startswith("http")
                    and not s.startswith("www")
                ]
                if relevant:
                    lyrics = "\n".join(relevant[:10])
                    # Clean HTML entities
                    lyrics = re.sub(r"&[a-z]+;", " ", lyrics)
                    lyrics = re.sub(r"\s+", " ", lyrics).strip()
                    if len(lyrics) > 50:
                        return lyrics, url
        except Exception as e:
            logger.debug("Search failed for '%s': %s", title, e)

    return "", ""


def enrich_with_lyrics(pontos: list[PontoCantado]) -> list[PontoCantado]:
    found = 0
    for i, ponto in enumerate(pontos):
        if ponto.title.startswith("AlbumArt") or ponto.title.startswith("Folder"):
            continue

        logger.info("[%d/%d] Searching: %s (%s)", i + 1, len(pontos), ponto.title, ponto.entity_name)
        lyrics, source = search_lyrics_online(ponto.title, ponto.entity_name)
        if lyrics:
            ponto.lyrics = lyrics
            ponto.lyrics_source = source
            found += 1
            logger.info("  Found lyrics (%d chars)", len(lyrics))

        time.sleep(REQUEST_DELAY)

    logger.info("Lyrics found for %d/%d pontos", found, len(pontos))
    return pontos


def save_catalog(pontos: list[PontoCantado], output_path: Path) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)

    with output_path.open("w", encoding="utf-8") as f:
        for ponto in pontos:
            entry = asdict(ponto)
            f.write(json.dumps(entry, ensure_ascii=False) + "\n")

    with_lyrics = sum(1 for p in pontos if p.lyrics)
    logger.info(
        "Catalog saved: %s (%d pontos, %d with lyrics)",
        output_path, len(pontos), with_lyrics,
    )


def main() -> None:
    parser = argparse.ArgumentParser(description="Pontos cantados catalog")
    parser.add_argument(
        "--output", type=str,
        default="/home/thalis/Projetos/orixas-mapa-astral/conteudo/pontos_cantados.jsonl",
    )
    parser.add_argument("--no-search", action="store_true", help="Skip online lyrics search")
    args = parser.parse_args()

    pontos = collect_pontos(PONTOS_ROOT)

    if not args.no_search:
        pontos = enrich_with_lyrics(pontos)

    save_catalog(pontos, Path(args.output))


if __name__ == "__main__":
    main()
