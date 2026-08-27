#!/usr/bin/env python3
"""
Coleta as páginas estáticas (/p/) do blog Rei dos Pontos — cada página traz
dezenas de pontos numerados por linha de entidade — e casa offline com o
catálogo por âncora de título. Mais barato e mais preciso que busca por ponto.

Uso:
    python scrape_pages.py [--dry-run]
"""

from __future__ import annotations

import argparse
import json
import logging
import re
import sys
import time
import unicodedata
from pathlib import Path

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
PAGES_FILE = CONTENT_DIR / "pontos_paginas.jsonl"
IMPERSONATE = "chrome124"
DELAY = 2.0
BLOG_ROOT = "https://reidospontos.blogspot.com"
SEED_URLS = (
    f"{BLOG_ROOT}/p/pontos-de-caboclos.html",
    f"{BLOG_ROOT}/",
)

_PONTO_MARKER = re.compile(r"^\d{1,3}\s*-\s*$")


def fold(text: str) -> str:
    """Minúsculas e sem acentos, para comparação tolerante."""
    text = unicodedata.normalize("NFD", text.lower())
    return "".join(c for c in text if unicodedata.category(c) != "Mn")


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


def collect_page_urls() -> list[str]:
    """Descobre todas as páginas /p/ do blog a partir de páginas-semente."""
    seen: set[str] = set()
    urls: list[str] = []
    for seed in SEED_URLS:
        try:
            resp = cr.get(seed, impersonate=IMPERSONATE, timeout=20)
            if resp.status_code != 200:
                continue
            tree = HTMLParser(resp.text)
            for a in tree.css("a"):
                href = a.attributes.get("href") or ""
                if href.startswith(f"{BLOG_ROOT}/p/") and href.endswith(".html"):
                    if href not in seen:
                        seen.add(href)
                        urls.append(href)
            time.sleep(DELAY)
        except Exception as e:
            logger.warning("Seed %s failed: %s", seed, e)
    return urls


def split_pontos(lines: list[str]) -> list[str]:
    """Divide o conteúdo da página em pontos pelos marcadores 'N-'."""
    pontos: list[str] = []
    current: list[str] = []
    for line in lines:
        if _PONTO_MARKER.match(line):
            if len(current) >= 3:
                pontos.append("\n".join(current).strip())
            current = []
        else:
            current.append(line)
    if len(current) >= 3:
        pontos.append("\n".join(current).strip())
    return pontos


def fetch_page_pontos(url: str) -> tuple[str, list[str]]:
    resp = cr.get(url, impersonate=IMPERSONATE, timeout=20)
    if resp.status_code != 200:
        return "", []
    tree = HTMLParser(resp.text)
    el = tree.css_first(".entry-content, .post-body, article")
    if el is None:
        return "", []

    title_el = tree.css_first("h1.post-title, h1.entry-title, title")
    page_title = (title_el.text() or "").strip() if title_el else ""

    lines = [ln.strip() for ln in el.text(separator="\n").splitlines() if ln.strip()]
    return page_title, split_pontos(lines)


def title_words(title: str) -> list[str]:
    clean = re.sub(r"\s*\d+$", "", title).strip()
    clean = re.sub(r"\s*-\s*Pout Pourri$", "", clean)
    words = re.split(r"\W+", fold(clean))
    return [w for w in words if len(w) >= 4]


def match_catalog(
    catalog: list[dict],
    page_pontos: list[dict],
    dry_run: bool,
) -> int:
    found = 0
    for ponto in catalog:
        if (ponto.get("lyrics") or "").strip():
            continue

        words = title_words(ponto["title"])
        if not words:
            continue

        best: dict | None = None
        best_score = 0.0
        for cand in page_pontos:
            cand_folded = cand["folded"]
            matched = sum(1 for w in words if w in cand_folded)
            if len(words) == 1:
                # Uma palavra só no título: exige também a entidade no texto.
                entity = fold(ponto.get("entity_name") or "")
                if matched < 1 or not entity or entity not in cand_folded:
                    continue
            elif matched < len(words):
                continue
            score = matched / len(words) + len(cand["text"]) / 100_000
            if score > best_score:
                best_score = score
                best = cand

        if best:
            found += 1
            if not dry_run:
                ponto["lyrics"] = best["text"][:3000]
                ponto["lyrics_source"] = f"{best['page_url']}#paginas"
            logger.info(
                "  ✓ %s ← %s (ponto %d da página)",
                ponto["title"],
                best["page_title"] or best["page_url"],
                best["idx"],
            )

    return found


def main() -> None:
    parser = argparse.ArgumentParser(description="Coleta páginas estáticas de pontos")
    parser.add_argument("--dry-run", action="store_true", help="Não grava o catálogo")
    args = parser.parse_args()

    logger.info("Discovering /p/ pages...")
    page_urls = collect_page_urls()
    logger.info("Found %d pages", len(page_urls))

    page_pontos: list[dict] = []
    for i, url in enumerate(page_urls, 1):
        logger.info("[%d/%d] %s", i, len(page_urls), url)
        try:
            page_title, pontos = fetch_page_pontos(url)
        except Exception as e:
            logger.warning("  fetch failed: %s", e)
            time.sleep(DELAY)
            continue
        logger.info("  %d pontos (%s)", len(pontos), page_title or "sem título")
        for idx, text in enumerate(pontos):
            page_pontos.append({
                "page_url": url,
                "page_title": page_title,
                "idx": idx,
                "text": text,
                "folded": fold(text),
            })
        time.sleep(DELAY)

    if not args.dry_run:
        with PAGES_FILE.open("w", encoding="utf-8") as f:
            for p in page_pontos:
                row = {k: v for k, v in p.items() if k != "folded"}
                f.write(json.dumps(row, ensure_ascii=False) + "\n")
        logger.info("Saved %d pontos de página em %s", len(page_pontos), PAGES_FILE.name)

    catalog = load_catalog()
    logger.info("Matching %d pontos de página contra o catálogo...", len(page_pontos))
    found = match_catalog(catalog, page_pontos, args.dry_run)

    if not args.dry_run:
        save_catalog(catalog)

    total_with = sum(1 for p in catalog if (p.get("lyrics") or "").strip())
    logger.info("=" * 60)
    logger.info("Casados: %d (dry_run=%s)", found, args.dry_run)
    logger.info("Total com letra: %d/%d", total_with, len(catalog))
    logger.info("=" * 60)


if __name__ == "__main__":
    main()
