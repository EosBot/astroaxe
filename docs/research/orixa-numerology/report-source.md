# Numerologia, Odù, Ifá e correspondências com Orixás

**Data:** 24 de agosto de 2026  
**Audiência:** produto, domínio, conteúdo cultural e conselho revisor do AstroAxe  
**Status:** base de pesquisa incorporada ao método v2; conteúdo público permanece sintetizado

## Resposta executiva

O estudo sustenta adicionar a soma numerológica da data e as tabelas signo→Orixá somente como
**lentes editoriais experimentais, independentes e nomeadas por fonte/escola**. Elas não devem
alterar o scorer da Tríade, revelar Odù, identificar Orixá de cabeça ou funcionar como evidência
religiosa.

“Odù de nascimento” designa coisas diferentes nas fontes. No conteúdo comercial do Astrocentro é
um número de 1 a 16 reduzido da data. Na etnografia do culto afro-cubano de Ifá no Brasil, é um dos
256 Odù apresentado durante a iniciação. No Candomblé baiano estudado por Clara Flaksman, a
composição da cabeça é consultada pelo jogo de búzios e permanece provisória até a feitura. Fundir
esses objetos sob uma única variável produziria uma equivalência falsa.

## O que as três páginas acrescentam

### Astrocentro: variante numerológica comercial 1–16

A página “Numerologia dos Orixás”, atualizada em julho de 2026, soma todos os algarismos da data e,
quando o total excede 16, soma novamente seus algarismos. O resultado indexa uma tabela de 16
nomes de Odù e um ou mais Orixás. A própria página distingue esse “Orixá regente de nascimento” do
Orixá de cabeça conhecido ritualisticamente. A autoria apresentada é editorial, sem bibliografia,
linhagem, casa, corpus, edição ou locators que sustentem a tabela. Portanto, seu status adequado é
`product-editorial` e `discovery_only`, nunca `CLAIM_ELIGIBLE`.

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

### Terra: correspondência simbólica signo solar→Orixá

O Terra declara que a regência espiritual exige orientação tradicional e consulta por búzios, mas
publica uma associação simbólica de signos a Orixás baseada em semelhanças de personalidade. Isso
é evidência de uma construção editorial contemporânea, não de um método religioso nem de um
cálculo natal completo. A tabela pode servir para medir divergência entre escolas públicas de
correspondência, sem receber peso por popularidade ou alcance do portal.

Fonte: [Terra — Orixá ligado ao signo](https://www.terra.com.br/vida-e-estilo/horoscopo/descubra-qual-orixa-esta-ligado-ao-seu-signo-do-zodiaco,d2aba17bc0a5dfb39ce613d925d6cad072sv4uc0.html),
acesso em 24 de agosto de 2026, introdução e seções por signo.

### Imaginário Brasileiro: três métodos incompatíveis na mesma página

A página oferece um teste por nascimento, uma tabela parcial signo→Orixá, outra tabela por dia da
semana e, simultaneamente, afirma que a identificação precisa depende de babalorixá/iyalorixá e
jogo de búzios. Não informa algoritmo do teste, autoria individual, tradição, casa ou fontes da
tabela. Também está inserida em uma loja de arte. É útil para documentar linguagem e circulação
popular, mas não para criar claims culturais ou validar o motor.

Fonte: [Imaginário Brasileiro — Como saber o meu Orixá](https://imaginariobrasileiro.com.br/blogs/news/como-saber-o-meu-orixa-descubra-sua-divindade-na-religiao-afro-brasileira),
Artes do Imaginário Brasileiro, 8 de julho de 2023, seções sobre método tradicional, signo e data.

## Evidência acadêmica e institucional

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

## Acervo privado `E:\Ocultismo`

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
`UmbandaSagradaSaraceni`, não evidência de Candomblé ou Ifá. Cópias sem cadeia legal/editorial
verificável permanecem `REFERENCE_ONLY`; o repositório não reproduzirá seu conteúdo.

Os 538 áudios, imagens e materiais alheios ao escopo não foram transcritos nem tratados como fontes
do cálculo. Pontos cantados e material ritual também não devem ser minerados automaticamente para
claims sem consentimento, contexto de casa e revisão cultural.

## Matriz de evidências

| Claim                                          | Evidência                             | Confiança                 | Contradição/limite                                  | Decisão                          |
| ---------------------------------------------- | ------------------------------------- | ------------------------- | --------------------------------------------------- | -------------------------------- |
| A soma decimal 1–16 circula publicamente       | Astrocentro; artigo de etnomatemática | alta                      | genealogia e adoção tradicional não demonstradas    | variante editorial experimental  |
| Numerologia ocorre em ao menos uma Umbanda     | tese USP, p. 162                      | alta para a casa estudada | método inclui nome, cera e entidade; não é só data  | claim situado, sem generalização |
| Umbanda aceita data como regência              | evidência insuficiente                | baixa                     | Saraceni rejeita explicitamente a inferência        | proibido como claim universal    |
| Odù de Ifá é calculado pela data               | nenhuma fonte primária encontrada     | baixa                     | etnografia mostra apresentação iniciática entre 256 | não implementar                  |
| Signo solar corresponde universalmente a Orixá | portais e escolas divergem            | baixa                     | ausência de consenso e de método ritual             | escola editorial separada        |
| Odù identifica Orixá de cabeça                 | evidência insuficiente                | baixa                     | Odù, Orí e Orixá tutelar aparecem separados         | proibido                         |

## Proposta de incremento

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

## Critério de parada e lacunas

A pesquisa parou porque fontes acadêmicas independentes já demonstram a diferença ontológica e
procedimental, e novas páginas comerciais repetem tabelas sem melhorar a proveniência. Permanecem
lacunas materiais: origem histórica documentada da chamada “Cabala de Odù”, autoria da tabela
1–16, variantes por casas, edição legalmente verificável das obras privadas e revisão de
detentores culturais. Enquanto essas lacunas existirem, o incremento é elegível apenas para um
protótipo de pesquisa desligado do produto.

## Registro da decisão

- **ANTES:** o projeto proibia equivaler Odù a Orixá, mas ainda não possuía classificação detalhada
  da numerologia popular por data nem análise de sua distribuição.
- **DEPOIS:** a soma 1–16, as tabelas zodiacais e as tabelas por dia ficam modeladas como lentes
  editoriais independentes, sem acesso ao scorer da Tríade.
- **MOTIVO:** preservar a informação nova sem converter práticas divergentes em confirmação
  religiosa ou criar uma variável matematicamente enviesada no motor.
- **IMPACTO:** nenhum resultado, endpoint, cache ou versão pública muda. Uma implementação futura
  exigirá contrato, testes de distribuição, versão própria e revisão cultural.
