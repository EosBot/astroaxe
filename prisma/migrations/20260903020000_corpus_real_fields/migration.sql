-- Alinha a tabela ao que o acervo realmente tem.
--
-- O `conteudo/README.md` documenta um schema com `source_path`, `doc_id` e
-- `char_count`. Os arquivos não têm nada disso: cada linha traz `id`, `title`,
-- `category`, `subcategory`, `metadata` e `text`. Guardar coluna que a origem
-- não preenche significaria inventar proveniência, que é exatamente o oposto do
-- que ela serve para fazer.
--
-- `doc_id`, `chunk_index` e `char_count` continuam existindo porque são
-- deriváveis com honestidade: os dois primeiros saem do próprio `id`, que tem a
-- forma `<documento>_<índice>`, e o terceiro é o tamanho do texto.

ALTER TABLE "corpus_chunks" DROP COLUMN "source_path";
ALTER TABLE "corpus_chunks" ADD COLUMN "subcategory" VARCHAR(60) NOT NULL DEFAULT '';
