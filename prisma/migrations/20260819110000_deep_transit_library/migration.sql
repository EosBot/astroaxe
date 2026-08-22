-- A reusable astrological library. The prose is original AstroAxe editorial copy,
-- assembled once into concrete records; no LLM is called when a user requests a reading.

ALTER TABLE "transit_interpretation_templates"
  ADD CONSTRAINT "transit_text_published_depth_check" CHECK (
    "status" <> 'PUBLISHED' OR (
      length("opening") >= 180 AND
      length("deepening") >= 1200 AND
      length("technical_why") >= 180 AND
      length("reflection_prompt") >= 60 AND
      length("practice") >= 100
    )
  );

WITH
transiting_blocks(body, name, opening, body_text) AS (VALUES
  ('sun', 'Sol',
   'O Sol em trânsito ilumina um ponto do mapa e torna mais visível a maneira como você ocupa espaço, escolhe direção e reconhece aquilo que merece energia consciente.',
   'O movimento solar funciona como foco: ele não cria sozinho uma situação, mas concentra atenção sobre uma função natal. Pode surgir vontade de definir prioridades, mostrar uma posição ou recuperar autoria sobre algo conduzido no automático. A vitalidade não é infinita, então clareza também significa decidir onde não investir presença. Observe a diferença entre aparecer para sustentar algo verdadeiro e buscar confirmação para aliviar uma insegurança passageira.'),
  ('moon', 'Lua',
   'A Lua em trânsito muda depressa e aproxima o céu calculado dos ritmos de humor, cuidado, memória e resposta corporal que atravessam este momento.',
   'Por ser rápida, a Lua descreve uma atmosfera curta, não uma identidade permanente. Sensações podem ganhar volume e depois mudar de forma. O valor da leitura está em perceber necessidade, cansaço, proteção e pertencimento antes de transformar uma reação em conclusão definitiva. Alimentação, sono, ambiente e vínculos concretos participam dessa experiência; o trânsito oferece uma lente temporal, jamais uma desculpa para ignorar o corpo ou atribuir toda emoção ao céu.'),
  ('mercury', 'Mercúrio',
   'Mercúrio em trânsito movimenta linguagem, interpretação, negociação e circulação de informações, tocando a forma como uma função natal pode ser nomeada e reconsiderada.',
   'Este ciclo costuma trazer perguntas, mensagens, deslocamentos, documentos ou conversas para o primeiro plano. A mente pode ganhar agilidade, mas rapidez não garante compreensão. Vale separar dado, suposição e resposta emocional; revisar o que foi entendido; perguntar antes de preencher lacunas. Mercúrio favorece experiências pequenas que produzem informação. Em vez de exigir uma certeza total, experimente formular a próxima pergunta capaz de tornar o cenário um pouco mais legível.'),
  ('venus', 'Vênus',
   'Vênus em trânsito aproxima temas de valor, vínculo, prazer, reciprocidade e escolha, mostrando onde atração e acordo precisam conversar com a realidade.',
   'A passagem venusiana não promete romance nem dinheiro. Ela evidencia critérios: o que você aprecia, aceita, oferece e espera receber. Pode haver mais abertura para conciliar, criar beleza ou reconhecer afinidades, mas também tendência a evitar um desconforto necessário para preservar harmonia aparente. Observe trocas concretas. Um vínculo saudável não depende de adivinhar desejos; uma escolha sustentável considera prazer, custo, consentimento e continuidade.'),
  ('mars', 'Marte',
   'Marte em trânsito aumenta impulso, iniciativa e capacidade de confronto no ponto natal tocado, tornando mais difícil ignorar energia acumulada ou limites ultrapassados.',
   'Marte pede movimento, mas não determina briga. Sua força pode aparecer como coragem, irritação, desejo, competitividade ou pressa. Antes de agir, identifique o alvo real: o que precisa começar, parar, ser defendido ou receber esforço? A ação mais potente nem sempre é a maior; costuma ser a que tem direção e medida. Corpo, descanso e contexto importam. Intensidade sem escuta pode ferir, enquanto assertividade bem localizada devolve escolha.'),
  ('jupiter', 'Júpiter',
   'Júpiter em trânsito amplia perspectiva, confiança e desejo de crescimento, fazendo uma função natal parecer maior, mais promissora ou mais urgente do que antes.',
   'Expansão pode significar estudo, circulação, oportunidade, generosidade ou recuperação de esperança. Também pode exagerar promessas, gastos e certezas. O trabalho não é diminuir entusiasmo, mas oferecer escala e critério. Pergunte o que essa abertura ensina, quais recursos exige e quem será afetado. Crescimento consistente não precisa provar grandeza; ele aumenta repertório e responsabilidade ao mesmo tempo.'),
  ('saturn', 'Saturno',
   'Saturno em trânsito coloca tempo, limite, consequência e compromisso diante da função natal tocada, pedindo uma relação mais honesta entre ambição e capacidade.',
   'Este ciclo pode coincidir com peso, atraso, cobrança ou necessidade de consolidar algo. Nada disso equivale a fracasso anunciado. Saturno torna visível o que depende de estrutura, repetição e renúncia. Metas criadas apenas para provar valor tendem a cansar; compromissos escolhidos com consciência podem ganhar forma. Maturidade aqui não é suportar tudo sozinho, mas distinguir responsabilidade, ajuda necessária e limite que precisa ser comunicado.')
),
natal_blocks(body, name, opening, body_text, question) AS (VALUES
  ('sun', 'Sol natal', 'O ponto natal envolvido organiza vontade, vitalidade, identidade e a necessidade de assumir autoria sobre a própria direção.', 'Quando o Sol natal é ativado, a experiência toca a imagem de si e aquilo que faz a vida parecer significativa. Reconhecimento pode importar, mas não substitui coerência. Observe onde você está agindo por escolha e onde tenta manter uma versão antiga de competência. A leitura fica mais útil quando identidade é tratada como prática revisável, não como personagem que precisa permanecer igual.', 'Que escolha expressaria melhor quem você está se tornando, sem precisar sustentar uma imagem antiga?'),
  ('moon', 'Lua natal', 'O ponto natal envolvido organiza segurança emocional, memória, pertencimento e os ritmos pelos quais você procura e oferece cuidado.', 'A Lua natal guarda respostas aprendidas muito cedo. Quando tocada, o corpo pode reagir antes que a mente compreenda o presente. Isso não invalida a sensação; convida a investigar o que ela protege. Diferencie necessidade atual, hábito familiar e memória ativada. Se a hora natal for desconhecida, respeite os avisos de precisão do cálculo e evite conclusões apoiadas em casas ou ângulos.', 'Que necessidade concreta existe por baixo da reação mais imediata deste momento?'),
  ('mercury', 'Mercúrio natal', 'O ponto natal envolvido descreve como você aprende, formula perguntas, conecta informações e comunica aquilo que percebe.', 'Ativações de Mercúrio natal podem mudar o ritmo do pensamento e colocar decisões, estudos ou conversas em evidência. Ideias não são fatos só porque chegaram com força. Anote, compare, peça contexto e permita revisão. A inteligência deste ciclo está menos em responder tudo e mais em construir uma linguagem capaz de incluir nuance, dúvida e consequência.', 'Qual conversa ou informação precisa de uma pergunta melhor antes de receber uma resposta?'),
  ('venus', 'Vênus natal', 'O ponto natal envolvido descreve critérios de valor, atração, reciprocidade, prazer e a maneira como você negocia proximidade.', 'Quando Vênus natal é tocada, relações e escolhas materiais podem revelar o que você considera digno de tempo e cuidado. Evite reduzir o símbolo a romance. Amizade, dinheiro, estética, autoestima e acordos também participam. Observe se a busca por aprovação está substituindo desejo próprio ou se independência virou recusa de receber.', 'Que troca poderia ficar mais justa se desejo, limite e expectativa fossem nomeados com clareza?'),
  ('mars', 'Marte natal', 'O ponto natal envolvido descreve iniciativa, desejo, defesa, competição e o modo como você mobiliza força para atravessar resistência.', 'Ativações de Marte natal podem devolver coragem ou expor irritação acumulada. O desafio é escolher direção antes que a energia escolha qualquer alvo disponível. Conflito não é obrigatório, e passividade não é paz. Nomeie o que quer, o que recusa e qual consequência aceita sustentar. Ação pequena, clara e repetível costuma produzir mais mudança que explosão.', 'Onde sua energia precisa de direção concreta, em vez de mais pressão ou contenção?'),
  ('jupiter', 'Júpiter natal', 'O ponto natal envolvido descreve busca de sentido, confiança, aprendizado, visão de mundo e a forma como você reconhece possibilidades.', 'Quando Júpiter natal é ativado, crenças e expectativas ganham protagonismo. Pode haver vontade de ensinar, viajar, estudar ou apostar em uma escala maior. Examine o que é convicção viva e o que virou certeza defensiva. Perspectiva cresce quando encontra experiências diferentes, não quando transforma otimismo em obrigação.', 'Que possibilidade amplia seu repertório sem exigir que você ignore riscos ou limites reais?'),
  ('saturn', 'Saturno natal', 'O ponto natal envolvido descreve responsabilidade, medo, autoridade, duração e as estruturas construídas para lidar com a realidade.', 'Ativações de Saturno natal podem trazer antigas exigências de volta à consciência. Algumas protegem; outras apenas repetem medo e escassez. Faça inventário antes de obedecer ou rejeitar. Uma estrutura boa distribui peso, esclarece expectativa e admite manutenção. Rigidez tenta impedir mudança; consistência cria apoio para atravessá-la.', 'Qual regra ainda sustenta sua vida e qual precisa ser renegociada porque virou apenas peso?'),
  ('uranus', 'Urano natal', 'O ponto natal envolvido descreve ruptura, autonomia, invenção e a necessidade de abrir espaço para formas menos previsíveis de existir.', 'Quando Urano natal é tocado, inquietação pode sinalizar que um sistema ficou estreito. Nem toda novidade é liberdade, e nem toda estabilidade é prisão. Procure o experimento reversível: uma mudança que produza informação sem destruir apoios necessários. Autonomia amadurece quando inclui impacto e responsabilidade.', 'Que pequena experiência permitiria testar uma mudança sem confundir liberdade com rompimento impulsivo?'),
  ('neptune', 'Netuno natal', 'O ponto natal envolvido descreve imaginação, permeabilidade, idealização, compaixão e zonas em que fronteiras podem ficar menos nítidas.', 'Ativações de Netuno natal ampliam imagens, desejos de união e sensibilidades difíceis de traduzir. Também podem aumentar projeção ou confusão. Não é preciso abandonar poesia para verificar fatos. Dê forma ao que sente por meio de arte, descanso ou escrita, e adie compromissos irreversíveis quando informação essencial estiver nebulosa.', 'O que pode permanecer simbólico por enquanto, sem ser transformado depressa em promessa ou certeza?'),
  ('pluto', 'Plutão natal', 'O ponto natal envolvido descreve intensidade, controle, perda, regeneração e processos que pedem contato honesto com aquilo que foi evitado.', 'Quando Plutão natal é ativado, uma questão pode ocupar espaço psíquico desproporcional. Evite romantizar sofrimento ou disputar poder em nome de transformação. Observe compulsões, segredos e medos com apoio adequado. Mudança profunda não exige exposição total nem isolamento; pode começar pelo reconhecimento de um padrão e pela recuperação gradual de escolha.', 'Que padrão perde força quando você deixa de alimentá-lo em segredo e procura apoio concreto?')
),
aspect_blocks(kind, name, angle, opening, body_text, practice) AS (VALUES
  ('conjunction', 'conjunção', 0, 'A conjunção reúne as duas funções no mesmo ponto e aumenta sua proximidade: fica mais difícil perceber onde termina uma e começa a outra.', 'A concentração pode produzir potência e excesso. Em vez de classificar a experiência como boa ou ruim, observe qual função está ocupando todo o campo e qual precisa de espaço para responder. Conjunções inauguram uma mistura que será compreendida pela prática. O orbe mostra proximidade geométrica, não intensidade emocional garantida.', 'Durante dez minutos, descreva as duas necessidades envolvidas sem tentar conciliá-las. Depois escolha uma ação que reconheça ambas.'),
  ('sextile', 'sextil', 60, 'O sextil descreve uma possibilidade de cooperação que existe, mas costuma precisar de gesto, conversa ou iniciativa para sair do campo potencial.', 'Há recurso disponível, embora ele possa passar despercebido se você esperar uma solução automática. Procure conexões modestas: uma pessoa, ferramenta, habilidade ou ajuste de rotina capaz de aproximar as duas funções. Facilidade astrológica não elimina trabalho; ela pode tornar o trabalho mais fértil e responsivo.', 'Identifique um recurso já disponível e use-o em uma ação pequena antes de procurar uma solução inteiramente nova.'),
  ('square', 'quadratura', 90, 'A quadratura coloca as duas funções em atrito e torna visível uma incompatibilidade que pede escolha, ajuste ou construção de nova capacidade.', 'Tensão não significa punição. Ela mostra que duas demandas legítimas não cabem do mesmo modo no mesmo espaço. Evite decidir no auge da irritação ou transformar dificuldade em identidade. Nomeie custos, limites e prioridades. A quadratura amadurece quando o conflito deixa de ser ruído e vira problema concreto que pode receber forma.', 'Escreva as duas demandas em conflito, o custo de ignorar cada uma e o menor ajuste possível para hoje.'),
  ('trine', 'trígono', 120, 'O trígono facilita circulação entre as duas funções e pode tornar um talento, apoio ou possibilidade mais acessível neste período.', 'Fluidez ajuda, mas também pode manter hábitos não examinados. Use a abertura para consolidar algo que vale continuar. Pergunte o que está funcionando, por que funciona e como evitar excesso ou acomodação. Um trígono não promete sucesso; ele oferece menor atrito para experimentar, aprender e reconhecer recursos.', 'Escolha algo que está fluindo e registre qual comportamento concreto merece ser repetido de modo consciente.'),
  ('opposition', 'oposição', 180, 'A oposição coloca as duas funções frente a frente e frequentemente torna a tensão visível por meio de relações, contrastes ou projeções.', 'O outro pode parecer carregar tudo aquilo que falta ou incomoda, mas a geometria pede perspectiva, não culpado. Escute o contraste antes de tentar vencê-lo. Integração não exige meio-termo artificial: pode significar alternância, negociação ou fronteira clara. O eixo fica mais habitável quando cada polo recebe nome e responsabilidade.', 'Antes de reagir ao contraste, escreva o que pertence a você, o que pertence ao outro e o que precisa ser negociado.')
),
assembled AS (
  SELECT
    t.body AS transiting_body,
    n.body AS natal_body,
    a.kind AS aspect_type,
    t.name || ' em ' || a.name || ' com ' || n.name AS title,
    t.opening || ' ' || n.opening || ' ' || a.opening AS opening,
    t.body_text || E'\n\n' || n.body_text || E'\n\n' || a.body_text || E'\n\n' ||
    'Esta combinação não descreve um acontecimento obrigatório nem resume a sua vida. O mesmo trânsito pode aparecer em trabalho, relações, criação, rotina ou mundo interno, conforme escolhas, contexto e demais fatores do mapa. Use o período para comparar percepção e realidade: o que começou a mudar, o que se repete, o que ganhou nome e o que ainda precisa de tempo. Se a leitura tocar sofrimento persistente, risco ou decisão importante, procure apoio humano qualificado; astrologia não substitui cuidado médico, psicológico, jurídico ou financeiro.' AS deepening,
    t.name || ' em trânsito forma ' || a.name || ' de ' || a.angle::text || ' graus com ' || n.name ||
    '. O motor seleciona esta leitura pela distância angular, pelo orbe configurado, pelo movimento aplicante ou separante e pela intensidade relativa. Início, pico e fim são calculados para a passagem contínua atual; esses dados descrevem geometria astrológica e não garantem eventos ou comportamentos.' AS technical_why,
    n.question AS reflection_prompt,
    a.practice || ' Trate a prática como convite opcional: adapte à sua realidade ou não a realize.' AS practice
  FROM transiting_blocks t CROSS JOIN natal_blocks n CROSS JOIN aspect_blocks a
)
INSERT INTO "transit_interpretation_templates" (
  "transiting_body", "natal_body", "aspect_type", "locale", "title", "opening",
  "deepening", "technical_why", "reflection_prompt", "practice", "version",
  "status", "generation_method", "author_id", "reviewer_id", "reviewed_at",
  "published_at", "updated_at"
)
SELECT
  transiting_body, natal_body, aspect_type, 'pt-BR', title, opening,
  deepening, technical_why, reflection_prompt, practice, 'modular-ptbr-1',
  'PUBLISHED', 'AI_ASSISTED',
  '10000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000002',
  CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM assembled
WHERE
  length(opening) >= 180 AND length(deepening) >= 1200 AND
  length(technical_why) >= 180 AND length(reflection_prompt) >= 60 AND
  length(practice) >= 100
ON CONFLICT ("transiting_body", "natal_body", "aspect_type", "locale", "version") DO NOTHING;
