import { regencyFunctionGraphSchema, type RegencyFunctionGraph } from "./function-graph";

/**
 * Atribuições de função estrutural, camada 1 de `docs/BLUEPRINT.md` §5.0.1.
 *
 * Cada linha registra o que uma tradição afirma, com escola, obra e locator. As
 * atribuições marcadas `corpus_retrieval` foram localizadas por busca semântica
 * no corpus de `conteudo/` e conferidas no texto antes de entrarem aqui; nenhuma
 * foi escrita de memória.
 *
 * Sobre o Exu do artigo de geodiversidade: a mesma tabela descreve Exu como
 * "aquele que abre e fecha caminhos", que casaria com `function:path-opening`.
 * Não foi codificado. O artigo trata "religiões afro-brasileiras" como um bloco e
 * não distingue o Exu Òrìṣà de Ketu/Nagô da entidade-guia de Umbanda e Quimbanda;
 * a taxonomia deste projeto exige essa distinção, e escolhê-la por conta própria
 * seria decidir pela fonte o que ela não decidiu.
 *
 * Sobre Saraceni: *Teogonia de Umbanda*, *As Sete Linhas de Umbanda*, *Os
 * Arquétipos da Umbanda* e *Fundamentos Doutrinários de Umbanda* são todas do
 * mesmo autor e entram sob `family:saraceni`. São quatro obras e uma voz —
 * tratá-las como quatro confirmações quadruplicaria a convergência na fonte
 * mais presente do corpus, que é precisamente o erro que este grafo existe para
 * não cometer.
 *
 * Sobre as categorias: o Exu da Quimbanda entra como `guide_entity`, não como
 * `orisa`. `docs/METHOD.md` é explícito — entidades de guia
 * não são Orixás, e ocupar posição análoga não as torna a mesma coisa.
 *
 * Sobre as famílias: Agrippa, Trithemius e o Heptameron compartilham
 * `family:renaissance-ceremonial` porque não são linhagens independentes —
 * Trithemius foi mestre de Agrippa e o Heptameron circulou junto do quarto livro
 * atribuído a ele. Contá-los como três confirmações inflaria a convergência
 * exatamente onde o método precisa dela honesta. O Arbatel, anônimo e de
 * circulação própria, tem família separada.
 *
 * Sobre `school:trithemius`, corrigido na versão 0.4.0: a obra angélica do corpus
 * estava filiada à escola de Trithemius, e **a própria obra não sustenta isso**.
 * `_texto_magia_angelical_72` é *Alta Magia Angelical*, de Frater Dalton R.F
 * (O.G.B), e sua bibliografia (p. 194) declara Vacchiano, David Goddard,
 * MacGregor Mathers, Vitor Sanches, Sistemagia e Ordem Lótus Negro. Trithemius
 * não aparece; Agrippa aparece uma única vez, de passagem, numa lista de autores
 * que tratam do círculo mágico — não como fonte das correspondências. A escola
 * passou a ser `school:dalton-alta-magia-angelical`, pelo autor que a obra
 * declara. **A família continua `renaissance-ceremonial`**, e isso é
 * deliberadamente conservador: as Clavículas de Mathers colocam a obra a jusante
 * do mesmo fluxo solomônico-renascentista, e dar-lhe família própria criaria uma
 * segunda linhagem independente onde há transmissão da mesma.
 *
 * Sobre Rankine e d'Este: *Mágica Planetária Prática* (Avalonia, 2007) é escola
 * distinta — outros autores, outro país, outro século de publicação — mas os
 * próprios autores se descrevem trabalhando "com base na pesquisa de material de
 * origem", "firmemente enraizado na tradição". Transmitem a mesma linhagem, e por
 * isso entram como `school:rankine-deste` dentro de `family:renaissance-ceremonial`.
 * Escola diferente não é linhagem diferente: eles somam testemunho, não somam
 * convergência. É por isso que os dois campos existem separados.
 *
 * O nome do arcanjo de Vênus **diverge entre as duas escolas** e a divergência
 * está registrada como conflito, não resolvida por escolha: Dalton diz `Anael` na
 * tabela planetária e `Haniel` na oração de sexta-feira — variantes de um mesmo
 * nome —, enquanto a tabela sefirótica de Rankine e d'Este põe `Uriel` em Netzach.
 * Haniel e Uriel não são variantes um do outro; as fontes discordam sobre qual
 * potência ocupa a posição, e tirar média disso apagaria o dado.
 *
 * O que ficou de fora da tradição angélica, de propósito:
 *
 * - **Cassiel/Saturno em `function:affliction-and-cure`.** A tabela de Dalton dá a
 *   Saturno "obras de maldição e morte" e "tanatologia esotérica", e nenhuma cura
 *   — que ela atribui ao Sol e a Mercúrio. A função pergunta pela potência que
 *   impõe o limite do corpo **e nele opera a cura**; Saturno sustenta só a
 *   primeira metade. O mesmo vale ao contrário para Phul e Aratron em Rankine e
 *   d'Este, que curam e prolongam a vida sem impor o limite.
 * - **A observação que isso produz:** o material cerimonial *separa* o que a
 *   função reúne. Aflição e cura são uma potência só em Omolu, e nas fontes
 *   angélicas moram em planetas distintos. Isso é sinal de que o vocabulário pode
 *   estar recortado pela Umbanda; revisá-lo, se for o caso, é decisão
 *   metodológica própria e nunca um ajuste para acomodar fonte.
 * - **`function:generative-waters`.** A Lua é de elemento Água na tabela, mas suas
 *   obras são divinatórias, não geradoras. Elemento não é função.
 * - **`function:passage-between-planes`.** A tabela lista "projeção astral" entre
 *   as obras da Lua. É o que o operador faz sob aquele planeta, não uma afirmação
 *   de que a potência governa a passagem — a diferença decide, e ficou de fora.
 * - **`_texto_magia_angelical_simples`** é material de apoio de uma videoaula, sem
 *   fontes declaradas. Identificável não basta: nada dali entrou.
 *
 * Sobre a Goetia, entrada na versão 0.6.0. O acervo tem **três cópias** do
 * Lemegeton e a edição ilustrada de Crowley e DuQuette. São uma linhagem, não
 * quatro: entram sob `family:lemegeton`. A categoria `goetic_spirit` existe para
 * que a condensação não faça o que o método proíbe — um espírito goético e um
 * Orixá podem ocupar a mesma função estrutural sem que um vire o outro, e a
 * fonte permanece tratada como registro histórico, nunca como orientação. Quem
 * transforma descrição de arquivo em conselho acionável é a política da task 20,
 * e ela recusa.
 *
 * O que a Goetia mudou de verdade: as duas funções mais frágeis do grafo
 * deixaram de ser sustentadas por uma escola só. Marbas — "Ele cura e causa
 * doenças" — sustenta `affliction-and-cure` **nas duas metades**, que é
 * precisamente o que as fontes angélicas não faziam; e Bune, que "altera o lugar
 * onde estão os mortos", sustenta `passage-between-planes`. Um grimório
 * solomônico do século XVII e a Umbanda do século XX são linhagens genuinamente
 * independentes, então a corroboração é real.
 *
 * O que ficou de fora da Goetia, de propósito:
 *
 * - **Bael em `function:generative-waters`.** Esta tradução o chama de "senhor da
 *   tempestade e da fecundidade". Isso não é ofício goético: é o tradutor
 *   sobrepondo Baal, o deus cananeu, ao Bael do grimório, cujo ofício declarado
 *   na mesma frase é tornar invisível. É o caso exemplar de erro de autor que o
 *   grafo precisa recusar em vez de herdar — codificá-lo daria estatuto de
 *   tradição a um deslize de tradução.
 * - **Focalor e Vepar em `function:generative-waters`.** Governam as águas, sim,
 *   mas para afogar homens e naufragar navios. A função pergunta pela potência
 *   que gera e sustenta a vida que nasce. Domínio sobre um elemento não é a
 *   função que aquele elemento sugere — vale aqui como valeu para a Lua.
 * - **Buer.** "Remedia os destemperos no homem" é cura sem o limite do corpo, a
 *   mesma metade solta que barrou Phul e Aratron.
 *
 * Sobre o Arbatel, corrigido na versão 0.7.0: o texto do acervo separa a glosa
 * moderna do compilador — "atua em todos os assuntos planetários de X" — da
 * citação do grimório, e as cinco atribuições olímpicas repousavam na glosa.
 * Conferidas contra o original, quatro se sustentaram e **uma não**: o Arbatel diz
 * que Ophiel governa as coisas de Mercúrio, dá espíritos familiares e ensina todas
 * as artes, e não diz nada sobre abrir, fechar ou ordenar passagem. Ophiel saiu de
 * `function:path-opening`, que perdeu uma linhagem. Aratron e Phul continuam fora:
 * "torna fecundo o que é estéril" é geração sem águas, e "cura a hidropepsia […]
 * faz viver 300 anos" é cura sem o limite do corpo.
 *
 * Sobre a Theurgia-Goetia (task 24): o Livro II do Lemegeton declara um ofício
 * **coletivo** para os Espíritos Chefes, e é assim que ele entra — a atribuição é
 * da classe que a fonte nomeia, não de um espírito que ela não singularizou.
 * `aerial_spirit` existe para que eles não sejam lidos como os 72 da Goetia, ainda
 * que os dois livros pertençam à mesma `family:lemegeton`: são dois livros de uma
 * compilação, não duas testemunhas independentes.
 *
 * Sobre as inteligências planetárias (task 26): categoria `planetary_intelligence`
 * própria. Hagiel divide Vênus com Anael, Uriel e Hagith, e compartilhar planeta é
 * relação, nunca identidade — sem categoria separada a condensação convidaria a
 * fundi-los. Note que a mesma obra resolve sozinha a variância de Marte, listando
 * "Camael, Madimiel, Martiel, Samael, Zamael" como outros nomes de Khamael: ali a
 * própria fonte declara `name_variant`, e não há divergência a registrar.
 *
 * O que `function:generative-waters` revelou ao longo destas tasks: entraram nela
 * os anjos da Primeira Altitude do Almadel e a inteligência Hagiel, e **nenhum dos
 * dois envolve água**. Saíram dela a Lua (elemento água, obras divinatórias),
 * Focalor e Vepar (águas que afogam) e Aratron (fecunda sem águas). O rótulo
 * "águas" é da Umbanda; a função que as fontes sustentam é a geração e a
 * sustentação da vida que nasce. Renomeá-la é decisão metodológica pendente, a ser
 * tomada por mérito e com correção registrada — nunca de passagem.
 */
