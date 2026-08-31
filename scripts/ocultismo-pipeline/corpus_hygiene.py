"""
Higiene do corpus: portões de qualidade e escopo aplicados antes do chunking.

Existe porque o pipeline original deixou passar três classes de problema que só
apareceram na auditoria do corpus já indexado:

- extração degenerada (PDF com fonte embutida sem mapa de caracteres, que
  devolve símbolos e tokens de um caractere);
- material fora do escopo do projeto, indexado por estar na mesma pasta;
- a mesma obra em múltiplas cópias, que inflaria a convergência entre escolas
  no método de regências — cópia da mesma linhagem não é confirmação
  independente.
"""

from __future__ import annotations

import logging
import re
import unicodedata
from collections.abc import Iterable

logger = logging.getLogger(__name__)

MIN_VISIBLE_CHARS = 100
MIN_LETTER_RATIO = 0.5
MIN_AVG_WORD_LEN = 2.5
MIN_STOPWORD_RATIO = 0.02
NEAR_DUPLICATE_JACCARD = 0.80
SHINGLE_SIZE = 8

_WORD_RE = re.compile(r"[^\W\d_]+", re.UNICODE)

# Português e inglês: o acervo tem grimórios em ambas as línguas, e um portão
# só em português descartaria o Lemegeton junto com o ruído de OCR.
_STOPWORDS = frozenset(
    """
    de da do das dos que nao para com uma como mais mas por seu sua ou ser
    quando muito ha nos ja esta tambem so pelo pela ate isso ele entre depois
    sem mesmo aos seus quem nas esse eles voce essa num nem suas meu as os um
    em no na se ao dele ela pelos pelas nao sao foi era
    the of and to in that is was for it with as his on be at by not this from
    are have but they which you were all their has more will one would there
    """.split()
)

# Fora do escopo: ocultismo, tradições afro-brasileiras e o material de apoio
# ao método. O que não responde a isso não entra, mesmo estando no acervo.
OUT_OF_SCOPE = {
    "DrugUsersBible-LowRes_compressed": "guia de uso de drogas recreativas",
    "CatalogoGeralDeProdutos": "catálogo comercial de contatores elétricos",
    "progresso": "log de execução do próprio pipeline",
    # Autoajuda, coaching e tipologia de personalidade comercial.
    "reflexoes-para-autoconhecimento-denize-goncalves-2247": "autoajuda",
    "os-tipos-humanos-luiz-pasquali": "autoajuda",
    "a-lei-da-atracao-michael-j-losier-3088": "autoajuda",
    "personalidade-ramiro-verissimo": "autoajuda",
    "metodo-vida-master-autoconhecimento-cleide-marcos-2249": "autoajuda",
    "autocuidado-emocional-uma-questao-de-habito-anna-paula-goncalves-6315": "autoajuda",
    "introducao-ao-eneagrama-pdfcoffee": "autoajuda",
    "o-poder-do-autoconhecimento-instituto-brasileiro-de-coaching-6314": "autoajuda",
    "explore-o-seu-castelo-interior-camila-barone-2248": "autoajuda",
    "descubra-qual-o-seu-tipo-de-personalidade-no-eneagrama-apresentacao-ligia-fabr": "autoajuda",
    "eneagrama-portal-idea": "autoajuda",
    "eneagrama-na-pratica-apresentacao-marco-meda": "autoajuda",
    "meu-diario-de-autoconhecimento-gabriela-panicio-vizu-2246": "autoajuda",
    "autoconhecimento-e-desenvolvimento-pessoal-camila-barone-2254": "autoajuda",
    "introducao-ao-eneagrama-apresentacao-flavia-possas": "autoajuda",
    "plano-de-30-dias-de-autoconhecimento-tais-nunes-6316": "autoajuda",
    "diario-de-autoconhecimento-mirele-rodrigues-de-melo-2251": "autoajuda",
}

# Prefixos de título: o eneagrama e os diários de autoconhecimento chegam com
# nomes gerados por conversores e variam entre execuções.
OUT_OF_SCOPE_PREFIXES = ("descubra-qual-o-seu-tipo-de-personalidade",)


def _fold(text: str) -> str:
    return unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode().lower()


def is_out_of_scope(title: str) -> str | None:
    """Devolve o motivo do descarte, ou None se o título pertence ao escopo."""
    if title in OUT_OF_SCOPE:
        return OUT_OF_SCOPE[title]
    for prefix in OUT_OF_SCOPE_PREFIXES:
        if title.startswith(prefix):
            return "autoajuda"
    return None


