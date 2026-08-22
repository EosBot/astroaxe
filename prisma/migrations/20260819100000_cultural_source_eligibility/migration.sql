ALTER TABLE "cultural_sources"
  ADD COLUMN "usage_status" VARCHAR(30) NOT NULL DEFAULT 'REFERENCE_ONLY';

ALTER TABLE "cultural_sources"
  ADD CONSTRAINT "cultural_sources_usage_status_check"
  CHECK ("usage_status" IN ('REFERENCE_ONLY', 'CLAIM_ELIGIBLE', 'WITHDRAWN'));

-- Sources already used by the IPHAN research drafts have public locators and
-- were read for those limited claims. Newly catalogued books remain references
-- until an editor records the exact edition and page/section actually reviewed.
UPDATE "cultural_sources"
SET "usage_status" = 'CLAIM_ELIGIBLE'
WHERE "source_key" IN (
  'iphan-oficio-baianas-acaraje-2021',
  'iphan-pnpi-casa-branca-2014'
);

INSERT INTO "cultural_sources" (
  "id", "source_key", "title", "url", "evidence_kind", "usage_status",
  "license_note", "accessed_at"
) VALUES
  (
    '21000000-0000-4000-8000-000000000001',
    'saraceni-codigo-umbanda-9788537003381',
    'Código de Umbanda',
    'https://www.madras.com.br/umbanda/codigo-de-umbanda-6499',
    'community-primary', 'REFERENCE_ONLY',
    'Obra protegida; catálogo editorial consultado. Fonte doutrinária situada na Umbanda Sagrada de Rubens Saraceni. Exige exemplar legal, edição e página antes de sustentar claim; não reproduzir texto.',
    DATE '2026-08-19'
  ),
  (
    '21000000-0000-4000-8000-000000000002',
    'saraceni-sete-linhas-9788537003633',
    'As Sete Linhas de Umbanda — A Religião dos Mistérios',
    'https://www.madras.com.br/kits/essencial-rubens-saraceni',
    'community-primary', 'REFERENCE_ONLY',
    'Obra protegida; catálogo editorial consultado. Teologia específica da Umbanda Sagrada, não consenso entre Umbandas. Exige exemplar legal, edição e página; não reproduzir texto.',
    DATE '2026-08-19'
  ),
  (
    '21000000-0000-4000-8000-000000000003',
    'saraceni-arquetipos-9788537001905',
    'Os Arquétipos da Umbanda',
    'https://www.madras.com.br/umbanda/arquetipos-da-umbanda-os',
    'community-primary', 'REFERENCE_ONLY',
    'Obra protegida; catálogo editorial consultado. Tratar conceitos como doutrina da corrente de Saraceni. Exige exemplar legal, edição e página; não reproduzir texto.',
    DATE '2026-08-19'
  ),
  (
    '21000000-0000-4000-8000-000000000004',
    'prandi-mitologia-orixas-9788535900644',
    'Mitologia dos Orixás',
    'https://www.companhiadasletras.com.br/livro/9788535900644/mitologia-dos-orixas',
    'scholarly-analysis', 'REFERENCE_ONLY',
    'Obra protegida; catálogo oficial confirma 301 narrativas e dados bibliográficos, não a leitura integral. Exige exemplar legal, edição, página e identificação da proveniência da narrativa; não reproduzir mitos.',
    DATE '2026-08-19'
  ),
  (
    '21000000-0000-4000-8000-000000000005',
    'verger-notas-orixas-voduns-9788531404757',
    'Notas Sobre o Culto aos Orixás e Voduns',
    'https://www.edusp.com.br/livros/notas-sobre-o-culto-aos-orixas-e-voduns/',
    'ethnography', 'REFERENCE_ONLY',
    'Obra protegida e com material potencialmente iniciático; catálogo oficial consultado. Exige exemplar legal, edição, página, avaliação de sensibilidade e revisão cultural; não reproduzir ritos ou oríkì.',
    DATE '2026-08-19'
  ),
  (
    '21000000-0000-4000-8000-000000000006',
    'santos-nago-morte-9788532609236',
    'Os Nàgô e a Morte: Pàde, Àsèsè e o culto Égun na Bahia',
    'https://catalogue.bnf.fr/ark:/12148/cb34946851v',
    'ethnography', 'REFERENCE_ONLY',
    'Obra protegida; registro de biblioteca consultado. Tema ritual e potencialmente restrito. Exige exemplar legal, edição, página, avaliação de sensibilidade e revisão cultural; não reproduzir textos rituais.',
    DATE '2026-08-19'
  ),
  (
    '21000000-0000-4000-8000-000000000007',
    'abimbola-ifa-literary-corpus-1976',
    'Ifá: An Exposition of Ifá Literary Corpus',
    'https://search.worldcat.org/title/Ifa-%3A-an-exposition-of-Ifa-literary-corpus/oclc/3071093',
    'scholarly-analysis', 'REFERENCE_ONLY',
    'Obra protegida; registro bibliográfico consultado, sem leitura integral. Exige exemplar legal, edição, página, contexto linguístico e revisão por conhecedor de Ifá; não reproduzir versos.',
    DATE '2026-08-19'
  ),
  (
    '21000000-0000-4000-8000-000000000008',
    'bascom-sixteen-cowries-1980',
    'Sixteen Cowries: Yoruba Divination from Africa to the New World',
    'https://search.worldcat.org/title/Sixteen-cowries-%3A-Yoruba-divination-from-Africa-to-the-New-World/oclc/560389150',
    'ethnography', 'REFERENCE_ONLY',
    'Registro bibliográfico consultado; a indicação de acesso no catálogo não elimina direitos ou sensibilidade ritual. Exige verificação da licença do exemplar, página e revisão cultural; não reproduzir textos divinatórios.',
    DATE '2026-08-19'
  )
ON CONFLICT ("source_key") DO NOTHING;

CREATE INDEX "cultural_sources_usage_status_idx"
  ON "cultural_sources"("usage_status");
