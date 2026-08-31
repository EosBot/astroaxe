-- Primeiro verbete derivado do corpus condensado de `conteudo/`.
--
-- A fonte é uma obra de escola específica, e o verbete é escrito para ensinar a
-- lê-la como tal. Não há revisão independente registrada: desde a migration
-- 20260826150000 a revisão deixou de ser pré-condição, e inventar um parecer que
-- não aconteceu seria gravar ficção no banco. `reviewer_id` e `reviewed_at`
-- ficam nulos porque é isso que corresponde ao que houve.

INSERT INTO "cultural_sources" (
  "id", "source_key", "title", "url", "evidence_kind", "usage_status",
  "license_note", "accessed_at"
) VALUES (
  '20000000-0000-4000-8000-000000000010',
  'saraceni-teogonia-umbanda',
  'Orixás — Teogonia de Umbanda (Rubens Saraceni)',
  'https://www.madras.com.br/umbanda/orixas-teogonia-de-umbanda-5885',
  'community-primary',
  'REFERENCE_ONLY',
  'Obra de autor umbandista, consultada no acervo de estudo do responsável. Citada por posição; nenhuma expressão da obra é reproduzida no texto publicado, que é síntese original.',
  DATE '2026-08-27'
) ON CONFLICT ("source_key") DO NOTHING;

INSERT INTO "cultural_entries" (
  "id", "slug", "display_name", "category", "tradition_id", "summary",
  "editorial_body", "version", "status", "author_id", "published_at", "updated_at"
) VALUES (
  '31000000-0000-4000-8000-000000000005',
  'iemanja-teogonia-umbanda-sagrada',
  'Iemanjá na Teogonia de Umbanda de Rubens Saraceni',
  'orisa',
  'Umbanda',
  'Uma leitura situada de como Iemanjá aparece na Teogonia de Umbanda, obra de Rubens Saraceni. O verbete explica o que uma exposição de escola permite afirmar, por que densidade de material não é o mesmo que amplitude de concordância, e o que esse registro não autoriza generalizar sobre Umbanda, Candomblé ou tradições iorubás.',
  $body$Quando alguém procura saber quem é Iemanjá, o caminho mais curto costuma ser o pior: uma definição breve, aplicável a toda parte, que dispensa perguntar de onde ela veio. Este verbete faz o contrário. Ele parte de uma obra específica — a Teogonia de Umbanda, de Rubens Saraceni — e trata a origem do texto como parte do que o texto afirma.

Naquela exposição, Iemanjá é apresentada como mãe da vida e como a água que vivifica, e a ela é atribuída a regência sobre a geração. É uma formulação clara e coerente dentro do sistema que o autor constrói ao longo do livro, no qual os Orixás aparecem organizados por linhas, polaridades e funções que se articulam entre si. Compreender a afirmação exige compreender esse sistema: ela não é uma observação solta, é uma peça de uma teologia autoral.

E é justamente aí que mora o cuidado. Umbanda não tem doutrina nacional única, e a obra de um autor — por mais influente, por mais lida, por mais coerente — não é a voz de todas as casas. A mesma Iemanjá recebe leituras diferentes em terreiros diferentes, e diferentes de novo no Candomblé Ketu, no Jeje, no Congo-Angola, no Batuque, ou nas tradições iorubás em que o nome tem outra história. Nenhuma dessas leituras precisa da aprovação das outras para valer no seu contexto.

Há uma armadilha específica que este verbete quer ensinar a reconhecer, porque nós caímos nela durante o estudo. No acervo que sustenta este trabalho, quatro das obras mais presentes sobre Umbanda são do mesmo autor. Um sistema que contasse obras, e não linhagens, encontraria ali quatro confirmações e concluiria que aquela formulação é consenso. Não é. É uma voz, exposta quatro vezes, e a densidade do material diz mais sobre a nossa biblioteca do que sobre a concordância entre escolas. Quando corrigimos isso, o método passou a mostrar menos convergência do que mostrava — e a que ficou é real. Quem lê sobre religião com o mesmo cuidado que se lê sobre qualquer outra coisa deveria fazer a mesma pergunta diante de qualquer bibliografia: quantas vozes há aqui, e não quantos livros.

O que este registro permite afirmar, então, é preciso e limitado: existe uma exposição publicada, de autoria identificada, dentro da Umbanda, que descreve Iemanjá dessa maneira. Não permite afirmar que assim se ensina em toda Umbanda, nem que a mesma descrição valha para outras tradições, nem que uma formulação teológica publicada substitua o que se aprende numa casa, com quem tem autoridade para ensinar.

No AstroAxe, isso tem uma consequência direta e verificável. Iemanjá não será deduzida de signo, planeta, data de nascimento ou trânsito. O cálculo astrológico organiza uma leitura do céu e não confirma pertencimento religioso nem revela Orixá. Quando o produto apresentar uma ressonância simbólica próxima deste conteúdo, ela apontará para este contexto, declarará o método e o limite, e manterá aberta a diferença entre uma reflexão editorial e o fundamento de uma tradição viva. Orientação ritual pertence às comunidades e a quem elas legitimam.$body$,
  'authorial-synthesis-1',
  'PUBLISHED',
  '10000000-0000-4000-8000-000000000001',
  TIMESTAMPTZ '2026-08-28 01:00:00-03',
  CURRENT_TIMESTAMP
) ON CONFLICT ("id") DO NOTHING;

INSERT INTO "cultural_claims" (
  "id", "entry_id", "source_id", "claim_key", "predicate", "object_summary",
  "source_locator", "status"
) VALUES (
  '32000000-0000-4000-8000-000000000005',
  '31000000-0000-4000-8000-000000000005',
  '20000000-0000-4000-8000-000000000010',
  'iemanja-mae-da-vida-geracao',
  'descrita_na_obra_como',
  'A obra descreve Iemanjá como mãe da vida e água que vivifica, atribuindo-lhe a regência sobre a geração. A afirmação pertence ao sistema autoral do livro e não é apresentada como consenso da Umbanda.',
  'Seção sobre Iemanjá, no capítulo dos Orixás',
  'ACTIVE'
) ON CONFLICT ("entry_id", "claim_key") DO NOTHING;
