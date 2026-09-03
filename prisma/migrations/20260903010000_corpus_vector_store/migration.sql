-- Acervo vetorizado dentro do Postgres.
--
-- Até aqui o acervo vivia como arquivos soltos (`chunks.jsonl`, `embeddings.npy`,
-- `index.faiss`) que só a pipeline Python conseguia ler. A aplicação não tinha
-- acesso a nada disso, e sem acesso qualquer conteúdo ritual escrito no produto
-- seria invenção de quem programa.

CREATE TABLE "corpus_chunks" (
    "chunk_id" VARCHAR(64) NOT NULL,
    "doc_id" VARCHAR(64) NOT NULL,
    "title" VARCHAR(400) NOT NULL,
    "category" VARCHAR(60) NOT NULL,
    -- Proveniência interna. Nunca é projetada para o navegador.
    "source_path" VARCHAR(1000) NOT NULL,
    "chunk_index" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "char_count" INTEGER NOT NULL,
    "embedding" vector(1024) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "corpus_chunks_pkey" PRIMARY KEY ("chunk_id")
);

CREATE INDEX "corpus_chunks_category_idx" ON "corpus_chunks"("category");
CREATE INDEX "corpus_chunks_doc_id_chunk_index_idx" ON "corpus_chunks"("doc_id", "chunk_index");

-- HNSW com produto interno: os vetores do bge-m3 já vêm normalizados em L2, e
-- para vetores unitários o produto interno ordena igual ao cosseno. Construir o
-- índice depois da carga é mais rápido, mas deixá-lo aqui garante que ninguém
-- esqueça de criá-lo e descubra a lentidão em produção.
CREATE INDEX "corpus_chunks_embedding_idx"
    ON "corpus_chunks" USING hnsw ("embedding" vector_ip_ops);

CREATE TABLE "corpus_topics" (
    "id" VARCHAR(120) NOT NULL,
    "kind" VARCHAR(40) NOT NULL,
    "label" VARCHAR(200) NOT NULL,
    "query_text" VARCHAR(600) NOT NULL,
    "embedding" vector(1024) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "corpus_topics_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "corpus_topics_kind_idx" ON "corpus_topics"("kind");
