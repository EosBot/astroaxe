-- Relaxa a exigência de revisor distinto do autor para publicar.
--
-- A constraint original exigia `reviewer_id <> author_id` em todo verbete cultural e todo
-- texto de trânsito publicado. Ela veio do modelo em que publicação dependia de aprovação
-- externa — descartado em docs/BLUEPRINT.md §5.0.
--
-- Num projeto de uma pessoa esse gate não pode ser satisfeito honestamente: ou se inventa
-- uma segunda conta para assinar a própria revisão, o que torna a garantia uma ficção, ou
-- nada é publicado. Uma constraint que só se satisfaz mentindo é pior que constraint
-- nenhuma, porque dá aparência de rigor a um registro falso.
--
-- O que continua exigido, porque é fato verificável e não permissão:
--
--   published_at IS NOT NULL   -- quem publicou registrou quando
--   autoria                    -- author_id continua NOT NULL na tabela
--   versão imutável            -- correção gera nova versão, o histórico não é apagado
--   profundidade               -- as constraints de tamanho mínimo permanecem intactas
--
-- reviewer_id e reviewed_at permanecem nas tabelas e continuam sendo gravados quando
-- houver de fato uma segunda pessoa revisando. Deixam de ser pré-condição; passam a ser
-- registro do que aconteceu.
--
-- Roll-forward: nenhuma linha existente viola a nova regra, já que a antiga era mais
--               estrita.
-- Rollback: `git revert` restaura a constraint anterior. Linhas publicadas sem revisor
--           distinto passariam a violá-la, então um rollback exige decidir o que fazer com
--           elas antes de reaplicar.

ALTER TABLE "cultural_entries"
  DROP CONSTRAINT IF EXISTS "cultural_entries_publication_check";

ALTER TABLE "cultural_entries"
  ADD CONSTRAINT "cultural_entries_publication_check" CHECK (
    "status" <> 'PUBLISHED' OR "published_at" IS NOT NULL
  );

ALTER TABLE "transit_interpretation_templates"
  DROP CONSTRAINT IF EXISTS "transit_text_publication_check";

ALTER TABLE "transit_interpretation_templates"
  ADD CONSTRAINT "transit_text_publication_check" CHECK (
    "status" <> 'PUBLISHED' OR "published_at" IS NOT NULL
  );
