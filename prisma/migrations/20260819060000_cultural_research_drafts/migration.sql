-- Research drafts only. These records are intentionally not published and require
-- independent cultural review before any product or future AI consumption.

INSERT INTO "cultural_contributors" (
  "id", "display_name", "attribution_line", "role"
) VALUES (
  '10000000-0000-4000-8000-000000000001',
  'Pesquisa editorial AstroAxe',
  'Rascunho de pesquisa; não representa revisão religiosa ou comunitária',
  'AUTHOR'
) ON CONFLICT ("id") DO NOTHING;

INSERT INTO "cultural_sources" (
  "id", "source_key", "title", "url", "evidence_kind", "license_note", "accessed_at"
) VALUES
  (
    '20000000-0000-4000-8000-000000000001',
    'iphan-oficio-baianas-acaraje-2021',
    'Ofício das Baianas de Acarajé — Parecer Técnico',
    'https://www.gov.br/iphan/pt-br/assuntos/noticias/aberta-consulta-publica-sobre-quatro-tres-bens-culturais/oficio-da-baianas-de-acaraje-sei_iphan-2956233-parecer-tecnico.pdf',
    'institutional-inventory',
    'Portal IPHAN sob CC BY-ND 3.0; usar apenas síntese factual original, atribuição e locator. Revisar direitos antes da publicação.',
    DATE '2026-08-19'
  ),
  (
    '20000000-0000-4000-8000-000000000002',
    'iphan-pnpi-casa-branca-2014',
    'Compêndio dos Editais do Programa Nacional do Patrimônio Imaterial — Volume II',
    'https://www.gov.br/iphan/pt-br/acesso-a-informacao/acoes-e-programas/programas/edital-do-programa-nacional-de-patrimonio-imaterial-pnpi-em-2023/pnpivol2.pdf',
    'institutional-inventory',
    'Portal IPHAN sob CC BY-ND 3.0; usar apenas síntese factual original, atribuição e locator. Revisar direitos antes da publicação.',
    DATE '2026-08-19'
  )
ON CONFLICT ("source_key") DO NOTHING;

INSERT INTO "cultural_entries" (
  "id", "slug", "display_name", "category", "tradition_id", "summary",
  "editorial_body", "version", "status", "author_id", "updated_at"
) VALUES
  (
    '30000000-0000-4000-8000-000000000001',
    'xango-contexto-iphan',
    'Xangô em contextos documentados pelo IPHAN',
    'orisa',
    'CandombleKetuNago',
    'Um rascunho situado sobre referências públicas a Xangô em patrimônios afro-brasileiros documentados pelo IPHAN.',
    'O parecer sobre o Ofício das Baianas de Acarajé registra associações rituais situadas do acarajé com Xangô e outras figuras. O compêndio do PNPI também descreve a presença de Xangô na Casa Branca, em Salvador. Essas referências pertencem aos contextos documentados e não formam uma regra universal entre tradições ou casas.',
    'research-draft-1', 'DRAFT', '10000000-0000-4000-8000-000000000001', CURRENT_TIMESTAMP
  ),
  (
    '30000000-0000-4000-8000-000000000002',
    'oia-iansa-contexto-acaraje',
    'Oiá/Iansã no contexto documentado do acarajé',
    'orisa',
    'CandombleKetuNago',
    'Um rascunho situado sobre a presença de Oiá/Iansã na documentação patrimonial do Ofício das Baianas de Acarajé.',
    'O parecer técnico do IPHAN registra Oiá, também grafada Iansã no documento, entre as figuras relacionadas ao acarajé em uma dimensão religiosa específica. O registro deve preservar a localização da fonte e não autoriza generalizar comidas, narrativas ou relações para todas as comunidades.',
    'research-draft-1', 'DRAFT', '10000000-0000-4000-8000-000000000001', CURRENT_TIMESTAMP
  ),
  (
    '30000000-0000-4000-8000-000000000003',
    'oba-contexto-acaraje',
    'Obá no contexto documentado do acarajé',
    'orisa',
    'CandombleKetuNago',
    'Um rascunho situado sobre a referência a Obá no parecer patrimonial do Ofício das Baianas de Acarajé.',
    'O parecer técnico do IPHAN inclui Obá entre as figuras citadas no contexto religioso do acarajé. Esta claim descreve somente o documento consultado: não define identidade, preferência pessoal, prescrição ritual ou correspondência astrológica.',
    'research-draft-1', 'DRAFT', '10000000-0000-4000-8000-000000000001', CURRENT_TIMESTAMP
  )
ON CONFLICT ("slug", "version") DO NOTHING;

INSERT INTO "cultural_claims" (
  "id", "entry_id", "source_id", "claim_key", "predicate", "object_summary",
  "source_locator", "status"
) VALUES
  (
    '40000000-0000-4000-8000-000000000001',
    '30000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000001',
    'xango-acaraje-iphan', 'appears_in_documented_context',
    'O parecer registra Xangô no contexto religioso e patrimonial do acarajé em Salvador.',
    'Parecer técnico, discussão da dimensão religiosa', 'ACTIVE'
  ),
  (
    '40000000-0000-4000-8000-000000000002',
    '30000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000002',
    'xango-casa-branca-iphan', 'appears_in_documented_context',
    'O compêndio descreve Xangô entre as referências da Casa Branca do Engenho Velho.',
    'Volume II, seção Casa Branca do Engenho Velho', 'ACTIVE'
  ),
  (
    '40000000-0000-4000-8000-000000000003',
    '30000000-0000-4000-8000-000000000002',
    '20000000-0000-4000-8000-000000000001',
    'oia-iansa-acaraje-iphan', 'appears_in_documented_context',
    'O parecer registra Oiá/Iansã no contexto religioso e patrimonial do acarajé em Salvador.',
    'Parecer técnico, discussão da dimensão religiosa', 'ACTIVE'
  ),
  (
    '40000000-0000-4000-8000-000000000004',
    '30000000-0000-4000-8000-000000000003',
    '20000000-0000-4000-8000-000000000001',
    'oba-acaraje-iphan', 'appears_in_documented_context',
    'O parecer registra Obá no contexto religioso e patrimonial do acarajé em Salvador.',
    'Parecer técnico, discussão da dimensão religiosa', 'ACTIVE'
  )
ON CONFLICT ("entry_id", "claim_key") DO NOTHING;
