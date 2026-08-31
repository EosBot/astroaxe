# Corpus Vetorializado — Ocultismo Afro-Brasileiro

Corpus de referência sobre Umbanda, Orixás e tradições afro-brasileiras, processado e vetorizado para consumo por modelos de IA e módulos do AstroAxe.

## Estrutura

```
conteudo/
├── README.md                  # Este arquivo
├── manifest.json              # Metadados do corpus (modelo, dimensões, contagens)
├── chunks.parquet             # Chunks com metadados completos (pandas/pyarrow)
├── chunks.jsonl               # Chunks em JSONL (uma linha por chunk, ideal para fine-tuning)
├── embeddings.npy             # Vetores normalizados (bge-m3, 1024d, float32)
├── index.faiss                # Índice FAISS (inner product, portável CPU/GPU)
├── pontos_cantados.jsonl      # Catálogo dos 538 pontos; 216 com letra validada
└── pontos_paginas.jsonl       # Pontos avulsos coletados das páginas estáticas do blog
```

## Modelo de Embedding

- **Modelo:** `BAAI/bge-m3`
- **Dimensão:** 1024
- **Normalização:** L2 (vetores unitários)
- **Similaridade:** Inner product (equivalente a cosine similarity após normalização)
- **Idiomas:** Multilingual (português otimizado)

## Categorias do Corpus

| Categoria         | Descrição                                                            |
| ----------------- | -------------------------------------------------------------------- |
| `livros`          | Livros completos de Umbanda, Cabala, Tarot, Alquimia                 |
| `fitoterapia`     | Ervas medicinais, banhos, defumações                                 |
| `magia_angelical` | Magia angelical e olímpica                                           |
| `magia_cigana`    | Tradição cigana                                                      |
| `magia_7_cruzes`  | Magia das 7 cruzes                                                   |
| `magia_ervas`     | Magia com ervas                                                      |
| `magia_fogo`      | Magia do fogo                                                        |
| `apometria`       | Apometria e desobsessão                                              |
| `judaismo`        | Judaísmo e Cabala                                                    |
| `kundalini`       | Kundalini e Tantra                                                   |
| `reiki`           | Reiki e cura energética                                              |
| `oracoes_rezas`   | Orações e rezas                                                      |
| `oracao_pinheiro` | Oração do Pinheiro                                                   |
| `pontos_cantados` | Pontos cantados de Umbanda                                           |
| `sepher_ra_hazim` | Sepher Ra Hazim                                                      |
| `templo_pena`     | Templo da Pena                                                       |
| `backup`          | Pasta `Backup` do acervo: apostilas, assentamentos e material avulso |

A pasta `resumos_individuais` do acervo contém apenas o log de processamento
`progresso.json`, que não é material de estudo — por isso não há categoria
`resumos` no corpus.

## Schema dos Chunks

Cada chunk em `chunks.parquet` / `chunks.jsonl`:

```json
{
  "chunk_id": "a1b2c3d4_0001",
  "doc_id": "a1b2c3d4e5f6g7h8",
  "title": "Fundamentos Doutrinários de Umbanda",
  "category": "livros",
  "subcategory": "",
  "source_path": "/mnt/e/Ocultismo/Livros/...",
  "file_type": "pdf",
  "chunk_index": 1,
  "text": "Texto do chunk...",
  "char_count": 800,
  "metadata": {
    "total_chunks": 45,
    "original_page_count": 320
  }
}
```

## Schema dos Pontos Cantados

```json
{
  "ponto_id": "ponto_0001",
  "title": "Ogum Beira Mar",
  "category": "pontos_cantados",
  "subcategory": "Pai Ogum",
  "entity_type": "orixá",
  "entity_name": "Pai Ogum",
  "file_path": "/mnt/e/Ocultismo/Pontos/Orixás/Pai Ogum/Ogum Beira Mar.mp3",
  "lyrics": "Letra do ponto...",
  "lyrics_source": "letras.mus.br",
  "lyrics_status": "validada",
  "metadata": {}
}
```

`lyrics_status` registra o que aconteceu com a letra na validação:

| Valor                               | Significado                                                                    |
| ----------------------------------- | ------------------------------------------------------------------------------ |
| `validada`                          | A letra coletada já tinha forma de canto e passou íntegra                      |
| `recuperada por segmentação`        | A página trazia vários pontos; o recorte correspondente ao título foi extraído |
| `descartada: não valida como letra` | O que havia era artigo, navegação ou o ponto vizinho — o campo foi esvaziado   |
| `ausente`                           | Nunca houve coleta para esse ponto                                             |

Só entram no índice vetorial os pontos `validada` e `recuperada por segmentação`.
Campo vazio é resultado honesto; letra errada contamina a busca e o método.

## Consulta

### Script Python

```python
import sys

sys.path.insert(0, "scripts/ocultismo-pipeline")
from query import CorpusQuery

cq = CorpusQuery(device="cuda")

# Busca geral
results = cq.search("significado de Oxóssi na Umbanda", top_k=5)

# Busca filtrada por categoria
results = cq.search("ervas para banho", top_k=10, category="fitoterapia")

for r in results:
    print(f"[{r['score']:.4f}] {r['title']} ({r['category']})")
    print(r['text'][:200])
```

### CLI

