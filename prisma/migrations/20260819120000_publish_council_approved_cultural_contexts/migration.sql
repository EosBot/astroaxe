-- Publish the first council-approved cultural collection without inventing
-- individual credentials. Approval is recorded as the collective decision
-- declared by the product owner on 2026-08-19.

INSERT INTO "cultural_contributors" (
  "id", "display_name", "public_bio", "attribution_line", "role"
) VALUES (
  '10000000-0000-4000-8000-000000000003',
  'Conselho cultural AstroAxe',
  'Instância coletiva de governança cultural do produto. Este registro documenta a aprovação em lote declarada pelo responsável do AstroAxe; não atribui nomes, cargos religiosos ou credenciais individuais que não tenham sido fornecidos.',
  'Aprovação coletiva declarada pelo responsável do produto em 19 de agosto de 2026',
  'REVIEWER'
) ON CONFLICT ("id") DO NOTHING;

ALTER TABLE "cultural_entries"
  ADD CONSTRAINT "published_cultural_entry_depth"
  CHECK (
    "status" <> 'PUBLISHED'
    OR (
      char_length("summary") >= 240
      AND char_length("editorial_body") >= 1800
    )
  );

INSERT INTO "cultural_entries" (
  "id", "slug", "display_name", "category", "tradition_id", "summary",
  "editorial_body", "version", "status", "author_id", "reviewer_id",
  "reviewed_at", "published_at", "updated_at"
) VALUES
  (
    '31000000-0000-4000-8000-000000000001',
    'xango-contexto-iphan',
    'Xangô em contextos documentados pelo IPHAN',
    'orisa',
    'CandombleKetuNago',
    'Uma leitura contextual sobre como Xangô aparece em dois registros públicos de patrimônio afro-brasileiro: o Ofício das Baianas de Acarajé e a Casa Branca do Engenho Velho. O verbete preserva o lugar, a tradição e os limites das fontes, sem converter documentação patrimonial em regra religiosa ou correspondência astrológica.',
    $body$Começar por Xangô, neste acervo, não significa começar por uma lista de atributos. Significa começar por lugares, pessoas e práticas que o Instituto do Patrimônio Histórico e Artístico Nacional registrou como patrimônio vivo. Em um dos documentos, Xangô aparece na discussão da dimensão religiosa do Ofício das Baianas de Acarajé, em Salvador. Em outro, aparece entre as referências da Casa Branca do Engenho Velho. As duas ocorrências aproximam o nome de Xangô de contextos afro-brasileiros concretos, mas não os transformam em uma fórmula única.

O acarajé não entra aqui como ilustração decorativa. O parecer técnico do IPHAN trata de um ofício sustentado por conhecimentos, modos de fazer, circulação urbana, memória e relações religiosas. Quando o documento registra Xangô nesse contexto, ele permite afirmar uma coisa precisa: há uma associação documentada naquele universo patrimonial. Não permite concluir que toda preparação, toda casa, toda pessoa ou toda tradição formule essa relação da mesma maneira. O valor da fonte está justamente em situar, e não em apagar diferenças.

A Casa Branca do Engenho Velho amplia a paisagem documental sem produzir uma regra universal. A menção a Xangô em um compêndio do Programa Nacional do Patrimônio Imaterial aponta para a continuidade histórica de uma comunidade e para a importância de seus próprios referenciais. Ler esse registro com cuidado exige reconhecer que patrimônio imaterial não é uma coleção de símbolos disponíveis para qualquer uso. É conhecimento vinculado a comunidades, territórios, autoridades e modos de transmissão.

Por isso, este texto não tenta resumir quem é Xangô em todas as tradições. Também não escolhe uma narrativa mítica como se ela anulasse as demais. Seu propósito é ensinar uma forma de leitura: quando uma figura religiosa aparece em uma fonte pública, é preciso perguntar onde aparece, quem produziu o registro, qual prática está sendo descrita e quais generalizações a fonte não autoriza. Essa disciplina protege a profundidade do tema contra duas reduções comuns — o verbete enciclopédico sem contexto e o arquétipo de personalidade que promete explicar alguém em poucas palavras.

No AstroAxe, essa distinção tem uma consequência direta. Xangô não será deduzido de signo, planeta, data de nascimento ou trânsito. Um cálculo astrológico pode organizar uma leitura do céu; ele não confirma pertencimento religioso nem revela Orixá. Caso o produto apresente, no futuro, uma ressonância simbólica próxima deste conteúdo, ela deverá apontar para este contexto, declarar o método usado e manter aberta a diferença entre reflexão editorial e fundamento de uma tradição viva.

Este verbete é, portanto, uma porta de entrada documental. Ele convida a perceber que um mesmo nome pode atravessar histórias e comunidades sem perder a necessidade de localização. Aprofundar-se significa consultar as fontes indicadas, reconhecer suas limitações e buscar a palavra de praticantes e lideranças quando a pergunta deixa de ser histórica ou cultural e passa a ser religiosa. O aplicativo pode oferecer contexto; orientação ritual pertence às comunidades e aos espaços legitimados por elas.$body$,
    'council-approved-1', 'PUBLISHED',
    '10000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000003',
    TIMESTAMPTZ '2026-08-19 12:00:00-03', TIMESTAMPTZ '2026-08-19 12:00:00-03', CURRENT_TIMESTAMP
  ),
  (
    '31000000-0000-4000-8000-000000000002',
    'oia-iansa-contexto-acaraje',
    'Oiá/Iansã no contexto documentado do acarajé',
    'orisa',
    'CandombleKetuNago',
    'Uma leitura situada da presença de Oiá, também grafada Iansã no parecer consultado, na dimensão religiosa do Ofício das Baianas de Acarajé. O texto explica o que esse registro patrimonial permite compreender e o que ele não permite generalizar sobre comidas, narrativas, casas ou identidade religiosa.',
    $body$O nome Oiá aparece no parecer técnico do IPHAN sobre o Ofício das Baianas de Acarajé, acompanhado também pela grafia Iansã. Essa informação parece simples, mas pede uma leitura cuidadosa. A fonte não está montando um dicionário universal de Orixás; está documentando um bem cultural brasileiro, suas continuidades, transformações, agentes e dimensões religiosas. O contexto do documento é parte inseparável da afirmação.

O Ofício das Baianas de Acarajé reúne muito mais do que a existência de uma receita. Há saberes de preparo, trabalho, circulação nas cidades, transmissão entre gerações, vestimentas, objetos, sociabilidade e vínculos religiosos. Ao registrar Oiá/Iansã entre as figuras relacionadas ao acarajé nessa dimensão específica, o parecer torna visível uma ligação presente no universo pesquisado. Essa visibilidade é importante porque evita tratar a cultura afro-brasileira como pano de fundo anônimo. Ao mesmo tempo, ela não autoriza transformar a ligação em uma tabela rígida válida para qualquer território ou comunidade.

Preservar as duas grafias também é uma decisão de contexto. Nomes viajam entre línguas, práticas de escrita e histórias brasileiras. O verbete não usa essa variação para afirmar que todos os usos são idênticos nem para escolher uma forma como superior. Ele informa como a própria fonte apresenta o nome e mantém a tradição declarada no registro editorial. Em conteúdos posteriores, outras tradições ou comunidades podem exigir nomenclaturas, pronúncias e explicações próprias.

O ponto central desta leitura é que comida, patrimônio e religião podem se encontrar sem se tornarem equivalentes. O acarajé pode circular em diferentes situações sociais, e o documento patrimonial descreve uma dimensão religiosa que não deve ser apagada. Reconhecer essa dimensão não significa prescrever oferenda, ritual, preferência alimentar ou comportamento individual. Nenhuma dessas conclusões está sustentada pela claim registrada aqui.

Essa fronteira importa especialmente em um produto astrológico. O AstroAxe não usa vento, tempestade, movimento ou qualquer outro motivo simbólico para declarar que uma pessoa “é de Iansã”. Metáforas podem ser potentes na literatura e na reflexão, mas não substituem fundamentos, iniciação, consulta ou pertencimento. Se uma futura leitura aproximar um tema astrológico deste acervo, a aproximação será rotulada como ressonância editorial, terá fonte e versão e jamais funcionará como diagnóstico religioso.

Ler com profundidade, neste caso, é resistir à pressa de completar a fonte com certezas que ela não oferece. O parecer permite acompanhar uma presença documentada e entender que o ofício possui uma dimensão religiosa reconhecida pelo patrimônio cultural. Para aprender sobre narrativas, fundamentos e variações de Oiá/Iansã, serão necessários outros corpus, cada um identificado por tradição, edição e autoria. Este bloco não ocupa esse lugar: ele oferece um chão documental e indica honestamente onde esse chão termina.$body$,
    'council-approved-1', 'PUBLISHED',
    '10000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000003',
    TIMESTAMPTZ '2026-08-19 12:00:00-03', TIMESTAMPTZ '2026-08-19 12:00:00-03', CURRENT_TIMESTAMP
  ),
  (
    '31000000-0000-4000-8000-000000000003',
    'oba-contexto-acaraje',
    'Obá no contexto documentado do acarajé',
    'orisa',
    'CandombleKetuNago',
    'Uma leitura contextual da referência a Obá no parecer técnico do Ofício das Baianas de Acarajé. Em vez de preencher lacunas com perfis de personalidade ou versões isoladas de mitos, o verbete mantém a afirmação junto ao documento, ao patrimônio e aos limites do que foi efetivamente consultado.',
    $body$Obá aparece no parecer técnico do IPHAN dentro da discussão sobre a dimensão religiosa do Ofício das Baianas de Acarajé. Este verbete parte dessa ocorrência pequena e específica para mostrar por que contexto é uma forma de profundidade. Uma menção documental não conta toda a história de uma figura religiosa, mas pode revelar onde um nome participa de práticas, memórias e formas de vida que receberam reconhecimento patrimonial.

O documento consultado não foi produzido como manual teológico nem como coleção completa de narrativas. Seu objeto é um ofício exercido por pessoas reais, atravessado por técnicas de preparo, trabalho, transmissão de saberes e relações com religiões afro-brasileiras. A presença de Obá nesse registro permite afirmar que o parecer a inclui entre as figuras relacionadas à dimensão religiosa descrita. A claim para aí porque avançar além dela exigiria outras fontes e outras competências.

Essa contenção é especialmente necessária no caso de Obá, frequentemente apresentada ao público por meio de uma única narrativa reduzida a rivalidade, ciúme ou sofrimento. Repetir um resumo descontextualizado até que ele vire traço de personalidade empobrece a tradição e pode transformar uma figura religiosa em personagem psicológica disponível para consumo. O corpus atual não usa o parecer do IPHAN para confirmar nem para negar versões míticas; ele simplesmente não atribui ao documento aquilo que o documento não foi chamado a demonstrar.

Há também uma diferença entre citar uma relação cultural com o acarajé e prescrever uma prática. O verbete não informa oferenda, obrigação, ritual ou preferência individual. Não orienta conduta religiosa e não sugere que uma pessoa possa descobrir vínculo com Obá por afinidade emocional. Esses limites não diminuem o conteúdo. Eles deixam visível a cadeia de conhecimento e protegem o leitor contra uma certeza fabricada.

No AstroAxe, nenhum trânsito, aspecto ou posição natal converte esta referência em identidade. A astrologia utilizada pelo produto é um sistema de cálculo e interpretação separado. Uma eventual ressonância cultural precisa ser construída por método explicitamente aprovado, reutilizar apenas blocos publicados e mostrar sua condição simbólica. Ela não será uma equivalência do tipo planeta–Orixá, nem uma resposta sobre cabeça, filiação ou destino religioso.

O convite deste texto é olhar para o documento como começo, não como atalho. Ele situa Obá em um registro público do patrimônio afro-brasileiro e oferece ao leitor a fonte para conferir a afirmação. Para aprofundar narrativas e fundamentos, o acervo precisará de obras efetivamente lidas, locators precisos e versões separadas conforme suas tradições. A honestidade sobre esse percurso é parte do valor editorial: texto longo não deve significar texto inflado, mas uma explicação clara do que sabemos, de onde sabemos e do que ainda não devemos afirmar.$body$,
    'council-approved-1', 'PUBLISHED',
    '10000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000003',
    TIMESTAMPTZ '2026-08-19 12:00:00-03', TIMESTAMPTZ '2026-08-19 12:00:00-03', CURRENT_TIMESTAMP
  )
