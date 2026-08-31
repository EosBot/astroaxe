# Método e fontes

Documento único do método autoral de regências, do vocabulário cultural, do protocolo de
pesquisa, da operação editorial e do changelog de cálculo astrológico.

Consolidado em 28 de agosto de 2026 a partir de seis documentos separados. Nada foi
reescrito na consolidação.

## Método de regências e taxonomia cultural

### Propósito e limite do método

O AstroAxe cruza o mapa natal ocidental com uma ontologia versionada de Orixás,
correspondências ocultistas, narrativas e simbolismos documentados. O resultado
é uma leitura direta de **Orixá de frente, Orixá de cabeça e Orixá de costas**
dentro do método autoral AstroAxe.

O produto assume a seleção e responde por sua matriz, pesos, explicação e
acurácia publicada. A interface apresenta a conclusão com clareza. A origem de
cada correspondência permanece registrada para permitir síntese universalista
sem esconder divergências entre escolas e tradições.

O disclaimer de interface é breve e aparece no rodapé: **“Método autoral
AstroAxe; consulte a metodologia.”** A página metodológica contém versão,
fontes, população de validação, métricas e limites observados.

### Categorias que não podem ser fundidas

| Categoria     | Contexto primário                                         | Regra de modelagem                                                                            |
| ------------- | --------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `Orisa`       | Ìṣẹ̀ṣe/Ifá Yorùbá e tradições Nagô/Ketu                    | Não tratar como sinônimo de Vodum, Nkisi ou guia.                                             |
| `Vodun`       | Tradições ewe-fon e Candomblé Jeje                        | Correspondências com Orixás são claims situadas, nunca identidade global.                     |
| `Nkisi`       | Matrizes bantu e Candomblé Congo-Angola                   | No Brasil também aparece como Inquice; preservar língua, linhagem e contexto.                 |
| `Odu`         | Corpus e signos divinatórios de Ifá/Fá e usos diaspóricos | Não é divindade, arquétipo psicológico nem equivalente a Orixá.                               |
| `OriConcept`  | Concepções yorùbá de cabeça interior, pessoa e destino    | Não é automaticamente “Orixá de cabeça”.                                                      |
| `GuideEntity` | Umbandas e outros contextos mediúnicos                    | Caboclos, pretos-velhos, crianças, boiadeiros, marinheiros, Exus e Pombagiras não são Orixás. |
| `Ancestor`    | Cultos e relações ancestrais específicos                  | Não fundir com divindade ou guia sem claim explícita da tradição descrita.                    |

As grafias locais devem ser conservadas. Uma forma normalizada pode apoiar
busca, mas não deve apagar a forma registrada pela fonte ou pela comunidade.
Em particular, Òrìṣà/Orisa/Orixá, Nkisi/Inquice e Odù/Odu são variantes de
transliteração ou uso contextual, não autorização para fundir panteões.

### Tradições e relações pessoais

O knowledge graph deve manter `Tradition`, `Subtradition` e `HouseOrLineage`
como escopos distintos. Os primeiros valores controlados são:

- `IseseYoruba` e `IfaYoruba`;
- `CandombleKetuNago`;
- `CandombleJeje`, com subtradições quando a fonte as especificar;
- `CandombleCongoAngola`;
- `Batuque`, com seus lados ou nações;
- `Umbanda`, sem pressupor uma doutrina nacional única.

Uma casa pode praticar mais de uma modalidade. Isso deve ser representado por
relações paralelas, e não pela fusão das tradições. Batuque, Umbanda, Quimbanda
e Linha Cruzada, por exemplo, podem coexistir no mesmo espaço sem se tornarem
categorias equivalentes.

`PersonSacredRelation` registra o termo usado pela fonte, sua definição e seu
escopo. Valores como `head_orisa`, `junto`, `adjunto`, `body_orisa`, `passagem`,
`coroa` e `guide` não formam posições universais. “Frente”, “cabeça” e “costas”
podem ser vocabulário de uma casa ou região, mas não devem virar uma tríade
canônica nem ser projetados sobre Ifá, Jeje, Congo-Angola, Batuque ou Umbanda.

O método pelo qual uma relação é conhecida também precisa ser explícito:

- Ifá com ikin ou ọ̀pẹ̀lẹ̀;
- Fá em seu contexto documentado;
- merindilogun ou jogo de búzios;
- consulta incorporada ou desenvolvimento mediúnico;
- iniciação, feitura, assentamento, bori ou obrigação;
- transmissão familiar, comunitária ou de linhagem.

O predicado deve distinguir `reveals`, `indicates`, `confirms`, `constitutes`,
`cultivates` e `caresFor`. Uma consulta pode revelar uma relação; iniciação e
cuidado podem constituí-la ou transformá-la. O grafo não deve reduzir esses
processos a uma propriedade estática de personalidade.

### Claims de conhecimento e proveniência

Cores, dias, elementos, domínios, comidas, folhas, animais, ferramentas,
saudações, mitos e características não pertencem como colunas universais ao nó
de uma entidade. Cada associação é uma claim reificada e versionada:

```text
KnowledgeClaim
├── id
├── subjectId
├── predicate
├── objectId | literalValue
├── traditionId
├── subtraditionId?
├── houseOrLineageId?
├── region?
├── periodStart? / periodEnd?
├── sourceId
├── sourceLocator?
├── evidenceKind
├── confidence
├── accessLevel
├── status
├── supersedesClaimId?
├── knowledgeVersion
└── reviewedAt
```

`evidenceKind` deve diferenciar ao menos `community-primary`,
`institutional-inventory`, `ethnography`, `scholarly-analysis` e
`product-editorial`. `accessLevel` aceita `public`, `restricted` ou
`sacred-secret`; o produto nunca deve tentar reproduzir conteúdo restrito ou
secreto. `status` aceita `active`, `contested`, `deprecated` e `withdrawn`.

Uma `CorrespondenceClaim` liga seres de tradições diferentes somente quando
uma fonte o fizer. Ela informa o tipo — `functional`, `ritual`, `historical`,
`syncretic` ou `scholarly-comparison` — e nunca produz `sameAs`. Semelhança de
domínio, cor, ferramenta ou gesto ritual não demonstra identidade ontológica.

Mitos, ìtàn, versos e narrativas ficam em `NarrativeVariant`, com idioma,
tradição, região, período, performer/autoria quando publicável, corpus ou Odù
quando a fonte o declarar, restrição de acesso e citação. Versões contraditórias
podem coexistir sem uma delas ser promovida a cânone universal.

### Método calculado e autoral

O cálculo recebe apenas dados astrológicos validados e determinísticos. A
camada cultural fornece temas narrativos explicitamente liberados para uso
editorial. Cada versão do método deve declarar:

1. features astrológicas usadas e suas unidades;
2. pesos, normalização e regra de desempate;
3. conjunto exato de claims culturais elegíveis;
4. versões do motor astrológico, configuração e base de conhecimento;
5. textos de transparência exibidos ao usuário.

A saída é uma tríade ordenada, acompanhada do ranking completo para auditoria:

```text
OrisaRegencyResult
├── front
├── head
├── back?                      # papel ancestral; pode permanecer não determinado
├── unresolvedRoles?
├── rankingsByRole[]
│   ├── orisaId
│   ├── normalizedScore        # 0..1
│   ├── rank
│   ├── astrologicalIndicators[]
│   ├── correspondenceClaimIds[]
│   └── contributionBreakdown[]
├── methodVersion
├── astrologyEngineVersion
├── astrologyConfigVersion
├── knowledgeVersion
├── inputFingerprint
└── limitationsVersion
```

O score expressa aderência ao método e não deve ser convertido em porcentagem de
certeza sem calibração. Métricas de acurácia pertencem ao conjunto de validação,
não à impressão subjetiva do texto.

O resultado deve ser determinístico: mesmo snapshot, versões e base de claims
produzem a mesma saída. Mudanças de peso, regra, claims ou texto interpretativo
exigem nova versão e registro `ANTES / DEPOIS / MOTIVO / IMPACTO`.

#### Scorer de pesquisa 0.2.0

O scorer mantém três artefatos separados: matriz de correspondências, features calculadas e
configuração de pesos. Uma regra só contribui quando o fator do claim, a categoria da feature e seu
valor coincidem. Cada contribuição registra regra, claim, escola, feature, valor e, quando houver,
faceta ativada. Correspondências repetidas de escolas distintas permanecem visíveis e também servem
como critério de convergência.

Cada regra também cita sua fonte estrutural. O modo `planetary_resonance` permite que um claim de
correspondência planetária seja reforçado quando o mesmo planeta rege o dia ou a hora natal, sem
exigir a criação de uma segunda identidade ou de uma equivalência religiosa. Seletores de feature
distinguem Ascendente, Meio do Céu, Descendente e Fundo do Céu mesmo quando compartilham o mesmo
signo. A temporalidade da leitura pode produzir uma camada de manifestação, mas a configuração
inicial da tríade usa somente o contexto natal.

O ranking técnico por papel segue, nesta ordem: score bruto, número de escolas independentes, maior
contribuição individual e ID canônico. O ID torna a auditoria reproduzível, mas não resolve uma
regência. Quando os três critérios substantivos anteriores permanecem iguais entre os primeiros
candidatos, o papel fica sem atribuição com `tradition_confirmation_required`. A confirmação deve
seguir a tradição, casa e método divinatório declarados; o motor não inventa nem armazena fundamento
reservado para preencher a lacuna.

A política decisória é um artefato separado, versionado, com escopo de tradição, subtradição e
linhagem quando aplicável, método, fontes públicas e revisão de praticante. A política pública inicial
registra apenas procedimentos verificáveis: caráter especializado e contextual da consulta,
abstenção em empate substantivo e caráter opcional do papel ancestral. Ela não se apresenta como uma
lei universal dos cultos nem transpõe automaticamente uma regra de uma casa para outra.

O motor não completa três posições por obrigação. Frente e cabeça são avaliados como manifestações
principais; costas representa a camada ancestral no vocabulário do método e pode não se manifestar
com força calculável. Cada papel possui score e abrangência mínimos versionados. Quando nenhum
candidato os alcança — ou quando a exigência de entidades distintas impede uma atribuição honesta —
o valor é `null` e a saída explica `insufficient_score`, `insufficient_evidence_breadth`,
`distinct_candidate_unavailable` ou `tradition_confirmation_required`. Um terceiro Orixá só é
exibido quando supera os critérios e não permanece em empate substantivo.

As referências cerimonial, angelical e goética entram como estruturas comparativas para organizar
planetas, temporalidades, dignidades e facetas. Elas não criam automaticamente correspondências com
Orixás. Uma aplicação cultural concreta só entra no score por claim publicado, identificado por
fonte e escola.

`ANTES`: não havia scorer da tríade nem regra executável de desempate.

`DEPOIS`: há um scorer puro, versionado e explicável, ainda marcado como pesquisa, capaz de combinar
mapa natal, ressonância temporal, fontes estruturais e seleção específica de ângulos para formar uma
composição de até três papéis distintos, sem forçar o ancestral. A versão 0.4.0 separa o ranking
técnico da política cultural e se abstém diante de empate substantivo, solicitando confirmação no
contexto tradicional declarado. Um caso golden sintético congela o comportamento da versão.

`MOTIVO`: permitir calibração reproduzível sem transformar um desempate técnico arbitrário em decisão
cultural e sem esconder a origem dos pesos ou da política.

`IMPACTO`: empates antes resolvidos por ID passam a produzir papel não determinado; nenhum resultado
público muda enquanto a integração ao produto permanecer bloqueada até validação cultural e
calibração.

#### Incremento numerológico e grafo v2

A pesquisa v2 acrescenta `birth_number` como fator e exige `lensId` tanto na feature quanto no
claim. Isso impede que a raiz digital 1–9 acione por acidente uma tabela editorial 1–16. O snapshot
guarda soma bruta e trilha de redução; não depende de relógio nem de hora natal.

A matriz `regency-matrix-0.4.0-v2-research` compõe a base publicada, hipóteses simbólicas e a tabela
numerológica sem alterar o runtime público. O grafo `regency-evidence-graph-0.1.0-research` separa
artefato, obra, família e escola: republicações não aumentam abrangência independente, e relações
concorrentes permanecem como conflitos explícitos. O avaliador e a análise leave-one-school-out
aceitam as features numerológicas para futuros benchmarks consentidos.

`ANTES`: data natal não era uma feature do scorer e repetição documental não tinha contrato próprio.

`DEPOIS`: duas lentes determinísticas, matriz composta, faceta Oxaguiã e grafo de evidência são
executáveis e cobertos por testes golden, de distribuição, conflito, deduplicação e estabilidade.

`MOTIVO`: incorporar o estudo numerológico e o corpus local com cálculo reproduzível e proveniência.

`IMPACTO`: resultados só mudam quando a configuração v2 de pesquisa é escolhida explicitamente.

#### Geração de correspondências 0.2.0

A cobertura é ampliada por uma cadeia de três artefatos, nunca por uma tabela opaca:

```text
atributo cultural extraído → regra de tradução simbólica → correspondência astrológica candidata
```

O atributo conserva Orixá, eixo, tradição e fontes. A regra de tradução é identificada como hipótese
autoral AstroAxe e contém fator, valores, justificativa e fonte estrutural. A correspondência gerada
carrega os IDs de ambos e permanece `candidate`; nesta fase ela não entra no scorer público nem se
disfarça de correspondência publicada.

O inventário inicial abrange os 25 Orixás do catálogo e contempla domínios naturais, funções sociais,
motivos míticos, símbolos materiais, qualidades de movimento e temporalidades. A busca inclui
periódicos, casas e comunidades, museus e institutos culturais, bibliotecas iorubás, registros
históricos e páginas de referência para descoberta. Fonte terciária pode apontar uma trilha, mas não
pode ser a única evidência de um atributo promovido.

`ANTES`: somente 12 dos 25 candidatos possuíam alguma correspondência publicada e o contrato não
representava uma inferência autoral.

`DEPOIS`: os 25 possuem perfis extraídos para revisão e correspondências candidatas geradas de forma
determinística, com proveniência cultural e regra estrutural separadas.

`MOTIVO`: permitir cobertura ampla mesmo quando a internet não oferece uma tabela astrológica pronta,
sem confundir atributo tradicional, interpretação comparativa e evidência publicada.

`IMPACTO`: nenhum score ativo muda. A promoção ocorrerá por lotes após revisão de cada atributo,
tratamento das divergências entre tradições e calibração das regras derivadas.

A versão 0.2.0 acrescenta convergências compostas. Uma regra só dispara quando o mesmo Orixá possui
todos os atributos exigidos; `ferro + guerra`, por exemplo, reforça Marte, enquanto
`oceano + maternidade` reforça Câncer. A saída registra todos os claims de atributo usados,
diversidade de eixos e uma força de convergência entre 0 e 1. Essa força mede exclusivamente a
estrutura interna da hipótese, não certeza religiosa nem acurácia observada.

O comando `npm run regency:correspondence-report` apresenta cobertura, quantidade de candidatos por
Orixá, total de regras compostas e fatores com alternativas concorrentes. A versão atual produz 106
candidatos, dos quais 23 são compostos, mantendo cobertura dos 25 Orixás. Alternativas não são
resolvidas por preferência editorial: seguem visíveis para calibração e política cultural.

`ANTES`: cada correspondência candidata dependia de um único atributo e conflitos só apareciam por
inspeção manual.

`DEPOIS`: convergências de dois ou três atributos podem reforçar uma hipótese e um relatório puro
torna cobertura e alternativas observáveis.

`MOTIVO`: representar as nuances combinatórias pedidas para o método sem elevar associações isoladas
ao mesmo nível das convergências simbólicas.

`IMPACTO`: a matriz ativa e o resultado público continuam inalterados; muda apenas o catálogo de
pesquisa candidato, cuja versão passa a `symbolic-correspondence-generator-0.2.0-research`.

