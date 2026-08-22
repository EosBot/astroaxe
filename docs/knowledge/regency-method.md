# Método de regências AstroAxe e taxonomia cultural

## Propósito e limite do método

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

## Categorias que não podem ser fundidas

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

## Tradições e relações pessoais

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

## Claims de conhecimento e proveniência

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

## Método calculado e autoral

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

### Scorer de pesquisa 0.2.0

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

### Geração de correspondências 0.2.0

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

### Matriz derivada experimental 0.2.0

Os 106 candidatos podem ser materializados em uma matriz exclusivamente experimental. Claims
publicados conservam multiplicador `1`; claims derivados recebem a `convergenceStrength` registrada
pela cadeia de atributos. Cada contribuição expõe `evidenceTrack` e `evidenceMultiplier`, permitindo
reconstruir por que um valor entrou no score.

Elementos e modalidades dos quatro ângulos passam a integrar o snapshot de features. A configuração
experimental acrescenta lentes de elemento, modalidade e casa para frente, cabeça e costas. Esses
pesos continuam hipóteses de calibração e não alteram a configuração pública/baseline.

O comando abaixo avalia baseline e experimental sobre exatamente as mesmas partições:

```bash
npm run regency:evaluate-derived -- caminho/seguro/dataset.json
```

`ANTES`: o benchmark aceitava apenas a matriz publicada incompleta, e as hipóteses geradas não podiam
ser pontuadas.

`DEPOIS`: a matriz `regency-matrix-0.2.0-derived-research` e a configuração
`regency-weights-0.4.0-derived-research` podem ser comparadas lado a lado com o baseline, usando o
scorer `regency-scorer-0.5.0-research`.

`MOTIVO`: medir se a geração amplia cobertura e acurácia antes de promover qualquer correspondência
ao produto.

`IMPACTO`: nenhum endpoint ou resultado público passa a usar a matriz experimental. A promoção
permanece condicionada a revisão cultural, conjunto de validação congelado e ganho mensurável por
papel sem aumento indevido de falsas atribuições.

### Avaliação e calibração 0.1.0

O avaliador recebe somente ID opaco, partição previamente fixada, proveniência categórica, qualidade
da hora, features derivadas validadas e a tríade de referência. Nome, email, data, hora, cidade,
coordenadas e snapshot natal não pertencem ao artefato analítico. A execução reporta acurácia por
papel, acurácia da tríade exata e matriz de confusão, sempre com versão do dataset, configuração e
avaliador. Uma partição vazia é erro, e casos de calibração não entram nas métricas de validação.

### Avaliação e calibração 0.3.0

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
resultados públicos permanecem inalterados. Métricas reais continuam indisponíveis até a entrada de
casos elegíveis, consentidos ou publicamente verificáveis, em armazenamento restrito.

### Congelamento e decisão comparativa 0.1.0

O benchmark experimental agora produz um manifesto sanitizado com versão, SHA-256 canônico do
dataset, total de casos e contagens agregadas por partição e proveniência. A ordem dos casos não muda
o fingerprint; qualquer mudança de conteúdo, rótulo ou feature muda o digest. O manifesto não contém
nomes, URLs, locators, nascimento, localização nem IDs individuais.

A política `regency-promotion-policy-0.1.0-research` exige pelo menos 30 rótulos de validação para
frente e 30 para cabeça. Em cada papel obrigatório, a matriz experimental não pode reduzir top-1 nem
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

`IMPACTO`: o comando `regency:evaluate-derived` ganha manifesto e parecer técnico. Nenhum resultado
público muda e nenhuma aprovação cultural é automatizada.

## Calibração, validação e limites

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

## Texto mínimo para a interface

> Método autoral AstroAxe; consulte a metodologia.