ON CONFLICT ("slug", "version") DO NOTHING;

INSERT INTO "cultural_claims" (
  "id", "entry_id", "source_id", "claim_key", "predicate", "object_summary",
  "source_locator", "status"
) VALUES
  (
    '41000000-0000-4000-8000-000000000001',
    '31000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000001',
    'xango-acaraje-iphan', 'appears_in_documented_context',
    'O parecer registra Xangô no contexto religioso e patrimonial do acarajé em Salvador.',
    'Parecer técnico, dimensão religiosa', 'ACTIVE'
  ),
  (
    '41000000-0000-4000-8000-000000000002',
    '31000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000002',
    'xango-casa-branca-iphan', 'appears_in_documented_context',
    'O compêndio descreve Xangô entre as referências da Casa Branca do Engenho Velho.',
    'Volume II, seção Casa Branca do Engenho Velho', 'ACTIVE'
  ),
  (
    '41000000-0000-4000-8000-000000000003',
    '31000000-0000-4000-8000-000000000002',
    '20000000-0000-4000-8000-000000000001',
    'oia-iansa-acaraje-iphan', 'appears_in_documented_context',
    'O parecer registra Oiá/Iansã no contexto religioso e patrimonial do acarajé em Salvador.',
    'Parecer técnico, dimensão religiosa', 'ACTIVE'
  ),
  (
    '41000000-0000-4000-8000-000000000004',
    '31000000-0000-4000-8000-000000000003',
    '20000000-0000-4000-8000-000000000001',
    'oba-acaraje-iphan', 'appears_in_documented_context',
    'O parecer registra Obá no contexto religioso e patrimonial do acarajé em Salvador.',
    'Parecer técnico, dimensão religiosa', 'ACTIVE'
  )