#### Matriz derivada experimental 0.2.0

Os 106 candidatos podem ser materializados em uma matriz exclusivamente experimental. Claims
publicados conservam multiplicador `1`; claims derivados recebem a `convergenceStrength` registrada
pela cadeia de atributos. Cada contribuição expõe `evidenceTrack` e `evidenceMultiplier`, permitindo
reconstruir por que um valor entrou no score.

Elementos e modalidades dos quatro ângulos passam a integrar o snapshot de features. A configuração
experimental acrescenta lentes de elemento, modalidade e casa para frente, cabeça e costas. Esses
pesos continuam hipóteses de calibração e não alteram a configuração pública/baseline.

O comando abaixo avalia baseline e experimental sobre exatamente as mesmas partições:

```bash
npm run regency:evaluate-v2 -- caminho/seguro/dataset.json
```

`ANTES`: o benchmark aceitava apenas a matriz publicada incompleta, e as hipóteses geradas não podiam
ser pontuadas.

`DEPOIS`: o candidato v2 composto pode ser comparado lado a lado com o baseline congelado usando o
mesmo avaliador e as mesmas partições.

`MOTIVO`: medir se a geração amplia cobertura e acurácia antes de promover qualquer correspondência
ao produto.

`IMPACTO`: o módulo autenticado passa a usar o candidato v2; promoção para versão validada continua
condicionada a revisão cultural, conjunto congelado e ganho mensurável.

#### Avaliação e calibração 0.1.0

O avaliador recebe somente ID opaco, partição previamente fixada, proveniência categórica, qualidade
da hora, features derivadas validadas e a tríade de referência. Nome, email, data, hora, cidade,
coordenadas e snapshot natal não pertencem ao artefato analítico. A execução reporta acurácia por
papel, acurácia da tríade exata e matriz de confusão, sempre com versão do dataset, configuração e
avaliador. Uma partição vazia é erro, e casos de calibração não entram nas métricas de validação.

#### Avaliação e calibração 0.3.0

O relatório passa a registrar, por papel, acurácia top-1, acurácia top-3, quantidade e taxa de
abstenções e intervalos de confiança de Wilson de 95%. A tríade exata também recebe intervalo de
confiança. Os cortes agregados incluem qualidade da hora, método temporal e proveniência do caso;
percentuais com amostra zero continuam `null`.

O schema rejeita a mesma impressão digital de evidência em calibração e validação. Essa barreira
impede que republicações ou variantes da mesma cadeia documental atravessem as partições sem serem
detectadas. A impressão é HMAC e não revela URL, locator nem identidade.

`ANTES`: a versão `regency-evaluation-0.2.0` reportava somente acurácia pontual por papel, tríade
exata, matriz de confusão e cortes temporal/hora.

`DEPOIS`: `regency-evaluation-0.3.0` mede top-3, incerteza estatística, abstenção e proveniência, além
de bloquear vazamento documental entre as duas partições.

`MOTIVO`: comparar baseline e matriz derivada sem ocultar amostras pequenas, cobertura insuficiente
ou ganho artificial causado pela reutilização de casos.

`IMPACTO`: o formato do relatório de pesquisa ganha campos; scorer, pesos, matriz ativa, endpoints e
o módulo autenticado usa o candidato v2. Métricas reais continuam indisponíveis até a entrada de
casos elegíveis, consentidos ou publicamente verificáveis, em armazenamento restrito.

#### Congelamento e decisão comparativa 0.1.0

O benchmark experimental agora produz um manifesto sanitizado com versão, SHA-256 canônico do
dataset, total de casos e contagens agregadas por partição e proveniência. A ordem dos casos não muda
o fingerprint; qualquer mudança de conteúdo, rótulo ou feature muda o digest. O manifesto não contém
nomes, URLs, locators, nascimento, localização nem IDs individuais.

A política `regency-promotion-policy-0.1.0-research` exige pelo menos 30 rótulos de validação para
frente e 30 para cabeça. Em cada papel obrigatório, o candidato v2 não pode reduzir top-1 nem
top-3 e pode elevar a taxa de abstenção em no máximo cinco pontos percentuais. Costas é reportado,
mas não bloqueia a análise enquanto não alcançar sua própria amostra mínima, pois o papel ancestral
pode não estar declarado ou manifestado.

A decisão técnica possui somente três estados: `insufficient_evidence`, `not_eligible` e
`eligible_for_cultural_review`. O último não publica nem promove a configuração; ele abre a etapa de
revisão cultural e análise dos erros.

`ANTES`: relatórios baseline e experimental eram apresentados lado a lado sem digest canônico nem
critério versionado de continuidade.

`DEPOIS`: `regency-comparison-0.1.0` vincula a comparação ao dataset sanitizado exato e produz deltas
de top-1, top-3 e abstenção por papel sob política explícita.

`MOTIVO`: impedir escolha oportunista de versões, adulteração silenciosa do conjunto e promoção por
amostras pequenas ou por redução artificial da cobertura.

`IMPACTO`: o comando `regency:evaluate-v2` produz manifesto e parecer técnico. Nenhuma aprovação
cultural é automatizada.

#### Grafo de funções estruturais 0.1.0

Primeira implementação das três camadas de `docs/BLUEPRINT.md` §5.0.1.

`function:*` é o vocabulário das posições estruturais, e cada função carrega **a pergunta que
responde**. Isso não é ornamento: é o que autoriza a comparação. Duas tradições só se encontram
numa função quando de fato respondem à mesma pergunta — sem esse teste, a aproximação vira
sincretismo por semelhança de vocabulário. A versão 0.1.0 publica quatro funções: abertura de
caminho e passagem, ferro e ofício da guerra, vitalidade solar e evidência, expansão e sentença.

`regency-function-graph-0.1.0-research` registra cada atribuição com entidade, **categoria** de
entidade, tradição, escola, família de fonte e locator. A categoria usa o vocabulário da seção
"Categorias que não podem ser fundidas" acima e é o que impede a condensação de virar fusão de
panteões: o Exu da Quimbanda entra como `guide_entity`, nunca como `orisa`, e continua distinto do
Èṣù yorùbá mesmo ocupando posição análoga a Ophiel e Raphael.

A condensação agrupa por função e gradua a sustentação por **famílias de fonte independentes**,
nunca pela contagem de atribuições. Agrippa, Trithemius e o Heptameron compartilham
`family:renaissance-ceremonial` porque não são linhagens independentes — Trithemius foi mestre de
Agrippa e o Heptameron circulou junto do quarto livro atribuído a ele. Contá-los como três
confirmações inflaria a convergência exatamente onde o método precisa dela honesta.

O mesmo vale, com consequência maior, do lado afro-brasileiro. _Orixás — Teogonia de Umbanda_,
_As Sete Linhas de Umbanda_, _Os Arquétipos da Umbanda_ e _Fundamentos Doutrinários de Umbanda_
são **todas de Rubens Saraceni** e entram sob `family:saraceni`. São quatro obras e uma voz, e é a
fonte mais presente do corpus: quem contasse obras em vez de linhagens quadruplicaria a
convergência exatamente onde o acervo é mais denso, e leria como consenso de escolas aquilo que é
a exposição de um único autor. As linhagens umbandistas independentes disponíveis hoje no corpus
são quatro — Saraceni, Templo da Pena, Ramatís e Quimbanda.

Uma função sustentada por uma linhagem só permanece no grafo com o rótulo `single_school`, em vez
de ser omitida. `function:passage-between-planes` tem duas atribuições e uma família: Saraceni
descreve Obaluaiê como "Senhor das Passagens" e Omolu como regente do instante da passagem. Duas
afirmações, uma voz — e o rótulo diz isso, em vez de a ausência sugerir sustentação inexistente.

A saída é qualitativa — `single_school`, `corroborated`, `convergent` — e não um coeficiente. Não
existe amostra que calibre um número aqui, e um percentual seria lido como certeza. O que se pode
afirmar é quantas linhagens distintas chegaram à mesma posição.

A relação declarada é sempre `analogous_position`. O tipo não oferece outra: "ocupa a mesma função
estrutural" é o que a comparação estabelece e se sustenta sob escrutínio; "é o mesmo ente" é
afirmação diferente, que nenhuma fonte sustenta e que derrubaria o método junto.

`ANTES`: as tradições não tinham camada comum. O grafo de evidência ligava Orixá a planeta, e as
fontes estruturais do scorer eram quatro, todas de magia cerimonial europeia.

`DEPOIS`: oito funções condensadas reúnem Umbanda, Quimbanda, Arbatel e a linhagem angélica
renascentista, com proveniência preservada, divergência registrada como conflito em vez de
resolvida por média, e sustentação graduada em `single_school`, `corroborated` ou `convergent`
conforme quantas linhagens independentes chegaram à mesma posição.

`MOTIVO`: é a camada que o §5.0.1 define como o produto — a pessoa vê um sistema, a máquina sabe de
onde cada peça veio e o quanto ela é sustentada.

`IMPACTO`: nenhum. O grafo é artefato de pesquisa versionado e não alimenta o scorer nem o runtime
público; a Tríade continua saindo da matriz v2. Ligá-lo ao scorer exige benchmark e bump de versão.

#### Grafo de funções estruturais 0.2.0 — 2026-08-28

> Auditoria posterior: “passagem localizada” não equivale automaticamente a
> “fonte encerrada”. Abimbola foi confirmado também na identidade
> Ifá/Òrúnmìlà; Prandi sustenta apenas a dimensão de limiar; Agrippa foi
> confrontado com a página digitalizada da edição inglesa de 1651. Ver
> `PROJECT_MEMORY.md` no bloco mais recente.

- **ANTES:** 9 funções e 24 atribuições; Ifá possuía apenas a linhagem UNESCO,
  Èṣù/Exu Òrìṣà ainda não tinha atribuição e fontes externas eram rotuladas como
  recuperação do corpus local.
- **DEPOIS:** 9 funções e 26 atribuições; Abimbola corrobora a função de
  adivinhação e conselho, e o trecho oficial de Prandi sustenta Èṣù/Exu Òrìṣà
  como guardião do limiar. Fontes externas usam `manual_review` ou
  `table_review` conforme o procedimento real.
- **MOTIVO:** foram localizadas passagens abertas, verificáveis e categorialmente
  inequívocas, além de uma inconsistência no metadado de extração.
- **IMPACTO:** `function:divination-and-counsel` passa de `single_school` para
  `corroborated`; `function:path-opening` ganha uma linhagem Ketu/Nagô sem fundir
  o Òrìṣà com entidades-guia. O scorer público não muda e continua na matriz v2.

#### Grafo de funções estruturais 0.3.0 — 2026-08-28

- **ANTES:** 9 funções e 26 atribuições; _Sixteen Cowries_ constava apenas como
  referência bibliográfica inacessível.
- **DEPOIS:** 9 funções e 27 atribuições. A edição da Indiana University Press no
  JSTOR sustenta Òrìṣàlá na função de adivinhação no corpus específico de Salakọ,
  com escola e locator que preservam esse recorte.
- **MOTIVO:** Bascom ressalta que crenças e proeminência variam entre cultos; no
  material de Salakọ, é Òrìṣàlá quem controla os dezesseis búzios. A modelagem
  localizada conserva a divergência em vez de universalizá-la.
- **IMPACTO:** `function:divination-and-counsel` reúne três famílias independentes
  e passa de `corroborated` para `convergent`. O scorer público não muda.

### Calibração, validação e limites

- Casos sacerdotais entram somente com autorização, finalidade definida e
  minimização. Casos públicos exigem declaração primária verificável da regência.
- Calibração e validação são separadas por pessoa; variantes do mesmo caso não
  podem atravessar os dois conjuntos.
- O dataset não armazena nomes no artefato analítico. Mantém ID opaco, fonte,
  qualidade da hora, features derivadas e rótulos necessários.
- Acurácia é reportada por posição, top-k, tríade completa, hora conhecida e
  desconhecida, tradição declarada e tamanho da amostra.
- O método não infere iniciação, terreiro, Odù, Vodum, Nkisi ou entidade quando
  esses rótulos não fazem parte do alvo validado.
- Não ranquear uma tradição como mais autêntica. Fontes acadêmicas descrevem;
  comunidades e autoridades religiosas são detentoras das práticas.
- Não publicar segredos, prescrições, oferendas ou ritos iniciáticos. O grafo
  deve permitir registrar que algo existe sem armazenar seu conteúdo.
- Não transformar arquétipos em diagnóstico médico, psicológico, moral ou de
  personalidade. Narrativas devem evitar fatalismo e linguagem de autoridade.
- Submeter taxonomia, glossário, textos públicos e correspondências a revisão
  remunerada por representantes de mais de uma linhagem relevante.

Validação mede determinismo, rastreabilidade e concordância com os casos de
referência. Nenhuma versão pode alegar “a mais precisa” sem benchmark publicado
e reproduzível que sustente a comparação.

### Texto mínimo para a interface

> Método autoral AstroAxe; consulte a metodologia.

## Registro de fontes culturais

### Para que serve este registro

Atualizado em 26 de agosto de 2026, conforme `docs/BLUEPRINT.md` §5.0.

Este é um **mapa de estudo**, não um cadastro de licenças. Ele registra o que foi lido, onde a
ideia aparece e o que cada obra sustenta — para que possamos reestudar o ponto certo quando uma
leitura do método se mostrar errada. Nenhuma entrada aqui autoriza ou proíbe coisa alguma: o
vocabulário de elegibilidade (`REFERENCE_ONLY`, `CLAIM_ELIGIBLE`) foi descartado com o modelo de
direitos por fonte.

O que continua valendo, porque é rigor e não trava:

1. **Uma fonte descreve um contexto; não cria uma regra universal.** Ausência de fonte também não
   prova inexistência.
2. **Testemunhos divergem, e a divergência é dado.** Heptameron atribuído a Pedro de Abano é
   espúrio; manuscritos do Lemegeton não são uniformes; listas de Agrippa variam entre edições.
   Onde as fontes discordam, o método registra o conflito em vez de escolher um vencedor em
   silêncio.
3. **Condensar por função, registrando a escola.** Umbanda Sagrada, Candomblé Ketu/Nagô,
   corpus de Ifá, magia cerimonial europeia e cabala se cruzam e se complementam, e o método
   as agrupa pela função estrutural que compartilham (ver `BLUEPRINT.md` §5.0.1). O registro
   por escola sobrevive à condensação porque é ele que dá peso: convergência entre escolas
   independentes é evidência forte, e cópia ou tradução da mesma linhagem não vale como duas
   confirmações. Afirmamos posição análoga, não identidade.
4. **Prioridade de voz:** comunidades e detentores culturais primeiro, depois instituições de
   patrimônio, depois etnografia acadêmica, depois análise comparativa — sempre identificada
   como análise.
5. **O que publicamos é nosso.** O site entrega síntese escrita por nós a partir deste estudo,
   nunca o texto das obras.

Acesso verificado em 19 de agosto de 2026.

### Estruturas comparativas de magia cerimonial

Estas fontes desenham a gramática computacional de camadas, temporalidades, hierarquias, ofícios
e facetas — a linguagem de **função estrutural** na qual o método condensa as tradições
(`BLUEPRINT.md` §5.0.1). Onde anjos, espíritos, Orixás, Voduns e Nkisi ocupam a mesma posição
funcional, isso é registrado como posição análoga e ganha peso pela convergência entre escolas
independentes. O que não afirmamos é identidade entre entes: "cumpre a mesma função" se sustenta,
"é o mesmo" não.

#### Heptameron — tradição pseudo-Pedro de Abano

- Transcrição comparada: <https://www.esotericarchives.com/solomon/heptamer.htm>
- Estrutura observada: o círculo varia conforme estação, dia, hora, estrela/região e função; o
  regente do dia governa a primeira hora e os sete regentes seguem em ciclo.
