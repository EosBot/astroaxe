#!/usr/bin/env python3
"""
Scraper profissional de letras de pontos de Umbanda.
Usa curl_cffi (impersona Chrome), múltiplas fontes, retry inteligente.
"""

from __future__ import annotations

import json
import logging
import re
import sys
import time
from pathlib import Path
from urllib.parse import quote_plus, urljoin

from curl_cffi import requests as cffi_requests
from selectolax.parser import HTMLParser

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
    stream=sys.stderr,
)
logger = logging.getLogger(__name__)

CONTENT_DIR = Path("/home/thalis/Projetos/orixas-mapa-astral/conteudo")
CATALOG_FILE = CONTENT_DIR / "pontos_cantados.jsonl"
IMPERSIONATE = "chrome124"
MAX_SEARCHES = 300
DELAY = 2.5


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


def normalize_title(title: str) -> str:
    title = re.sub(r"\s*\d+$", "", title).strip()
    title = re.sub(r"\s*-\s*Pout Pourri$", "", title)
    return title.strip()


# --- Source 1: DuckDuckGo HTML search ---

def search_duckduckgo(query: str) -> list[dict]:
    url = f"https://html.duckduckgo.com/html/?q={quote_plus(query)}"
    try:
        resp = cffi_requests.get(url, impersonate=IMPERSIONATE, timeout=15)
        if resp.status_code != 200:
            return []
        tree = HTMLParser(resp.text)
        results = []
        for a in tree.css("a.result__url"):
            href = a.attributes.get("href", "")
            title_el = a.parent.parent.css_first("a.result__snippet")
            snippet = title_el.text() if title_el else ""
            if href and "letras" in href.lower():
                results.append({"url": href, "snippet": snippet})
            elif href and "umbanda" in snippet.lower():
                results.append({"url": href, "snippet": snippet})
        return results[:5]
    except Exception as e:
        logger.debug("DuckDuckGo search failed: %s", e)
        return []


# --- Source 2: letras.mus.br direct ---

def search_letras_mus(title: str) -> str | None:
    slug = re.sub(r"[^\w\s]", "", title.lower().strip())
    slug = re.sub(r"\s+", "-", slug)
    url = f"https://www.letras.mus.br/umbanda/{slug}/"
    try:
        resp = cffi_requests.get(url, impersonate=IMPERSIONATE, timeout=10)
        if resp.status_code == 200:
            tree = HTMLParser(resp.text)
            lyric_div = tree.css_first(".lyric-text") or tree.css_first("[class*=lyric]")
            if lyric_div:
                text = lyric_div.text(separator="\n").strip()
                if len(text) > 30:
                    return text
        return None
    except Exception as e:
        logger.debug("letras.mus.br direct failed: %s", e)
        return None


# --- Source 3: letras.mus.br search page ---

def search_letras_mus_search(query: str) -> list[dict]:
    url = f"https://www.letras.mus.br/?q={quote_plus(query)}"
    try:
        resp = cffi_requests.get(url, impersonate=IMPERSIONATE, timeout=15, allow_redirects=True)
        if resp.status_code != 200:
            return []
        tree = HTMLParser(resp.text)
        results = []
        for a in tree.css("a"):
            href = a.attributes.get("href", "")
            text = a.text(strip=True)
            if "/umbanda/" in href or "/pontos/" in href:
                full_url = urljoin("https://www.letras.mus.br", href)
                results.append({"url": full_url, "title": text})
        return results[:5]
    except Exception as e:
        logger.debug("letras.mus.br search failed: %s", e)
        return []


# --- Source 4: Google cache/web archive ---

def search_google_cached(query: str) -> list[dict]:
    url = f"https://www.google.com/search?q={quote_plus(query)}&num=5&hl=pt-BR"
    try:
        resp = cffi_requests.get(
            url,
            impersonate=IMPERSIONATE,
            timeout=15,
            headers={
                "Accept": "text/html,application/xhtml+xml",
                "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
            },
        )
        if resp.status_code != 200:
            return []
        tree = HTMLParser(resp.text)
        results = []
        for a in tree.css("a[href]"):
            href = a.attributes.get("href", "")
            if "letras.mus.br" in href or "umbanda" in href.lower():
                if href.startswith("/url?"):
                    href = href.split("url=")[-1].split("&")[0]
                results.append({"url": href})
        return results[:3]
    except Exception as e:
        logger.debug("Google search failed: %s", e)
        return []


# --- Source 5: cifrasantigas / umbanda sites ---

UMBANDA_SITES = [
    "https://www.cifrasantigas.com.br",
    "https://www.pontosdeumbanda.net",
    "https://umbandacasaaberta.com.br",
]