```bash
P=scripts/ocultismo-pipeline/.venv/bin/python

# Busca simples
$P scripts/ocultismo-pipeline/query.py "pontos de Ogum"

# Com filtros
$P scripts/ocultismo-pipeline/query.py "banho de ervas" --top 10 --category fitoterapia

# Output JSON para integração com APIs
$P scripts/ocultismo-pipeline/query.py "Oxum cachoeira" --format json
```

### Integração com AstroAxe

O corpus pode ser consumido pelos módulos do AstroAxe para:

1. **Correspondência Orixá ↔ signos planetas** — buscar no corpus textos sobre regências e associações
2. **Conteúdo ritual** — pontos, orações e práticas associadas a cada entidade
3. **Fitoterapia astrológica** — ervas e banhos correspondentes a posições planetárias
4. **Treinamento de LLMs** — fine-tuning com o JSONL para modelos especializados

```python
import faiss
import numpy as np
import pandas as pd
from sentence_transformers import SentenceTransformer

# Carregar
df = pd.read_parquet("conteudo/chunks.parquet")
index = faiss.read_index("conteudo/index.faiss")
model = SentenceTransformer("BAAI/bge-m3")

# Buscar
query = "qual orixá rege o signo de Áries"
embedding = model.encode([query], normalize_embeddings=True).astype(np.float32)
scores, indices = index.search(embedding, 5)

for score, idx in zip(scores[0], indices[0]):
    row = df.iloc[idx]
    print(f"[{score:.4f}] {row['title']}: {row['text'][:150]}")
```

## Higiene do corpus

Três portões, em `corpus_hygiene.py`, decidem o que entra:

1. **Escopo.** O acervo tem material que não é ocultismo nem tradição afro-brasileira —
   ele estava na mesma pasta, não no mesmo assunto. `OUT_OF_SCOPE` lista o que fica de
   fora, com o motivo.
2. **Extração degenerada.** PDF com fonte embutida sem mapa de caracteres devolve
   símbolos, não texto. O portão mede letras entre os caracteres não-brancos, comprimento
   médio das palavras e presença de palavras funcionais — os três, porque contar espaço em
   branco como conteúdo deixa passar um documento inteiro quebrado em caracteres isolados.
   Esses PDFs são encaminhados ao OCR por `ingest_scanned_pdfs.py`, não descartados.
3. **Cópias da mesma obra.** Comparar o início do texto só reconhece arquivos idênticos.
   A deduplicação usa assinatura de n-gramas no pipeline e, sobre o índice já construído,
   cobertura de chunk entre vetores: numa cópia quase todo chunk do documento menor
   encontra par quase idêntico no maior; em obras distintas do mesmo autor, poucos
   encontram. Isso importa além do espaço em disco — o método pesa convergência entre
   escolas independentes, e a mesma obra contada quatro vezes vira quatro votos onde há um.

`clean_corpus.py` aplica os três retroativamente ao índice existente, selecionando linhas
em vez de reprocessar o acervo. Casos limítrofes são relatados, nunca descartados em
silêncio.

## Reprocessamento

Para reprocessar o corpus (ex: após adicionar novos documentos):

```bash
cd scripts/ocultismo-pipeline

# Pipeline completo (com OCR). RTX 2060 6GB pede --batch-size 8.
.venv/bin/python pipeline.py --output-dir ../../conteudo --device cuda --batch-size 8

# Sem OCR (mais rápido)
.venv/bin/python pipeline.py --output-dir ../../conteudo --skip-ocr --device cuda --batch-size 8

# Mesclar pontos cantados com letra ao corpus (após o pipeline)
.venv/bin/python integrate_pontos.py --device cuda

# OCR de PDFs escaneados sem camada de texto (idempotente, mescla ao índice)
.venv/bin/python ingest_scanned_pdfs.py          # --dry-run para listar candidatos

# Higiene retroativa do índice (--dry-run relata sem gravar)
python scripts/ocultismo-pipeline/clean_corpus.py --dry-run
python scripts/ocultismo-pipeline/clean_corpus.py

# Validação das letras dos pontos (reescreve lyrics_status no catálogo)
python scripts/ocultismo-pipeline/validate_lyrics.py

# Coleta de letras: páginas estáticas do blog + busca. A segmentação e a
# validação ficam por conta de validate_lyrics.py, que roda depois da coleta.
.venv/bin/python scrape_pages.py
.venv/bin/python scrape_v3.py
.venv/bin/python validate_lyrics.py
```

A ordem importa: coletar, validar, integrar. `integrate_pontos.py` só indexa
pontos com `lyrics_status` validado ou recuperado, e remove os já indexados
antes de inserir — o catálogo é reescrito a cada validação.

## Estatísticas

Geradas automaticamente no `manifest.json`:

- Total de documentos processados
- Total de chunks gerados
- Categorias presentes
- Dimensão dos embeddings
- Métrica de similaridade

## Dependências

```
Python 3.12+
torch (CUDA 12.4+)
sentence-transformers
faiss-gpu
pymupdf
pandas + pyarrow
easyocr (OCR, opcional)
requests + beautifulsoup4 (scraping de letras)
```

## Licença e Uso

O corpus contém material de diversas fontes. As letras de pontos cantados são de domínio cultural da tradição umbandista. Livros e apostilas são de seus respectivos autores. O corpus é destinado a uso educacional e de pesquisa para o projeto AstroAxe.