export const regencyFunctionGraph: RegencyFunctionGraph = regencyFunctionGraphSchema.parse({
  version: "regency-function-graph-0.8.0-research",
  status: "research",
  assignments: [
    // --- Abertura de caminho e passagem ---
    assignment("exu-path-quimbanda", "path-opening", "quimbanda", "exu", "guide_entity", {
      tradition: "quimbanda",
      school: "quimbanda-coppini",
      family: "quimbanda-coppini",
      work: "quimbanda-chama-vermelha-e-preta",
      locator: "Corpus local, Quimbanda — O Culto da Chama Vermelha e Preta, seção sobre Exu",
      confidence: 0.9,
    }),
    assignment("raphael-path-angelical", "path-opening", "ceremonial", "raphael", "angel", {
      tradition: "angelical",
      school: "dalton-alta-magia-angelical",
      family: "renaissance-ceremonial",
      work: "magia-angelical-72",
      locator: "Corpus local, _texto_magia_angelical_72, oração ao príncipe Raphael (quarta-feira)",
      confidence: 0.6,
    }),

    // --- Ferro, forja e ofício da guerra ---
    assignment(
      "phaleg-iron-rankine",
      "iron-and-war-craft",
      "ceremonial",
      "phaleg",
      "olympic_spirit",
      {
        tradition: "arbatel",
        school: "rankine-deste",
        family: "arbatel",
        work: "rankine-deste-magia-planetaria-pratica",
        locator:
          "Corpus local, _texto_magia_pratica_planetaria, espíritos olímpicos: “Phaleg eleva uma pessoa a grande honra em assuntos de guerra”",
        confidence: 0.8,
        extractionMethod: "table_review",
      },
    ),
    assignment("leraie-iron-lemegeton", "iron-and-war-craft", "goetia", "leraie", "goetic_spirit", {
      tradition: "lemegeton",
      school: "lemegeton-chave-menor",
      family: "lemegeton",
      work: "lemegeton-chave-menor-de-salomao",
      locator:
        "Corpus local, lemegeton-a-chave-menor-de-salomao, Parte I, verbete 14 — Leraie: “Ele causa grandes batalhas e disputas; e traz a putrefação pelo ferimento que é feito com as setas por Arqueiros”",
      confidence: 0.7,
      extractionMethod: "manual_review",
    }),
    assignment("khamael-iron-dalton", "iron-and-war-craft", "ceremonial", "khamael", "angel", {
      tradition: "angelical",
      school: "dalton-alta-magia-angelical",
      family: "renaissance-ceremonial",
      work: "magia-angelical-72",
      locator:
        "Corpus local, _texto_magia_angelical_72, Correspondências Planetárias, MARTE (p. 25): “Metal: Ferro”, arcanjo Khamael, obras de “coragem, força e ímpeto”",
      confidence: 0.85,
      extractionMethod: "table_review",
    }),
    assignment("khamael-iron-rankine", "iron-and-war-craft", "ceremonial", "khamael", "angel", {
      tradition: "angelical",
      school: "rankine-deste",
      family: "renaissance-ceremonial",
      work: "rankine-deste-magia-planetaria-pratica",
      locator:
        "Corpus local, _texto_magia_pratica_planetaria, capítulo de Marte: “Ferramentas: Bigorna, martelo, chicote, lança, flagelo”, “Arcanjo Khamael”, e “seu metal, ferro, que pode ser usado para fazer arados ou bisturis […] ou espadas”",
      confidence: 0.9,
      extractionMethod: "table_review",
    }),
    assignment("ogum-iron-pena", "iron-and-war-craft", "umbanda", "ogum", "orisa", {
      tradition: "umbanda",
      school: "templo-pena",
      family: "templo-pena",
      work: "templo-pena-apostila",
      locator: "Corpus local, apostila_oga_guardiao_do_axe: “Orixá do ferro e da guerra”",
      confidence: 0.9,
    }),
    assignment("ogum-iron-ramatis", "iron-and-war-craft", "umbanda", "ogum", "orisa", {
      tradition: "umbanda",
      school: "ramatis",
      family: "ramatis",
      work: "ramatis-umbanda",
      locator:
        "Corpus local, linha Ramatís; correspondência marcial registrada no grafo de evidência",
      confidence: 0.8,
    }),
    assignment(
      "phaleg-iron-arbatel",
      "iron-and-war-craft",
      "ceremonial",
      "phaleg",
      "olympic_spirit",
      {
        tradition: "arbatel",
        school: "arbatel",
        family: "arbatel",
        work: "ars-arbatel",
        locator:
          "Corpus local, _texto_olimpicos, verbete Phaleg, descrição original do grimório de Arbatel: “A quem dá o seu caractere é elevado às mais altas dignidades na arte da guerra”",
        confidence: 0.9,
      },
    ),

    // --- Vitalidade solar e evidência ---
    assignment("oxala-solar-pena", "solar-vitality", "umbanda", "oxala", "orisa", {
      tradition: "umbanda",
      school: "templo-pena",
      family: "templo-pena",
      work: "templo-pena-apostila",
      locator: "Corpus local, apostila do Templo da Pena; correspondência solar",
      confidence: 0.9,
    }),
    assignment("oxala-solar-ramatis", "solar-vitality", "umbanda", "oxala", "orisa", {
      tradition: "umbanda",
      school: "ramatis",
      family: "ramatis",
      work: "ramatis-umbanda",
      locator:
        "Corpus local, linha Ramatís; correspondência solar registrada no grafo de evidência",
      confidence: 0.8,
    }),
    assignment("och-solar-arbatel", "solar-vitality", "ceremonial", "och", "olympic_spirit", {
      tradition: "arbatel",
      school: "arbatel",
      family: "arbatel",
      work: "ars-arbatel",
      locator:
        "Corpus local, _texto_olimpicos, verbete Och, descrição original do grimório de Arbatel: “Och preside às coisas solares e dá 600 anos de vida com uma saúde robusta […] ensina a medicina”",
      confidence: 0.9,
    }),
    assignment("michael-solar-angelical", "solar-vitality", "ceremonial", "michael", "angel", {
      tradition: "angelical",
      school: "dalton-alta-magia-angelical",
      family: "renaissance-ceremonial",
      work: "magia-angelical-72",
      locator: "Corpus local, _texto_magia_angelical_72, oração ao príncipe Michael (domingo)",
      confidence: 0.8,
    }),

    // --- Expansão e sentença ---
    assignment(
      "bethor-expansion-rankine",
      "expansion-and-judgment",
      "ceremonial",
      "bethor",
      "olympic_spirit",
      {
        tradition: "arbatel",
        school: "rankine-deste",
        family: "arbatel",
        work: "rankine-deste-magia-planetaria-pratica",
        locator:
          "Corpus local, _texto_magia_pratica_planetaria, espíritos olímpicos: “Bethor eleva uma pessoa a grandes dignidades, ou seja, ele deve ser chamado quando tentar ganhar promoção ou melhorar sua vida”",
        confidence: 0.8,
        extractionMethod: "table_review",
      },
    ),
    assignment("xango-expansion-pena", "expansion-and-judgment", "umbanda", "xango", "orisa", {
      tradition: "umbanda",
      school: "templo-pena",
      family: "templo-pena",
      work: "templo-pena-apostila",
      locator: "Corpus local, apostila do Templo da Pena; correspondência jupiteriana",
      confidence: 0.9,
    }),
    assignment("xango-expansion-ramatis", "expansion-and-judgment", "umbanda", "xango", "orisa", {
      tradition: "umbanda",
      school: "ramatis",
      family: "ramatis",
      work: "ramatis-umbanda",
      locator: "Corpus local, linha Ramatís; correspondência jupiteriana no grafo de evidência",
      confidence: 0.8,
    }),
    assignment(
      "bethor-expansion-arbatel",
      "expansion-and-judgment",
      "ceremonial",
      "bethor",
      "olympic_spirit",
      {
        tradition: "arbatel",
        school: "arbatel",
        family: "arbatel",
        work: "ars-arbatel",
        locator:
          "Corpus local, _texto_olimpicos, verbete Bethor, descrição original do grimório de Arbatel: “Quem é digno de traçar seu caractere será por ele elevado às mais elevadas dignidades e posto em posse dos seus tesouros”",
        confidence: 0.9,
      },
    ),
    assignment(
      "sachiel-expansion-angelical",
      "expansion-and-judgment",
      "ceremonial",
      "sachiel",
      "angel",
      {
        tradition: "angelical",
        school: "dalton-alta-magia-angelical",
        family: "renaissance-ceremonial",
        work: "magia-angelical-72",
        locator:
          "Corpus local, _texto_magia_angelical_72, oração ao príncipe Sachiel (quinta-feira)",
        confidence: 0.8,
      },
    ),

    // --- Atração e concórdia ---
    assignment(
      "hagiel-attraction-rankine",
      "attraction-and-concord",
      "agrippa",
      "hagiel",
      "planetary_intelligence",
      {
        tradition: "planetary-intelligences",
        school: "rankine-deste",
        family: "renaissance-ceremonial",
        work: "rankine-deste-magia-planetaria-pratica",
        locator:
          "Corpus local, _texto_magia_pratica_planetaria, Inteligência Planetária de Vênus (p. 92): “Hagiel é bom para acabar com conflitos. Ele também é chamado para ajudar a ganhar amor”",
        confidence: 0.85,
        extractionMethod: "manual_review",
      },
    ),
    assignment(
      "hagith-attraction-rankine",
      "attraction-and-concord",
      "ceremonial",
      "hagith",
      "olympic_spirit",
      {
        tradition: "arbatel",
        school: "rankine-deste",
        family: "arbatel",
        work: "rankine-deste-magia-planetaria-pratica",
        locator:
          "Corpus local, _texto_magia_pratica_planetaria, espíritos olímpicos: “Hagith aumenta a beleza e a atratividade pessoal”",
        confidence: 0.75,
        extractionMethod: "table_review",
      },
    ),
    assignment(
      "beleth-attraction-lemegeton",
      "attraction-and-concord",
      "goetia",
      "beleth",
      "goetic_spirit",
      {
        tradition: "lemegeton",
        school: "lemegeton-chave-menor",
        family: "lemegeton",
        work: "lemegeton-chave-menor-de-salomao",
        locator:
          "Corpus local, lemegeton-a-chave-menor-de-salomao, Parte I, verbete 13 — Beleth: “Beleth causa todo tipo de amor que pode haver entre homens e mulheres”",
        confidence: 0.85,
        extractionMethod: "manual_review",
      },
    ),
    assignment(
      "uriel-attraction-rankine",
      "attraction-and-concord",
      "ceremonial",
      "uriel",
      "angel",
      {
        tradition: "angelical",
        school: "rankine-deste",
        family: "renaissance-ceremonial",
        work: "rankine-deste-magia-planetaria-pratica",
        locator:
          "Corpus local, _texto_magia_pratica_planetaria, tabela de atribuições sefiróticas: “3 Vênus Uriel Principados Hagiel Kedemel”",
        confidence: 0.7,
        extractionMethod: "table_review",
        conflictsWith: ["assignment:haniel-attraction-angelical"],
      },
    ),
    assignment("oxum-attraction-saraceni", "attraction-and-concord", "umbanda", "oxum", "orisa", {
      tradition: "umbanda",
      school: "umbanda-sagrada-saraceni",
      family: "saraceni",
      work: "saraceni-fundamentos-doutrinarios",
      locator:
        "Corpus local, Fundamentos Doutrinários de Umbanda: “Oxum do Amor … regida por Oxum (Orixá do amor)”",
      confidence: 0.9,
    }),
    assignment(
      "hagith-attraction-arbatel",
      "attraction-and-concord",
      "ceremonial",
      "hagith",
      "olympic_spirit",
      {
        tradition: "arbatel",
        school: "arbatel",
        family: "arbatel",
        work: "ars-arbatel",
        locator:
          "Corpus local, _texto_olimpicos, verbete Hagith: beleza, magnetismo e poder de atração (assuntos planetários de Vênus)",
        confidence: 0.9,
      },
    ),
    assignment(
      "haniel-attraction-angelical",
      "attraction-and-concord",
      "ceremonial",
      "haniel",
      "angel",
      {
        tradition: "angelical",
        school: "dalton-alta-magia-angelical",
        family: "renaissance-ceremonial",
        work: "magia-angelical-72",
        locator: "Corpus local, _texto_magia_angelical_72, oração ao príncipe Haniel (sexta-feira)",
        confidence: 0.7,
      },
    ),

    // --- Águas geradoras ---
    assignment(
      "hagiel-generative-rankine",
      "generative-waters",
      "agrippa",
      "hagiel",
      "planetary_intelligence",
      {
        tradition: "planetary-intelligences",
        school: "rankine-deste",
        family: "renaissance-ceremonial",
        work: "rankine-deste-magia-planetaria-pratica",
        locator:
          "Corpus local, _texto_magia_pratica_planetaria, Inteligência Planetária de Vênus (p. 92): “permitir a concepção livre de esterilidade”",
        confidence: 0.8,
        extractionMethod: "manual_review",
      },
    ),
    assignment(
      "almadel-chora-orientis-generative",
      "generative-waters",
      "almadel",
      "anjos-primeira-altitude",
      "angel",
      {
        tradition: "lemegeton-almadel",
        school: "lemegeton-rowe-sloane-2731",
        family: "lemegeton",
        work: "lemegeton-ars-almadel",
        locator:
          "Corpus local, lemegeton, Ars Almadel, Primeira Altitude (Chora Orientis): “fazer todas as coisas fecundas, produtivas e férteis […] promovendo o bom nascimento e desenvolvimento das crianças, e fazendo a mulher que é estéril, fértil”",
        confidence: 0.9,
        extractionMethod: "manual_review",
      },
    ),
    assignment("iemanja-generative-saraceni", "generative-waters", "umbanda", "iemanja", "orisa", {
      tradition: "umbanda",
      school: "umbanda-sagrada-saraceni",
      family: "saraceni",
      work: "saraceni-teogonia",
      locator:
        "Corpus local, Orixás — Teogonia de Umbanda: “Mãe da Vida … Iemanjá rege sobre a geração”",
      confidence: 0.9,
    }),
    assignment("iemanja-generative-pena", "generative-waters", "umbanda", "iemanja", "orisa", {
      tradition: "umbanda",
      school: "templo-pena",
      family: "templo-pena",
      work: "templo-pena-formacao-sacerdotal",
      locator:
        "Corpus local, Formação Sacerdotal Umbandista: “Mãe da Vida”, força que sustenta e multiplica a vida; elemento primordial aquático",
      confidence: 0.9,
    }),

    // --- Aflição e cura ---
    assignment(
      "marbas-affliction-lemegeton",
      "affliction-and-cure",
      "goetia",
      "marbas",
      "goetic_spirit",
      {
        tradition: "lemegeton",
        school: "lemegeton-chave-menor",
        family: "lemegeton",
        work: "lemegeton-chave-menor-de-salomao",
        locator:
          "Corpus local, lemegeton-a-chave-menor-de-salomao, Parte I, verbete 5 — Marbas: “Ele cura e causa doenças”",
        confidence: 0.9,
        extractionMethod: "manual_review",
      },
    ),
    assignment("omolu-cure-saraceni", "affliction-and-cure", "umbanda", "omolu", "orisa", {
      tradition: "umbanda",
      school: "umbanda-sagrada-saraceni",
      family: "saraceni",
      work: "saraceni-teogonia",
      locator:
        "Corpus local, Orixás — Teogonia de Umbanda: “ele cura, mesmo, os enfermos … essa natureza medicinal”",
      confidence: 0.9,
    }),

    // --- Passagem entre planos ---
    assignment(
      "bune-passage-lemegeton",
      "passage-between-planes",
      "goetia",
      "bune",
      "goetic_spirit",
      {
        tradition: "lemegeton",
        school: "lemegeton-chave-menor",
        family: "lemegeton",
        work: "lemegeton-chave-menor-de-salomao",
        locator:
          "Corpus local, lemegeton-a-chave-menor-de-salomao, Parte I, verbete 26 — Bune: “Ele altera o lugar onde estão os mortos, e faz os espíritos que estejam sob seu comando ascender acima dos sepulcros”",
        confidence: 0.85,
        extractionMethod: "manual_review",
      },
    ),
    assignment(
      "obaluaie-passage-saraceni",
      "passage-between-planes",
      "umbanda",
      "obaluaie",
      "orisa",
      {
        tradition: "umbanda",
        school: "umbanda-sagrada-saraceni",
        family: "saraceni",
        work: "saraceni-teogonia",
        locator:
          "Corpus local, Orixás — Teogonia de Umbanda: “Senhor das Passagens” de um plano para outro",
        confidence: 0.9,
      },
    ),
    assignment("omolu-passage-saraceni", "passage-between-planes", "umbanda", "omolu", "orisa", {
      tradition: "umbanda",
      school: "umbanda-sagrada-saraceni",
      family: "saraceni",
      work: "saraceni-fundamentos-doutrinarios",
      locator:
        "Corpus local, Fundamentos Doutrinários de Umbanda: Omolu “rege sobre a morte, o instante da passagem do plano material para o plano espiritual”",
      confidence: 0.9,
    }),

    // --- Adivinhação e conselho ---
    assignment(
      "theurgia-divination-lemegeton",
      "divination-and-counsel",
      "theurgia",
      "espiritos-chefes",
      "aerial_spirit",
      {
        tradition: "lemegeton-theurgia",
        school: "lemegeton-rowe-sloane-2731",
        family: "lemegeton",
        work: "lemegeton-ars-theurgia",
        locator:
          "Corpus local, lemegeton, Livro II — Theurgia Goetia, ofício dos Espíritos Chefes: “mostrar & descobrir todas as coisas que estão escondidas […] & também os segredos dos Reis ou quaisquer outras pessoas”",
        confidence: 0.85,
        extractionMethod: "manual_review",
      },
    ),
    assignment(
      "gusion-divination-lemegeton",
      "divination-and-counsel",
      "goetia",
      "gusion",
      "goetic_spirit",
      {
        tradition: "lemegeton",
        school: "lemegeton-chave-menor",
        family: "lemegeton",
        work: "lemegeton-chave-menor-de-salomao",
        locator:
          "Corpus local, lemegeton-a-chave-menor-de-salomao, Parte I, verbete 11 — Gusion: “Mostra todas as coisas, passadas, presentes, e futuras, e demonstra e responde quaisquer questões que o magista venha a perguntar”",
        confidence: 0.9,
        extractionMethod: "manual_review",
      },
    ),
    assignment(
      "gabriel-divination-dalton",
      "divination-and-counsel",
      "ceremonial",
      "gabriel",
      "angel",
      {
        tradition: "angelical",
        school: "dalton-alta-magia-angelical",
        family: "renaissance-ceremonial",
        work: "magia-angelical-72",
        locator:
          "Corpus local, _texto_magia_angelical_72, Correspondências Planetárias, LUA (p. 24): “Trabalhos de divinação, sonhos lúcidos, vidência […] adivinhação pelos sonhos”, arcanjo Gabriel",
        confidence: 0.9,
        extractionMethod: "table_review",
      },
    ),
    assignment(
      "raphael-divination-dalton",
      "divination-and-counsel",
      "ceremonial",
      "raphael",
      "angel",
      {
        tradition: "angelical",
        school: "dalton-alta-magia-angelical",
        family: "renaissance-ceremonial",
        work: "magia-angelical-72",
        locator:
          "Corpus local, _texto_magia_angelical_72, Correspondências Planetárias, MERCÚRIO (pp. 25–26): “os poderes da cura, da profecia, da invisibilidade, da divinação, a clarividência mental”, arcanjo Raphael",
        confidence: 0.7,
        extractionMethod: "table_review",
      },
    ),
    assignment("orunmila-divination-unesco", "divination-and-counsel", "ifa", "orunmila", "orisa", {
      tradition: "ifa",
      school: "unesco-ich",
      family: "unesco-ich",
      work: "unesco-ifa-divination-system",
      locator:
        "UNESCO, Patrimônio Cultural Imaterial (2008), Sistema de adivinhação Ifá: “the deity of wisdom and intellectual development”",
      confidence: 0.9,
      extractionMethod: "manual_review",
    }),
    assignment(
      "orunmila-divination-abimbola",
      "divination-and-counsel",
      "ifa",
      "orunmila",
      "orisa",
      {
        tradition: "ifa",
        school: "abimbola-ifa-corpus",
        family: "abimbola-ifa-corpus",
        work: "abimbola-ifa-exposition",
        locator:
          "Wande Abimbola, Ifa: An Exposition of Ifa Literary Corpus (1997), pp. 9–10: Ifa oferece conselho sábio, atua como porta-voz e é consultado para orientação nas decisões importantes",
        confidence: 0.95,
        extractionMethod: "manual_review",
      },
    ),
    assignment(
      "orishala-divination-bascom-salako",
      "divination-and-counsel",
      "yoruba",
      "orishala",
      "orisa",
      {
        tradition: "yoruba-erindinlogun",
        school: "salako-igana",
        family: "bascom-sixteen-cowries",
        work: "bascom-sixteen-cowries",
        locator:
          "William Bascom, Sixteen Cowries (1980), cap. III, pp. 32–52: no corpus de Salakọ, Òrìṣàlá controla os dezesseis búzios; o autor ressalva variações entre cultos",
        confidence: 0.9,
        extractionMethod: "manual_review",
      },
    ),

    // --- Limiar: fonte oficial do autor distingue Exu Òrìṣà ---
    assignment("esu-threshold-prandi", "path-opening", "ifa", "esu", "orisa", {
      tradition: "ketu-nago",
      school: "prandi-mitologia-orixas",
      family: "prandi",
      work: "prandi-mitologia-dos-orixas",
      locator:
        "Reginaldo Prandi, Mitologia dos Orixás (2001), trecho oficial do autor, p. 503: Obatalá chega à fronteira do além, onde Exu é o guardião",
      confidence: 0.95,
      extractionMethod: "manual_review",
    }),

    // --- Ferro: linhagem acadêmica brasileira, independente das escolas praticantes ---
    assignment("ogum-iron-geodiversidade", "iron-and-war-craft", "umbanda", "ogum", "orisa", {
      tradition: "afro-brasileira-comparada",
      school: "scielo-geodiversidade",
      family: "scielo-mercator",
      work: "ferreira-et-al-simbolismo-da-geodiversidade",
      locator:
        "Ferreira et al., «Simbolismo da Geodiversidade nas Religiões Afro-Brasileiras», Mercator v. 23 (2024), Tabela 2: “Ogum é o responsável pelos minerais, tendo o Ferro, Aço e Manganês”",
      confidence: 0.85,
      extractionMethod: "table_review",
    }),
  ],
  divergences: [
    {
      id: "divergence:venus-archangel-rank",
      functionId: "function:attraction-and-concord",
      between: ["assignment:haniel-attraction-angelical", "assignment:uriel-attraction-rankine"],
      kind: "rank_scheme",
      explanation:
        "As duas escolas concordam sobre a função de Vênus — atração, beleza, união, concórdia — e discordam sobre qual nome ocupa o posto de arcanjo. Não é descuido de nenhuma das duas. Rankine e d'Este põem Uriel no posto de forma deliberada e consistente em quatro lugares independentes da obra, e a tabela hebraica registra Uriel e Anael lado a lado na coluna de Vênus: eles conhecem Anael e ainda assim atribuem a Uriel o posto de arcanjo, dizendo-o de Vênus e da Terra. Dalton usa Anael na tabela planetária e Haniel na oração de sexta-feira, que são grafias de um mesmo nome. Logo a disputa é de posto entre esquemas, não de ortografia nem de erro. O que isso demonstra para o método é o essencial: a função permanece estável sob a divergência, e é por isso que condensar por função sobrevive a disputas de nome que derrubariam qualquer síntese feita por identidade.",
      functionRemainsStable: true,
      locators: [
        "Corpus local, _texto_magia_pratica_planetaria, correspondências de Vênus: “Arcanjo Uriel”",
        "Corpus local, _texto_magia_pratica_planetaria, hierarquia planetária (p. 84): “3 Vênus Uriel Principados Hagiel Kedemel”",
        "Corpus local, _texto_magia_pratica_planetaria, As Criaturas Espirituais de Vênus (p. 92): “Uriel, também conhecido como Auriel ou Oriel, é o Arcanjo de Vênus e da Terra”",
        "Corpus local, _texto_magia_pratica_planetaria, tabela hebraica (p. 182), coluna de Vênus: Uriel e Anael registrados juntos",
        "Corpus local, _texto_magia_angelical_72, Correspondências Planetárias, VÊNUS (pp. 26–27): “Arcanjo: Anael”",
      ],
    },
  ],
});

function assignment(
  id: string,
  functionSlug: string,
  entityGroup: string,
  entitySlug: string,
  entityCategory:
    | "orisa"
    | "guide_entity"
    | "angel"
    | "olympic_spirit"
    | "goetic_spirit"
    | "aerial_spirit"
    | "planetary_intelligence",
  evidence: {
    tradition: string;
    school: string;
    family: string;
    work: string;
    locator: string;
    confidence: number;
    extractionMethod?: "manual_review" | "table_review" | "corpus_retrieval";
    conflictsWith?: string[];
  },
) {
  return {
    id: `assignment:${id}`,
    functionId: `function:${functionSlug}`,
    entityId: `entity:${entityGroup}:${entitySlug}`,
    entityCategory,
    traditionId: `tradition:${evidence.tradition}`,
    workId: `work:${evidence.work}`,
    sourceFamilyId: `family:${evidence.family}`,
    claimSchoolId: `school:${evidence.school}`,
    locator: evidence.locator,
    extractionMethod: evidence.extractionMethod ?? "corpus_retrieval",
    extractionConfidence: evidence.confidence,
    reviewStatus: "candidate" as const,
    conflictsWith: evidence.conflictsWith ?? [],
  };
}
