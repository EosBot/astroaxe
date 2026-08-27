-- Descarta o aparato de direitos e publicação do modelo híbrido.
--
-- Decisão de arquitetura em docs/BLUEPRINT.md §5.0: runtime único, cobertura total. O
-- acervo é insumo de autoria e o site publica obra derivada e original — nunca o
-- texto-fonte. Sem duas superfícies, não há o que filtrar entre elas, e todo o mecanismo
-- que existia para essa filtragem passa a descrever um produto que não existe.
--
-- O que sai e por quê:
--
--   ceremonial_reviews                 aprovação de direitos/editorial como pré-condição
--                                      de publicação; não há mais publicação de fonte
--   ceremonial_public_bundles          bundle público filtrado por direitos
--   ceremonial_public_bundle_pointer   ponteiro ativo/anterior desse bundle
--   ceremonial_workspace_memberships   mapeamento de sistema por modo de runtime
--   rights / access / sensitivity      classificação por edição, artefato e mídia
--   rights_note
--
-- O que fica: a linhagem (systems, works, editions, artifacts, locators), as entidades e
-- correspondências, e os registros privados de planejamento. Linhagem é proveniência
-- interna — serve para sabermos o que reestudar quando uma leitura se mostra errada.
--
-- Destrutivo por natureza. Estas tabelas e colunas nunca existiram em produção: não há
-- deploy, e os únicos dados são de execução local do importador sobre o acervo do
-- responsável, reconstruíveis rodando `npm run ceremonial:import` de novo.
--
-- Roll-forward: reexecutar o importador reconstrói a linhagem a partir do manifesto.
-- Rollback: `git revert` desta migration restaura as definições, mas não os dados
--           descartados; restaure de backup se algum ambiente compartilhado os tiver.

DROP TABLE IF EXISTS "ceremonial_public_bundle_pointer";
DROP TABLE IF EXISTS "ceremonial_public_bundles";
DROP TABLE IF EXISTS "ceremonial_reviews";
DROP TABLE IF EXISTS "ceremonial_workspace_memberships";

-- Índices compostos que existiam só para consultar por direitos/acesso.
DROP INDEX IF EXISTS "ceremonial_editions_access_rights_idx";
DROP INDEX IF EXISTS "ceremonial_media_access_rights_idx";

ALTER TABLE "ceremonial_editions"
  DROP COLUMN IF EXISTS "rights",
  DROP COLUMN IF EXISTS "access",
  DROP COLUMN IF EXISTS "sensitivity",
  DROP COLUMN IF EXISTS "rights_note";

ALTER TABLE "ceremonial_artifacts"
  DROP COLUMN IF EXISTS "rights",
  DROP COLUMN IF EXISTS "access",
  DROP COLUMN IF EXISTS "sensitivity";

ALTER TABLE "ceremonial_media"
  DROP COLUMN IF EXISTS "rights",
  DROP COLUMN IF EXISTS "access",
  DROP COLUMN IF EXISTS "sensitivity";
