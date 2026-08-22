# Inventário técnico de dados

Este inventário descreve o código e o schema atuais. Ele não substitui política de privacidade,
registro de operações, avaliação jurídica ou definição de base legal.

## Dados de conta e sessão

| Grupo              | Campos persistidos                                    | Uso técnico                  | Retenção implementada                                            |
| ------------------ | ----------------------------------------------------- | ---------------------------- | ---------------------------------------------------------------- |
| Conta              | email normalizado, hash de senha, instante de criação | autenticação e ownership     | até exclusão integral da conta                                   |
| Sessão autenticada | hash de token, user ID, criação e expiração           | sessão opaca                 | worker remove sessões expiradas; logout revoga a sessão corrente |
| Sessão guest       | hash de token, criação e expiração                    | ownership temporário e claim | worker remove sessões expiradas em cascata                       |

Tokens em claro existem somente no cookie de sessão. Logger, access log e métricas não conservam
cookie, header ou token.

## Dados natais e conteúdo privado

| Grupo             | Campos persistidos                                                          | Uso técnico                              | Retenção implementada                                            |
| ----------------- | --------------------------------------------------------------------------- | ---------------------------------------- | ---------------------------------------------------------------- |
| Perfil natal      | nome/apelido, data, hora opcional, precisão, cidade, coordenadas e timezone | cálculo e apresentação do mapa           | guest até expiração/claim; conta até exclusão do perfil ou conta |
| Mapa e revisões   | fingerprint HMAC, versões, modo e resultado calculado                       | rastreabilidade e histórico de recálculo | cascata com perfil                                               |
| Diário e revisões | data, texto, criação/alteração e versões substituídas                       | diário privado e histórico               | exclusão individual ou cascata com perfil/conta                  |

A exportação autenticada integral inclui conta, perfis, resultados calculados, revisões de mapa,
diário e revisões do diário. O arquivo omite hashes de senha/sessão e fingerprints internos. A
exportação separada do diário permanece disponível para quem deseja somente esse conteúdo.
Exclusão de perfil remove mapa, revisões e diário por cascade; exclusão integral remove sessões e
perfis da conta. O E2E verifica ownership, as duas exportações e arquivo vazio após exclusão.

## Dados editoriais

Fontes culturais, claims, verbetes, pareceres, templates de trânsito e perfis de contribuidores são
dados editoriais versionados. Um contribuidor pode estar vinculado a uma conta, mas autoria e
revisão possuem retenção histórica própria e `onDelete: Restrict`/`SetNull` conforme o vínculo. Essa
retenção precisa constar dos contratos com colaboradores antes de uso real.

## Dados transitórios e externos

- geocoding envia ao Nominatim somente a consulta necessária; identificação do cliente é definida
  por `NOMINATIM_USER_AGENT` e a boundary possui cache/timeout;
- Redis contém cache e rate limit, nunca é fonte autoritativa dos dados privados;
- Pino aplica redaction e registra IDs opacos, status, duração e categorias, não payloads;
- Prometheus recebe métricas HTTP agregadas; access logs descartam caminho, query, IP e headers;
- analytics, LLM, SMTP e Stripe não recebem dados porque não existem integrações ativas.

## Lacunas antes de produção

- aprovar finalidade/base legal, prazos por categoria e política pública LGPD;
- definir atendimento, identidade do controlador, contato e prazo operacional para solicitações;
- definir expurgo de backups e validar exclusão após o período de retenção;
- revisar transferência internacional e subprocessadores antes de qualquer fornecedor externo;
- testar inventário e restauração no ambiente de destino com dados sintéticos;
- documentar retenção editorial e direitos de colaboradores em contrato.