def search_umbanda_sites(title: str) -> str | None:
    query = quote_plus(f"{title} ponto umbanda letra")
    for site in UMBANDA_SITES:
        try:
            url = f"{site}/?s={query}"
            resp = cffi_requests.get(url, impersonate=IMPERSIONATE, timeout=10)
            if resp.status_code == 200:
                tree = HTMLParser(resp.text)
                articles = tree.css("article, .entry-content, .post-content")
                for article in articles:
                    text = article.text(separator="\n").strip()
                    umbanda_kw = ["oxalá", "ogum", "oxóssi", "xangô", "oxum",
                                  "iansã", "iemanjá", "aruanda", "gira", "ponto",
                                  "salve", "saravá", "orixá"]
                    hits = sum(1 for kw in umbanda_kw if kw in text.lower())
                    if hits >= 3 and len(text) > 50:
                        return text[:2000]
        except Exception:
            continue
    return None


# --- Fetch lyrics from a URL ---

def fetch_lyrics_from_url(url: str) -> str | None:
    try:
        resp = cffi_requests.get(url, impersonate=IMPERSIONATE, timeout=15)
        if resp.status_code != 200:
            return None
        tree = HTMLParser(resp.text)

        # Try common lyric selectors
        for selector in [".lyric-text", "[class*=lyric]", "article p", ".cnt-letra"]:
            el = tree.css_first(selector)
            if el:
                text = el.text(separator="\n").strip()
                if len(text) > 30:
                    return text

        # Fallback: find largest text block
        paragraphs = tree.css("p")
        if paragraphs:
            texts = [(p.text().strip(), p) for p in paragraphs]
            texts = [(t, p) for t, p in texts if len(t) > 30]
            if texts:
                longest = max(texts, key=lambda x: len(x[0]))
                return longest[0]

        return None
    except Exception as e:
        logger.debug("Fetch from %s failed: %s", url, e)
        return None


# --- Main search orchestration ---

def search_ponto_lyrics(title: str) -> tuple[str, str]:
    clean = normalize_title(title)

    # Strategy 1: Direct URL on letras.mus.br
    lyrics = search_letras_mus(clean)
    if lyrics:
        return lyrics, f"letras.mus.br/umbanda/{clean}"

    # Strategy 2: DuckDuckGo search
    results = search_duckduckgo(f"{clean} ponto umbanda letra")
    for r in results:
        lyrics = fetch_lyrics_from_url(r["url"])
        if lyrics:
            return lyrics, r["url"]

    # Strategy 3: letras.mus.br search
    results = search_letras_mus_search(f"{clean} umbanda")
    for r in results:
        if clean.lower()[:10] in r.get("title", "").lower():
            lyrics = fetch_lyrics_from_url(r["url"])
            if lyrics:
                return lyrics, r["url"]

    # Strategy 4: Google cached
    results = search_google_cached(f"{clean} ponto umbanda letra site:letras.mus.br")
    for r in results:
        lyrics = fetch_lyrics_from_url(r["url"])
        if lyrics:
            return lyrics, r["url"]

    # Strategy 5: Umbanda-specific sites
    lyrics = search_umbanda_sites(clean)
    if lyrics:
        return lyrics, "umbanda_site_search"

    return "", ""


def main() -> None:
    catalog = load_catalog()
    without_lyrics = [p for p in catalog if not p.get("lyrics")]
    logger.info("Catalog: %d total, %d without lyrics", len(catalog), len(without_lyrics))

    found = 0
    searches = 0

    for ponto in without_lyrics:
        if searches >= MAX_SEARCHES:
            logger.info("Reached max searches (%d)", MAX_SEARCHES)
            break

        title = ponto["title"]
        logger.info("[%d/%d] Searching: %s", searches + 1, MAX_SEARCHES, title)

        lyrics, source = search_ponto_lyrics(title)
        searches += 1

        if lyrics and len(lyrics) > 30:
            ponto["lyrics"] = lyrics
            ponto["lyrics_source"] = source
            found += 1
            logger.info("  ✓ FOUND (%d chars) from %s", len(lyrics), source[:60])
        else:
            logger.info("  ✗ not found")

        time.sleep(DELAY)

    # Save updated catalog
    save_catalog(catalog)
    total_with = sum(1 for p in catalog if p.get("lyrics"))
    logger.info("=" * 60)
    logger.info("Done: %d new lyrics found (%d searches)", found, searches)
    logger.info("Total with lyrics: %d/%d", total_with, len(catalog))
    logger.info("=" * 60)


if __name__ == "__main__":
    main()