- Locator: seções I, II e XXV, incluindo as tabelas de anjos das horas.
- Relevância: sustenta separar identidade, função, tempo e esfera de correspondência.
- Cuidado: a atribuição a Pedro de Abano é considerada espúria pelo editor; testemunhos divergem na
  organização de horas noturnas. Toda regra derivada precisa identificar edição e variante.

#### De occulta philosophia — Heinrich Cornelius Agrippa

- Livro II: <https://www.esotericarchives.com/agrippa/agrippa2.htm>
- Livro III: <https://www.esotericarchives.com/agrippa/agrippa3.htm>
- Locator: livro II, capítulos 21–22 e 58–60; livro III, discussão das inteligências planetárias,
  signos, triplicidades, decanos, quinaries, elementos, direções, lugares e tempos.
- Estrutura observada: correspondências são organizadas em níveis celestes, planetários,
  zodiacais, elementais, numéricos e funcionais, com regências temporais e espaciais.
- Relevância: sustenta um grafo multifatorial e facetas contextuais, não uma associação plana.
- Cuidado: as listas internas também apresentam variantes de nomes e atribuições; não usar a obra
  como prova histórica ou religiosa sobre tradições afro-brasileiras.

#### Lemegeton / Lesser Key of Solomon

- Transcrição e variantes manuscritas: <https://www.esotericarchives.com/solomon/lemegeton.htm>
- Locator: sumário dos cinco livros; _Goetia_ para nomes, ordens e ofícios; _Theurgia Goetia_ para
  direções e divisões diurna/noturna; _Ars Paulina_ para horas planetárias e graus zodiacais.
- Estrutura observada: entidade, selo, ordem, ofício, direção, período e esfera são campos distintos;
  condições temporais modulam a operação sem necessariamente criar outra identidade.
- Relevância: inspira a separação computacional entre entidade estável e manifestação contextual.
- Cuidado: compilações e manuscritos não são uniformes. Não importar classificações morais,
  práticas evocativas ou equivalências para a leitura de Orixás.

#### Catálogos de manuscritos da British Library

- Harley MS 2267: <https://searcharchives.bl.uk/catalog/040-002048098>
- Sloane MS 3191: <https://searcharchives.bl.uk/catalog/040-002115575>
- Os registros confirmam, respectivamente, um manual ritual com atribuições planetárias e regras de
  operação, e materiais de John Dee com chaves angelicais e uma heptarquia planetária.
- Status: evidência institucional de existência e escopo dos manuscritos, não leitura integral nem
  autorização para claims de conteúdo além do catálogo.

#### Referências astronômicas para nascer e pôr do sol

- NOAA/GML, cálculo solar: <https://gml.noaa.gov/grad/solcalc/solareqns.PDF>
- U.S. Naval Observatory, condições polares: <https://aa.usno.navy.mil/faq/first_sunrise.html>
- A NOAA define nascer/pôr pela altura aparente corrigida para disco solar e refração. Seu calculador
  registra separadamente o evento anterior ou seguinte quando não há cruzamento do horizonte no dia
  em latitudes polares.
- O USNO documenta que, em regiões polares, o Sol pode permanecer continuamente acima ou abaixo do
  horizonte e que a refração próxima ao limite pode inclusive eliminar um evento previsto.
- Consequência: não existe hora planetária tradicional baseada em nascer/pôr naquele dia. O proxy
  equinocial AstroAxe é uma hipótese de continuidade computacional, não um evento astronômico nem uma
  regra histórica atribuída a essas instituições.

### Biblioteca de referência: Umbanda Sagrada de Rubens Saraceni

Estas obras são fontes doutrinárias primárias de uma corrente específica. Claims
derivadas delas devem usar `traditionId: UmbandaSagradaSaraceni`; não representam
consenso de todas as Umbandas e não devem ser transportadas para Candomblé, Ifá ou
tradições iorubás.

#### Código de Umbanda — Rubens Saraceni

- Catálogo oficial: <https://www.madras.com.br/umbanda/codigo-de-umbanda-6499>
- ISBN: `978-85-370-0338-1`; Madras; 576 páginas.
- O catálogo indica consciência religiosa, magia, fundamentos dos Orixás e bases do
  Ritual de Umbanda Sagrada.
- Limite: o catálogo sustenta apenas esses metadados e a autodescrição da obra.
  Conceitos apresentados como espiritualmente recebidos devem ser atribuídos à
  doutrina de Saraceni, não classificados como conclusão histórica ou científica.

#### As Sete Linhas de Umbanda — A Religião dos Mistérios

- Catálogo oficial: <https://www.madras.com.br/kits/essencial-rubens-saraceni>
- ISBN: `978-85-370-0363-3`.
- O catálogo situa a obra na exposição das Sete Linhas, dos mistérios dos Orixás e
  da chamada Ciência dos Orixás dentro da Umbanda Sagrada.
- Limite: “ciência” faz parte da terminologia interna da obra e não significa
  validação pelo método científico.

#### Os Arquétipos da Umbanda

- Catálogo oficial: <https://www.madras.com.br/umbanda/arquetipos-da-umbanda-os>
- ISBN: `978-85-370-0190-5`; Madras; 144 páginas.
- O catálogo apresenta Orixás como poderes de Olorum e mistérios da criação, dentro
  da formulação teológica do autor.
- Uso futuro: contexto doutrinário comparável somente depois de leitura localizada;
  nunca usar “arquétipo” como diagnóstico psicológico ou identidade religiosa.

Romances iniciáticos de Saraceni, como _O Guardião da Meia-Noite_, podem ser
estudados como literatura religiosa, mas não devem sustentar claims doutrinárias sem
corroboração explícita em obra de fundamento e revisão por praticantes da corrente.

### Biblioteca de referência: mitos iorubás, Ifá e diáspora

“Lenda iorubá” não é uma categoria única. O produto deve registrar se a narrativa
vem de corpus de Ifá, tradição oral localizada, compilação etnográfica ou recontagem
brasileira. Variantes não são erros a fundir em uma história definitiva. As obras
abaixo entram no estudo como qualquer outra.

#### Mitologia dos Orixás — Reginaldo Prandi

- Catálogo oficial: <https://www.companhiadasletras.com.br/livro/9788535900644/mitologia-dos-orixas>
- ISBN: `978-85-359-0064-4`; Companhia das Letras; 624 páginas; lançamento em 2000.
- O catálogo informa uma reunião de 301 relatos mitológicos iorubás/nagôs.
- Uso futuro: índice de narrativas e comparação de variantes, sempre preservando a
  proveniência apresentada na edição. Não copiar ou parafrasear um mito inteiro.

#### Orixás: Os deuses que habitam em nós — Reginaldo Prandi

- Catálogo oficial: <https://www.companhiadasletras.com.br/livro/9788535942576/orixas>
- ISBN: `978-85-359-4257-6`; Companhia das Letras; 256 páginas; 2025.
- O catálogo descreve interpretações contemporâneas de mitos ligados a dezoito
  Orixás, combinando ensaio e reflexão sociológica.
- Uso futuro: fonte de interpretação autoral contemporânea, não substituto do corpus
  oral nem regra religiosa.

#### Notas Sobre o Culto aos Orixás e Voduns — Pierre Verger

- Catálogo oficial: <https://www.edusp.com.br/livros/notas-sobre-o-culto-aos-orixas-e-voduns/>
- ISBN: `978-85-314-0475-7`; Edusp; 2ª edição, impressão de 2023.
- A editora descreve comparação entre Bahia, contextos yorùbá na Nigéria e djèdjè
  no antigo Daomé, incluindo ritos, transe e cerca de 1.500 oríkì.
- Cuidado reforçado: não expor material iniciático, prescrições rituais ou oríkì. A
  existência de uma descrição etnográfica não concede licença cultural ou autoral.

#### Os Nàgô e a Morte — Juana Elbein dos Santos

- Registro bibliográfico: <https://catalogue.bnf.fr/ark:/12148/cb34946851v>
- ISBN de edição Vozes posterior: `978-85-326-0923-6`; tese de Etnologia de 1972.
- O registro confirma estudo de Pàdè, Àsèsè e culto Égun na Bahia, com textos rituais
  yorùbá e tradução.
- Cuidado reforçado: ancestralidade e culto Égun podem envolver conhecimento
  restrito. Não converter em conteúdo de entretenimento ou prática guiada.
- Auditoria de 28 de agosto: frontispício e ficha catalográfica do scan localizado
  coincidem com Google Books e Smithsonian. Os trechos recuperados descrevem Èṣù
  como princípio dinâmico, de comunicação e individualização. Nenhuma função do
  vocabulário atual formula isso; por esse motivo a obra **não** gerou atribuição.

#### Ifá: An Exposition of Ifá Literary Corpus — Wande Abimbola

- Registro bibliográfico: <https://search.worldcat.org/title/Ifa-%3A-an-exposition-of-Ifa-literary-corpus/oclc/3071093>
- Oxford University Press Nigeria, Ibadan, 1976.
- Edição integral consultada: <https://thinkyorubafirst.org/wp-content/uploads/2023/10/Ifa-An-exposition-of-Ifa-literary-corpus.pdf>,
  reedição Athelia Henrietta Press, 1997.
- A p. 3 da edição (p. 10 do PDF) resolve a identidade usada no grafo: segundo
  Abimbola, Ifá e Òrúnmìlà referem-se à mesma divindade; `Ifá` também designa o
  sistema de adivinhação. O registro da reedição foi confrontado com
  <https://books.google.com/books/about/If%C3%A1.html?id=M1x-AAAAMAAJ>.
- Páginas 9–10: Ifá é descrito por sua sabedoria, conselho e mediação; páginas 10–11
  o apresentam como divindade de adivinhação consultada para orientação nas decisões
  importantes. Essa passagem sustenta a segunda linhagem de
  `function:divination-and-counsel`, independente do dossiê UNESCO.
- Não extrair versos nem criar equivalências com trânsitos. O uso no grafo registra
  somente a função estrutural sustentada pela prosa localizada.

#### Sixteen Cowries — William R. Bascom

- Registro bibliográfico: <https://search.worldcat.org/title/Sixteen-cowries-%3A-Yoruba-divination-from-Africa-to-the-New-World/oclc/560389150>
- Indiana University Press, 1980.
- O catálogo descreve textos yorùbá e traduções relacionados a um sistema de
  divinação da Nigéria e da diáspora.
- Texto primário consultado na edição digital da Indiana University Press/JSTOR:
  <https://www.jstor.org/stable/j.ctt16xwcgx>. No capítulo III (pp. 32–52), Bascom
  ressalva variação entre cultos e registra que Òrìṣàlá controla os dezesseis
  búzios no corpus de Salakọ. A atribuição usa `school:salako-igana` e não afirma
  regência universal sobre o sistema.
- Uso futuro: comparação etnográfica situada. Não apresentar conteúdo divinatório
  como cálculo astrológico nem reproduzir textos sem licença e revisão cultural.

### Ifá, Odù e Orí

#### Sistema de adivinhação Ifá — UNESCO

- URL: <https://ich.unesco.org/en/RL/ifa-divination-system-00146>
- Tipo: patrimônio cultural imaterial; descrição institucional.
- Sustenta: Ifá como sistema de signos interpretado por babaláwo, uso de ikin e
  corrente divinatória, corpus de 256 Odù e versos ẹsẹ̀, transmissão sacerdotal.
- Não sustenta: equivalência entre Odù e Orixá; astrologia como mecanismo de
  identificação pessoal.

#### À cabeça carrego a identidade: o orí como um problema de pluralidade teológica

- URL: <https://www.scielo.br/j/afro/a/sCT83PYTYLrgWH7cnmJVHdH/>
- Tipo: artigo acadêmico.
- Sustenta: pluralidade das concepções yorùbá de orí, destino, fabricação da
  pessoa e ritual de bọrí.
- Cuidado: orí não deve ser traduzido automaticamente como Orixá de cabeça.

#### Cadernos nagô: a antropologia reversa do Alapini Paulo Braz Ifamuide

- URL: <https://teses.usp.br/teses/disponiveis/8/8134/tde-16062015-124158/pt-br.html>
- Tipo: dissertação, Universidade de São Paulo.
- Sustenta: variações e inovações no jogo de Ifá e sua relação com iniciação,
  feitura, ancestralidade, oferendas e transmissão de conhecimento.

### Candomblé Ketu/Nagô e relações pessoais

#### Oogun Àṣẹ: estratégias de cuidado com a saúde no Candomblé em Nova Iorque

- URL: <https://www.scielo.br/j/icse/a/8r94PCz5zyGKbjhTDQ6PdDM/>
- Tipo: etnografia publicada em periódico acadêmico.
- Sustenta: jogo de búzios realizado por liderança de Candomblé para consultar
  caminhos e identificar o santo/Orixá de cabeça naquele contexto.
- Cuidado: não autoriza generalizar procedimentos ou resultados a toda casa.

#### A gente vive pra cuidar da população

- URL: <https://www.scielo.br/j/sausoc/a/bBcjM3zp3ZbSSyhhH3ydsTD/>
- Tipo: pesquisa etnográfica publicada em periódico acadêmico.
- Sustenta: consulta aos búzios, Orixá de cabeça, juntó/ajuntó, recomendações e a
  concepção múltipla de pessoa em terreiros pesquisados.
- Cuidado: o número de divindades e a forma de incorporação variam entre
  terreiros, como o próprio estudo registra.

#### Enredos, feituras e modos de cuidado

- URL: <https://repositorio.ufba.br/handle/ri/32653>
- Tipo: livro acadêmico, EDUFBA.
- Sustenta: relações entre pessoas, Orixás, Exus, erês e caboclos construídas em
  processos de feitura, cuidado e convivência.

#### Fazendo Orixás: sobre o modo de existência das coisas no Candomblé

- URL: <https://www.scielo.br/j/rs/a/hghGxf7Tqn9cRhhDJ9849kz/>
- Tipo: artigo etnográfico.
- Sustenta: assentamento/ibá como presença material e lugar em que a relação
  entre pessoa e Orixá é feita e cuidada.

### Jeje, Congo-Angola e correspondências

#### Inventário Nacional de Referências Culturais dos Terreiros do DF e Entorno

- URL: <https://portal.iphan.gov.br/uploads/publicacao/inventario_entorno.pdf>
- Tipo: inventário institucional, IPHAN.
- Sustenta: distinção entre Orixás, Voduns e Inkices e existência de
  aproximações históricas, materiais e rituais entre panteões.
- Cuidado: as aproximações descritas são correspondências contextuais, não
  declarações de identidade ontológica.

#### Das línguas africanas ao português brasileiro

- URL: <https://repositorio.ufba.br/bitstream/ri/3667/1/12121212.pdf>
- Tipo: trabalho acadêmico depositado na UFBA.
- Sustenta: vocabulários, línguas rituais, cargos e nomes distintos — Vodum nas
  tradições Jeje-Mina, Orixá nas Nagô-Ketu-Ijexá e Inquice nas Congo-Angola.

#### Corpo-Ebó: axé, sabenças, danças e candomblés para sustentar revoluções negras

- URL: <https://repositorio.ufba.br/handle/ri/36904>
- Arquivo consultado: <https://repositorio.ufba.br/bitstream/ri/36904/1/Disserta%C3%A7%C3%A3o%20Jean%20Ferreira%20Souza.pdf>
- Tipo: dissertação, Universidade Federal da Bahia, com interlocução de
  praticantes.
- Sustenta: centralidade do jogo de búzios em decisões rituais e na indicação
  da relação pessoal com Orixá/Inquice em um contexto Congo-Angola estudado.
- Cuidado: o uso diaspórico do jogo não transforma Nkisi em Orixá nem torna a
  prática idêntica à de Ketu.

#### Fé, boca calada e pé ligeiro: Terreiro Bate Folha

- URL: <https://repositorio.ufba.br/handle/ri/39424>
- Tipo: tese, Universidade Federal da Bahia.
- Sustenta: memória, iniciação, linhagem e preservação da tradição
  Congo-Angola no Terreiro Bate Folha.

