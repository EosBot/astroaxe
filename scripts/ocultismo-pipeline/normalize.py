"""
Normalização, limpeza, deduplicação e chunking semântico do corpus.
"""

from __future__ import annotations

import hashlib
import logging
import re
from dataclasses import dataclass, field

from extract import ExtractedDocument

logger = logging.getLogger(__name__)

MIN_CHUNK_CHARS = 100
MAX_CHUNK_CHARS = 2000
TARGET_CHUNK_CHARS = 800
OVERLAP_CHARS = 200


@dataclass
class TextChunk:
    chunk_id: str
    doc_id: str
    title: str
    category: str
    subcategory: str
    source_path: str
    file_type: str
    chunk_index: int
    text: str
    char_count: int
    metadata: dict = field(default_factory=dict)


# --- Text cleaning ---

_NOISE_PATTERNS = [
    re.compile(r"\x00"),
    re.compile(r"[\x01-\x08\x0b\x0c\x0e-\x1f\x7f]"),
    re.compile(r"\u200b|\u200c|\u200d|\ufeff"),
    re.compile(r"[\u2018\u2019]"),  # smart single quotes → '
    re.compile(r"[\u201c\u201d]"),  # smart double quotes → "
    re.compile(r"\u2013"),          # en dash
    re.compile(r"\u2014"),          # em dash
    re.compile(r"\u2026"),          # ellipsis
]

_REPLACE_MAP = {
    "\u2018": "'", "\u2019": "'",
    "\u201c": '"', "\u201d": '"',
    "\u2013": "-", "\u2014": "--",
    "\u2026": "...",
}

_MULTI_SPACE = re.compile(r"[ \t]+")
_MULTI_NEWLINE = re.compile(r"\n{3,}")
_TRAILING_WS = re.compile(r"[ \t]+$", re.MULTILINE)
_PAGE_BREAK = re.compile(r"\f|\x0c")


def clean_text(raw: str) -> str:
    text = _PAGE_BREAK.sub("\n\n", raw)

    for pat in _NOISE_PATTERNS:
        text = pat.sub(lambda m: _REPLACE_MAP.get(m.group(), ""), text)

    text = _MULTI_SPACE.sub(" ", text)
    text = _TRAILING_WS.sub("", text)
    text = _MULTI_NEWLINE.sub("\n\n", text)
    return text.strip()


def is_mostly_garbage(text: str) -> bool:
    if not text:
        return True
    alpha_ratio = sum(1 for c in text if c.isalpha() or c.isspace()) / max(len(text), 1)
    return alpha_ratio < 0.5


# --- Deduplication ---

def deduplicate_documents(docs: list[ExtractedDocument]) -> list[ExtractedDocument]:
    seen_hashes: dict[str, str] = {}
    unique: list[ExtractedDocument] = []
    dupes = 0

    for doc in docs:
        content_hash = hashlib.md5(doc.text[:5000].encode()).hexdigest()
        if content_hash in seen_hashes:
            dupes += 1
            logger.debug("Duplicate skipped: %s (matches %s)", doc.title, seen_hashes[content_hash])
        else:
            seen_hashes[content_hash] = doc.title
            unique.append(doc)

    logger.info("Deduplication: %d → %d documents (%d dupes removed)", len(docs), len(unique), dupes)
    return unique


# --- Semantic chunking ---

_SECTION_SPLIT = re.compile(r"\n\s*\n\s*\n")
_HEADING_SPLIT = re.compile(r"\n(?=[A-ZÁÉÍÓÚÂÊÔÃÕÇ]{3,}[\s:—])")


def _split_into_sections(text: str) -> list[str]:
    raw_sections = _SECTION_SPLIT.split(text)
    sections: list[str] = []
    for s in raw_sections:
        s = s.strip()
        if len(s) >= MIN_CHUNK_CHARS:
            sections.append(s)
        elif sections:
            sections[-1] += "\n\n" + s
        else:
            sections.append(s)
    return [s for s in sections if s.strip()]


def _split_long_section(text: str) -> list[str]:
    if len(text) <= MAX_CHUNK_CHARS:
        return [text]

    chunks: list[str] = []
    sentences = re.split(r"(?<=[.!?])\s+", text)
    current = ""

    for sentence in sentences:
        if len(current) + len(sentence) + 1 <= MAX_CHUNK_CHARS:
            current = f"{current} {sentence}".strip() if current else sentence
        else:
            if current:
                chunks.append(current)
            if len(sentence) > MAX_CHUNK_CHARS:
                words = sentence.split()
                current = ""
                for word in words:
                    if len(current) + len(word) + 1 <= MAX_CHUNK_CHARS:
                        current = f"{current} {word}".strip() if current else word
                    else:
                        if current:
                            chunks.append(current)
                        current = word
            else:
                current = sentence

    if current:
        chunks.append(current)

    return chunks


def _apply_overlap(chunks: list[str]) -> list[str]:
    if len(chunks) <= 1:
        return chunks

    result = [chunks[0]]
    for i in range(1, len(chunks)):
        prev_tail = chunks[i - 1][-OVERLAP_CHARS:]
        result.append(prev_tail + " " + chunks[i])
    return result


def chunk_document(doc: ExtractedDocument) -> list[TextChunk]:
    sections = _split_into_sections(doc.text)
    raw_chunks: list[str] = []
    for section in sections:
        raw_chunks.extend(_split_long_section(section))

    raw_chunks = _apply_overlap(raw_chunks)

    chunks: list[TextChunk] = []
    for idx, text in enumerate(raw_chunks):
        text = text.strip()
        if len(text) < MIN_CHUNK_CHARS:
            continue

        chunk_id = f"{doc.doc_id}_{idx:04d}"
        chunks.append(
            TextChunk(
                chunk_id=chunk_id,
                doc_id=doc.doc_id,
                title=doc.title,
                category=doc.category,
                subcategory=doc.subcategory,
                source_path=doc.source_path,
                file_type=doc.file_type,
                chunk_index=idx,
                text=text,
                char_count=len(text),
                metadata={
                    "total_chunks": len(raw_chunks),
                    "original_page_count": doc.page_count,
                },
            )
        )

    return chunks


def normalize_corpus(
    documents: list[ExtractedDocument],
) -> list[TextChunk]:
    cleaned: list[ExtractedDocument] = []
    garbage_count = 0

    for doc in documents:
        doc.text = clean_text(doc.text)
        if is_mostly_garbage(doc.text):
            garbage_count += 1
            logger.warning("Garbage document skipped: %s", doc.title)
            continue
        cleaned.append(doc)

    logger.info("Cleaning: %d → %d documents (%d garbage removed)", len(documents), len(cleaned), garbage_count)

    unique = deduplicate_documents(cleaned)

    all_chunks: list[TextChunk] = []
    for doc in unique:
        all_chunks.extend(chunk_document(doc))

    logger.info(
        "Chunking: %d documents → %d chunks (avg %.0f chars)",
        len(unique),
        len(all_chunks),
        sum(c.char_count for c in all_chunks) / max(len(all_chunks), 1),
    )

    return all_chunks
