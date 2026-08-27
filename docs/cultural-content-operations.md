# Operação do corpus cultural

## Estado atual

O banco e a API pública suportam conteúdo cultural versionado, com autoria e histórico. O corpus
público contém quatro textos escritos pelo projeto. Novos verbetes não são criados
automaticamente: alguém escreve cada um.

`GET /api/cultural-content` lista as versões públicas mais recentes. A página
`/acervo-cultural` apresenta os textos integrais e sua proveniência.
`GET /api/cultural-content/{slug}` retorna somente a versão publicada mais recente cuja data de
publicação já chegou. Rascunhos, pareceres internos, conteúdo retirado e claims retiradas ou
depreciadas não são expostos.

## Fluxo de autoria — atualizado em 26 de agosto de 2026

A decisão de arquitetura em `docs/BLUEPRINT.md` §5.0 encerrou o modelo de direitos por fonte.
Não existe mais `REFERENCE_ONLY`, `CLAIM_ELIGIBLE`, elegibilidade por obra nem fila bloqueando
autoria. O acervo é insumo e é usado por inteiro.

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

## Identidade e APIs editoriais

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

## Coleção aprovada existente

Os três rascunhos contextuais originais permanecem em `DRAFT` como histórico. Versões novas,
longas e `PUBLISHED` sobre Xangô, Oiá/Iansã e Obá se apoiam em dois documentos do IPHAN, preservam
locator e não criam correspondências astrológicas. A aprovação pública aparece como “Conselho
cultural AstroAxe — aprovação coletiva declarada pelo responsável do produto”; isso não atribui
nomes ou credenciais individuais.

O quarto verbete usa o capítulo VI, páginas 8–9, de _Yoruba Legends_ (M. I. Ogumefu, 1929) e o
prefácio, páginas iii–iv. O texto é síntese original e declara a moldura colonial da coletânea. O
status autoral varia por jurisdição; não copie nem traduza a expressão da obra. A fonte sustenta
somente as claims registradas, não uma descrição geral de Xangô.

## Condição para ativar a Tríade

A Tríade é entregue como resultado do método autoral AstroAxe, com versão, fatores determinantes e
o limite declarado no rodapé. O que a habilita não é uma aprovação externa: é o método estar
versionado, avaliado e explicado na página de metodologia. O produto apresenta uma interpretação
do mapa, não uma identidade religiosa.

## Uso do acervo

Não há mais classificação de elegibilidade por fonte. O acervo é lido por inteiro e alimenta a
derivação do método. O que registramos por obra é identidade — título, edição, idioma — e serve
para nós sabermos o que reestudar quando uma leitura se mostrar errada, não para autorizar nada.

## Composição determinística

Interpretações astrológicas são compostas de blocos versionados, passam pelas constraints de
profundidade e declaram autoria e método (`AI_ASSISTED` quando houver IA). A renderização de uma
combinação já publicada não exige nova composição nem chamada de IA.

A barra é a mesma para bloco cultural e bloco astrológico: **texto nosso, com profundidade real.**
O que muda entre eles é o cuidado com a matéria, não um processo de aprovação. Correspondência com
Orixá é interpretação cultural do método AstroAxe, declarada como tal, com versão e fatores
determinantes visíveis — nunca confirmação religiosa, diagnóstico ou substituto do jogo de búzios.
