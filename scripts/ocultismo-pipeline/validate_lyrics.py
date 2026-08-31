#!/usr/bin/env python3
"""
Valida as letras dos pontos cantados e descarta o que não é letra.

A coleta anterior mantinha a página inteira quando a segmentação falhava
(`refine_lyrics.py`), de modo que artigo de blog, verbete de Wikipédia e página
com dezenas de pontos entraram no catálogo como se fossem a letra de um ponto.
Aqui a ordem se inverte: primeiro limpa a navegação, depois tenta recortar a
estrofe que corresponde ao título e só então valida. O que não passa perde a
letra e fica registrado como pendente — um campo vazio é honesto, um artigo de
blog no lugar da letra não é.

Uso:
    python validate_lyrics.py [--dry-run]
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
    level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s", datefmt="%H:%M:%S"
)
logger = logging.getLogger(__name__)

CONTENT_DIR = Path(__file__).parent.parent.parent / "conteudo"
CATALOG_FILE = CONTENT_DIR / "pontos_cantados.jsonl"

# Calibrados sobre as letras que a inspeção confirmou boas: entre 90 e 430
# caracteres, de 4 a 20 versos, com linha mediana em torno de 22 caracteres.
MIN_CHARS = 60
MAX_CHARS = 900
MIN_LINES = 4
MAX_MEDIAN_LINE = 45
MAX_LINE = 120
MIN_WORDS_PER_LINE = 3
MIN_VERSE_RATIO = 0.6
MIN_STOPWORD_RATIO = 0.08

_BOILERPLATE = re.compile(
    r"toggle the table of contents|alternar o [íi]ndice|jump to content|"
    r"\d+\s+(languages?|idiomas?)$|origem:\s*wikip|ver hist[óo]rico|"
    r"p[áa]gina de discuss[ãa]o|^ocultar$|^editar$|^ver fonte$|"
    r"compartilhar|postado por|marcadores:|leia mais|nenhum coment|"
    r"exibi[çc][õo]es da letra|tradu[çc][õo]es|^cifra$|blogspot|"
    r"enviar por e-?mail|postar no blog|links para esta postagem|"
    r"assinar:|feed de coment|tecnologia do blogger|p[áa]gina inicial|"
    r"^letra$|^significado$|^nota:$|^\d{1,3}\.\d{3}$|^bis$|"
    r"t[óo]picos deste artigo|deixe um coment[áa]rio|min de leitura|"
    r"^\d{1,2} de \w+\.? de \d{4}$|songs that interpolate|^por$|"
    r"^\d+\s*-\s*(resumo|caracter[íi]sticas|do que|sauda[çc][ãa]o|t[íi]tulos)",
    re.IGNORECASE,
)

# Menus de idioma da Wikipédia chegam como uma linha por língua.
_LANGUAGE_MENU = re.compile(
    r"^(english|espa[ñn]ol|portugu[êe]s|deutsch|fran[çc]ais|italiano|"
    r"catal[àa]|euskara|esperanto|[čc]e[šs]tina|brezhoneg|polski|"
    r"yor[ùu]b[áa]|svenska|suomi|norsk|dansk|magyar|t[üu]rk[çc]e|"
    r"rom[âa]n[ăa]|sloven[šs][čc]ina|hrvatski|srpski|" 
    r"[\u0400-\u04ff\u0370-\u03ff\u0590-\u05ff\u0600-\u06ff"
    r"\u4e00-\u9fff\u3040-\u30ff\u0e00-\u0e7f]+)$",
    re.IGNORECASE,
)

_PT_STOPWORDS = frozenset(
    "de da do das dos que nao para com uma como mais mas por seu sua ou ser "
    "quando muito ja esta tambem so pelo pela ate isso ele ela entre sem meu "
    "minha na no em os as um e a o eu te me nos vem vai esta esse essa".split()
)

# O marcador aparece nas duas formas: sozinho na linha e prefixando o primeiro
# verso ("85- PONTO DE OGUM"). Reconhecer só a primeira deixava dois pontos
# colados no mesmo recorte.
_PONTO_MARKER = re.compile(r"^[ \t]*\d{1,3}\s*[-–—.](?=\s|$)", re.MULTILINE)


def fold(text: str) -> str:
    text = unicodedata.normalize("NFD", text.lower())
    return "".join(c for c in text if unicodedata.category(c) != "Mn")


def clean(text: str) -> str:
    """Remove navegação, menu de idiomas, tabulação decorativa e linhas vazias."""
    lines = []
    for raw in text.splitlines():
        line = re.sub(r"\s+", " ", raw.replace("\t", " ")).strip()
        if not line or _BOILERPLATE.search(line) or _LANGUAGE_MENU.match(line):
            continue
        lines.append(line)
    return "\n".join(lines)


# Palavras que nomeiam o momento do ritual, não o conteúdo cantado. "Chamada e
# Subida de Mãe Oxum" descreve quando o ponto é usado; exigi-las dentro do verso
# descartaria o recorte correto.
_RITUAL_FUNCTION_WORDS = frozenset(
    """
    chamada subida saudacao saudação louvacao louvação ponto pontos canto
    cantos curimba hino oracao oração prece partida despedida abertura
    encerramento defumacao defumação cruzamento amaci firmeza chamado
    """.split()
)


def title_anchors(title: str) -> list[re.Pattern[str]]:
    """
    Palavras do título como padrões de palavra inteira.

    A busca por substring casava "banda" dentro de "umbanda", o que fazia
    qualquer trecho sobre Umbanda parecer o ponto "Saravá a banda".
    """
    clean_title = re.sub(r"\s*\d+$|\s*-\s*Pout Pourri$", "", title).strip()
    words = [
        w
        for w in re.split(r"\W+", fold(clean_title))
        if len(w) >= 4 and w not in _RITUAL_FUNCTION_WORDS
    ]
    return [re.compile(rf"\b{re.escape(w)}\b") for w in words]


def is_lyric(text: str) -> bool:
    """
    Estrutura de canto, verificada por quatro sinais.

    O comprimento mediano da linha separa verso de prosa — um ponto tem versos
    de duas dezenas de caracteres, um parágrafo de blog passa dos trezentos. A
    contagem de palavras por linha separa verso de menu de navegação, que também
    tem linhas curtas mas de uma palavra só. E a presença de palavras funcionais
    do português confirma que aquilo é uma frase cantada, não uma lista de
    rótulos de interface.
    """
    lines = [l for l in (line.strip() for line in text.splitlines()) if l]
    if not (MIN_CHARS <= len(text) <= MAX_CHARS):
        return False
    if len(lines) < MIN_LINES:
        return False
    if max(len(l) for l in lines) > MAX_LINE:
        return False

    lengths = sorted(len(l) for l in lines)
    if lengths[len(lengths) // 2] > MAX_MEDIAN_LINE:
        return False

    words_per_line = sorted(len(l.split()) for l in lines)
    if words_per_line[len(words_per_line) // 2] < MIN_WORDS_PER_LINE:
        return False
    if sum(1 for n in words_per_line if n >= MIN_WORDS_PER_LINE) / len(lines) < MIN_VERSE_RATIO:
        return False

    words = [fold(w) for w in re.findall(r"[^\W\d_]+", text)]
    if not words:
        return False
    return sum(1 for w in words if w in _PT_STOPWORDS) / len(words) >= MIN_STOPWORD_RATIO


def segments(text: str) -> list[str]:
    """Recorta candidatos: por marcador numérico e por estrofe."""
    found: list[str] = []
    for part in _PONTO_MARKER.split(text):
        part = part.strip()
        if part:
            found.append(part)
    for block in re.split(r"\n\s*\n", text):
        block = block.strip()
        if block:
            found.append(block)
    return found


def best_lyric(text: str, title: str, entity: str) -> str | None:
    """A estrofe válida que melhor corresponde ao título."""
    if is_lyric(text):
        return text

    anchors = title_anchors(title)
    entity_folded = fold(entity) if entity else ""

    best: tuple[int, str] | None = None
    for candidate in segments(text):
        if not is_lyric(candidate):
            continue
        folded = fold(candidate)
        hits = sum(1 for a in anchors if a.search(folded))
        # Um recorte só é aceito se contiver o título inteiro. A mesma página
        # traz dezenas de pontos e o nome da entidade aparece em todos eles;
        # aceitar correspondência parcial devolve a estrofe do ponto vizinho.
        if anchors and hits < len(anchors):
            continue
        score = hits * 100 + (50 if entity_folded and entity_folded in folded else 0)
        if best is None or score > best[0]:
            best = (score, candidate)

    return best[1] if best else None


def main() -> None:
    parser = argparse.ArgumentParser(description="Validação das letras dos pontos")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    rows = [json.loads(line) for line in CATALOG_FILE.open(encoding="utf-8")]

    intact = recovered = discarded = 0
    for row in rows:
        original = (row.get("lyrics") or "").strip()
        if not original:
            row["lyrics_status"] = "ausente"
            continue

        cleaned = clean(original)
        lyric = best_lyric(cleaned, row["title"], row.get("entity_name", ""))

        if lyric is None:
            discarded += 1
            row["lyrics"] = ""
            row["lyrics_status"] = "descartada: não valida como letra"
            row["lyrics_source"] = ""
        elif lyric.strip() == original:
            intact += 1
            row["lyrics_status"] = "validada"
        else:
            recovered += 1
            row["lyrics"] = lyric
            row["lyrics_status"] = "recuperada por segmentação"

    if not args.dry_run:
        with CATALOG_FILE.open("w", encoding="utf-8") as handle:
            for row in rows:
                handle.write(json.dumps(row, ensure_ascii=False) + "\n")

    total = len(rows)
    with_lyrics = intact + recovered
    logger.info("=" * 60)
    logger.info("Pontos no catálogo      : %d", total)
    logger.info("Letras já válidas       : %d", intact)
    logger.info("Recuperadas por recorte : %d", recovered)
    logger.info("Descartadas             : %d", discarded)
    logger.info("Com letra confiável     : %d (%.0f%%)", with_lyrics, with_lyrics / total * 100)
    logger.info("=" * 60)
    if args.dry_run:
        logger.info("Dry run: catálogo não gravado.")


if __name__ == "__main__":
    main()
