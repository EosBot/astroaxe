# Método autoral AstroAxe v2 — corpus, evidências e arquitetura de cálculo

**Data de corte:** 25 de agosto de 2026  
**Audiência:** domínio, pesquisa, produto e revisão cultural  
**Status:** pesquisa ativa; ainda não conectado ao produto

## Resposta executiva

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

## Cobertura do corpus local

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

## Unidade correta de independência

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

## Resultados preliminares da extração de relações

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

## Por que frequência bruta não será peso

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

## Ontologia v2

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

## Arquitetura inicial do cálculo

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

### Componentes

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

## Numerologia e Odù como canais calculáveis

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

## Desempate v2

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

## Próximas análises quantitativas

1. executar OCR somente nos PDFs sem camada textual útil e revisar a renderização comprimida faltante;
2. gerar `workId` por similaridade textual para deduplicar conversões PDF/DOCX;
3. extrair tabelas e relações explícitas com revisão de locator;
4. construir matriz Orixá × fator × escola × faceta;
5. medir conflitos internos e entre escolas;
6. simular funções de independência e normalização;
7. acrescentar as lentes numerológicas ao contrato de pesquisa;
8. executar ablação, sensibilidade e benchmark sobre os casos já suportados pelo avaliador;
9. ampliar o grafo congelado `regency-evidence-graph-0.1.0-research` após revisão cultural.

## Incremento implementado

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

## Registro da mudança de direção

- **ANTES:** o projeto possuía matriz publicada, hipóteses simbólicas derivadas e scorer por regras,
  mas o novo acervo ainda não estava inventariado nem modelado como corpus.
- **DEPOIS:** o método v2 implementa grafo multifatorial, independência por família, conflitos e
  facetas como dados, canais numerológicos paralelos e matriz composta isolada do runtime público.
- **MOTIVO:** cruzar todo o material autorizado sem transformar repetição, conversão de arquivo ou
  proximidade textual em evidência artificial.
- **IMPACTO:** o mesmo input passa a produzir resultado diferente apenas quando a matriz/configuração
  v2 forem selecionadas explicitamente; nenhum endpoint ou resultado público mudou neste corte.
