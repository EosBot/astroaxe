#!/usr/bin/env python3
"""
Busca letras de pontos no letras.mus.br e integra ao catálogo.
"""

from __future__ import annotations

import json
import logging
import re
import sys
import time
from pathlib import Path
from urllib.parse import quote_plus, urljoin

import requests
from bs4 import BeautifulSoup

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger(__name__)

CONTENT_DIR = Path("/home/thalis/Projetos/orixas-mapa-astral/conteudo")
CATALOG_FILE = CONTENT_DIR / "pontos_cantados.jsonl"
BASE_URL = "https://www.letras.mus.br"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36",
    "Accept-Language": "pt-BR,pt;q=0.9",
}
REQUEST_DELAY = 1.5
MAX_SEARCHES = 200


def normalize_for_search(title: str) -> str:
    title = re.sub(r"\s*\d+$", "", title).strip()
    title = re.sub(r"\s*-\s*Pout Pourri$", "", title)
    return title


def search_letras(query: str) -> list[dict]:
    url = f"{BASE_URL}/busca/?q={quote_plus(query)}"
    try:
        resp = requests.get(url, headers=HEADERS, timeout=15)
        if resp.status_code != 200:
            return []
        soup = BeautifulSoup(resp.text, "html.parser")
        results = []
        for a in soup.select("a[href*='/umbanda/'], a[href*='/pontos/']"):
            href = a.get("href", "")
            if href and href != "/umbanda/":
                results.append({"url": urljoin(BASE_URL, href), "title": a.get_text(strip=True)})
        return results[:5]
    except Exception as e:
        logger.debug("Search failed for '%s': %s", query, e)
        return []


def fetch_lyrics(url: str) -> str:
    try:
        resp = requests.get(url, headers=HEADERS, timeout=15)
        if resp.status_code != 200:
            return ""
        soup = BeautifulSoup(resp.text, "html.parser")
        # lyrics.mus.br uses div.lyric-text or article.lyric-content
        lyric_div = soup.select_one(".lyric-text, .lyric-content, article p")
        if lyric_div:
            # Get text preserving line breaks
            for br in lyric_div.find_all("br"):
                br.replace_with("\n")
            text = lyric_div.get_text()
            text = re.sub(r"\n{3,}", "\n\n", text)
            return text.strip()
        # Fallback: look for the largest text block
        paragraphs = soup.select("p")
        if paragraphs:
            longest = max(paragraphs, key=lambda p: len(p.get_text()))
            if len(longest.get_text()) > 100:
                return longest.get_text().strip()
        return ""
    except Exception as e:
        logger.debug("Fetch failed for %s: %s", url, e)
        return ""


def load_catalog() -> list[dict]:
    catalog = []
    with CATALOG_FILE.open("r", encoding="utf-8") as f:
        for line in f:
            catalog.append(json.loads(line))
    return catalog


def save_catalog(catalog: list[dict]) -> None:
    with CATALOG_FILE.open("w", encoding="utf-8") as f:
        for ponto in catalog:
            f.write(json.dumps(ponto, ensure_ascii=False) + "\n")


def main() -> None:
    catalog = load_catalog()
    logger.info("Loaded %d pontos from catalog", len(catalog))

    without_lyrics = [p for p in catalog if not p.get("lyrics")]
    logger.info("%d pontos without lyrics to search", len(without_lyrics))

    searches = 0
    found = 0

    for ponto in without_lyrics:
        if searches >= MAX_SEARCHES:
            logger.info("Reached max searches (%d), stopping", MAX_SEARCHES)
            break

        title = normalize_for_search(ponto["title"])
        query = f"{title} umbanda"

        logger.info("[%d/%d] Searching: %s", searches + 1, MAX_SEARCHES, title)
        results = search_letras(query)
        searches += 1
        time.sleep(REQUEST_DELAY)

        for result in results:
            result_title = normalize_for_search(result["title"])
            ponto_norm = normalize_for_search(ponto["title"]).lower()
            result_norm = result_title.lower()

            if ponto_norm in result_norm or result_norm in ponto_norm:
                lyrics = fetch_lyrics(result["url"])
                if lyrics and len(lyrics) > 30:
                    ponto["lyrics"] = lyrics
                    ponto["lyrics_source"] = result["url"]
                    found += 1
                    logger.info("  Found! (%d chars) %s", len(lyrics), result["url"])
                    time.sleep(REQUEST_DELAY)
                    break
                searches += 1
                time.sleep(REQUEST_DELAY)

    save_catalog(catalog)
    total_with = sum(1 for p in catalog if p.get("lyrics"))
    logger.info(
        "Done. Found %d new lyrics. Total: %d/%d with lyrics (%d searches)",
        found, total_with, len(catalog), searches,
    )


if __name__ == "__main__":
    main()
