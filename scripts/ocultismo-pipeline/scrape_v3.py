#!/usr/bin/env python3
"""
Scraper v3: busca letras de pontos em sites de Umbanda que funcionam.
Usa DuckDuckGo + sites conhecidos com curl_cffi.

Validação dura: páginas de busca e boilerplate de blog são rejeitados;
só entra no catálogo texto com estrutura de verso e vocabulário de Umbanda.
"""

from __future__ import annotations

import json
import logging
import re
import sys
import time
from pathlib import Path
from urllib.parse import quote_plus, unquote, urlparse

from curl_cffi import requests as cr
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
IMPERSONATE = "chrome124"
DELAY = 2.0
MAX_SEARCHES = 500
MAX_POSTS_PER_SEARCH = 3

# Sites conhecidos; URLs com placeholder {query} são páginas de BUSCA —
# o scraper extrai dali os links dos posts e busca a letra no post real.
UMBANDA_SITES = [
    "https://reidospontos.blogspot.com/search?q={query}",
    "https://umbandadobrasil.com.br/?s={query}",
    "https://girasdeumbanda.com.br/search?query={query}",
]

SEARCH_URL_HINTS = ("search?q=", "?s=", "/search?", "search?query=")

# Domínios sem letra extraível (vídeo, documento bloqueado, rede social).
SKIP_DOMAINS = (
    "youtube.com", "youtu.be", "scribd.com", "facebook.com",
    "instagram.com", "tiktok.com", "spotify.com",
)

BOILERPLATE_MARKERS = (
    "adsbygoogle",
    "Nenhuma postagem correspondente",
    "followersIframe",
    "Postagens (Atom)",
    "gapi.load",
    "Assinar:",
    "REI DOS PONTOS",
    "BLOG DIRECIONADO A CULTURA",
    "Mostrar todas as postagens",
    "Página inicial",
    "Seguidores",
    "window.followersIframeOpen",
    "Compartilhar no",
    "Tecnologia do",
)

# Termos distintivos: substring basta.
UMBANDA_SUBSTR_KEYWORDS = (
    "oxalá", "ogum", "oxóssi", "xangô", "oxum", "iansã",
    "iemanjá", "nanã", "obaluaiê", "exu", "pombagira",
    "aruanda", "terreiro", "congá", "pemba", "saravá",
    "orixá", "caboclo", "preto velho", "baiano", "boiadeiro",
    "marinheiro", "erê", "ibei", "jurema", "ogun", "oxossi",
    "iemanja", "cachoeira", "sereia", "encruzilhada", "calunga",
    "alvorada", "axé", "zambi", "macumba", "são jorge", "babá",
    "espada", "flecha", "coroa",
)

# Termos genéricos do português: só valem como palavra inteira.
UMBANDA_WORD_KEYWORDS = (
    "mar", "mata", "lua", "fé", "rei", "rainha", "gira",
    "ponto", "canto", "guia", "salve", "sereia", "praia",
    "demandas", "demanda",
)
_UMBANDA_WORD_RE = re.compile(
    r"\b(" + "|".join(UMBANDA_WORD_KEYWORDS) + r")\b", re.IGNORECASE
)


def count_umbanda_hits(text_lower: str) -> int:
    hits = sum(1 for kw in UMBANDA_SUBSTR_KEYWORDS if kw in text_lower)
    hits += len(set(m.group(1).lower() for m in _UMBANDA_WORD_RE.finditer(text_lower)))
    return hits

# Category → search terms mapping for better matching
ENTITY_TERMS = {
    "orixá": ["orixá", "ponto de umbanda"],
    "exu_pombagira": ["exu", "pombagira", "ponto de esquerda"],
    "caboclo": ["caboclo", "ponto de caboclo"],
    "preto_velho": ["preto velho", "ponto de preto velho"],
    "baiano": ["baiano", "ponto de baiano"],
    "boiadeiro": ["boiadeiro"],
    "marinheiro": ["marinheiro"],
    "cigano": ["cigano", "ponto cigano"],
    "erê": ["erê", "cosme e damião", "ibejada"],
}