def is_mostly_garbage(text: str) -> bool:
    """
    Extração degenerada, medida por três sinais independentes.

    O portão anterior somava letras e espaço em branco sobre o total, de modo
    que um texto quebrado em caracteres isolados separados por quebras de linha
    passava com folga — foi assim que 347 chunks de símbolos entraram no índice.
    Aqui o espaço em branco não conta como conteúdo, e o comprimento médio das
    palavras separa texto de detrito: a falha de mapa de caracteres produz
    tokens de um caractere, não palavras.
    """
    if not text:
        return True

    visible = [c for c in text if not c.isspace()]
    if len(visible) < MIN_VISIBLE_CHARS:
        return True

    if sum(1 for c in visible if c.isalpha()) / len(visible) < MIN_LETTER_RATIO:
        return True

    words = _WORD_RE.findall(text)
    if not words:
        return True

    if sum(len(w) for w in words) / len(words) < MIN_AVG_WORD_LEN:
        return True

    # Texto real em qualquer das duas línguas carrega palavras funcionais; OCR
    # ilegível produz sequências plausíveis como palavras, mas sem gramática.
    stopwords = sum(1 for w in words if _fold(w) in _STOPWORDS)
    return stopwords / len(words) < MIN_STOPWORD_RATIO


def shingles(text: str, size: int = SHINGLE_SIZE) -> set[int]:
    """Assinatura de n-gramas de palavras, para comparar obras entre si."""
    words = [_fold(w) for w in _WORD_RE.findall(text)]
    if len(words) < size:
        return set()
    return {
        hash(" ".join(words[i : i + size]))
        for i in range(0, len(words) - size + 1, size // 2)
    }


def jaccard(left: set[int], right: set[int]) -> float:
    if not left or not right:
        return 0.0
    return len(left & right) / min(len(left), len(right))


def find_duplicate_groups(
    items: Iterable[tuple[str, str, str, int]],
) -> dict[str, str]:
    """
    Agrupa obras repetidas.

    Recebe `(doc_id, title, text, weight)` e devolve `{doc_id_descartado:
    doc_id_mantido}`. Mantém a cópia de maior peso — a mais completa — porque
    edições e scans da mesma obra divergem em paginação e qualidade de OCR, e
    comparar apenas o início do texto não as reconhece como a mesma obra.
    """
    entries = [(d, t, shingles(x), w) for d, t, x, w in items]
    entries.sort(key=lambda e: -e[3])

    dropped: dict[str, str] = {}
    kept: list[tuple[str, str, set[int]]] = []

    for doc_id, title, sig, _ in entries:
        if not sig:
            kept.append((doc_id, title, sig))
            continue
        match = next(
            ((k_id, k_title) for k_id, k_title, k_sig in kept if jaccard(sig, k_sig) >= NEAR_DUPLICATE_JACCARD),
            None,
        )
        if match:
            dropped[doc_id] = match[0]
            logger.info("Cópia redundante: %r → mantida %r", title, match[1])
        else:
            kept.append((doc_id, title, sig))

    return dropped


# Calibrados contra pares conhecidos do próprio acervo. Com correspondência de
# chunk a 0.95, obras repetidas ficam entre 0.42 e 0.64 de cobertura e obras
# distintas não passam de 0.28 — o par mais próximo sendo o Grande Grimório e o
# Grimório do Papa Honório, que são textos historicamente aparentados. A faixa
# entre os dois limiares não é descartada: é relatada para decisão humana.
CENTROID_CANDIDATE_COS = 0.95
CHUNK_MATCH_COS = 0.95
CHUNK_MATCH_COVERAGE = 0.40
BORDERLINE_COVERAGE = 0.25


def find_redundant_by_embedding(doc_rows, embeddings, weights):
    """
    Obras repetidas que a assinatura textual não reconhece.

    Edições e scans diferentes da mesma obra divergem em paginação e OCR, então
    seus n-gramas não coincidem — mas seus vetores sim. Comparar centróides
    sozinho não basta: dois livros do mesmo autor sobre o mesmo assunto também
    ficam próximos. O que separa cópia de afinidade temática é a *cobertura* —
    numa cópia, quase todo chunk do documento menor encontra um par quase
    idêntico no maior; em obras distintas, poucos encontram.

    `doc_rows` mapeia doc_id para os índices de linha em `embeddings`.
    Devolve `{doc_id_descartado: doc_id_mantido}`.
    """
    import numpy as np

    ids = sorted(doc_rows, key=lambda d: -weights[d])
    centroids = {}
    for doc_id in ids:
        v = np.asarray(embeddings[doc_rows[doc_id]]).mean(0)
        centroids[doc_id] = v / max(np.linalg.norm(v), 1e-9)

    dropped: dict[str, str] = {}
    borderline: list[tuple[str, str, float]] = []
    kept: list[str] = []

    for doc_id in ids:
        redundant_of = None
        for keeper in kept:
            if float(centroids[doc_id] @ centroids[keeper]) < CENTROID_CANDIDATE_COS:
                continue
            a = np.asarray(embeddings[doc_rows[doc_id]], dtype="float32")
            b = np.asarray(embeddings[doc_rows[keeper]], dtype="float32")
            coverage = float(((a @ b.T).max(axis=1) >= CHUNK_MATCH_COS).mean())
            if coverage >= CHUNK_MATCH_COVERAGE:
                redundant_of = keeper
                break
            if coverage >= BORDERLINE_COVERAGE:
                borderline.append((doc_id, keeper, coverage))
        if redundant_of:
            dropped[doc_id] = redundant_of
        else:
            kept.append(doc_id)

    return dropped, borderline
