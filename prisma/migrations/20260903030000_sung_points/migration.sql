-- Pontos cantados, em letra.
--
-- Decisão do dono: entra a letra, não o áudio. O catálogo tem 538 pontos, dos
-- quais 216 com letra validada; os demais ficam registrados com o status
-- dizendo que a letra falta, em vez de sumirem da lista ou aparecerem com letra
-- inventada para preencher.

CREATE TABLE "sung_points" (
    "ponto_id" VARCHAR(60) NOT NULL,
    "title" VARCHAR(300) NOT NULL,
    "category" VARCHAR(60) NOT NULL,
    "subcategory" VARCHAR(120) NOT NULL,
    "entity_type" VARCHAR(60) NOT NULL,
    "entity_name" VARCHAR(160) NOT NULL,
    "lyrics" TEXT,
    "lyrics_source" VARCHAR(600),
    "lyrics_status" VARCHAR(40) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sung_points_pkey" PRIMARY KEY ("ponto_id")
);

CREATE INDEX "sung_points_entity_type_entity_name_idx" ON "sung_points"("entity_type", "entity_name");
CREATE INDEX "sung_points_lyrics_status_idx" ON "sung_points"("lyrics_status");