### Batuque e diversidade no Rio Grande do Sul

#### Mapeamento das casas de religiões de matriz africana do Rio Grande do Sul

- Volume 1: <https://portal.iphan.gov.br/uploads/publicacao/casas_religiao_matriz_africana_rs_mod1.pdf>
- Volume 2: <https://portal.iphan.gov.br/uploads/publicacao/casas_religiao_matriz_africana_rs_mod2.pdf>
- Tipo: inventário institucional, IPHAN.
- Sustenta: Batuque/Nação, seus lados, diferenças litúrgicas e coexistência de
  Batuque, Umbanda, Quimbanda e Linha Cruzada sem equivalência automática.

#### Narrativas míticas no Batuque do Rio Grande do Sul

- URL: <https://lume.ufrgs.br/bitstream/handle/10183/149562/001004832.pdf>
- Tipo: trabalho acadêmico, Universidade Federal do Rio Grande do Sul.
- Sustenta: descrição localizada de Orixá de cabeça, ajuntó/Orixá de corpo e
  Orixá de passagem.
- Cuidado: sexo do ajuntó, composição e terminologia são claims daquele campo,
  não regra universal do Batuque ou do Candomblé.

#### Religiões afro-brasileiras do Rio Grande do Sul: passado e presente

- URL: <https://www.scielo.br/j/eaa/a/MHgZxZM6Nw5qzMqZHyy7dQg/>
- Tipo: artigo acadêmico.
- Sustenta: distinções e cruzamentos históricos entre Batuque, Umbanda e Linha
  Cruzada no estado.

### Umbandas, guias e entidades

#### A escrita do sagrado na obra de Matta e Silva — José Henrique M. Oliveira

- URL: <https://klineeditora.com/revistajesushistorico/arquivos22/3-JOSE-HENRIQUE-OLIVEIRA.pdf>
- Tipo: análise acadêmica da codificação de _Umbanda de Todos Nós_ (1956), publicada na Revista
  Jesus Histórico, com autoria vinculada à UFRJ.
- Locator: tabela 2 e análise nas páginas 59–60 do artigo (páginas 16–17 do PDF).
- Sustenta, dentro da escola de Matta e Silva: Orixalá–Sol–Leão; Iemanjá–Lua–Câncer;
  Yori–Mercúrio–Gêmeos/Virgem; Ogum–Marte–Áries/Escorpião; Oxóssi–Vênus–Touro/Libra;
  Xangô–Júpiter–Sagitário/Peixes; Yorimá–Saturno–Capricórnio/Aquário.
- Cuidado: o próprio estudo conclui que Matta e Silva fez escolhas independentes ao elaborar a
  Umbanda Esotérica e aponta fragilidade particular em Oxóssi–Vênus. Yori e Yorimá são linhas da
  formulação do autor, não devem ser silenciosamente convertidos em Orixás de outras tradições.
- Alcance: representa essa matriz histórica localizada, não uma regra universal; pesos do
  algoritmo AstroAxe continuam sendo hipóteses versionadas e sujeitas à validação empírica.

#### Sessões em Casa: práticas religiosas e variação em Almas e Angola

- URL: <https://www.scielo.br/j/rs/a/rmMTStJK9qQTwMDC8K6mfTC/>
- Tipo: artigo etnográfico.
- Sustenta: distinção hierárquica local entre Orixás e entidades, além das
  linhas de pretos-velhos, caboclos/boiadeiros, crianças e povo de rua.
- Cuidado: a classificação é situada e não define todas as Umbandas.

#### Caboclos e Orixás no Terreiro: modos de conexão e possibilidades de simbiose

- URL: <https://www.scielo.br/j/rs/a/n6F4DSTVDDsTVQ6vzvhZxcR/>
- Tipo: artigo etnográfico.
- Sustenta: diferenças relacionais entre caboclos e Orixás, inclusive no modo
  de assentá-los, mesmo quando ambos convivem no terreiro.

#### Comida de Criança: doces (e) ibejadas da Umbanda

- URL: <https://www.scielo.br/scielo.php?pid=S0100-85872022000200067&script=sci_arttext&tlng=pt>
- Tipo: artigo etnográfico.
- Sustenta: diversidade e relações situadas entre crianças/ibejadas, Orixás e
  pontos de força em terreiros pesquisados.

#### Jeitos, sujeitos e afetos: plantas e médiuns umbandistas

- URL: <https://www.scielo.br/j/bgoeldi/a/mnr9qvM96cv5Tr5HcQsVZqp/>
- Tipo: artigo etnográfico.
- Sustenta: desenvolvimento mediúnico, aprendizado e atuação de guias em
  práticas de cuidado com plantas.

### Fontes de contexto institucional

#### Capacitação sobre povos e comunidades tradicionais de matriz africana

- URL: <https://portal.iphan.gov.br/pagina/detalhes/1316/>
- Tipo: programa institucional, IPHAN, com participação de representantes das
  tradições.
- Sustenta: reconhecimento público da pluralidade de Ketu, Angola, Nagô, Jeje,
  Batuque, Umbanda e outras tradições, sem reduzi-las a uma matriz única.

#### Inventário dos terreiros do Distrito Federal e Entorno

- URL: <https://portal.iphan.gov.br/uploads/publicacao/inventario_dos_terreiros_do_df_e_entorno.pdf>
- Tipo: inventário institucional, IPHAN.
- Sustenta: diversidade de nações e terminologia local, incluindo Orixás,
  Voduns, Inkices, Umbanda e Quimbanda.
- Sustenta também: o caráter especializado dos ofícios e da consulta pelo jogo
  de búzios; não fornece uma tabela universal de desempates para software.

#### Relações e narrativas: o enredo no candomblé da Bahia

- URL: <https://www.scielo.br/j/rs/a/BQZmgvKQLQNp9Z6vYCxbHcD/?lang=pt>
- Tipo: artigo etnográfico.
- Sustenta: a composição da cabeça é conhecida no contexto da consulta pelo
  jogo de búzios e da relação ritual, não por uma regra lexical externa.
- Cuidado: descreve contextos pesquisados na Bahia e não autoriza generalização
  para todas as tradições ou casas.

#### Os segredos de Orunmilá.com

- URL: <https://teses.usp.br/teses/disponiveis/27/27153/tde-24022021-154629/pt-br.html>
- Tipo: tese acadêmica.
- Sustenta: a divinação como processo técnico e dialógico entre oráculo,
  especialista e consulente, produtor de conhecimento contextual.
- Cuidado: sustenta a arquitetura de confirmação e abstenção, não uma
  correspondência astrológica específica nem acesso a fundamentos reservados.

### Narrativas integrais consultadas

#### Yoruba Legends — M. I. Ogumefu (1929), capítulo VI

- Texto integral: <https://www.sacred-texts.com/afr/yl/yl08.htm>
- Índice da edição: <https://www.sacred-texts.com/afr/yl/index.htm>
- Locators usados: capítulo VI, páginas 8–9; prefácio, páginas iii–iv.
- Sustenta somente: a sequência narrativa que liga o rei Sango, o uso do
  relâmpago, perda, morte e saudação ligada ao trovão; e a necessidade de
  contextualizar o enquadramento colonial/cristão do prefácio.
- Direitos: edição de 1929 em domínio público nos Estados Unidos; o status
  varia por jurisdição. O AstroAxe usa síntese original e não reproduz nem
  traduz a expressão da obra.
- Limite cultural: registro escrito em inglês, publicado em Londres e mediado
  por sua época. Não representa versão universal, origem da narrativa ou
  autoridade contemporânea sobre tradições iorubás e afro-diaspóricas.

### Inventário amplo para extração de atributos

O inventário executável fica em `correspondence-research-sources.ts`. Ele inclui fontes de múltiplos
tipos e países, entre elas:

- periódicos SciELO e PUC-Campinas sobre domínios naturais, narrativas e cantigas;
- National Institute for Cultural Orientation da Nigéria e Yoruba Library para Ajé;
- artigo sobre Òrìṣà Oko em Igbeti, Oyo;
- World History Encyclopedia e registros históricos digitalizados como trilhas de descoberta;
- casas, comunidades e acervos encontrados na varredura, que exigem identificação de autoria e
  tradição antes de sustentar promoção.

Páginas panorâmicas, Wikipedia, agregadores, blogs sem autoria e resultados de busca são
`discovery_only`. Servem para encontrar nomes, variantes e bibliografia, mas não sustentam sozinhos
uma correspondência ativa. O scraping guarda metadados e claims sintetizadas; não copia artigos,
livros ou fundamentos rituais integrais.

### Claims não sustentadas e proibidas

Até que documentação pública, situada e revisada demonstre o contrário, estas
afirmações não podem integrar a base cultural como fatos religiosos:

- uma tabela universal de signo zodiacal para Orixá, Vodum ou Nkisi;
- Sol como Orixá de frente, Lua como Orixá de cabeça e Saturno/Nodo Sul como
  Orixá de costas;
- cor, dia, elemento, comida ou animal universal e invariável para uma
  divindade em todas as tradições;
- equivalência entre Odù e Orixá ou entre orí e Orixá de cabeça;
- equivalência `sameAs` entre Orixá, Vodum e Nkisi;
- identificação de guia/entidade como Orixá;
- capacidade de um modelo estatístico validar jogo de búzios, Ifá, Fá,
  iniciação ou experiência mediúnica.

### Numerologia popular, data natal e tabelas zodiacais

O estudo completo e a proposta de modelagem estão em
[`../research/orixa-numerology/report-source.md`](../research/orixa-numerology/report-source.md).

- Astrocentro, “Numerologia dos Orixás”: `discovery_only` e `product-editorial`. Documenta uma
  redução decimal da data para 1–16 e uma tabela Odù/Orixá sem genealogia, casa ou bibliografia
  publicadas. Não sustenta Orixá de cabeça nem Odù de Ifá.
- Terra, “Descubra qual Orixá está ligado ao seu signo”: `discovery_only` e
  `product-editorial`. A própria página chama a tabela de associação simbólica e remete a
  identificação espiritual aos búzios.
- Imaginário Brasileiro, “Como saber o meu Orixá?”: `discovery_only`. Combina teste não
  documentado, signo, dia da semana e recomendação de consulta tradicional; não possui método ou
  proveniência suficientes para claims.
- _Etnomatemática e Candomblé: a mística numérica por trás dos ritos_: registra a soma da data, mas
  não demonstra que a tabela seja universal.
- Alice Macedo, tese USP, p. 162: sustenta apenas afirmar que a casa de Umbanda
  estudada combinava numerologia de nome/data com outras leituras. Não generalizar o procedimento.
- Rubens Saraceni, _As Sete Linhas de Umbanda_, pp. 48–49: acervo privado; confirmar edição ao
  reestudar. Na corrente do autor, contradiz a identificação do Orixá regente pela data natal —
  divergência que o método registra em vez de resolver em silêncio.

Essas fontes estabelecem divergência, não convergência. “Cabala de Odù” permanece termo de fonte a
ser genealogicamente investigado e não uma tradição única cadastrada pelo produto.

Esses itens podem ser estudados como construções editoriais, comparações ou
crenças situadas, mas precisam do tipo de claim adequado e jamais devem ser
apresentados como consenso tradicional.

## Protocolo de pesquisa de regências

### Objetivo

Construir e comparar versões determinísticas do método AstroAxe para Orixá de frente, cabeça e
costas. A matriz combina astrologia, ocultismo, narrativas, símbolos naturais e sistemas
afro-brasileiros, preservando a origem de cada correspondência para análise e ajuste.

### Trilhas de evidência

Cada correspondência recebe uma ou mais trilhas independentes:

1. fonte primária publicada por sacerdote, casa, comunidade ou autor da escola estudada;
2. fonte institucional, etnográfica ou acadêmica com locator;
3. sistema ocultista publicado, incluindo sua tradição, edição e justificativa;
4. convergência simbólica editorial AstroAxe, descrita como hipótese calculável;
5. evidência empírica de calibração, sem alterar o significado histórico da fonte.

Discordâncias não são apagadas. A matriz pode testar sínteses entre escolas, mas cada peso conserva
o caminho que o originou.

### Regência dinâmica e facetas

A entidade não é reduzida a um arquétipo invariável. Uma correspondência pode declarar uma faceta
específica ativada ou reforçada por planeta, signo, casa, ângulo, decanato, dignidade, aspecto, dia
planetário ou hora planetária. A identidade da entidade permanece estável; o contexto altera a
manifestação e o peso daquela faceta.

O método separa o contexto natal do contexto da leitura. Dias planetários começam no nascer do sol;
as doze horas diurnas dividem o intervalo entre nascer e pôr do sol, e as doze noturnas dividem o
intervalo entre o pôr e o nascer seguinte. Portanto, “hora planetária” não significa uma hora civil
fixa. Nascer e pôr do sol são calculados por uma boundary astronômica com data, coordenadas e fuso e
entram no snapshot auditável. Sem hora conhecida ou intervalo solar válido, o fator correspondente é
omitido e a precisão declarada diminui.

Analogias com magia cerimonial, astrologia tradicional ou outras religiões podem orientar a forma do
modelo — por exemplo, uma mesma entidade expressar facetas diferentes sob regências temporais — mas
não provam equivalência entre entidades de sistemas distintos. Cada aplicação concreta a um Orixá
precisa de claim próprio, fonte e escola identificadas.

### Casos de referência

#### Casos sacerdotais

- autorização explícita para pesquisa;
- data, hora, cidade e tríade conhecida;
- qualidade da hora e tradição/linhagem quando isso puder ser informado;
- nenhum nome, contato, relato íntimo, dado ritual reservado ou texto de consulta no dataset;
- direito de retirada por ID opaco.

#### Casos públicos

Um caso só é elegível quando existem duas cadeias independentes:

1. autodeclaração pública inequívoca da própria pessoa sobre sua regência;
2. data, hora e local de nascimento com fonte identificável e classificação de qualidade.

Entrevista, vídeo, livro autobiográfico ou publicação da própria pessoa têm precedência. Matéria que
apenas repete rumor, página sem fonte, inferência por personalidade ou atribuição de terceiro não é
rótulo válido. A fonte pode ser arquivada por URL, título, data de acesso, trecho mínimo permitido e
hash; conteúdo integral protegido não é copiado.

Pessoas vivas recebem proteção adicional: o dataset analítico usa ID opaco e não publica tabela
nominal. A página metodológica divulga critérios e métricas agregadas.

### Separação e métricas

- divisão por pessoa entre calibração e validação, antes de ajustar pesos;
- deduplicação de variantes, republicações e mapas retificados;
- métricas por frente, cabeça, costas, top-3 por papel e tríade completa;
- matriz de confusão por Orixá e análise de cobertura do conjunto;
- cortes por hora conhecida/desconhecida, origem do caso e tradição declarada;
- intervalo de confiança e tamanho da amostra junto de toda porcentagem;
- taxa de abstenção por papel, para distinguir prudência do motor de erro de classificação;
- baseline simples publicado para demonstrar ganho real da matriz robusta.

Casos com apenas um ou dois papéis explicitamente declarados podem contribuir para a métrica desses
papéis, sem preenchimento inferido dos demais. Cada papel usa seu próprio denominador. A acurácia de
tríade completa considera exclusivamente casos com os três rótulos disponíveis; quando não houver
nenhum, o relatório retorna amostra zero e acurácia nula, nunca zero por conveniência.

Da mesma forma, a previsão pode conter somente frente e cabeça. Costas é tratado como papel ancestral
de manifestação variável: ausência de evidência suficiente gera abstenção explicada, não um terceiro
nome escolhido por desempate. Quando calculável acima dos mínimos versionados, o ancestral é exibido
e participa das métricas do papel e da tríade completa.