ON CONFLICT ("entry_id", "claim_key") DO NOTHING;

INSERT INTO "cultural_reviews" (
  "id", "entry_id", "reviewer_id", "decision", "note", "created_at"
) VALUES
  (
    '51000000-0000-4000-8000-000000000001',
    '31000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000003',
    'APPROVED',
    'Aprovação em lote declarada pelo responsável do produto. Bloco restrito às duas claims IPHAN, sem correspondência astrológica, prescrição ritual ou credencial individual inferida.',
    TIMESTAMPTZ '2026-08-19 12:00:00-03'
  ),
  (
    '51000000-0000-4000-8000-000000000002',
    '31000000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000003',
    'APPROVED',
    'Aprovação em lote declarada pelo responsável do produto. Bloco restrito à claim IPHAN, preserva as grafias da fonte e não cria identidade ou correspondência religiosa.',
    TIMESTAMPTZ '2026-08-19 12:00:00-03'
  ),
  (
    '51000000-0000-4000-8000-000000000003',
    '31000000-0000-4000-8000-000000000003',
    '10000000-0000-4000-8000-000000000003',
    'APPROVED',
    'Aprovação em lote declarada pelo responsável do produto. Bloco restrito à claim IPHAN e não importa narrativas ou traços pessoais de fontes não elegíveis.',
    TIMESTAMPTZ '2026-08-19 12:00:00-03'
  )
ON CONFLICT ("id") DO NOTHING;
