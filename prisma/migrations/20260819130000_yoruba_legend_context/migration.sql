-- First narrative-context entry from a legally accessible full text. The
-- synthesis is original and treats the 1929 collection as a historically
-- situated written witness, not as a universal or contemporary authority.

INSERT INTO "cultural_sources" (
  "id", "source_key", "title", "url", "evidence_kind", "usage_status",
  "license_note", "accessed_at"
) VALUES (
  '22000000-0000-4000-8000-000000000001',
  'ogumefu-yoruba-legends-sango-1929',
  'Yoruba Legends — capítulo VI: Why People Cry “Long Live the King!” When Thunder Follows Lightning',
  'https://www.sacred-texts.com/afr/yl/yl08.htm',
  'community-primary',
  'CLAIM_ELIGIBLE',
  'Edição inglesa de 1929 consultada integralmente nas páginas 8–9. O texto está em domínio público nos Estados Unidos; o status varia por jurisdição. Usar somente síntese original e breve descrição factual, sem reproduzir ou traduzir a expressão da obra. A moldura colonial do prefácio exige contextualização crítica.',
  DATE '2026-08-19'
) ON CONFLICT ("source_key") DO NOTHING;

INSERT INTO "cultural_entries" (
  "id", "slug", "display_name", "category", "tradition_id", "summary",
  "editorial_body", "version", "status", "author_id", "reviewer_id",
  "reviewed_at", "published_at", "updated_at"
) VALUES (
  '32000000-0000-4000-8000-000000000001',
  'xango-narrativa-ogumefu-1929',
  'Xangô, trovão e memória em uma narrativa de 1929',
  'orisa',
  'YorubaFolkloreOgumefu1929',
  'Uma leitura profunda e situada de uma narrativa registrada por M. I. Ogumefu em 1929, na qual a memória do rei Sango é ligada ao relâmpago, ao trovão e a uma saudação coletiva. O texto reconta a estrutura sem copiar a obra, examina responsabilidade e memória e explicita os limites históricos e coloniais da coleção.',
  $body$Nesta narrativa registrada em 1929, Sango aparece primeiro como rei. Ele conhece uma preparação capaz de atrair o relâmpago e decide experimentar sua força sobre o próprio palácio. O gesto desencadeia uma destruição que atinge sua casa e sua família. A história não apresenta poder como uma qualidade isolada ou automaticamente admirável: desde o início, poder, decisão e consequência permanecem amarrados.

Depois da perda, o rei é tomado pela dor e pela cólera. A narrativa descreve decisões violentas e contraditórias, seguidas pelo abandono do governo e por uma partida na qual os companheiros desaparecem pouco a pouco. O percurso termina em morte e, mais tarde, em memória coletiva. Relâmpago e trovão passam a convocar a lembrança do rei, e a comunidade responde com uma saudação. A estrutura do conto vai, portanto, do domínio de uma força à impossibilidade de controlar tudo o que ela produz; da autoridade pública ao isolamento; da vida de um governante à permanência de seu nome no mundo.

Essa síntese não deve ser convertida em diagnóstico de personalidade. Dizer que alguém é “explosivo como Xangô”, por exemplo, reduziria uma narrativa inteira a um adjetivo e repetiria a lógica dos testes superficiais que o AstroAxe procura evitar. O conto preservado por Ogumefu sustenta uma reflexão mais exigente: o que acontece quando capacidade e responsabilidade se separam? Como uma comunidade reelabora a lembrança de uma figura cuja história reúne grandeza, perda, violência e culto? Não há uma resposta única embutida no texto, mas há uma tensão que merece permanecer aberta.

Também é necessário ler a fonte historicamente. *Yoruba Legends* é uma coleção em inglês publicada em Londres em 1929. Seu prefácio usa categorias coloniais e cristãs para hierarquizar as histórias que apresenta. Essa moldura não é neutra e não deve ser adotada pelo produto. Ao mesmo tempo, o capítulo oferece um registro escrito identificável de uma narrativa vinculada ao território iorubá. O uso responsável exige manter as duas coisas visíveis: a narrativa documentada e os limites da pessoa, da época, da língua e do projeto editorial que a colocou no papel.

Uma narrativa escrita também não encerra a tradição oral. Versões podem mudar conforme cidade, linhagem, narrador, idioma e ocasião. Este verbete não afirma que a sequência de 1929 seja a origem, a versão correta ou a forma compartilhada por todas as comunidades iorubás e afro-diaspóricas. Ele a trata como um testemunho localizado. Outras versões deverão entrar como outros registros, com seus próprios créditos e diferenças, e nunca ser fundidas silenciosamente em uma história artificialmente uniforme.

No contexto de um aplicativo astrológico, trovão e relâmpago não autorizam uma associação automática com Marte, Júpiter, signo de fogo ou qualquer trânsito. A imagem narrativa pode provocar reflexão, mas não produz uma correspondência religiosa. Caso este bloco venha a ser selecionado junto de uma leitura do céu, o produto precisará explicar o critério editorial, mostrar que a aproximação é simbólica e conservar este texto como unidade versionada — sem improvisar uma nova lenda para cada usuário.

Uma prática de leitura possível é retornar à sequência da narrativa e observar quatro movimentos: capacidade, escolha, consequência e memória. Em vez de perguntar “qual personagem eu sou?”, pode-se perguntar onde uma força disponível pede mais responsabilidade; qual consequência precisa ser reconhecida antes de uma nova ação; e como lembrar uma história sem apagar suas ambiguidades. É uma proposta de reflexão literária, não um rito, uma consulta ou um fundamento religioso.

O aprofundamento continua fora da tela: conferir o capítulo indicado, comparar versões publicadas por autores iorubás e escutar praticantes e pesquisadores capazes de situar as transformações da narrativa. O valor deste verbete não está em fechar Xangô em uma definição. Está em oferecer uma história com origem rastreável, reconhecer o filtro histórico pelo qual ela chegou e impedir que a intensidade do símbolo vire certeza sobre a vida religiosa de alguém.$body$,
  'council-approved-1', 'PUBLISHED',
  '10000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000003',
  TIMESTAMPTZ '2026-08-19 14:00:00-03', TIMESTAMPTZ '2026-08-19 14:00:00-03', CURRENT_TIMESTAMP
) ON CONFLICT ("slug", "version") DO NOTHING;