O conjunto de validação permanece congelado durante cada versão. Um caso corrigido gera nova versão
do dataset e registro `ANTES / DEPOIS / MOTIVO / IMPACTO`.

A versão `regency-evaluation-0.3.0` calcula intervalos de Wilson de 95% para acurácia top-1, top-3 e
tríade exata. Ela também recusa uma impressão digital de evidência presente nas duas partições e
reporta cortes por proveniência. Esses controles não substituem a deduplicação humana por pessoa,
mas detectam reutilização exata das mesmas cadeias documentais no artefato sanitizado.

A versão `regency-evaluation-0.4.0` acrescenta rótulos públicos não ordenados em `expected.anyOf`.
Ela existe para declarações como “sou de X” ou “meus Orixás são X e Y”, quando a fonte não atribui
frente, cabeça ou costas. Esses rótulos medem cobertura na tríade selecionada e no top-3 de qualquer
papel, sem alimentar acurácia por papel ou tríade exata. Uma declaração sem papel nunca é convertida
silenciosamente em cabeça.

Registro da mudança:

- **ANTES:** todo caso precisava atribuir ao menos um Orixá a frente, cabeça ou costas;
- **DEPOIS:** casos podem preservar um conjunto `anyOf`, com métricas agregadas próprias;
- **MOTIVO:** autodeclarações públicas e relatos consentidos frequentemente nomeiam Orixás sem papel;
- **IMPACTO:** mais casos podem ser auditados sem fabricar rótulos, mas não passam a satisfazer a
  amostra mínima por papel nem autorizam promoção do motor.

O método `regency-robustness-0.1.0-beta` adiciona uma análise de sensibilidade
`leave-one-school-out`. O scorer é repetido removendo, uma por vez, cada escola pública de
correspondência; por papel, o relatório mede quantas vezes o primeiro candidato original permanece
no topo e, quando houve seleção, quantas vezes o selecionado permanece no topo. Uma única escola é
amostra insuficiente. A medida não é probabilidade religiosa nem acurácia observada: ela detecta
dependência excessiva de uma família de fontes e orienta abstenção e revisão.

Registro da mudança:

- **ANTES:** a avaliação media acerto em casos rotulados, mas não expunha a sensibilidade do
  resultado à retirada de uma escola de correspondência;
- **DEPOIS:** a interface Beta mostra estabilidade experimental e a versão do teste de robustez;
- **MOTIVO:** uma pontuação alta pode ser frágil quando depende de uma única família documental;
- **IMPACTO:** resultados instáveis ficam visíveis e devem favorecer abstenção. O teste não promove
  pesos, não substitui validação externa e não confirma Orixás de ninguém.

Antes de qualquer comparação, `regency-comparison-0.1.0` calcula um SHA-256 canônico do dataset
sanitizado e registra apenas versão, digest e contagens agregadas. Baseline e experimental precisam
usar a mesma versão e a mesma partição de validação. A política inicial exige 30 rótulos em frente e
cabeça, não aceita perda top-1/top-3 e limita o aumento de abstenção a cinco pontos percentuais.
Passar esses critérios significa somente elegibilidade para revisão cultural; não ativa a versão no
produto.

### Execução do benchmark

O benchmark local recebe um JSON já derivado e sanitizado:

```bash
npm run regency:prepare-case -- caminho/seguro/caso-bruto.json > caso-derivado.json
npm run regency:evaluate -- caminho/seguro/dataset.json
```

O primeiro comando exige `FINGERPRINT_SECRET`, aceita no máximo 256 KiB e remove nascimento,
localização e URLs da saída. Em seu lugar, conserva apenas as features calculadas e um HMAC das duas
cadeias de evidência. O arquivo bruto e o vínculo entre pessoa, caso e fontes permanecem fora do
repositório, com acesso restrito e procedimento de retirada.

O arquivo é limitado a 10 MiB e validado integralmente antes do cálculo. Deve conter ao menos um
caso de calibração e um de validação para produzir os dois relatórios. A saída contém somente versões,
tamanho das amostras, acurácias e matrizes de confusão agregadas. Erros não imprimem conteúdo, caminho
completo, casos ou valores rejeitados. O dataset bruto não deve ser versionado no repositório.

A hora planetária natal é calculada pelo `caelus` já fixado no projeto, usando Julian Day,
latitude e longitude. O cálculo divide os intervalos reais de nascer–pôr e pôr–nascer seguinte. Em
condição polar sem intervalo solar, retorna `solar_interval_unavailable` e o fator é omitido.

Para condições polares existem duas políticas explícitas:

- `strict` (padrão): não produz dia/hora planetária e registra `method: unavailable`;
- `equinoctial_local_solar`: proxy experimental com nascer às 06:00 e pôr às 18:00 em tempo solar
  local médio, formando 24 segmentos iguais e preservando a sequência caldaica.

O proxy nunca é apresentado como nascer ou pôr do sol observado. Ele conserva
`solar_interval_unavailable`, registra `method: equinoctial_local_solar_proxy` e tem métricas
separadas no benchmark. A política só poderá se tornar padrão em latitude polar se superar a omissão
no conjunto de validação sem degradar a calibração global.

### Segurança e uso

Os datasets não entram em logs, analytics, LLM, MCP ou serviços externos. A coleta guarda somente o
necessário para auditoria e cálculo. Acesso bruto é restrito; artefatos versionados no repositório
contêm apenas dados derivados ou sintéticos até que haja uma política específica de pesquisa e
publicação.

### Precedentes iniciais

- UNESCO, sistema divinatório de Ifá: <https://ich.unesco.org/en/RL/ifa-divination-system-00146>;
- José Henrique M. Oliveira, estudo sobre W. W. da Matta e Silva e as Sete Linhas:
  <https://klineeditora.com/revistajesushistorico/arquivos22/3-JOSE-HENRIQUE-OLIVEIRA.pdf>;
- pesquisas etnográficas e fontes registradas em `docs/METHOD.md`.

## Política de orientação cerimonial acionável

Versão `ceremonial-guidance-policy-0.1.0`, implementada em 28 de agosto de 2026.

- **ANTES:** o roteiro enumerava categorias nocivas, mas não havia contrato de
  domínio comum a criação, atualização e exportação de planos futuros.
- **DEPOIS:** uma função pura recebe operação, categoria fechada e alvo. Objetivo
  seguro produz checklist limitado; risco material ou falta de consentimento
  produz recusa e categoria de ajuda tipadas. Input ausente ou desconhecido
  falha no schema.
- **MOTIVO:** uma restrição escrita apenas na interface seria contornável por API,
  atualização ou exportação. A política precisa existir antes dessas boundaries.
- **IMPACTO:** nenhum planner foi ativado. O contrato está pronto para ser usado
  obrigatoriamente quando as APIs forem criadas. Texto-fonte histórico continua
  em contrato separado, com proveniência e aviso, e não é modificado pela
  política de orientação.

A política não classifica linguagem natural por palavras-chave. A futura boundary
não poderá aceitar prompt arbitrário e declará-lo seguro por padrão: precisará
produzir uma das categorias fechadas ou recusar. Isso evita que sinônimos,
obfuscação ou idioma diferente atravessem um filtro textual superficial.

## Operação do corpus cultural

### Estado atual

O banco e a API pública suportam conteúdo cultural versionado, com autoria e histórico. O corpus
público contém quatro textos escritos pelo projeto. Novos verbetes não são criados
automaticamente: alguém escreve cada um.

`GET /api/cultural-content` lista as versões públicas mais recentes. A página
`/acervo-cultural` apresenta os textos integrais e sua proveniência.
`GET /api/cultural-content/{slug}` retorna somente a versão publicada mais recente cuja data de
publicação já chegou. Rascunhos, pareceres internos, conteúdo retirado e claims retiradas ou
depreciadas não são expostos.

### Fluxo de autoria — atualizado em 26 de agosto de 2026

A decisão de arquitetura em `docs/BLUEPRINT.md` §5.0 encerrou o modelo de direitos por fonte.
Não existe mais elegibilidade por obra como pré-condição, nem fila bloqueando autoria. O acervo é
insumo e é usado por inteiro.

Precisão que importa para quem for mexer nisso: `REFERENCE_ONLY` e `CLAIM_ELIGIBLE` **continuam
existindo** como vocabulário de registro de fonte em `src/lib/editorial/contracts.ts`, e
`cultural_sources.usage_status` segue no banco com `REFERENCE_ONLY` como padrão. O que foi removido
foi o **portão**: nenhum fluxo exige mais que a fonte esteja `CLAIM_ELIGIBLE` para a claim valer. O
campo permanece como anotação de como a fonte é usada, não como autorização.

O que permanece — e permanece porque é qualidade de produto, não trava jurídica:

1. **Escrevemos o texto.** Todo verbete é síntese original a partir do estudo de muitas fontes.
   Nunca transcrição, nunca paráfrase colada de um único texto. Fato e ideia são livres; a
   expressão é nossa.
2. **Profundidade é requisito.** Um verbete raso é pior que nenhum: ele ocupa o lugar do
   conhecimento sem entregá-lo. A constraint de profundidade no banco continua valendo, e a barra
   real é mais alta que ela.
3. **Versão imutável.** Correção gera nova versão; o histórico não é apagado. É isso que permite
   corrigir o método quando o entendimento muda.
4. **Proveniência interna.** Registramos de onde veio a ideia, no banco, fora da interface. Serve
   para nós — saber o que revisar quando uma leitura se mostra errada.
5. **Rótulo de IA quando houver.** Texto composto por IA é declarado como tal.

O que saiu: parecer por fonte, nota de licença por obra e o vocabulário de elegibilidade. Nada
disso descrevia risco real e tudo isso custava trabalho de autoria.

**Revisão independente deixou de ser pré-condição.** A migration `20260826150000` relaxou a
constraint que exigia `reviewer_id <> author_id` para publicar verbete cultural e texto de
trânsito, e `src/lib/editorial/workflow.ts` deixou de vetar autor = revisor. Num projeto de uma
pessoa aquele gate só se satisfazia com uma segunda conta assinando a própria revisão — uma
ficção gravada no banco com aparência de rigor.

O que o banco continua exigindo, verificado contra PostgreSQL 18 real:

- `published_at IS NOT NULL` para qualquer verbete publicado;
- a constraint de profundidade (`published_cultural_entry_depth`): resumo com pelo menos 240
  caracteres e corpo com pelo menos 1.800. Texto raso continua recusado pelo banco.

`reviewer_id` e `reviewed_at` permanecem nas tabelas e são gravados quando houver de fato uma
segunda pessoa revisando. Deixaram de ser pré-condição; passaram a ser registro do que
aconteceu.

Também saiu a exigência de que a fonte da claim estivesse `CLAIM_ELIGIBLE`. **A exigência de
locator permanece**: uma afirmação material aponta para uma posição citável, porque é isso que
permite reestudar o ponto quando a leitura se mostrar errada.

### Identidade e APIs editoriais

O acesso editorial não é herdado de uma conta comum. Um operador confiável precisa vincular
manualmente `cultural_contributors.user_id` a uma conta existente e atribuir um papel:

- `AUTHOR`: cadastra fontes e cria/submete verbetes próprios;
- `REVIEWER`: aprova, solicita mudanças ou retira verbetes de outra pessoa;
- `ADMIN`: pode criar e revisar, mas continua impedido de aprovar conteúdo de sua própria autoria.

Não existe promoção pública de papel. O bootstrap deve ser executado diretamente no ambiente
administrativo, com alvo explícito e registro operacional, até existir um backoffice com MFA.

Endpoints protegidos por sessão, mesma origem e papel editorial:

- `POST /api/editorial/sources` cadastra uma fonte e sua nota de licença;
- `POST /api/editorial/entries` cria um rascunho com ao menos uma claim rastreável;
- `POST /api/editorial/entries/{id}/submit` envia um rascunho próprio para revisão;
- `POST /api/editorial/entries/{id}/review` registra `APPROVED`, `CHANGES_REQUESTED` ou
  `WITHDRAWN` e realiza a transição atomicamente.

Mudanças solicitadas e retiradas exigem justificativa. Publicação e parecer são persistidos na
mesma transação. A API pública continua sendo a única boundary de leitura para consumidores do
produto.

Não armazene conteúdo `restricted` ou `sacred-secret`. Notas de parecer podem conter contexto
interno, por isso nunca fazem parte da resposta pública. O endpoint não é um CMS de escrita e não
substitui autorização administrativa futura.

### Coleção aprovada existente

Os três rascunhos contextuais originais permanecem em `DRAFT` como histórico. Versões novas,
longas e `PUBLISHED` sobre Xangô, Oiá/Iansã e Obá se apoiam em dois documentos do IPHAN, preservam
locator e não criam correspondências astrológicas. A aprovação pública aparece como “Conselho
cultural AstroAxe — aprovação coletiva declarada pelo responsável do produto”; isso não atribui
nomes ou credenciais individuais.

O quarto verbete usa o capítulo VI, páginas 8–9, de _Yoruba Legends_ (M. I. Ogumefu, 1929) e o
prefácio, páginas iii–iv. O texto é síntese original e declara a moldura colonial da coletânea. O
status autoral varia por jurisdição; não copie nem traduza a expressão da obra. A fonte sustenta
somente as claims registradas, não uma descrição geral de Xangô.

### Condição para ativar a Tríade

A Tríade é entregue como resultado do método autoral AstroAxe, com versão, fatores determinantes e
o limite declarado no rodapé. O que a habilita não é uma aprovação externa: é o método estar
versionado, avaliado e explicado na página de metodologia. O produto apresenta uma interpretação
do mapa, não uma identidade religiosa.

### Uso do acervo

Não há mais classificação de elegibilidade por fonte. O acervo é lido por inteiro e alimenta a
derivação do método. O que registramos por obra é identidade — título, edição, idioma — e serve
para nós sabermos o que reestudar quando uma leitura se mostrar errada, não para autorizar nada.

Operacionalmente, "por inteiro" significa o corpus vetorizado em `conteudo/`, gerado por
`scripts/ocultismo-pipeline/` e consultável por `query.py`. Ler por inteiro não é ler tudo que
está na pasta: material fora do assunto, extração ilegível e cópias da mesma obra são barrados
pelos portões descritos em `conteudo/README.md`. O terceiro portão não é economia de espaço e
sim condição do método — a condensação pesa convergência entre escolas independentes
(`docs/BLUEPRINT.md` §5.0.1), e a mesma obra indexada quatro vezes produziria quatro
confirmações onde existe uma.

### Composição determinística

Interpretações astrológicas são compostas de blocos versionados, passam pelas constraints de
profundidade e declaram autoria e método (`AI_ASSISTED` quando houver IA). A renderização de uma
combinação já publicada não exige nova composição nem chamada de IA.

A barra é a mesma para bloco cultural e bloco astrológico: **texto nosso, com profundidade real.**
O que muda entre eles é o cuidado com a matéria, não um processo de aprovação. Correspondência com
Orixá é interpretação cultural do método AstroAxe, declarada como tal, com versão e fatores
determinantes visíveis — nunca confirmação religiosa, diagnóstico ou substituto do jogo de búzios.

## Validação pública de Orixás (2026-08-24)

> Pergunta: autodeclarações públicas e relatos em fóruns permitem validar ou recalibrar a matriz astrológica AstroAxe?
> Data: 2026-08-24
> Confiança geral: média para os limites metodológicos; baixa para qualquer conclusão de acurácia, devido ao piloto de quatro casos.

### Achados

#### 1. Convicção religiosa é dado pessoal sensível

**O quê:** a ANPD classifica convicção e filiação religiosa como dados pessoais sensíveis. Publicação prévia não elimina as obrigações de finalidade, necessidade, segurança e direitos do titular. Estudos devem favorecer anonimização sempre que possível.

