# Método de ressonância simbólica e taxonomia cultural

## Propósito e limite do método

O AstroAxe cruza dados produzidos pelo motor astrológico ocidental com um
conjunto versionado de narrativas e correspondências culturais. O resultado é
uma **ressonância simbólica autoral e probabilística**. Ele não determina,
confirma nem substitui:

- Orixá de cabeça, juntó, adjuntó, Orixá de corpo ou de passagem;
- Odù individual ou destino revelado por Ifá/Fá ou pelo jogo de búzios;
- vínculo com Vodum, Nkisi/Inquice, guia ou entidade;
- consulta oracular, desenvolvimento mediúnico, iniciação ou orientação de uma
  liderança religiosa.

Não há base acadêmica ou institucional para tratar signo solar, Lua,
Ascendente, casas, planetas, aspectos ou dia da semana como método religioso de
identificação dessas relações. A astrologia é a linguagem de entrada do produto;
as tradições afro-diaspóricas são fontes culturais contextualizadas, e não
rótulos a serem previstos.

Toda interface que apresentar o resultado deve usar os termos **ressonância**,
**afinidade narrativa** ou **leitura simbólica AstroAxe**. Os termos
**determinação**, **confirmação**, **Orixá de cabeça** e equivalentes ficam
reservados à descrição histórica ou religiosa, acompanhados de proveniência.

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

## Método probabilístico autoral

O cálculo recebe apenas dados astrológicos validados e determinísticos. A
camada cultural fornece temas narrativos explicitamente liberados para uso
editorial. Cada versão do método deve declarar:

1. features astrológicas usadas e suas unidades;
2. pesos, normalização e regra de desempate;
3. conjunto exato de claims culturais elegíveis;
4. versões do motor astrológico, configuração e base de conhecimento;
5. textos de transparência exibidos ao usuário.

A saída recomendada é uma distribuição de afinidades, não uma classificação
religiosa:

```text
SymbolicResonanceResult
├── candidates[]
│   ├── symbolicFigureId
│   ├── normalizedScore        # 0..1
│   ├── rank
│   ├── astrologicalIndicators[]
│   └── publicClaimIds[]
├── methodVersion
├── astrologyEngineVersion
├── astrologyConfigVersion
├── knowledgeVersion
├── inputFingerprint
└── limitationsVersion
```

O score significa apenas força relativa dentro daquela execução. Não é
probabilidade de alguém “ser filho” de uma divindade e não deve receber rótulos
como confiança religiosa alta, média ou baixa.

O resultado deve ser determinístico: mesmo snapshot, versões e base de claims
produzem a mesma saída. Mudanças de peso, regra, claims ou texto interpretativo
exigem nova versão e registro `ANTES / DEPOIS / MOTIVO / IMPACTO`.

## Limites éticos e validação

- Não treinar classificador de “Orixá verdadeiro” com questionários de pessoas
  iniciadas. Além do viés de seleção e das diferenças entre casas, isso converte
  relações religiosas sensíveis em alvo inferencial sem validade demonstrada.
- Não usar relatos de usuários como ground truth automático. Consentimento para
  uso do produto não equivale a consentimento para pesquisa ou treinamento.
- Não inferir religião, iniciação, terreiro, Odù ou entidade pessoal a partir de
  dados de nascimento.
- Não ranquear uma tradição como mais autêntica. Fontes acadêmicas descrevem;
  comunidades e autoridades religiosas são detentoras das práticas.
- Não publicar segredos, prescrições, oferendas ou ritos iniciáticos. O grafo
  deve permitir registrar que algo existe sem armazenar seu conteúdo.
- Não transformar arquétipos em diagnóstico médico, psicológico, moral ou de
  personalidade. Narrativas devem evitar fatalismo e linguagem de autoridade.
- Submeter taxonomia, glossário, textos públicos e correspondências a revisão
  remunerada por representantes de mais de uma linhagem relevante.

Validação de produto mede determinismo, rastreabilidade, clareza, respeito,
compreensão do aviso e ausência de claims indevidas. Ela não mede “acerto” em
adivinhar vínculos religiosos.

## Texto mínimo para a interface

> Esta é uma leitura simbólica autoral do AstroAxe baseada no seu mapa
> astrológico. Ela não identifica Orixá de cabeça, Odù, Vodum, Nkisi, guia ou
> vínculo iniciático. Nas tradições que os reconhecem, esses vínculos pertencem
> a processos próprios de consulta, cuidado e iniciação, conduzidos por suas
> comunidades e autoridades religiosas.