INSERT INTO "cultural_claims" (
  "id", "entry_id", "source_id", "claim_key", "predicate", "object_summary",
  "source_locator", "status"
) VALUES
  (
    '42000000-0000-4000-8000-000000000001',
    '32000000-0000-4000-8000-000000000001',
    '22000000-0000-4000-8000-000000000001',
    'sango-lightning-thunder-memory-ogumefu',
    'appears_in_recorded_narrative',
    'O capítulo narra uma sequência que liga o rei Sango, o uso destrutivo do relâmpago, sua morte e uma saudação comunitária quando o trovão sucede o relâmpago.',
    'Capítulo VI, páginas 8–9',
    'ACTIVE'
  ),
  (
    '42000000-0000-4000-8000-000000000002',
    '32000000-0000-4000-8000-000000000001',
    '22000000-0000-4000-8000-000000000001',
    'ogumefu-preface-colonial-frame',
    'requires_historical_context',
    'O prefácio da coleção enquadra as narrativas por categorias coloniais e cristãs; esse enquadramento não é adotado pelo AstroAxe e limita o uso da obra como autoridade geral.',
    'Prefácio, páginas iii–iv',
    'ACTIVE'
  )
ON CONFLICT ("entry_id", "claim_key") DO NOTHING;

INSERT INTO "cultural_reviews" (
  "id", "entry_id", "reviewer_id", "decision", "note", "created_at"
) VALUES (
  '52000000-0000-4000-8000-000000000001',
  '32000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000003',
  'APPROVED',
  'Aprovação em lote declarada pelo responsável do produto. Síntese original limitada ao capítulo VI e ao prefácio consultados; mantém crítica da moldura colonial, não reproduz texto e não cria correspondência astrológica ou identidade religiosa.',
  TIMESTAMPTZ '2026-08-19 14:00:00-03'
) ON CONFLICT ("id") DO NOTHING;