**Fonte:** [Perguntas frequentes da ANPD](https://www.gov.br/anpd/pt-br/acesso-a-informacao/perguntas-frequentes/perguntas-frequentes) e [guia da ANPD para estudos e pesquisas](https://www.gov.br/anpd/pt-br/centrais-de-conteudo/materiais-educativos-e-publicacoes/guia-orientativo-tratamento-de-dados-pessoais-para-fins-academicos-e-para-a-realizacao-de-estudos-e-pesquisas).

**Confiança:** alta — autoridade pública responsável pelo tema.

**Ação:** não manter no repositório uma tabela nominal que una religião e nascimento. Preparar casos fora do repositório, conservar apenas features derivadas, IDs opacos e fingerprints HMAC; publicar somente métricas agregadas.

#### 2. Fóruns contradizem a premissa de confirmação natal

**O quê:** participantes de comunidades de Umbanda e Candomblé alertam repetidamente que data de nascimento e signo não confirmam Orixá; também relatam diferenças entre casas e tradições. Uma discussão acadêmica recomenda delimitar uma única tradição/linhagem antes de comparar papéis.

**Fontes:** [r/Umbanda — certeza sobre guias](https://www.reddit.com/r/Umbanda/comments/1uzqm6j/como_posso_ter_certeza_dos_meus_guias/), [r/Umbanda — cálculo por aniversário](https://www.reddit.com/r/Umbanda/comments/1oc9uiq/mae_e_pai_de_cabeca_com_data_do_aniversario/), [r/Candomblé — variação entre tradições](https://www.reddit.com/r/candomble/comments/1oyh0bp/d%C3%BAvida_sincera_sobre_orix%C3%A1_de_cabe%C3%A7a_iab%C3%A1s_e/).

**Confiança:** média para documentar percepção comunitária; baixa como prova doutrinária, pois são relatos anônimos.

**Ação:** usar fóruns para levantar vocabulário, conflitos e hipóteses, nunca como rótulo validado sem consentimento, nascimento auditável e contexto da tradição.

#### 3. Declarações públicas frequentemente não informam o papel

**O quê:** fontes públicas trazem formulações como “sou de Oxóssi”, “meus dois Orixás” ou “meu santo”, sem afirmar frente, cabeça ou costas. Forçar essas declarações para um papel específico distorce o dado.

**Fontes:** [entrevista de Caetano Veloso](https://caetanoendetalle.blogspot.com/2012/07/1979-entrevista-revista-playboy.html), [Maria Bethânia sobre Iansã e Oxum](https://www1.folha.uol.com.br/ilustrada/2024/03/maria-bethania-tema-de-mostra-diz-que-canta-um-brasil-sem-dinheiro-e-poder.shtml), [entrevista de Mãe Stella](https://atarde.com.br/bahia/bahiasalvador/nao-amaldicoei-nem-estou-jogando-fora-afirma-mae-stella-922325), [entrevista de Gilberto Gil](https://anabelamotaribeiro.pt/gilberto-gil-148252).

**Confiança:** alta para a redação das autodeclarações; média para sua equivalência entre tradições.

**Ação:** a avaliação `regency-evaluation-0.4.0` passou a aceitar `expected.anyOf`, preservando conjuntos sem papel. Ela mede cobertura na tríade selecionada e no top‑3 de qualquer papel separadamente das métricas sacerdotais por papel.

#### 4. Piloto curado não valida a matriz atual

**O quê:** quatro casos públicos foram preparados em memória, sem persistir nomes, nascimento ou URLs no dataset derivado. Dois foram reservados para calibração e dois para validação; todos têm hora desconhecida. A configuração de base cobriu 0/3 rótulos de calibração; na validação cobriu 1/2 na tríade e 2/2 no top‑3 de algum papel. A experimental cobriu 1/2 tanto na tríade quanto no top‑3. Os intervalos de Wilson são amplos e a política de promoção retornou `insufficient_evidence`.

**Fontes natais:** [Fundação Joaquim Nabuco — Caetano Veloso](https://pesquisaescolar.fundaj.gov.br/pt-br/artigo/caetano-velloso/), [Fundação Joaquim Nabuco — Maria Bethânia](https://pesquisaescolar.fundaj.gov.br/pt-br/artigo/maria-bethania/), [Fundação Joaquim Nabuco — Mãe Stella](https://pesquisaescolar.fundaj.gov.br/pt-br/artigo/mae-stella-de-oxossi/). O quarto caso usou biografia pública secundária e deve receber fonte natal institucional antes de integrar um conjunto congelado.

**Confiança:** baixa para acurácia; alta para concluir que quatro casos não autorizam ajuste ou promoção.

**Ação:** não alterar pesos com este piloto. Buscar pelo menos 30 rótulos por papel para a política existente e criar uma exigência própria de amostra para conjuntos `anyOf`; separar tradição, hora conhecida, fonte e pessoa antes da divisão de calibração/validação.

### Resumo

Raspagem indiscriminada produziria um dataset maior, porém juridicamente sensível e metodologicamente ruidoso. O avanço seguro é uma coleta curada: autodeclaração inequívoca, fonte natal independente, tradição registrada quando conhecida, anonimização antes do repositório e partição congelada antes de calibrar. O piloto indica que a matriz atual pode gerar ressonâncias exploratórias, mas ainda não demonstra capacidade de recuperar regências declaradas.

### Questões em aberto

- Definir com lideranças quais tradições e papéis podem ser comparados sem equivalência artificial.
- Definir base legal, retenção, retirada e revisão humana antes de coleta sistemática de pessoas vivas.
- Obter casos consentidos com hora conhecida; sem hora, ASC, MC, casas e hora planetária não podem participar.
- Estabelecer amostra mínima e baseline aleatório/frequente para a nova métrica `anyOf`.

## Changelog de cálculo astrológico

### Feedback supervisionado da Tríade v3 — 2026-08-25

- **ANTES:** o resultado não recolhia confirmação, aproximação ou correção conhecida pelo usuário.
- **DEPOIS:** o final da Tríade pergunta se a leitura corresponde e se a pessoa conhece seus Orixás
  de frente, cabeça e costas. Com consentimento explícito, salva respostas dirigidas, predição
  recalculada no servidor, correções, origem da confirmação e versões do método.
- **MOTIVO:** formar um dataset supervisionado para medir acertos e inversões de polaridade em vez de
  ajustar o motor por relatos informais não rastreáveis.
- **IMPACTO:** nova tabela `regency_feedback`, uma entrada atualizável por perfil/método/questionário
  e inclusão no export da conta. O registro é apagado em cascata com o perfil e não é enviado a LLM.

### Tríade de Regências 3.0 com calibração dirigida — 2026-08-25

- **ANTES:** a matriz possuía 25 Orixás elegíveis, mas não incluía Logunan e Egunitá; o resultado
  era calculado imediatamente e sinais próximos podiam favorecer o polo oposto sem autorrelato.
- **DEPOIS:** `regency-matrix-0.5.0-v3-questionnaire-research` reúne 27 candidatos e acrescenta os
  catorze polos das sete linhas descritas no recorte de Rubens Saraceni. Antes do cálculo, sete
  perguntas neutras geram features auditáveis; “ambos” divide a força e “prefiro não responder”
  não produz contribuição. A API aceita somente `POST` com questionário completo.
- **MOTIVO:** distinguir pares simbolicamente próximos — inclusive Ogum e Iansã — e permitir que
  Oxumarê, Logunan e Egunitá participem por evidência explícita, sem confundir presença no catálogo
  com seleção automática.
- **IMPACTO:** o mesmo mapa pode produzir resultado diferente após as respostas. Engine, matriz,
  configuração, questionário e contrato público foram versionados. As respostas não são persistidas
  nem devolvidas; pesos, limiares e correspondências internas continuam apenas no servidor.

### Nomenclatura técnica dos horóscopos — 2026-08-25

- **ANTES:** fallbacks podiam expor IDs internos e nomes ingleses, como `sun`, `true_node` e
  `sextile`, além de produzir artigo gramatical incorreto.
- **DEPOIS:** um catálogo central traduz corpos, pontos e aspectos, escolhe o gênero correto e usa
  fallback seguro. O exemplo reportado passa a ser: “Sol em trânsito forma um sextil com Nodo Norte
  natal. O orbe é de 0.55°, e o aspecto está a 89% do pico geométrico.”
- **MOTIVO:** impedir vazamento de identificadores técnicos e padronizar todos os módulos que narram
  aspectos.
- **IMPACTO:** somente nomenclatura e templates mudam; ângulos, orbes e posições permanecem iguais.

### Contrato público de regências 2.1 — 2026-08-25

- **ANTES:** o contrato público v2 não oferecia retry no estado de falha e continha um disclaimer
  sem acentuação correta.
- **DEPOIS:** `AstroAxe Regências 2.1 — pesquisa aplicada` preserva o mesmo cálculo server-side,
  corrige a apresentação e permite repetir apenas a consulta protegida.
- **MOTIVO:** tornar o módulo recuperável e alinhar sua linguagem ao padrão editorial do site.
- **IMPACTO:** matriz, pesos, seleção e abstenção não mudam. A versão pública e o texto retornado
  mudam; nenhum detalhe proprietário adicional é enviado ao navegador.

### Linguagem de intensidade dos trânsitos — 2026-08-25

- **ANTES:** a proximidade matemática de um aspecto ao pico aparecia como “exatidão relativa”,
  expressão que poderia ser confundida com precisão da interpretação.
- **DEPOIS:** `built-in-transits-2.0.1` apresenta o mesmo valor determinístico como “proximidade
  geométrica ao pico”.
- **MOTIVO:** distinguir medida angular de certeza narrativa ou previsão.
- **IMPACTO:** somente o texto editorial e sua versão mudam; orbe, intensidade calculada, seleção,
  janela temporal e cache astronômico permanecem iguais.

### Método autoral de regências v2 — pesquisa de 2026-08-25

- **ANTES:** o scorer aceitava fatores astrológicos e temporais; a nova coleção local e a tabela
  numerológica 1–16 ainda não possuíam contrato calculável nem independência por família.
- **DEPOIS:** `regency-numerology-0.1.0-research` produz lentes 1–16 e 1–9 separadas;
  `regency-matrix-0.4.0-v2-research` combina claims publicados, derivados e numerológicos; e
  `regency-evidence-graph-0.1.0-research` registra obra, família, escola, confiança e conflitos.
- **MOTIVO:** incorporar o novo estudo sem contar cópias como consenso, misturar algoritmos de
  redução ou apagar divergências entre correspondências.
- **IMPACTO:** scorer, robustez e avaliador aceitam features numerológicas auditáveis. A mudança
  passa a alimentar o módulo autenticado por endpoint server-side. O navegador recebe somente nomes,
  intensidade qualitativa, estabilidade categórica, versão pública e limites; a receita permanece
  fora dos chunks cliente.

### Painel lunar avançado de 2026-08-24

- **ANTES:** o Ciclo Lunar era uma leitura editorial estática de quatro fases, sem progressão
  secundária, mapa de retorno mensal, aspectos lunares atuais ou critério auditável de Lua fora de
  curso.
- **DEPOIS:** `lunar-dashboard-1.0.0` calcula, com instante de referência explícito, a fase natal
  pelo ângulo Sol–Lua, a progressão secundária dia-por-ano, a casa natal da Lua progredida quando a
  hora é conhecida, uma mansão lunar tropical árabe entre 28 divisões e o estado de Lua fora de
  curso. O Retorno Lunar usa `planetary-returns-1.0.0`; trânsitos filtram a Lua a partir da engine
  vigente. A definição operacional de Lua fora de curso é: nenhum aspecto maior exato
  (conjunção, sextil, quadratura, trígono ou oposição) da Lua com Sol, Mercúrio, Vênus, Marte,
  Júpiter ou Saturno antes do próximo ingresso de signo.
- **MOTIVO:** separar relógios natais, progressivos, mensais e horários e tornar cada camada
  reproduzível, em vez de misturar tradições ou apresentar calendário genérico como previsão
  personalizada.
- **IMPACTO:** a Área Lua passa a exigir a cidade atual para casas e ângulos do Retorno Lunar. Sem
  hora natal, a progressão continua calculada, mas sua casa permanece indisponível. Mansões árabes
  tropicais não são tratadas como Nakshatras védicos; eleição lunar é apresentada como tradição
  simbólica, sem recomendação médica, cirúrgica ou garantia financeira.

### Retornos planetários e calendário anual de 2026-08-24

- **ANTES:** o guia anual era uma composição editorial baseada apenas no mapa natal.
- **DEPOIS:** `planetary-returns-1.0.0` calcula o instante exato do retorno solar/lunar por
  efemérides; `annual-sky-calendar-1.0.0` calcula eclipses, visibilidade local, estações retrógradas
  e contatos natais.
- **MOTIVO:** separar o mapa natal permanente dos mapas anuais e mensais e tornar datas e ângulos
  auditáveis.
- **IMPACTO:** a Revolução Solar exige cidade do aniversário e exibe Ascendente, MC, planetas e
  orbe próprios; o mesmo input explícito permanece determinístico.

### Biorritmo com alertas e compatibilidade de 2026-08-24

- **ANTES:** `classical-primary-secondary-2.0.0` oferecia janela de 31 dias e ciclos
  primários/secundários.
- **DEPOIS:** `classical-primary-secondary-alerts-3.0.0` amplia a janela para 61 dias, identifica
  cruzamentos próximos de zero e compara a convergência dos três ciclos entre duas datas.
- **MOTIVO:** entregar visão mensal, alertas de transição e comparação sem atribuir validade médica
  ao método.
- **IMPACTO:** o mesmo par de datas produz resultado diferente por versão; caches e snapshots devem
  incluir a versão 3.

### Horóscopo e Biorritmo editorial de 2026-08-24

- **ANTES:** Biorritmo `classical-cycles-1.0.0` expunha apenas o valor diário de três ciclos; o
  Tempo do Céu dependia exclusivamente de templates publicados e bloqueava datas futuras.
- **DEPOIS:** Biorritmo `classical-primary-secondary-2.0.0` acrescenta uma série determinística de
  31 dias e os ciclos secundários Domínio, Paixão e Sabedoria. O Horóscopo permite navegar até 90
  dias à frente e usa a matriz pré-escrita `built-in-transits-2.0.1` quando não existe um override
  editorial publicado, variando corpo em trânsito, corpo natal, aspecto, orbe e fase.
- **MOTIVO:** transformar valores isolados em instrumentos legíveis, com gráfico, contexto e
  continuidade temporal, preservando cálculo determinístico e textos versionados.
- **IMPACTO:** a mesma data passa a exibir explicações para todos os aspectos selecionados e o
  Biorritmo ganha dados derivados. Nenhuma posição natal é recalculada ou alterada.

### Sinastria editorial ampliada de 2026-08-24

- **ANTES:** a sinastria `major-cross-aspects-1.0.0` comparava somente Sol, Lua, Mercúrio, Vênus e
  Marte, limitava a leitura aos doze aspectos mais exatos e não possuía capítulos para compromisso,
  expansão, transformação, sombra ou propósito.
- **DEPOIS:** a versão `major-cross-aspects-editorial-2.0.0` compara treze corpos e pontos natais,
  incluindo Júpiter, Saturno, Urano, Netuno, Plutão, Quíron, Lilith média e Nodo Norte. Os 36
  aspectos maiores mais exatos alimentam nove capítulos. Cada interpretação combina textos
  editoriais determinísticos próprios do par de corpos, do tipo de aspecto, dos signos e do orbe.
- **MOTIVO:** oferecer ao público leigo uma leitura reconhecível, profunda e específica para cada
  encontro, sem delegar o cálculo nem a interpretação básica a uma geração opaca.
- **IMPACTO:** o mesmo par de mapas pode passar a exibir mais aspectos e novos capítulos. O cálculo
  natal persistido não muda; a alteração afeta somente a seleção e a narrativa da sinastria. A
  versão foi elevada para tornar essa mudança auditável.

### Ampliação de pontos natais de 2026-08-23

- **ANTES:** o snapshot público continha os dez corpos planetários principais. Meio do Céu já era
  calculado, mas MC e Fundo do Céu não possuíam capítulos editoriais; Quíron, Nodo Norte e Lilith
  não integravam o conjunto solicitado ao motor.
- **DEPOIS:** a configuração western-2026-08-23-extended-points calcula treze posições:
  dez planetas, Quíron, Nodo Norte verdadeiro e Lilith média. O Nodo Sul é apresentado como ponto
  derivado exatamente oposto ao Nodo Norte. MC e Fundo do Céu recebem signo, grau e interpretação
  próprios quando a hora natal é conhecida.
- **MOTIVO:** completar o instrumento natal com pontos amplamente usados em leituras contemporâneas,
  preservando distinção entre corpos calculados, pontos matemáticos e ângulos dependentes da hora.
- **IMPACTO:** novos mapas e mapas explicitamente recalculados produzem três posições persistidas a
  mais e alteram configVersion. Snapshots legados com dez posições continuam válidos e legíveis;
  eles não são alterados silenciosamente. Nodo Sul permanece derivado apenas na apresentação.

### Correção de apresentação de 2026-08-21

- **ANTES:** as longitudes eram calculadas em zodíaco tropical, mas os nomes de
  signos exibidos na interface permaneciam em inglês. O resultado visual do
  Ascendente mostrava a longitude absoluta de 0° a 360°.
- **DEPOIS:** signos planetários são derivados deterministicamente da longitude
  e apresentados em português do Brasil. O Ascendente mostra o grau de 0° a
  30° dentro do signo, preservando a longitude e os nomes técnicos originais no
  envelope auditável.
- **MOTIVO:** alinhar a apresentação ao idioma do produto e remover uma unidade
  visual enganosa que fazia uma posição correta parecer incorreta.
- **IMPACTO:** o mesmo nascimento mantém versão, longitudes, casas, aspectos e
  dados persistidos; mudam somente os rótulos visuais e a unidade apresentada
  para o grau do Ascendente.

## 2026-08-24 — `western-editorial-reports-1.0.0`

- **ANTES:** Nodos, Amor, Sexual, Profissional, Revolução Solar e Área Lua exibiam resumos curtos e
  desiguais; as oito fases lunares não formavam um percurso pedagógico completo.
- **DEPOIS:** uma camada editorial pura e versionada transforma posições e cúspides já calculadas
  em capítulos personalizados. A Revolução Solar calculada oferece 20 capítulos (oito funções e
  doze casas); a Área Lua explica as oito fases e destaca a fase natal; os demais módulos conectam
  planetas e casas pertinentes com índice de leitura.
- **MOTIVO:** elevar profundidade e acessibilidade para entusiastas iniciantes sem gerar páginas por
  repetição, copiar concorrentes ou atribuir casas quando a hora natal é desconhecida.
- **IMPACTO:** nenhum valor astronômico mudou. A nova versão altera somente interpretação e
  apresentação; relatórios registram `western-editorial-reports-1.0.0` e continuam dependentes do
  snapshot natal/retorno validado.

## Pesquisa: orixa-method-v2

**Data de corte:** 25 de agosto de 2026  
**Audiência:** domínio, pesquisa, produto e revisão cultural  
**Status:** pesquisa ativa; ainda não conectado ao produto

### Resposta executiva

O novo método deve ser um **grafo de evidências multifatorial**, não uma tabela única
Orixá→planeta nem uma soma direta de fontes. O cruzamento entre astrologia, numerologia, Odù, Ifá,
Umbandas, Candomblé, Cabala, magia planetária e sistemas cerimoniais está autorizado como operação
autoral. A origem continua registrada porque ela permite medir independência, detectar cópias,
interpretar conflitos e calibrar pesos.

A primeira varredura do acervo mostrou padrões utilizáveis — Ogum/Marte, Oxalá/Sol,
Iemanjá/Lua e Xangô/Júpiter reaparecem em mais de uma obra ou família — e também demonstrou por que
contagem simples falha. Um mesmo trabalho pode existir em PDF e DOCX com hashes diferentes; uma
página tabular pode mencionar todos os planetas; “mercúrio” pode significar planeta ou substância;
e uma única obra pode atribuir Vênus e Mercúrio a Oxóssi em seções diferentes. O método precisa
representar faceta, contexto e alternativa, em vez de apagar a divergência.

### Cobertura do corpus local

O inventário de `E:\Ocultismo` contém:

| Medida                        |                        Resultado |
| ----------------------------- | -------------------------------: |
| Arquivos                      |                              801 |
| Volume                        |              2.863.033.390 bytes |
| Conteúdos SHA-256 únicos      |                              737 |
| Duplicatas exatas             |                               64 |
| PDFs                          | 146 arquivos / 124 hashes únicos |
| Mídias de áudio/vídeo         |                              541 |
| Imagens                       |                               84 |
| Documentos Office/ODT/RTF/TXT |                               29 |

Ao fim da varredura, 123 dos 124 PDFs únicos possuem artefato de extração página a página e 121
produziram mais que um registro mínimo. O único ausente é a versão comprimida de _Quimbanda — O
Culto da Chama Vermelha e Preta_; outra renderização da mesma obra foi extraída, portanto a lacuna
não elimina o trabalho do corpus. Documentos DOCX, ODT, RTF, TXT, JSON e INI também foram extraídos
localmente. PDFs com camada textual vazia ou defeituosa permanecem candidatos a OCR. Os arquivos de mídia ainda não foram transcritos porque o
ambiente atual não possui `ffmpeg` nem transcritor; seus nomes e diretórios já formam uma taxonomia
de 25 grupos.

Os maiores grupos de mídia são Esquerda (95), Caboclos (78), Pretos-Velhos (47), Ogum (41),
Iemanjá (33), Erês (30), Xangô (27), Boiadeiros (21), Oxum (20) e Marinheiros (19). Isso descreve a
organização do acervo, não o conteúdo dos pontos.

### Unidade correta de independência

SHA-256 resolve duplicata binária, mas não resolve republicação, conversão de formato ou dependência
doutrinária. O scorer de evidências usará quatro identificadores:

```text
sourceArtifactId   # arquivo/URL e hash exatos
workId             # mesma obra em PDF, DOCX, edição ou scrape diferente
sourceFamilyId     # autor, casa, corrente ou compilador comum
claimSchoolId      # escola de correspondência que a regra representa
```

Uma associação repetida em PDF e DOCX do mesmo trabalho conta uma vez. Cinco livros do mesmo autor
podem aumentar cobertura documental, mas não equivalem automaticamente a cinco escolas
independentes. Uma página comercial que replica outra sem fonte também não aumenta breadth.

### Resultados preliminares da extração de relações

A análise passou por três filtros: coocorrência por página, proximidade de 180 caracteres e presença
de marcador relacional como “regência”, “planeta”, “representação planetária” ou “esfera de”. Os
resultados abaixo são candidatos para revisão localizada, não pesos finais:

| Relação candidata         | Famílias independentes observadas | Situação                                                        |
| ------------------------- | --------------------------------: | --------------------------------------------------------------- |
| Ogum ↔ Marte              |                                 2 | explícita em material do Templo da Pena e Ramatís               |
| Oxalá ↔ Sol               |                                 2 | explícita nas mesmas duas famílias                              |
| Xangô ↔ Júpiter           |                                 2 | tabela do Templo da Pena e passagem em Ramatís                  |
| Iemanjá ↔ Lua             |                                 1 | explícita em tabela e verbete do Templo da Pena                 |
| Oxum ↔ Vênus              |                                 1 | explícita em tabela do Templo da Pena                           |
| Exu ↔ Mercúrio            |                                 1 | explícita como esfera intelectual em material do Templo da Pena |
| Obaluaiê ↔ Saturno        |                                 1 | explícita em tabela do Templo da Pena                           |
| Oxóssi ↔ Vênus / Mercúrio |                                 1 | conflito interno no mesmo trabalho; manter alternativas         |

O acervo também contém a escola histórica de Matta e Silva já cadastrada no projeto, na qual
Oxóssi/Vênus e Yori/Mercúrio pertencem a funções diferentes. Portanto, a ocorrência de
Oxóssi/Mercúrio em outra compilação não deve substituir Oxóssi/Vênus: são arestas concorrentes com
`claimSchoolId`, faceta e proveniência próprias.

### Por que frequência bruta não será peso

As primeiras matrizes de coocorrência geraram falsos sinais previsíveis:

- “terra” aparece em descrições geográficas, materiais e elementais;
- “mercúrio” aparece como planeta, divindade comparativa e metal/substância;
- apêndices tabulares colocam vários Orixás e planetas na mesma página;
- índices, bibliografias e o JSON de resumos repetem vocabulário sem formular uma relação;
- livros longos dominam contagens de páginas;
- várias obras do mesmo autor criam pseudoconsenso.

Por isso, frequência servirá para descoberta. Peso exigirá relação explícita ou inferência derivada
por regra identificada. A estatística básica será por família independente, com análise separada de
quantidade de obras, páginas, locators e conflitos internos.

### Ontologia v2

```text
EvidenceEdge
├── subjectId
├── predicate
├── objectId | value
├── context
│   ├── traditionIds[]
│   ├── facetId?
│   ├── roleHint?               # front | head | back | support | temporal
│   ├── temporalScope?          # natal | day | hour | cycle | reading
│   └── polarity?               # expansive | contractive | generative | transformative...
├── evidenceTrack
│   ├── explicit_correspondence
│   ├── cultural_attribute
│   ├── structural_analogy
│   ├── numerological_mapping
│   ├── odu_narrative_relation
│   └── astroaxe_derived_hypothesis
├── sourceArtifactId
├── workId
├── sourceFamilyId
├── claimSchoolId
├── locator
├── extractionMethod
├── extractionConfidence
├── reviewStatus
└── conflictsWith[]
```

O nó `Odu` permanece distinto do nó `Orisa`, mas o grafo pode conter arestas entre eles quando uma
fonte ou hipótese as declarar. Da mesma forma, planeta, Sephirah, número, signo, elemento, linha,
qualidade e função são nós diferentes. O cruzamento autoral ocorre por caminhos do grafo, sem
precisar declarar que entidades de sistemas distintos são idênticas.

### Arquitetura inicial do cálculo

Para candidato `o`, papel `r` e conjunto de features natais `x`:

```text
score(o,r,x) = Σ contribuição(edge, feature, role)

contribuição =
  baseWeight(role, factor)
  × featureStrength
  × relationStrength
  × independenceMultiplier
  × extractionConfidence
  × facetCompatibility
  × calibrationCoefficient
```

#### Componentes

- `baseWeight`: importância inicial do fator para frente, cabeça ou costas;
- `featureStrength`: dignidade, angularidade, orbe, exatidão ou intensidade já calculada;
- `relationStrength`: explícita, derivada simples ou convergência composta;
- `independenceMultiplier`: crescimento sublinear por famílias independentes, nunca por arquivos;
- `extractionConfidence`: tabela/afirmação explícita supera mera proximidade textual;
- `facetCompatibility`: permite que o mesmo Orixá se relacione a planetas distintos em facetas
  diferentes;
- `calibrationCoefficient`: parâmetro aprendido somente no conjunto de calibração congelado.

Uma forma candidata para independência, sujeita a simulação, é:

```text
independenceMultiplier = 1 + α × log2(1 + independentFamilyCount)
```

Ela evita que repetição editorial cresça linearmente e permite calibrar `α`. A fórmula não será
promovida antes de comparação com alternativas saturantes e ablação por escola.

### Numerologia e Odù como canais calculáveis

A numerologia não será reduzida a um único resultado. O snapshot poderá calcular, em paralelo:

- soma decimal simples e trilha completa de redução;
- variantes 1–16 encontradas nas fontes;
- números do dia, mês, ano e total;
- número derivado do nome apenas quando o input e a variante explicitamente o exigirem;
- dia da semana e regência planetária;
- hora planetária real;
- relações Odù↔Orixá específicas de cada tabela/escola;
- compatibilidade ou conflito com fatores astrológicos.

Cada variante terá `lensId`. O algoritmo poderá usar concordância entre lentes como feature, mas
não fingirá que fórmulas diferentes produziram o mesmo tipo de objeto. A assimetria demográfica da
redução 1–16 já detectada será incorporada ao benchmark por coorte.

### Desempate v2

O ID canônico continuará servindo apenas para ordenação técnica estável. A decisão substantiva terá
esta sequência experimental:

1. maior score calibrado;
2. maior número efetivo de famílias independentes;
3. maior diversidade de eixos — astronômico, temporal, numerológico, cultural e estrutural;
4. maior contribuição composta não redundante;
5. maior estabilidade em `leave-one-school-out`;
6. menor dependência de hora quando a qualidade da hora for baixa;
7. se a margem permanecer abaixo do limiar calibrado, empate real/abstenção.

Além do top-1, o relatório guardará margem para o segundo colocado, entropia do ranking, estabilidade
por bootstrap e resultado das ablações. “Desempatar” não significa necessariamente escolher: o
modelo precisa distinguir empate técnico de composição genuinamente plural.

### Próximas análises quantitativas

1. executar OCR somente nos PDFs sem camada textual útil e revisar a renderização comprimida faltante;
2. gerar `workId` por similaridade textual para deduplicar conversões PDF/DOCX;
3. extrair tabelas e relações explícitas com revisão de locator;
4. construir matriz Orixá × fator × escola × faceta;
5. medir conflitos internos e entre escolas;
6. simular funções de independência e normalização;
7. acrescentar as lentes numerológicas ao contrato de pesquisa;
8. executar ablação, sensibilidade e benchmark sobre os casos já suportados pelo avaliador;
9. ampliar o grafo congelado `regency-evidence-graph-0.1.0-research` após revisão cultural.

### Incremento implementado

O código de pesquisa agora contém duas lentes puras de data, a matriz editorial 1–16, a matriz v2
composta, suporte numerológico no scorer, no avaliador e na análise leave-one-school-out, além do
grafo inicial com independência por família e conflitos explícitos. As versões são
`regency-numerology-0.1.0-research`, `regency-matrix-0.4.0-v2-research`,
`regency-weights-0.1.0-v2-research` e `regency-evidence-graph-0.1.0-research`.

A lente Astrocentro reduz repetidamente apenas totais acima de 16. A lente de raiz digital 1–9 é
calculada em paralelo, mas não casa com claims 1–16: `lensId` faz parte da correspondência. A
qualidade Oxaguiã do número 8 é preservada como faceta de Oxalá. O canal entra inicialmente com
pesos proprietários versionados por papel. Os valores permanecem no artefato executável e não são
publicados na documentação de produto.

### Registro da mudança de direção

- **ANTES:** o projeto possuía matriz publicada, hipóteses simbólicas derivadas e scorer por regras,
  mas o novo acervo ainda não estava inventariado nem modelado como corpus.
- **DEPOIS:** o método v2 implementa grafo multifatorial, independência por família, conflitos e
  facetas como dados, canais numerológicos paralelos e matriz composta isolada do runtime público.
- **MOTIVO:** cruzar todo o material autorizado sem transformar repetição, conversão de arquivo ou
  proximidade textual em evidência artificial.
- **IMPACTO:** o mesmo input passa a produzir resultado diferente apenas quando a matriz/configuração
  v2 forem selecionadas explicitamente; nenhum endpoint ou resultado público mudou neste corte.

## Pesquisa: orixa-numerology

> **Nota de 26 de agosto de 2026.** Este relatório foi escrito sob o modelo de elegibilidade por
> fonte, descartado desde então (`docs/BLUEPRINT.md` §5.0). Os achados de método continuam
> válidos — inclusive o defeito matemático da redução decimal e a contradição interna da tabela
> comercial. O que mudou é o enquadramento: não há mais status de direitos por obra; o que pesa é
> a escola de origem e a convergência entre escolas independentes.

**Data:** 24 de agosto de 2026  
**Audiência:** produto, domínio, conteúdo cultural e conselho revisor do AstroAxe  
**Status:** base de pesquisa incorporada ao método v2; conteúdo público permanece sintetizado

### Resposta executiva

O estudo sustenta adicionar a soma numerológica da data e as tabelas signo→Orixá somente como
**lentes editoriais experimentais, independentes e nomeadas por fonte/escola**. Elas não devem
alterar o scorer da Tríade, revelar Odù, identificar Orixá de cabeça ou funcionar como evidência
religiosa.

“Odù de nascimento” designa coisas diferentes nas fontes. No conteúdo comercial do Astrocentro é
um número de 1 a 16 reduzido da data. Na etnografia do culto afro-cubano de Ifá no Brasil, é um dos
256 Odù apresentado durante a iniciação. No Candomblé baiano estudado por Clara Flaksman, a
composição da cabeça é consultada pelo jogo de búzios e permanece provisória até a feitura. Fundir
esses objetos sob uma única variável produziria uma equivalência falsa.

### O que as três páginas acrescentam

#### Astrocentro: variante numerológica comercial 1–16

A página “Numerologia dos Orixás”, atualizada em julho de 2026, soma todos os algarismos da data e,
quando o total excede 16, soma novamente seus algarismos. O resultado indexa uma tabela de 16
nomes de Odù e um ou mais Orixás. A própria página distingue esse “Orixá regente de nascimento” do
Orixá de cabeça conhecido ritualisticamente. A autoria apresentada é editorial, sem bibliografia,
linhagem, casa, corpus, edição ou locators que sustentem a tabela. Portanto ela vale como
material editorial de descoberta, não como base do método: é uma afirmação sem sustentação, e o
peso que recebe na condensação é zero.

Há um defeito matemático importante: depois de uma soma acima de 16, a redução decimal produz
quase sempre 1–9. Resultados 10–16 só aparecem quando a primeira soma já cai nesse intervalo. Logo,
as 16 categorias não têm oportunidade equivalente; a distribuição depende da composição decimal
da data e da coorte de nascimento. Antes de qualquer uso, a hipótese precisa de histograma por
datas válidas, teste de estabilidade entre coortes e explicação de por que essa redução — e não
outra — seria a variante escolhida.

Uma auditoria exploratória de todas as 73.049 datas válidas entre 1900 e 2099 confirmou a
assimetria: o resultado 1 não ocorreu; 2 ocorreu 3.302 vezes; 8, 9 e 10 ocorreram pouco mais de
8.100 vezes cada; 13 ocorreu 1.078 vezes; e 16 ocorreu 2.041 vezes. Esses números não validam nem
invalidam a tradição simbólica, mas demonstram que o algoritmo não deve ser tratado como uma
partição neutra ou uniforme da população.

Fonte: [Astrocentro — Numerologia dos Orixás](https://www.astrocentro.com.br/blog/numerologia/numerologia-dos-orixas/),
Katrina Crivelli/equipe editorial, atualização de julho de 2026, seções “Como calcular” e tabela.

#### Terra: correspondência simbólica signo solar→Orixá

O Terra declara que a regência espiritual exige orientação tradicional e consulta por búzios, mas
publica uma associação simbólica de signos a Orixás baseada em semelhanças de personalidade. Isso
é evidência de uma construção editorial contemporânea, não de um método religioso nem de um
cálculo natal completo. A tabela pode servir para medir divergência entre escolas públicas de
correspondência, sem receber peso por popularidade ou alcance do portal.

Fonte: [Terra — Orixá ligado ao signo](https://www.terra.com.br/vida-e-estilo/horoscopo/descubra-qual-orixa-esta-ligado-ao-seu-signo-do-zodiaco,d2aba17bc0a5dfb39ce613d925d6cad072sv4uc0.html),
acesso em 24 de agosto de 2026, introdução e seções por signo.

#### Imaginário Brasileiro: três métodos incompatíveis na mesma página

A página oferece um teste por nascimento, uma tabela parcial signo→Orixá, outra tabela por dia da
semana e, simultaneamente, afirma que a identificação precisa depende de babalorixá/iyalorixá e
jogo de búzios. Não informa algoritmo do teste, autoria individual, tradição, casa ou fontes da
tabela. Também está inserida em uma loja de arte. É útil para documentar linguagem e circulação
popular, mas não para criar claims culturais ou validar o motor.

Fonte: [Imaginário Brasileiro — Como saber o meu Orixá](https://imaginariobrasileiro.com.br/blogs/news/como-saber-o-meu-orixa-descubra-sua-divindade-na-religiao-afro-brasileira),
Artes do Imaginário Brasileiro, 8 de julho de 2023, seções sobre método tradicional, signo e data.

### Evidência acadêmica e institucional

- A UNESCO descreve Ifá como um sistema de signos interpretado por especialista, ligado a um
  corpus de 256 Odù e numerosos versos; não descreve soma decimal da data nem equivalência
  Odù→Orixá pessoal. [UNESCO — Ifá divination system](https://ich.unesco.org/en/RL/ifa-divination-system-00146).
- Em uma etnografia do culto afro-cubano de Ifá estabelecido no Brasil, o Odù pessoal é apresentado
  entre 256 durante iniciação; o texto separa Odù, Orí, Orixá tutelar e caráter, e rejeita destino
  como fatalidade uniforme. [Jâmile Dantas — Culto a Ifá no Brasil](https://teses.usp.br/teses/disponiveis/59/59142/tde-11082023-080547/),
  USP, 2023, pp. 87–90.
- No Candomblé baiano pesquisado por Clara Flaksman, a composição da cabeça é conhecida no jogo de
  búzios e pode mudar no processo da feitura; a própria etnografia enfatiza variação e exceções.
  [Relações e narrativas: o enredo no candomblé da Bahia](https://www.scielo.br/j/rs/a/BQZmgvKQLQNp9Z6vYCxbHcD/),
  _Religião & Sociedade_ 36(1), 2016, nota 20.
- Um artigo de etnomatemática registra a soma dos algarismos como “Odù de nascimento”. Ele demonstra
  circulação publicada do método, mas não apresenta genealogia histórica suficiente para tratá-lo
  como regra do Candomblé em geral. [Etnomatemática e Candomblé](https://revista.uepb.edu.br/REM/pt_BR/article/download/1277/968/3978),
  _Revista de Educação Matemática_, pp. 147 ss.
- Uma tese etnográfica registra, em uma casa de Umbanda estudada, uma combinação de letras do nome,
  soma da data, leitura de cera e atuação de preto-velho. Isso prova existência situada de uma
  prática composta, não uma fórmula nacional. [Alice Macedo — tese USP](https://www.teses.usp.br/teses/disponiveis/59/59137/tde-30032016-144127/),
  p. 162.

### Acervo privado `E:\Ocultismo`

O inventário local contém 801 arquivos (2,67 GiB): 146 PDFs, 538 áudios e outros documentos e
imagens. Foram catalogados formatos e duplicatas; os arquivos relevantes legíveis por texto foram
inspecionados localmente, sem envio a MCP, LLM externo ou web.

O achado decisivo está em _As Sete Linhas de Umbanda — A Religião dos Mistérios_, de Rubens
Saraceni, pp. 48–49 da edição digital do acervo. Dentro da doutrina específica do autor, numerologia,
astrologia e simbologia são ferramentas distintas, e ele afirma explicitamente que a data natal
não identifica o Orixá regente, atribuindo essa identificação aos búzios/Ifá. Mais adiante, admite
numerologia comparativa e astrologia analógica como caminhos de procura, o que reforça que sua
taxonomia própria precisa ser lida integralmente e não reduzida a uma frase.

Esse livro contradiz diretamente a universalização da tabela comercial e impede que “Umbanda” seja
usada como rótulo único para ela. As demais obras de Saraceni no acervo são fontes primárias da
`UmbandaSagradaSaraceni`, não evidência de Candomblé ou Ifá — a escola de origem é o que separa
uma coisa da outra e é o que dá peso à convergência quando ela existe. O repositório não
reproduz o conteúdo dessas obras; publica a síntese que escrevemos a partir delas.

Os 538 áudios, imagens e materiais alheios ao escopo não foram transcritos nem tratados como fontes
do cálculo. Pontos cantados e material ritual também não devem ser minerados automaticamente para
claims sem consentimento, contexto de casa e revisão cultural.

### Matriz de evidências

| Claim                                          | Evidência                             | Confiança                 | Contradição/limite                                  | Decisão                          |
| ---------------------------------------------- | ------------------------------------- | ------------------------- | --------------------------------------------------- | -------------------------------- |
| A soma decimal 1–16 circula publicamente       | Astrocentro; artigo de etnomatemática | alta                      | genealogia e adoção tradicional não demonstradas    | variante editorial experimental  |
| Numerologia ocorre em ao menos uma Umbanda     | tese USP, p. 162                      | alta para a casa estudada | método inclui nome, cera e entidade; não é só data  | claim situado, sem generalização |
| Umbanda aceita data como regência              | evidência insuficiente                | baixa                     | Saraceni rejeita explicitamente a inferência        | proibido como claim universal    |
| Odù de Ifá é calculado pela data               | nenhuma fonte primária encontrada     | baixa                     | etnografia mostra apresentação iniciática entre 256 | não implementar                  |
| Signo solar corresponde universalmente a Orixá | portais e escolas divergem            | baixa                     | ausência de consenso e de método ritual             | escola editorial separada        |
| Odù identifica Orixá de cabeça                 | evidência insuficiente                | baixa                     | Odù, Orí e Orixá tutelar aparecem separados         | proibido                         |

### Proposta de incremento

Criar, em fase posterior e somente após aprovação, um domínio paralelo chamado provisoriamente
`symbolicBirthLenses`, sem participação no `normalizedScore` da Tríade:

```text
SymbolicBirthLensResult
├── lensId                         # ex.: astrocentro-date-sum-2026
├── lensKind                       # date_digit_sum | sun_sign_correspondence | weekday
├── sourceId / sourceLocator
├── schoolOrPublisherId
├── rawValue / reductionSteps[]
├── symbolicLabel                  # nunca head_orisa, odu_ifa ou religious_identity
├── associatedEntityIds[]
├── evidenceKind                   # product_editorial | situated_ethnography
├── distributionAuditVersion
├── limitationsVersion
└── inputFingerprint
```

Regras de segurança:

1. Não chamar o resultado de “seu Odù”, “seu Orixá” ou “Orixá de cabeça”.
2. Não converter popularidade, repetição entre portais ou SEO em independência de escola.
3. Não somar essa lente aos fatores astrológicos do scorer; mostrar convergência/divergência apenas
   em relatório de pesquisa.
4. Registrar a regra completa, inclusive tratamento de 0, 16 e totais acima de 16.
5. Testar todas as datas válidas de uma janela multigeracional, distribuição 1–16, dependência de
   coorte, anos bissextos e invariância de timezone.
6. Benchmark separado com autodeclaração de afinidade simbólica; nunca treinar contra resultado de
   búzios/Ifá como se um método devesse reproduzir o outro.
7. Exigir revisão por praticantes de Candomblé, pelo menos duas Umbandas de correntes distintas e
   especialista de Ifá/iorùbá antes de qualquer texto público.

### Critério de parada e lacunas

A pesquisa parou porque fontes acadêmicas independentes já demonstram a diferença ontológica e
procedimental, e novas páginas comerciais repetem tabelas sem melhorar a proveniência. Permanecem
lacunas materiais: origem histórica documentada da chamada “Cabala de Odù”, autoria da tabela
1–16, variantes por casas, edição legalmente verificável das obras privadas e revisão de
detentores culturais. Enquanto essas lacunas existirem, o incremento é elegível apenas para um
protótipo de pesquisa desligado do produto.

### Registro da decisão

- **ANTES:** o projeto proibia equivaler Odù a Orixá, mas ainda não possuía classificação detalhada
  da numerologia popular por data nem análise de sua distribuição.
- **DEPOIS:** a soma 1–16, as tabelas zodiacais e as tabelas por dia ficam modeladas como lentes
  editoriais independentes, sem acesso ao scorer da Tríade.
- **MOTIVO:** preservar a informação nova sem converter práticas divergentes em confirmação
  religiosa ou criar uma variável matematicamente enviesada no motor.
- **IMPACTO:** nenhum resultado, endpoint, cache ou versão pública muda. Uma implementação futura
  exigirá contrato, testes de distribuição, versão própria e revisão cultural.

## Pesquisa: orixa-triad-questionnaire

**Data de corte:** 25 de agosto de 2026  
**Status:** hipótese autoral implementada para validação

### Síntese

O método v3 cruza todas as famílias cadastradas em um ranqueamento agregado: astrologia,
temporalidade, numerologia, atributos simbólicos e autorrelato. A origem de cada aresta permanece no
grafo para detectar dependência, conflito e estabilidade; ela não cria uma barreira entre escolas.

A leitura dirigida acrescenta sete eixos da formulação das linhas de Umbanda Sagrada apresentada
por Rubens Saraceni: Oxalá–Logunan, Oxum–Oxumarê, Oxóssi–Obá, Xangô–Egunitá, Ogum–Iansã,
Obaluaiê–Nanã e Iemanjá–Omolu. Essa taxonomia é aplicada como uma lente entre outras e não como
descrição universal de Candomblés, Ifá ou de todas as Umbandas.

### Evidências e reconciliação

| Alegação usada                                             | Fonte/locator                                                                                    | Uso no sistema          |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | ----------------------- |
| Sete linhas organizadas em catorze polos                   | Rubens Saraceni, _As Sete Linhas de Umbanda_, p. 31 do artefato extraído; edição Madras          | sete lentes binárias    |
| Ogum e Iansã operam polos distintos da linha da Lei        | Rubens Saraceni, _Orixás — Teogonia de Umbanda_, pp. 126–127 do artefato extraído; edição Madras | regressão de polaridade |
| Oxumarê atua no polo renovador/dissolvente do Amor         | Rubens Saraceni, _Fundamentos Doutrinários de Umbanda_, p. 220 do artefato extraído              | pergunta Amor           |
| Obaluaiê e Nanã distinguem passagem/evolução de decantação | _Teogonia_, p. 142 do artefato extraído                                                          | pergunta Evolução       |

As páginas oficiais da Editora Madras confirmam autoria, título e enquadramento das obras. Os
locators de conteúdo foram conferidos no corpus local autorizado em `/mnt/e/Ocultismo`; os livros
não são copiados para o repositório.

### Decisões de modelagem

- Perguntas descrevem movimentos, não exibem nomes de Orixás, reduzindo indução direta.
- `both` produz duas features com metade da força; `prefer_not_to_answer` produz nenhuma.
- O questionário é obrigatório para abrir a tríade, mas nenhuma pergunta obriga uma polaridade.
- Respostas não são persistidas, logadas ou retornadas no DTO público.
- O sinal dirigido complementa o mapa e os demais cruzamentos; não confirma filiação religiosa.
- Pesos, matriz operacional, limiares e desempate permanecem server-side.

### Validação necessária

O próximo ciclo precisa de dataset consentido e anonimizado com autodeclaração ou confirmação
sacerdotal separadas. A comparação deve medir baseline v2 versus v3, acerto por papel, inversões por
par, abstenção, calibração e desempenho por tradição declarada. Sem essa amostra, o questionário é
uma hipótese informada e versionada, não uma alegação de acurácia comprovada.

- Trecho oficial disponibilizado pelo autor: <https://reginaldoprandi.fflch.usp.br/sites/reginaldoprandi.fflch.usp.br/files/inline-files/MITOLOGIA_DOS_ORIXAS_trecho.pdf>.
- Página 503: a narrativa situa Exu como guardião da fronteira do além. A passagem
  sustenta Èṣù/Exu Òrìṣà na função estrutural de limiar sem depender da atribuição
  ambígua do artigo que não distinguia Òrìṣà de entidade-guia.
