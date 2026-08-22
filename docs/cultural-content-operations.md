# Operação do corpus cultural

## Estado atual

O banco e a API pública suportam conteúdo cultural versionado, autoria, revisão independente,
claims e fontes. O corpus público contém quatro textos aprovados em lote pelo responsável do
produto: três contextos IPHAN e uma narrativa iorubá historicamente situada. Novos verbetes não são
criados automaticamente e continuam sujeitos ao mesmo fluxo.

`GET /api/cultural-content` lista as versões públicas mais recentes. A página
`/acervo-cultural` apresenta os textos integrais e sua proveniência.
`GET /api/cultural-content/{slug}` retorna somente a versão publicada mais recente cuja data de
publicação já chegou. Rascunhos, pareceres internos, conteúdo retirado e claims retiradas ou
depreciadas não são expostos.

## Fluxo editorial obrigatório

1. Cadastre a pessoa autora com o crédito público acordado.
2. Cadastre cada fonte com tipo de evidência, URL, data de acesso e nota de licença.
3. Crie o verbete como `DRAFT`, com versão imutável e claims situadas por tradição.
4. Mova para `IN_REVIEW` e registre o parecer em `cultural_reviews`.
5. Uma pessoa diferente da autora revisa linguagem, proveniência, acesso e limites culturais.
6. Publique apenas com `reviewer_id`, `reviewed_at` e `published_at`; a constraint do banco impede
   publicação sem revisão independente.
7. Correções geram nova versão. Conteúdo cuja autorização foi retirada muda para `WITHDRAWN`; não
   apague o histórico editorial.

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

O requisito quantitativo de três verbetes publicados foi atendido, assim como a aprovação coletiva
de conteúdo. Isso não aprova automaticamente um método mapa→Orixá. A geração personalizada só pode
ser conectada quando as correspondências possuírem claims, fontes e versão próprias. Até lá, o
produto não deve fabricar equivalências nem apresentar a Tríade como identidade religiosa.

## Elegibilidade de fontes

Fontes recém-cadastradas assumem `REFERENCE_ONLY`. Catálogo, ISBN ou sinopse
confirmam a existência e o escopo anunciado de uma obra, mas não habilitam claims.
Antes de mudar para `CLAIM_ELIGIBLE`, registre acesso legal ao exemplar, edição,
locator preciso, direitos de uso, sensibilidade cultural e responsável pela checagem.
Submissão e aprovação falham se qualquer claim ativa estiver sem locator ou ligada a
fonte `REFERENCE_ONLY`/`WITHDRAWN`.

## Aprovação em lote versus revisão cultural

Interpretações estritamente astrológicas podem ser aprovadas em lote quando forem compostas de
blocos versionados, passarem pelas constraints de profundidade e linguagem e preservarem autoria,
revisor automatizado e método `AI_ASSISTED`. A renderização de uma combinação já publicada não
exige nova revisão nem chamada de IA.

Essa automação não transforma um bloco cultural em conteúdo autorizado. Claims sobre Orixás,
tradições, narrativas, ritos ou correspondências continuam exigindo fonte elegível e aprovação do
bloco cultural por pessoa competente. Depois dessa aprovação única, o mesmo bloco pode ser
reutilizado deterministicamente sem revisar cada tela ou usuário.