POST_LINK_SELECTORS = (
    "h3.post-title a",
    ".post-title a",
    ".entry-title a",
    "h2 a",
    "h3 a",
    "article a",
)


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


def is_boilerplate(text: str) -> bool:
    return any(marker in text for marker in BOILERPLATE_MARKERS)


def _title_anchor(text_lower: str, title: str) -> bool:
    """Alguma palavra relevante do título aparece no texto."""
    words = [w for w in re.split(r"\W+", normalize_title(title).lower()) if len(w) >= 4]
    return any(w in text_lower for w in words)


def looks_like_lyrics(
    text: str,
    title: str | None = None,
    entity_name: str | None = None,
) -> bool:
    """Texto precisa ter estrutura de verso e vocabulário de Umbanda.

    Com 2+ termos de Umbanda, aceita direto. Com 1 termo, exige âncora:
    o título do ponto ou o nome da entidade mencionado no texto.
    """
    if not text or len(text) < 50 or is_boilerplate(text):
        return False

    lines = [ln.strip() for ln in text.splitlines() if ln.strip()]
    if len(lines) < 4:
        return False

    avg_line_len = sum(len(ln) for ln in lines) / len(lines)
    if avg_line_len > 60:
        return False

    text_lower = text.lower()
    hits = count_umbanda_hits(text_lower)
    if hits >= 2:
        return True
    if hits >= 1:
        if title and _title_anchor(text_lower, title):
            return True
        if entity_name and entity_name.lower() in text_lower:
            return True
    return False


def clean_extracted_text(text: str) -> str:
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def extract_post_urls(html: str, source_url: str) -> list[str]:
    """Extrai links de posts reais de uma página de busca."""
    tree = HTMLParser(html)
    source_host = urlparse(source_url).netloc
    seen: set[str] = set()
    urls: list[str] = []

    for selector in POST_LINK_SELECTORS:
        for a in tree.css(selector):
            href = a.attributes.get("href", "")
            if not href.startswith("http"):
                continue
            parsed = urlparse(href)
            if parsed.netloc != source_host:
                continue
            if any(hint in href for hint in SEARCH_URL_HINTS):
                continue
            label = (a.text() or "").strip()
            if len(label) < 8:
                continue
            if href not in seen:
                seen.add(href)
                urls.append(href)
        if urls:
            break

    return urls[:MAX_POSTS_PER_SEARCH]


def extract_lyrics_from_page(html: str) -> str | None:
    """Extrai texto com aparência de letra de um POST/artigo real."""
    tree = HTMLParser(html)

    for selector in (".entry-content", "article", ".post-content", ".post-body", "main"):
        for el in tree.css(selector):
            text = clean_extracted_text(el.text(separator="\n"))
            if looks_like_lyrics(text):
                return text[:3000]

    return None


def is_search_page(url: str) -> bool:
    return any(hint in url for hint in SEARCH_URL_HINTS)


def fetch_lyrics_at(url: str) -> str | None:
    """Busca letra em uma URL; se for página de busca, segue os posts."""
    try:
        resp = cr.get(url, impersonate=IMPERSONATE, timeout=15)
        if resp.status_code != 200:
            return None
    except Exception as e:
        logger.debug("Fetch %s failed: %s", url[:60], e)
        return None

    if is_search_page(url):
        for post_url in extract_post_urls(resp.text, url):
            lyrics = fetch_post_lyrics(post_url)
            if lyrics:
                return lyrics
        return None

    return extract_lyrics_from_page(resp.text)


def fetch_post_lyrics(post_url: str) -> str | None:
    try:
        resp = cr.get(post_url, impersonate=IMPERSONATE, timeout=15)
        if resp.status_code != 200:
            return None
        return extract_lyrics_from_page(resp.text)
    except Exception as e:
        logger.debug("Post fetch %s failed: %s", post_url[:60], e)
        return None


def search_duckduckgo(query: str) -> list[str]:
    """Search DuckDuckGo and return result URLs."""
    url = f"https://html.duckduckgo.com/html/?q={quote_plus(query)}"
    try:
        resp = cr.get(url, impersonate=IMPERSONATE, timeout=15)
        if resp.status_code != 200:
            return []

        tree = HTMLParser(resp.text)
        urls = []
        for a in tree.css("a.result__url"):
            href = (a.attributes.get("href") or "").strip()
            if href.startswith("//"):
                href = "https:" + href
            # DuckDuckGo wraps URLs in redirect
            if "uddg=" in href:
                href = unquote(href.split("uddg=")[-1].split("&")[0])
            if not href.startswith("http"):
                continue
            if any(skip in href for skip in SKIP_DOMAINS):
                continue
            urls.append(href)
        return urls[:5]
    except Exception as e:
        logger.debug("DDG search failed: %s", e)
        return []


def search_ponto(title: str, entity_type: str, entity_name: str) -> tuple[str, str]:
    """Search for a ponto's lyrics using multiple strategies."""
    clean = normalize_title(title)
    terms = ENTITY_TERMS.get(entity_type, ["ponto de umbanda"])

    def valid(lyrics: str) -> bool:
        return looks_like_lyrics(lyrics, title=title, entity_name=entity_name)

    # Strategy 1: Search DuckDuckGo
    query = f"{clean} {terms[0]}"
    for url in search_duckduckgo(query):
        lyrics = fetch_lyrics_at(url)
        if lyrics and valid(lyrics):
            return lyrics, url

    # Strategy 2: Try known Umbanda sites (search pages → follow posts)
    for site_template in UMBANDA_SITES:
        site_url = site_template.format(query=quote_plus(clean))
        lyrics = fetch_lyrics_at(site_url)
        if lyrics and valid(lyrics):
            return lyrics, site_url

    # Strategy 3: Try DuckDuckGo with different terms
    for term in terms[1:]:
        query = f"{clean} {term}"
        for url in search_duckduckgo(query):
            lyrics = fetch_lyrics_at(url)
            if lyrics and valid(lyrics):
                return lyrics, url

    return "", ""


def main() -> None:
    catalog = load_catalog()
    without_lyrics = [p for p in catalog if not (p.get("lyrics") or "").strip()]
    logger.info("Catalog: %d total, %d without lyrics", len(catalog), len(without_lyrics))

    found = 0
    searches = 0

    for ponto in without_lyrics:
        if searches >= MAX_SEARCHES:
            logger.info("Reached max searches (%d)", MAX_SEARCHES)
            break

        title = ponto["title"]
        entity_type = ponto.get("entity_type", "geral")
        entity_name = ponto.get("entity_name", "")
        logger.info("[%d/%d] Searching: %s (%s)", searches + 1, len(without_lyrics), title, entity_type)

        lyrics, source = search_ponto(title, entity_type, entity_name)
        searches += 1

        if lyrics and looks_like_lyrics(lyrics, title=title, entity_name=entity_name):
            ponto["lyrics"] = lyrics
            ponto["lyrics_source"] = source
            found += 1
            logger.info("  ✓ FOUND (%d chars)", len(lyrics))
        else:
            logger.info("  ✗ not found")

        time.sleep(DELAY)

    save_catalog(catalog)
    total_with = sum(1 for p in catalog if (p.get("lyrics") or "").strip())
    logger.info("=" * 60)
    logger.info("Done: %d new lyrics (%d searches)", found, searches)
    logger.info("Total with lyrics: %d/%d", total_with, len(catalog))
    logger.info("=" * 60)


if __name__ == "__main__":
    main()
