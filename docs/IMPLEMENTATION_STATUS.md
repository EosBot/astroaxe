# Estado de implementação e handoff

Atualizado em 28 de agosto de 2026. Este documento registra o estado observável do workspace; não
representa deploy, revisão humana externa ou commit Git.

O ponto curto de retomada entre sessões é `docs/PROJECT_MEMORY.md`.

## Auditoria de fontes externas — concluída em 28 de agosto de 2026

A pesquisa não considera uma lacuna fechada apenas porque encontrou um arquivo.
Cada atribuição precisa passar por quatro verificações: edição autenticável,
passagem íntegra, entidade identificada pela própria fonte e aderência literal à
função estrutural.

- Abimbola passou pelas quatro verificações: além das passagens funcionais, a
  própria p. 3 afirma que Ifá e Òrúnmìlà nomeiam a mesma divindade e que Ifá
  também nomeia o sistema. A reedição de 1997 foi confrontada com Google Books
  e o registro da edição original com WorldCat.
- Prandi passou com escopo limitado ao **limiar**: o trecho oficial hospedado
  pelo autor na USP chama Exu de guardião da fronteira do além. Não se extrapola
  daí uma formulação geral de “abridor de caminhos”.
- Agrippa passou pelas quatro verificações: a transcrição foi confrontada com a
  imagem da p. 280 do fac-símile de 1651 originado na Michigan State University,
  e a edição também foi localizada em acervos da Library of Congress e do
  CESIMA/PUC-SP. A modelagem continua conservadora e não simula dignidades que o
  motor ainda não calcula.
- Bascom deixou a lacuna de acesso por meio da edição da Indiana University
  Press no JSTOR. O capítulo III sustenta Òrìṣàlá na adivinhação somente no
  corpus localizado de Salakọ e explicita que há variações entre cultos.
- Juana Elbein teve edição autenticada, mas não gerou atribuição: “princípio
  dinâmico/de comunicação” não é sinônimo de nenhuma função atual. Verger segue
  sem passagem primária acessível. Catálogo, snippet e citação secundária não
  bastam para preencher esse restante.

O grafo `regency-function-graph-0.8.0-research` possui 9 funções e 43 atribuições:
seis `convergent`, uma `corroborated` e duas `single_school`. Esses números
descrevem o artefato atual, não uma alegação de que toda a bibliografia
prioritária foi exaurida. Checkpoint: 589 testes passando e 5 ignorados;
cobertura 86,65%/72,95%/89,22%/88,76% (statements/branches/functions/lines), com
typecheck, lint, formatação e build de produção limpos.

## Mudança de direção — 26 de agosto de 2026

**O modelo híbrido público/local foi descartado.** Runtime único, cobertura total. A decisão
canônica está em `docs/BLUEPRINT.md` §5.0.

O acervo privado é **insumo de autoria**; o site publica **obra derivada e original**. Como
não publicamos texto-fonte de terceiros, todo o aparato que existia para filtrar entre duas
superfícies deixou de descrever o produto e foi removido do código e do banco:

- modo de runtime `disabled|public|local` e o Compose do runtime local;
- matriz de facetas/direitos, bundle público filtrado e seu ponteiro de ativação;
- rota que entregava artefato-fonte e o storage que a servia;
- colunas `rights`/`access`/`sensitivity` em edições, artefatos e mídia;
- fila de revisão de importação e a tabela de pareceres cerimoniais.

O que permanece do pipeline: censo do acervo, extração com OCR, e a linhagem
obra→edição→artefato→locator como **proveniência interna** — para sabermos o que reestudar
quando uma leitura do método se mostrar errada.

Símbolos, selos e pontos riscados são redesenhados em SVG próprio.

## Resumo executivo por fase

| Fase                   | Estado                                       | Entrega observável                                                                                 | Próxima fronteira                                                         |
| ---------------------- | -------------------------------------------- | -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| 0 — Governança         | Concluída no escopo local                    | Blueprint, política cultural/IA, fontes e operação editorial                                       | Formalizar créditos, contratos e remuneração quando fornecidos            |
| 1 — Fundação           | Concluída                                    | Docker, PostgreSQL/pgvector, Redis, Traefik, health, Sonar e restore testado                       | Endurecer e medir a operação containerizada                               |
| 2 — Motor              | Concluída no escopo natal e trânsitos atuais | Cálculo determinístico, hora desconhecida, golden tests, cache e janelas                           | Ampliar efemérides/regras somente com snapshots e bump de versão          |
| 3 — Conta e mapa       | Concluída no MVP local                       | Guest-first, autenticação, ownership, arquivo, edição, histórico e E2E                             | Exercitar continuamente os fluxos completos em desktop e mobile           |
| 4 — Conteúdo           | V3 dirigida, validação em curso              | Workflow editorial, corpus público e Tríade v3 auditável                                           | Calibrar com casos elegíveis congelados e publicar métricas suficientes   |
| 5 — Ritual e IA        | Parcial avançada                             | Tempo do Céu, diário privado versionado e exportável; sem LLM em runtime                           | Histórico longitudinal e RAG opcional sobre o corpus condensado           |
| 6 — Receita            | Não iniciada                                 | Hipóteses documentadas, sem cobrança simulada                                                      | Free/Pro, limites, Stripe e webhooks após decisões e credenciais de teste |
| 7 — Polimento/operação | Parcial avançada                             | Acessibilidade, E2E, SEO, backup/restore, métricas/alertas locais, gate e borda pública verificada | Destino externo de alertas e SLOs do ambiente real                        |

## Concluído

### Laboratório Cerimonial — fundação dual-mode (SUPERADA)

> Histórico do que foi construído nas Tasks 7–11 e depois removido. Ver "Mudança de direção"
> no topo deste documento.

- O roteiro cerimonial está em 11 de 39 tasks: Waves 1 e 2 completas.
- Os processos aceitam somente `disabled`, `public` ou `local`; o modo é imutável e não pode ser
  selecionado por request, header, cookie ou papel. O runtime local possui Compose, banco, Redis,
  credenciais e volumes separados e fica limitado a loopback.
- A migration `20260826020000_ceremonial_corpus` acrescenta 15 tabelas de proveniência e registros
  privados, elevando o histórico observado para 22 migrations, sem alterar tabelas anteriores.
- Uma política pura governa metadata, quotation, fullText, image, seal, mediaDownload e export.
  Publicação exige revisão RIGHTS e EDITORIAL vigente por faceta; corpo/exportação exigem direitos
  elegíveis. Registros local-only, valores desconhecidos, revisões expiradas/revogadas e modo
  desabilitado negam explicitamente.
- A entrega local de artefatos usa rota autenticada e dinâmica, abre somente caminhos relativos
  sob o arquivo read-only, impede symlinks/escapes pelo descritor, valida MIME por assinatura e
  oferece ranges com headers no-store/nosniff. A superfície não existe em modo público/desabilitado
  e não revela caminhos em resposta, filename ou erro.
- O bundle público usa manifesto estrito/canônico, SHA-256, namespace inativo separado e verificação
  independente de aprovações, direitos e hashes de mídia antes da ativação. Um ponteiro singleton
  troca active/previous em transação serializável e preserva rollback imediato. A migration mais
  recente eleva o histórico aplicado para 23 migrations.
- O responsável autorizou continuar as Tasks 12–13, 15 e 22–26. Direitos e competência cultural
  não serão inferidos dessa autorização: sem evidência específica, o acesso público continua
  metadata-only ou negado.

### Ingest cerimonial — inventário e extração (Tasks 12–13)

- A T12 censou o acervo real: 801 arquivos, 737 hashes únicos, 64 duplicatas, 13 em quarentena
  por tipo não identificado. O censo foi reproduzido nesta sessão com `matchesBaseline: true`.
- A T13 acrescentou um pipeline de extração isolado (`compose.ingest.yml`, alvo `ingest-runner`).
  O container roda **sem rede** (`network_mode: none`), com rootfs somente leitura, uid 1000,
  todas as capabilities removidas, `no-new-privileges`, CPU/memória/PIDs limitados e `/tmp` em
  tmpfs `noexec`. O acervo é montado `:ro`.
- Antes de extrair, cada fonte é reaberta com `O_NOFOLLOW` e reconferida contra o censo por
  tamanho e SHA-256. **O adaptador recebe o descritor já verificado como stdin, nunca um
  caminho**, então não existe janela para troca de nome entre a verificação e a leitura. Depois
  da extração o `fstat` é comparado de novo (inode, device, tamanho, mtime).
- Derivados passam por quarentena, são relidos, reconferidos por hash e só então promovidos por
  rename atômico para um volume reconstruível, endereçado por conteúdo, modo 600. Todo derivado
  nasce `UNKNOWN` / `LOCAL_ONLY` / `CULTURALLY_SENSITIVE`; o schema recusa outra classificação.
  Extração não concede direito de publicação — isso é a Task 15.
- Adaptadores: `pdftotext` 22.12.0 (PDF), `tesseract` 5.3.0 por+eng (imagens e PDFs escaneados,
  via fallback `pdf-ocr`), `bsdtar` 3.6.2 (DOCX/ODT) e código puro para texto e RTF.
- **Áudio não é transcrito.** 539 dos 801 arquivos são pontos cantados e recebem `NO_ADAPTER`
  com motivo `AUDIO_NOT_TRANSCRIBED`: não existe ASR local determinístico aceitável, o plano
  proíbe modelo externo, e transcrever canto sagrado é decisão cultural que ninguém tomou. A
  cobertura é reportada sobre todas as linhas do censo, não sobre as tentadas.
- Dois manifestos: o completo é local-only, porque cada caminho é o título de um livro do
  responsável; o sanitizado (`--sanitized`) carrega apenas versões, fingerprint e contagens.
- `npm run ceremonial:scan` gera SBOM CycloneDX e relatório Trivy 0.74.0 fixado e aplica uma
  política em código com relógio injetado: Critical/High bloqueiam sem forma de exceção; Medium
  exige responsável, remediação real e validade de no máximo 30 dias; exceção vencida volta a
  bloquear. **O gate hoje bloqueia a própria imagem de ingest** — 201 achados (8 CRITICAL,
  62 HIGH, 131 MEDIUM), quase todos pacotes Debian bookworm sem correção upstream. A política
  não foi afrouxada. Um experimento com base trixie reduz Critical+High de 70 para 25, mas não
  a zero: nenhuma imagem Node baseada em Debian atinge hoje a barra de zero Critical/High. A
  decisão é do responsável e está registrada no plano.
- Runbook: `docs/OPERATIONS.md`. Desvio declarado: não há perfil seccomp próprio; vale o
  allowlist padrão do Docker, não desabilitado, reforçado por rede nenhuma e `cap_drop: ALL`.

### Fundação e motor natal

- Runtime Docker com app Next.js, worker, PostgreSQL/pgvector, Redis, Traefik e migrations.
- Healthchecks, configuração validada, headers de segurança, rate limit e logger sanitizado.
- Motor natal determinístico Caelus, modo explícito de hora desconhecida, contratos Zod e testes
  golden.
- Onboarding guest-first, geocoding com cache, persistência do mapa e primeiro valor antes da conta.

### Conta e propriedade

- Cadastro, login, logout, senha `scrypt`, sessão opaca, claim idempotente de perfil guest e limpeza
  de sessões vencidas pelo worker.
- Área `/conta`, listagem isolada por titular, edição/recálculo e exclusão autorizada.
- Histórico de resultados substituídos em `natal_chart_revisions`.
- A conta permite trocar a senha informando a senha atual; a alteração cria uma nova sessão e
  revoga todas as anteriores. A exclusão integral exige senha e confirmação textual, apaga usuário,
  sessões, perfis, mapas e revisões por cascade e preserva atribuições editoriais sem vínculo de
  login.

### Corpus e workflow cultural

- Modelos versionados para colaboradores, fontes/licenças, verbetes, claims e pareceres.
- Leitura pública fail-closed: somente versão `PUBLISHED`, data vigente, revisão independente e
  claims `ACTIVE` ou `CONTESTED`.
- Papéis editoriais `AUTHOR`, `REVIEWER` e `ADMIN`, vinculados explicitamente a uma conta.
- APIs para cadastrar fontes, criar/submeter verbetes e aprovar, solicitar mudanças ou retirar.
- Autor e revisor precisam ser pessoas diferentes; parecer e publicação são transacionais.
- Nenhum verbete fictício ou não autorizado foi inserido.
- A aprovação coletiva em lote declarada pelo responsável do produto está registrada sem inventar
  nomes, cargos religiosos ou credenciais individuais. O crédito público explicita esse alcance.
- Duas fontes institucionais do IPHAN sustentam versões longas publicadas sobre Xangô, Oiá/Iansã e
  Obá. Os rascunhos curtos permanecem preservados como histórico e não são retornados pela API.
- Um quarto texto longo contextualiza a narrativa de Sango, relâmpago, trovão e memória registrada
  por M. I. Ogumefu em 1929. A claim usa capítulo VI, páginas 8–9, e outra claim registra o viés
  colonial/cristão do prefácio; a obra é testemunho situado, não autoridade universal.
- A constraint `published_cultural_entry_depth` exige resumo com ao menos 240 caracteres e corpo
  com ao menos 1.800 caracteres para qualquer novo verbete `PUBLISHED`.
- `GET /api/cultural-content` lista apenas a versão publicada mais recente de cada slug. A página
  `/acervo-cultural` entrega o texto integral, autoria, aprovação, versão, claims, locators, fontes
  e a proveniência cultural. A abertura também apresenta o inventário agregado do corpus ampliado,
  separando material técnico de verbetes culturalmente revisados e sem expor a coleção privada ou
  a receita proprietária. O acervo informa o grafo de pesquisa; conteúdo publicado não recebe peso
  automático por simples presença no corpus.

### Início do Tempo do Céu

- Domínio puro `src/domain/astrology/transits` com snapshot por instante explícito.
- Aspectos suportados: conjunção, sextil, quadratura, trígono e oposição.
- Resultado contém orbe, estado aplicante, intensidade relativa e fingerprint versionado.
- Nenhum LLM participa do cálculo.
- Serviço diário com cache Redis validado, TTL de três dias e chave que inclui versão, fingerprint
  natal, data e timezone; corrupção vira miss e é sobrescrita.
- `GET /api/profiles/{profileId}/transits?date=AAAA-MM-DD` exige conta e filtra o mapa pelo titular.
- Biblioteca editorial de interpretações indexada por corpo em trânsito, corpo natal, aspecto,
  idioma e versão. A seleção usa somente conteúdo `PUBLISHED` com revisão independente.
- Três textos longos originais foram cadastrados como `AI_ASSISTED` e `PUBLISHED`: Saturno quadratura
  Sol, Júpiter trígono Sol e Marte conjunção Lua. Cada um possui abertura, aprofundamento,
  explicação técnica, pergunta e prática. A revisão registrada é automatizada e declarada como tal;
  não equivale a autoria humana. Eles são entregues automaticamente quando o aspecto correspondente
  aparece entre os cinco trânsitos mais relevantes.
- A ficha de cada perfil agora abre o `Tempo do Céu` da data no fuso do mapa e organiza a leitura
  em `Agora / Por quê / Como trabalhar`. A interface mostra intensidade relativa, dado técnico,
  pergunta, prática, autoria, revisão e rótulo de assistência por IA. Loading, erro com retry e
  ausência de texto editorial possuem estados próprios; quando não há texto publicado, a tela
  mostra apenas o aspecto calculado e declara que não improvisará uma interpretação.
- Os cinco aspectos prioritários agora incluem a janela determinística da passagem contínua que
  contém a data consultada: início, pico de menor orbe local e fim. A busca usa passos adequados à
  velocidade de cada corpo, refina numericamente os limites e não mistura passagens separadas. As
  janelas fazem parte do snapshot cacheado e aparecem no fuso do perfil.
- A biblioteca astrológica profunda materializa 350 combinações em português: sete agentes em
  trânsito, dez funções natais e cinco aspectos. Cada registro possui abertura, aprofundamento,
  explicação técnica, pergunta e prática. A migration só publica combinações que atendem mínimos de
  profundidade e segregação autor/revisor; a composição acontece antes do uso e não chama IA em
  runtime. O feed mostra até cinco ciclos e permite expandir as leituras além do tema principal.
- A ficha do perfil permite navegar pelo histórico diário dos últimos 366 dias, escolher uma data,
  avançar ou retornar a hoje. A navegação reutiliza o endpoint autenticado, o cálculo determinístico
  e o cache versionado; não cria uma segunda cópia dos trânsitos nem amplia a coleta de dados.

### Diário privado

- Uma reflexão por perfil e data, limitada a 4.000 caracteres, fica vinculada exclusivamente ao
  titular autenticado. Atualizações preservam a versão anterior em tabela separada.
- A conta permite criar, atualizar, listar e excluir uma reflexão, além de exportar todo o diário em
  JSON autenticado e `no-store`. Exclusão do perfil ou da conta elimina entradas e revisões por
  cascade.
- O conteúdo não entra no logger, analytics, IA, MCP ou corpus editorial. As APIs validam JSON,
  mesma origem nas mutações, Zod e ownership no servidor.

### Tríade de Regências v3 — questionário, feedback e provenança

- A Tríade exige sete respostas de questionário antes do cálculo (`POST`); essas respostas são
  cálculo-apenas — usadas somente naquela requisição e nunca persistidas, logadas ou devolvidas no
  DTO público. Boundaries fail-closed: mesma origem, corpo JSON limitado (415/413), erro de cálculo
  sanitizado (503) e ownership do perfil em toda operação.
- Um coletor separado e explicitamente consentido (`PUT`) pergunta se a pessoa conhece seus Orixás
  de frente, cabeça e costas; só então persiste `regency_feedback` com predição recalculada no
  servidor, versões de método/matriz/config/scorer/questionário e origem da confirmação. O checkbox
  de consentimento é um estado controlado — não é possível enviar sem marcá-lo, mesmo contornando o
  botão. `knowsOrisas=false` proíbe correção; `knowsOrisas=true` exige ao menos um papel corrigido,
  reforçado por CHECK constraints no banco (última defesa, não a primeira).
- `DELETE` permite retirar um feedback específico (por método/questionário) sem apagar o mapa; a
  exclusão do perfil ou da conta continua removendo tudo em cascata.
- A exportação pessoal (`GET /api/auth/export`) inclui as cinco versões de cada feedback. Um novo
  relatório agregado internamente restrito (`regency:evaluate -- --aggregate-release`) publica
  contagens sobre dimensões fixas predeclaradas com amostra mínima de 30, supressão primária abaixo
  de 10, supressão complementar e bloqueio por risco de ataque de diferenciação contra o release
  anterior — nunca dados por linha, nunca abaixo do corte.

### Método autoral de regências v2

- O módulo autenticado usa a composição v2: fatores natais, canais temporais disponíveis,
  numerologia versionada e correspondências culturais com proveniência separada por escola.
- O grafo distingue arquivo, obra, família de fonte e escola; cópias e conversões não são contadas
  como consenso independente. Conflitos permanecem dados auditáveis.
- O benchmark compara o baseline congelado com o candidato v2 nas mesmas partições.
- O avaliador `regency-evaluation-0.4.0` mede top-1, top-3, tríade exata, intervalos de Wilson de 95%,
  abstenções, matrizes de confusão e cortes por hora, método temporal e proveniência.
- A mesma impressão digital documental não pode atravessar calibração e validação. Casos reais não
  foram inventados nem incorporados ao repositório; a próxima dependência é coleta elegível e
  restrita conforme o protocolo de pesquisa.
- O benchmark comparativo gera fingerprint SHA-256 canônico e manifesto sanitizado. A política de
  promoção exige amostra mínima, ausência de perda top-1/top-3 e limite de aumento de abstenções;
  mesmo quando passa, a promoção é decisão explícita e versionada, nunca automática.
- A rota pública `/metodologia` apresenta entradas, controles, versionamento e limites sem publicar
  matriz, pesos, limiares, regras de desempate ou corpus proprietário.
- Percentuais normalizados deixaram a interface: o usuário vê intensidade relativa em linguagem
  qualitativa, evitando leitura indevida como certeza espiritual.
- O cálculo v2 roda somente no servidor pela rota autenticada
  `GET /api/profiles/{profileId}/regency`, com ownership e resposta `private, no-store`. O DTO não
  contém claims, regras, pesos, contribuições ou versão interna da matriz. `server-only` impede que
  matriz/configuração sejam importadas por componentes cliente.

## Migrations aplicadas no banco PostgreSQL 18 ativo

1. `20260819000000_enable_vector`;
2. `20260819010000_guest_birth_chart`;
3. `20260819020000_accounts_and_ownership`;
4. `20260819030000_chart_revisions`;
5. `20260819040000_cultural_corpus`;
6. `20260819050000_editorial_identity`;
7. `20260819060000_cultural_research_drafts`;
8. `20260819070000_transit_interpretation_library`;
9. `20260819080000_transit_interpretation_drafts`;
10. `20260819090000_publish_validated_transit_texts`;
11. `20260819100000_cultural_source_eligibility`;
12. `20260819110000_deep_transit_library`;
13. `20260819120000_publish_council_approved_cultural_contexts`;
14. `20260819130000_yoruba_legend_context`;
15. `20260819140000_correct_cultural_publication_time`;
16. `20260820010000_private_journaling`;
17. `20260822010000_transactional_email_outbox`;
18. `20260823010000_account_verification_and_recovery`;
19. `20260825160000_regency_feedback`.

A migration 11 adicionou `REFERENCE_ONLY`, `CLAIM_ELIGIBLE` e `WITHDRAWN` às fontes. **Esse
vocabulário foi descartado** com o modelo de direitos por fonte (`BLUEPRINT.md` §5.0): as oito
obras de Saraceni e dos corpus iorubás entram no estudo como qualquer outra. As colunas
permanecem no banco por ora — removê-las é trabalho pendente, e enquanto isso o valor gravado
nelas não significa nada. O que continua valendo é a exigência de locator: uma afirmação material
aponta para uma posição citável.

A migration 12 adiciona uma constraint de profundidade para textos astrológicos publicados e
materializa 350 leituras `modular-ptbr-1`. No banco isolado, os mínimos observados foram 398
caracteres de abertura, 1.591 de aprofundamento, 352 de explicação técnica, 80 de reflexão e 182 de
prática. Essa aprovação automatizada não se aplica a claims culturais.

As migrations 13–15 registram a aprovação cultural declarada, publicam quatro verbetes profundos,
adicionam a fonte integral de Ogumefu como elegível apenas para síntese original e corrigem a
vigência para o início da data aprovada. A migration `20260828010000` acrescentou o quinto verbete,
o primeiro derivado do corpus condensado: **são cinco verbetes publicados**, com corpos entre 2.904
e 3.018 caracteres, todos acima da constraint de 1.800.

### Experiência, motion e acessibilidade

- A apresentação de signos e Ascendente deriva os nomes em português da longitude e exibe o grau
  dentro do signo, sem alterar o núcleo astronômico. A mudança possui função pura, testes e registro
  em `docs/METHOD.md`.
- O onboarding adotou o contrato visual de `docs/BLUEPRINT.md`: palco orbital, foco claro e
  coreografia curta, preservando a identidade quente e editorial do Observatório Ritual.
- O palco orbital WebGL é decorativo e progressivo: conteúdo e formulário permanecem disponíveis
  sem a cena. A implementação Canvas anterior, sem consumidor, foi removida com seus testes e CSS.
- A composição foi verificada em `1440×1000`, `390×844` e `320×700`, sem overflow horizontal,
  overlay de erro ou erro de console. O resultado usa uma mandala natal real e interativa, com dez
  posições no DOM, seleção por teclado, casas e ASC/DSC quando a hora é conhecida e omissão explícita
  desses elementos quando a hora é desconhecida.
- O shell global agora possui marca vetorial AstroAxé, menu responsivo e rodapé em todas as páginas.
  A entrada ganhou rota própria e leva diretamente à central autenticada.
- A central autenticada organiza mapa natal, Tempo do Céu, diário, sinastria e biorritmo como
  módulos navegáveis. Sinastria calcula aspectos maiores cruzados entre os cinco corpos pessoais de
  dois mapas salvos. Biorritmo calcula os três ciclos clássicos por data explícita e informa que o
  modelo não possui comprovação científica.
- A versão western-2026-08-23-extended-points acrescenta Quíron, Nodo Norte verdadeiro e Lilith
  média aos novos snapshots. Nodo Sul é derivado na interface. MC/FC passaram a ter leitura
  editorial ao lado de ASC/DSC; snapshots legados continuam compatíveis sem mutação silenciosa.

- Playwright `1.62.1` foi fixado e existe `npm run test:e2e` para Chromium desktop e Pixel 7.
- `npm run test:e2e` sobe a stack isolada `astroaxe_e2e` com PostgreSQL e Redis persistentes,
  migrations e runtime de produção reais, Traefik em `127.0.0.1:3100`, readiness explícita e
  teardown automático sem `down -v`. O volume PostgreSQL 18 é derivado do nome do projeto e não
  colide com o runtime principal. `npm run test:e2e:running` testa uma stack já iniciada.
- Quatorze execuções E2E passam: ciclo autenticado completo, corpus publicado/proveniência,
  navegação por teclado/ausência de overflow, metodologia pública e três cenários da mandala natal,
  cada cenário em desktop e mobile, sequencialmente.
- O ciclo autenticado calcula dois mapas guest com cidade sintética interceptada no navegador,
  confirma cadastro e login com claim, arquivo, precisão, Tempo do Céu editorial, edição e
  recálculo, diário privado com atualização/exportação/exclusão, revogação da sessão, ownership e
  exclusões por interface e API. O app permanece sem rede de egress durante o E2E, portanto nenhuma
  consulta ao Nominatim pode sair para a internet.
- O layout ganhou skip link, foco visível para links e `summary`, `theme-color`, touch action e
  títulos preparados para quebra. `allowedDevOrigins` permite somente `127.0.0.1` no servidor de
  desenvolvimento usado pelo E2E.
- O wrapper encaminha argumentos adicionais ao Playwright, portanto `npm run test:e2e -- --list`
  preserva o mesmo bootstrap autocontido sem executar os cenários.

### Recuperação operacional e SEO técnico

- `npm run backup:postgres` cria dump custom do PostgreSQL sem owner/privilégios, com permissão
  local restrita e SHA-256. `npm run backup:verify -- <arquivo>` confere o checksum, restaura em
  banco temporário, valida pgvector e histórico Prisma e remove o banco isolado ao final.
- O backup do banco legado foi restaurado no volume ativo `astroaxe_postgres18_data` em 21 de agosto
  de 2026. PostgreSQL `18.6`, extensão `vector` e 16 migrations foram verificados; o volume
  `astroaxe_postgres_data` com PostgreSQL 16 permanece intacto para retorno.
- Metadata usa `SITE_URL` validada e incorporada no build. Home e acervo possuem canonical e Open
  Graph coerentes; `/conta` é `noindex`; `robots.txt` exclui API/conta; `sitemap.xml` contém apenas
  páginas públicas; JSON-LD declara somente `WebSite`, sem fabricar organização, produto, preço,
  review ou FAQ.
- Checkpoint desta revisão: 300 testes em 87 arquivos passaram, com 86,11% de statements, 70,69%
  de branches, 89,06% de functions e 88,31% de linhas. Typecheck, lint, formatação, build Docker de
  produção, release smoke e os 14 cenários E2E passaram. O Quality Gate do SonarQube foi
  reexecutado em 25 de agosto de 2026 e passou. A inspeção de 65 arquivos estáticos do cliente não
  encontrou marcadores da matriz proprietária. No checkpoint anterior, o gate registrava
  zero novas violações, 83,0% de cobertura no código novo e 0,54482% de duplicação. Por decisão do
  responsável, o `.env` local contém um Project Analysis Token e um User Token permanentes,
  distintos e validados; nenhum valor foi versionado.
- Um smoke pela entrada Traefik realizou 100 requisições com concorrência 10, zero falhas e p95 de
  127 ms na stack Docker local. O comando `npm run test:performance` e o runbook de diagnóstico
  não coletam PII. O Compose do Sonar ganhou uma rede de borda separada para publicar somente
  `127.0.0.1:9000`, mantendo seu PostgreSQL na rede interna.
- `npm run test:release-smoke` valida uma origem containerizada explícita: liveness, readiness de
  PostgreSQL/Redis, home, metodologia, robots, sitemap, `noindex` da conta e headers de segurança.
  O runbook de release descreve staging, promoção por digest e roll-forward sem assumir provedor.
- A sobreposição `compose.observability.yml` executa Prometheus 3.13.1 LTS com retenção limitada,
  coleta métricas agregadas do Traefik e carrega quatro alertas locais. `npm run test:observability`
  verifica target, séries e regras. Logs de acesso descartam caminho, query, endereço do cliente e
  headers; o provider Docker fica restrito ao projeto Compose para impedir colisões entre stacks.
- Não há coletor, SDK, endpoint, evento ou flag de analytics. O contrato sem chamadores foi removido
  como código especulativo; fornecedor, finalidade, consentimento e política LGPD continuam
  pré-condições para criar uma boundary real.
- O inventário técnico de dados mapeia conta, sessões, perfil natal, mapas, diário, conteúdo
  editorial, cascatas e boundaries externas, além de registrar as lacunas jurídicas e de retenção
  que ainda impedem declarar a política LGPD final.
- A conta oferece exportação JSON integral, validada por schema e sem cache, com dados cadastrais,
  perfis, mapas, versões e diário. Hashes de senha/sessão e fingerprints internos não entram no
  arquivo; autenticação e filtro por owner são cobertos por teste e pelo lifecycle E2E.

Os volumes anteriores não foram apagados e nenhum `down -v` foi executado.

### Borda pública Cloudflare

A zona `astroaxe.net` saiu do default de fábrica e foi verificada contra a borda real em 2026-08-26,
antes de qualquer VPS existir. TLS estrito com mínimo 1.2 e TLS 1.1 recusado; Managed Free Ruleset
ativo; quatro regras WAF custom; rate limiting cortando na 16ª requisição a `/api/auth/`; cache que
exclui toda superfície autenticada; Bot Fight Mode com bloqueio de crawlers de treino de IA; e Zero
Trust Access por One-time PIN barrando `staging.astroaxe.net` antes da origem.

A origem existe apenas por Cloudflare Tunnel: a zona não tem registro `A` nem wildcard, então não há
IP de origem descobrível. Os tokens dos dois Tunnels foram validados conectando `cloudflared` de
verdade e registrando conexões na borda.

O domínio está declarado como não-remetente no DNS — null MX, `v=spf1 -all` e DMARC `p=reject` —
até existir relay e endereço de contato. HSTS permanece desligado de propósito até o primeiro deploy
com HTTPS confirmado.

Enquanto a VPS não existe, um Worker (`astroaxe-holding`) publica a página "em construção" no apex,
respondendo `503` com `noindex` para não ser indexada como se fosse o site real.

Runbook autoritativo: `docs/OPERATIONS.md`. Desenho aprovado:
`docs/superpowers/specs/2026-08-26-cloudflare-edge-design.md`.

## Fila restante, em ordem recomendada

### P0 — Fechar o MVP confiável

1. Manter a validação funcional completa na stack Docker. Em 23 de agosto de 2026, os 14 cenários
   Playwright passaram em desktop e mobile, sem dados pessoais reais; o cadastro também passou pelo
   caminho outbox → worker SMTP → Mailpit em homologação.
2. Ampliar a medição de carga somente quando existir um ambiente de destino e SLOs definidos. O
   smoke local pelo Traefik está automatizado; não existe etapa, vínculo ou dependência de Vercel.
3. Definir o destino externo dos alertas e da disponibilidade. Métricas, quatro regras e logs
   sanitizados já funcionam localmente em containers; Alertmanager/fornecedor, destinatários,
   retenção e revogação ainda precisam de contrato. Nenhuma data de nascimento, localização, email
   ou token pode sair nos eventos.

### P1 — Condensar o acervo e escrever o método

O insumo está pronto. O acervo `/mnt/e/Ocultismo` foi extraído, chunkado e vetorizado com
`BAAI/bge-m3` em `conteudo/`, consultável por `scripts/ocultismo-pipeline/query.py`. Em 27 de
agosto de 2026 o índice passou por higiene: material fora do assunto, extração ilegível e cópias
da mesma obra saíram, e as letras dos pontos foram validadas uma a uma. Os portões que decidem o
que entra estão em `corpus_hygiene.py` e valem para execuções futuras, não só para esta limpeza.

A ponte entre corpus e produto começou. `regency-function-graph-0.8.0-research` implementa as três
camadas do §5.0.1: vocabulário de funções estruturais, atribuições com escola/obra/família/locator
e condensação que pesa **famílias independentes**, não contagem de atribuições. O grafo possui
**nove funções e 43 atribuições** e reúne Umbanda, Quimbanda, Arbatel, a linhagem angélica
renascentista, Ifá e uma via acadêmica afro-brasileira. As atribuições do corpus foram localizadas
por busca semântica e conferidas no texto; as externas possuem fonte aberta e locator explícito —
nenhuma foi escrita de memória.

O corpus continua sendo insumo de autoria, não dado de runtime: nenhum código em `src/` lê
`conteudo/`, e é assim que deve ser. O que atravessa a fronteira é o achado, versionado e com
proveniência, nunca o texto-fonte.

O vocabulário tem **nove funções**. Além das quatro linhagens umbandistas do corpus — Saraceni,
Templo da Pena, Ramatís e Quimbanda —, a pesquisa em fonte primária de 28 de agosto trouxe duas
linhagens independentes delas: o **dossiê Ifá da UNESCO**, que fundamenta
`function:divination-and-counsel` com Òrúnmìlà e faz Ifá entrar no grafo, e um **artigo revisado
por pares na Mercator/SciELO**, que sustenta Ogum na função do ferro por uma via acadêmica
independente das escolas praticantes.

O que ainda falta: **Verger** continua sem passagem primária aberta e verificável. BnF, IFAN,
Google Books e Edusp autenticam a obra, mas não substituem o texto. **Juana Elbein foi localizada
e autenticada**, porém as passagens recuperadas sobre Èṣù como princípio dinâmico e de comunicação
não cabem nas nove funções atuais sem forçar a taxonomia. **Bascom deixou a lista em 28 de agosto:**
a edição da Indiana University Press no JSTOR registra Òrìṣàlá controlando os dezesseis búzios no
corpus de Salakọ e adverte sobre variações entre cultos; por isso a atribuição é localizada nessa
escola, não universal. **Abimbola deixou essa lista em 28 de agosto:**
uma edição integral aberta foi localizada e a passagem das páginas 9–10 acrescentou uma segunda
linhagem de Ifá a `function:divination-and-counsel`. **Prandi também deixou a lista:** um trecho
oficial do autor situa Exu Òrìṣà como guardião da fronteira do além e fundamenta a função de limiar
sem confundi-lo com entidade-guia. Ketu/Nagô segue com cobertura fina; Verger é dependência de
acesso ao texto, e Juana demanda ampliar o vocabulário somente se a função de comunicação for uma
decisão metodológica independente — nunca para acomodar uma fonte.

O scorer continua usando a matriz v2 e suas quatro fontes estruturais; ligar o grafo de funções a
ele exige benchmark e bump de versão.

Checkpoint de 28 de agosto após a versão 0.2.0: 575 testes passando, cobertura global de 86,64%
de statements e 88,74% de linhas, com typecheck, lint, formatação e build de produção limpos.

Checkpoint posterior à Task 20: **589 testes passando**, cobertura global de 86,71% de statements,
73,09% de branches, 89,30% de funções e 88,80% de linhas; typecheck, lint, formatação e build de
produção limpos.

1. **Condensar as tradições por função estrutural** (`docs/BLUEPRINT.md` §5.0.1). Angelical,
   Ars Goetia, Theurgia-Goetia, espíritos olímpicos, inteligências planetárias, Umbanda Sagrada,
   Ketu/Nagô e Ifá alimentam um grafo de funções comum. A escola de origem é registrada porque é
   ela que dá peso: convergência entre escolas independentes é evidência forte; cópia e tradução
   da mesma linhagem não são duas confirmações.
2. **Escrever a síntese.** Começou em 28 de agosto de 2026 com o primeiro verbete derivado do
   corpus condensado — `iemanja-teogonia-umbanda-sagrada`, migration `20260828010000`, 3.018
   caracteres de corpo, publicado sem revisor porque nenhuma revisão aconteceu. Ele fixa o padrão:
   parte de uma obra identificada, trata a origem do texto como parte do que o texto afirma, ensina
   a diferença entre densidade de material e amplitude de concordância, e declara o que a fonte não
   autoriza generalizar. **Segue aberto**: é conteúdo, e conteúdo se escreve um a um.
3. ~~**Explicar o método na página** no formato de _model card_.~~ **Feito em 27 de agosto de 2026.** `/metodologia` publica as cinco partes — entradas, processo etapa a etapa, condensação
   das tradições em três camadas, versionamento, avaliação e limites conhecidos. O conteúdo mora em
   `PUBLIC_REGENCY_METHOD_CARD` (`src/domain/orixas/regency/public-method.ts`), não na página, para
   ser contrato versionado e coberto por teste. Publica a regra de linhagem e o limite de posição
   análoga; continua sem expor matriz, coeficientes, limiares nem identificadores internos de
   artefato, o que é verificado por teste.
4. ~~**Redesenhar os símbolos em SVG próprio.**~~ **Feito em 27 de agosto de 2026.** Os 14 glifos
   planetários estão em `src/components/site/celestial-glyph.tsx` e substituem os caracteres
   Unicode, que dependiam da fonte instalada. Cinco selos rituais — Exu, Ogum, Oxóssi, Xangô e
   Iemanjá — estão em `src/components/site/ritual-seal.tsx`, cada um com sua fundamentação no
   acervo registrada em `grounding`. Entidade sem selo fundamentado não renderiza nada. Falta
   ampliar o conjunto de selos e dar um passe no glifo de Júpiter, o mais estilizado.
5. ~~**Entregar a Tríade** como resultado do método autoral, com versão, fatores determinantes e o
   limite declarado no rodapé.~~ **Feito em 27 de agosto de 2026.** A resposta pública traz
   `determiningFactors` por papel, traduzidos por `public-factors.ts` para linguagem de leitura;
   a ordem é pública e o peso não. Papel em aberto não lista fatores. Versão e limite já estavam
   no rodapé, que agora também linka `/metodologia`.
6. ~~**Correção versionada.**~~ **Feito em 27 de agosto de 2026.** `method-corrections.ts` guarda
   as correções com área, o que mudou, causa e efeito, e `/metodologia` publica o registro. Duas
   entradas, ambas verificáveis nesta documentação — inclusive a que reduz a convergência que o
   produto mostra.

### P2 — Produto, receita e crescimento responsável

1. Definir limites reais dos planos Free/Pro e quais benefícios sustentam assinatura. Validar com
   usuários antes de cristalizar os preços que hoje são hipóteses.
2. Validar com usuários a navegação longitudinal do Tempo do Céu; o histórico diário de um ano,
   journaling privado, exportação e exclusão LGPD explícita já estão implementados.
3. Preparar beta e integrar analytics apenas após o contrato de finalidade/fornecedor e a política
   LGPD. A fronteira fail-closed e o vocabulário mínimo já existem; nenhum dado natal, coordenada ou
   texto de diário pode ser enviado.

### P3 — Produção

1. Domínio, TLS e borda pública estão definidos e verificados (`docs/OPERATIONS.md`). Resta
   definir provedor de VPS, secret manager e banco/Redis gerenciados ou operação equivalente.
2. Executar migrations em staging, smoke tests, teste de restauração, carga básica e Quality Gate.
3. Submeter a página factual de privacidade já publicada à revisão jurídica e completar controlador,
   bases legais, retenção, subprocessadores e termos antes de produção.
4. Criar procedimento de deploy e rollback/roll-forward; observar o primeiro deploy antes de
   declarar produção concluída.

### P4 — Integrações externas finais

1. Recuperação de senha e verificação de email estão implementadas localmente com links de uso
   único, expiração, resposta anti-enumeração e revogação de sessões. O fluxo completo passou na
   homologação com Mailpit; entrega por domínio real continua dependente do relay de staging.
2. Por último, integrar Stripe em modo de teste: Checkout/Portal, webhooks assinados e idempotentes,
   ledger de entitlement, cancelamento, falhas de pagamento e testes de replay. A integração exige
   conta e chaves de teste fornecidas pelo responsável.

## Dependências humanas ou externas

- A aprovação coletiva foi declarada pelo responsável e está registrada com esse alcance. Nomes,
  credenciais individuais, contratos e remuneração não foram fornecidos e não são simulados.
- Stripe exige conta e chaves de teste; nenhuma chave deve ser criada ou armazenada no repositório.
- Conteúdo/RAG exige corpus efetivamente autorizado; a lista de fontes em `docs/knowledge` não é
  licença automática.
- Domínio e borda pública estão resolvidos. Deploy, email transacional, monitoramento externo e
  política LGPD final continuam exigindo escolhas e credenciais do responsável pelo produto.

## Estado Git e operação

- Em 27 de agosto de 2026 o working tree está limpo e `develop` está dois commits à frente de
  `origin/develop`: `840fc03` (corpus vetorizado do acervo) e `f3c79ca` (OCR dos escaneados).
  Os artefatos pesados do corpus ficam fora do Git; os catálogos de pontos, que são curadoria,
  são versionados.
- `.env` local existe, está ignorado e não deve ser versionado ou exibido.
- SonarQube usa tokens permanentes distintos no `.env` local, por decisão explícita do responsável;
  eles devem ser rotacionados e nunca versionados.
- Banco isolado observado em 28 de agosto de 2026, contra PostgreSQL 18 real: **26 migrations
  aplicadas sem erro**, 3 rascunhos históricos, **5 verbetes publicados** e 4 pareceres `APPROVED`.
  O quinto verbete é o único sem revisor registrado — a revisão deixou de ser pré-condição em
  `20260826150000`, e gravar um parecer que não aconteceu seria ficção no banco.
- O volume persistente histórico do projeto Compose principal é PostgreSQL 16 e não inicia com a
  imagem PostgreSQL 18 atual. Ele foi preservado intacto: a correção exige clone, backup e
  `pg_upgrade`/restore planejado, nunca exclusão do volume. As validações recentes usaram projetos e
  volumes isolados.
- O domínio público `astroaxe.net` existe, está configurado e foi verificado contra a borda real.
  Não existe evidência de deploy, CI remoto ou monitoramento externo; esses itens não devem ser
  apresentados como concluídos. Backup local possui restauração comprovada, mas ainda não existe
  cópia externa criptografada nem teste em infraestrutura hospedada.
- Antes de retomar: leia `AGENTS.md`, `docs/PROJECT_MEMORY.md` e este arquivo; conforme o
  assunto, siga para `docs/BLUEPRINT.md`, `docs/METHOD.md` ou `docs/OPERATIONS.md`. Execute
  `git status --short` e preserve mudanças alheias.
- **Existe um plano só.** Até 28 de agosto de 2026 havia dois — a fila P0–P4 deste arquivo e um
  roteiro paralelo de 39 tasks em `.omo/plans/`, que não se conheciam e divergiram: as sessões de
  27 e 28 de agosto executaram o P1 daqui sem jamais consultar aquele. O roteiro foi absorvido na
  seção "Roteiro granular" ao final deste documento e o `.omo/` foi removido. A fila P0–P4 dá a
  ordem de prioridade do produto; o roteiro granular dá os critérios de aceite das tasks
  cerimoniais que continuam abertas.

---

# Roteiro granular — absorvido do `.omo` em 28 de agosto de 2026

O diretório `.omo/` foi removido e seu conteúdo vive aqui. Ele trazia 39 todos numerados em
sete waves, com critérios de aceite, QA e mensagem de commit declarada por task, mais
evidência por task em `docs/IMPLEMENTATION_STATUS.md` (índice de evidências). As tasks 1-14 e a 27 estão concluídas; o que segue
são as **abertas**, preservadas com seus critérios porque é isso que as torna executáveis.

A fila P0–P4 acima continua sendo a ordem de prioridade do produto. Este roteiro é o
detalhamento de execução das partes cerimoniais — **não é um segundo plano concorrente**, que
era a contradição existente até esta consolidação.

## Estado das waves

| Wave                                | Tasks | Status                                       |
| ----------------------------------- | ----- | -------------------------------------------- |
| 1 — Recuperação e Tríade v3         | 1-6   | Concluída                                    |
| 2 — Esquema de proveniência         | 7-11  | Só o esquema (T8) vale; o resto foi superado |
| 3 — Ingestão do corpus              | 12-16 | 12-14 e 16 feitas; 15 cancelada              |
| 4 — Domínio cerimonial determinista | 17-21 | **Concluída** (T17–T21)                      |
| 5 — Condensação das tradições       | 22-27 | **Concluída** (T22–T27)                      |
| 6 — Publicar o domínio como obra    | 28-33 | **Reescrita** em 31/08; aberta e executável  |
| 7 — Operação e release              | 34-39 | Aberta                                       |

#### Wave 3 — Ingestão do corpus (task 16, reescrita em 31 de agosto de 2026)

> A task 16 sobreviveu à consolidação de 28 de agosto apenas como linha de tabela: as
> abertas foram preservadas com seus critérios, e esta ficou sem bloco. O texto original foi
> recuperado do histórico do Git e reescrito, porque duas de suas premissas caíram.

- [x] **16. Relatório de integridade do corpus — FEITA em 31 de agosto de 2026.** `src/domain/ceremonial/corpus-integrity.ts` é função pura: mesmas entradas, mesmo relatório, sem relógio, disco ou estado de sessão. Soma totais por categoria e por obra, agrupa cópias por hash, conta extração ilegível em vez de descartá-la em silêncio, lista metadado por resolver, aponta derivado anterior à última modificação do arquivo e reconcilia contra o inventário da task 12 nomeando o motivo de cada ausência. `scripts/corpus-integrity-report.ts` é a fronteira que agrega o JSONL em documentos; o manifesto do inventário é argumento opcional porque não é versionado — contém caminhos do acervo. **Executado contra o corpus real: 429 documentos, 29.296 chunks, 16 categorias.** Ver a entrada de 31 de agosto em `docs/PROJECT_MEMORY.md` para o que a execução revelou e para o defeito que ela expôs no próprio relatório.
  - **A metade da descoberta foi feita, e de outro jeito.** A task pedia FTS5 do `node:sqlite` e dizia explicitamente "no embeddings/external model". Em 27 de agosto o acervo foi extraído, chunkado e **vetorizado com `BAAI/bge-m3`**, e a busca semântica local vive em `scripts/ocultismo-pipeline/query.py`. O modelo roda offline, na máquina, sem chamada externa — a premissa que a task protegia era não vazar corpus para serviço de terceiro, e ela continua respeitada. Foi a decisão posterior que prevaleceu, e as tasks 22 a 27 foram executadas em cima dela.
  - **Implement:** o que falta é o **relatório de integridade**. Totais por categoria e por obra, cópias da mesma obra, cobertura de extração, chunks ilegíveis, metadados não resolvidos e derivados desatualizados em relação ao inventário da task 12. Deve reconciliar com o inventário ou explicar cada quarentena. Sem classificação de direitos e sensibilidade: essas colunas saíram do banco na migration `20260826140000`.
  - **References:** `conteudo/manifest.json`; `scripts/ocultismo-pipeline/corpus_hygiene.py`, que já guarda os portões que decidem o que entra; `query.py`; manifestos das tasks 12 e 13; `docs/OPERATIONS.md`.
  - **Acceptance:** todo resultado de busca aponta obra e locator; os totais do relatório reconciliam com o inventário ou declaram a diferença; o relatório é reprodutível e não depende de estado de sessão.
  - **QA happy:** frase-fixture conhecida retorna a obra e a passagem corretas, e o relatório fecha com o inventário.
  - **QA failure:** **passagem literal de obra de terceiro nunca alcança resposta pública** — é a fronteira insumo/obra do `BLUEPRINT` §5.0, e o que trafega é o achado derivado, com proveniência interna, nunca o texto-fonte.
  - **Commit:** `feat(corpus): add corpus integrity report`.

#### Wave 4 — Build deterministic ceremonial domain contracts

- [x] **17. Extract planetary day/hour calculation into a neutral astrology domain — FEITA em 28 de agosto de 2026.** `src/domain/astrology/planetary-hours/` concentra sequência caldaica, intervalo solar observado e proxy equinocial, sem conhecer Orixás. `src/domain/orixas/regency/temporal.ts` virou adaptador fino e manteve todos os seus exports; as seis fixtures golden de `temporal.test.ts` passam **sem alteração**, que era o critério de aceite. Nove testes novos cobrem determinismo, os dois hemisférios, a sequência caldaica atravessando a noite, as doze horas desiguais, o modo estrito polar devolvendo `unavailable` e o proxy rotulando a própria incerteza. `resolvePlanetaryHourInInterval` valida a própria fronteira porque os perfis de eleição da task 18 vão chamá-la direto.
  - **Implement:** move generic Chaldean day/hour, observed-solar intervals, interval progress and polar fallback into `src/domain/astrology/planetary-hours/`; keep a backward-compatible Orixá adapter and preserve outputs/version behavior unless intentionally version-bumped with changelog.
  - **References:** `src/domain/orixas/regency/temporal.ts:1-200`; `temporal.test.ts`; `src/domain/astrology/lunar.ts`; `AGENTS.md:domain rules`.
  - **Acceptance:** pure deterministic API accepts explicit instant/location/fallback; no React/Next/network/clock; old golden fixtures remain equal through adapter.
  - **QA happy:** golden tests across day/night and hemispheres (`.../T17/planetary-hours.txt`).
  - **QA failure:** polar strict mode returns typed unavailable while proxy mode labels uncertainty (`.../T17/polar-cases.txt`).
  - **Commit:** `refactor(astrology): extract neutral planetary hours`.

- [x] **18. Define versioned election profiles instead of a universal score — FEITA em 28 de agosto de 2026.** `src/domain/astrology/elections/` traz contratos, avaliador e perfis. A observação carrega versão de motor, de perfil, sistema de origem, locator e incerteza declarada, e o tipo **não oferece** campo de sucesso, score ou recomendação — só `matched`, `conflicted` ou `unavailable`. Dado ausente vira condição `indeterminate` com motivo, nunca palpite. `evaluateElections` mostra perfis divergentes lado a lado, sem conciliar. **Quatro perfis semeados** — Agrippa, Arbatel, Khan Secretum e Heptameron —, todos com passagem citada. A digitalização integral de Agrippa foi localizada depois do primeiro handoff; o perfil observa planeta da operação regendo dia e hora, mas permanece `unavailable` enquanto dignidades, Lua, Mercúrio e figura do céu exigidos pela fonte não forem computáveis. **Ars Paulina não é lacuna de texto:** sua regra vincula a construção do selo ao dia e hora já escolhidos e não define como eleger o momento, portanto continua fora do tipo em `electionProfileGaps`.
  - **Implement:** create strict contracts for named source-bound rule profiles, required/forbidden/preferred conditions, uncertainty, conflict and provenance locator; evaluator returns matched/conflicted/unavailable observations, never “guaranteed success.” Inject time and use existing lunar/transit/annual event calculations.
  - **References:** `src/domain/astrology/lunar.ts:51-153`; `src/domain/astrology/transits/index.ts:39-123`; `src/domain/astrology/annual-calendar.ts`; task-17 timing.
  - **Acceptance:** Heptameron/Agrippa/Arbatel/Ars Paulina profiles remain distinct; conflicting profiles are shown side-by-side; every output includes engine/profile/source versions and limitations.
  - **QA happy:** TDD golden election fixture per profile, with sanitized JSON evidence generated by task 18.
  - **QA failure:** missing coordinates/time/source rule returns typed unavailable, not a guessed time, with a sanitized JSON receipt generated by task 18.
  - **Commit:** `feat(ceremonial): add source-bound election profiles`.

- [x] **19. Create strict source-bound entity, correspondence and variant contracts — FEITA em 28 de agosto de 2026.** `src/domain/ceremonial/entity-records.ts`. Uma entidade só existe dentro de um `sourceSystemId`, e o identificador carrega o sistema para que nenhuma consulta perca o discriminante. Correspondência sem locator é recusada. `crossSystemRelationSchema` é o único caminho pelo qual dois sistemas se tocam, exige tipo e locator, e **não oferece `same_entity`** — só `shares_name`, `analogous_position`, `derived_from` e `contradicts`. `findNameCollisions` relata homônimos entre sistemas **sem os fundir**, que é o caso que mais convida ao erro. Construída sobre o grafo de funções, não em paralelo: o grafo afirma posição análoga entre tradições, este módulo guarda o que cada tradição diz da sua própria entidade.
  - **Implement:** add schemas that distinguish `workspaceKind` from `sourceSystemId`, plus entity kinds, names/aliases, rank/office, correspondences, seals/media and cross-references. Every relation states source edition+locator and type; aliases never merge entities across source systems, including systems grouped in one workspace.
  - **References:** `src/domain/orixas/regency/contracts.ts`; `questionnaire-matrix.ts`; task-8 schema; `docs/METHOD.md`.
  - **Acceptance:** IDs are branded/stable; exhaustive workspace discriminants coexist with open, validated source-system IDs; unknown workspace/system/variant combinations reject at boundaries.
  - **QA happy:** parse representative fixture from each system (`.../T19/contracts-happy.txt`).
  - **QA failure:** cross-system alias/locatorless correspondence is rejected (`.../T19/contracts-rejections.txt`).
  - **Commit:** `feat(ceremonial): define source-bound entity contracts`.

- [x] **20. Separate archival source access from safe actionable guidance — FEITA em 28 de agosto de 2026.** `src/domain/ceremonial/guidance-policy.ts` define `ceremonial-guidance-policy-0.1.0`, uma política pura para `create`, `update` e `export`. O input aceita somente categoria e alvo estruturados; texto livre não entra na decisão nem é ecoado. Estudo, reflexão, memória e rotina pessoal produzem checklist curto e limitado. Coerção, violência, autolesão, sacrifício/ferimento, ilegalidade e promessas médicas ou financeiras retornam recusa e ajuda tipadas; alvo não consentinte é recusado antes do checklist. Fonte histórica usa contrato separado `archival_source`, com sistema, edição, locator e aviso explícito, sem censura ou conversão em orientação. Não existem APIs de planner ainda; quando forem implementadas, todas as três operações deverão classificar a intenção e chamar esta mesma política — prompt livre não pode virar bypass.
  - **Implement:** create pure policy for goal categories and generated/checklist content. Local mode may display archival source text with provenance/warnings, but planner APIs must refuse coercion, violence, self-harm, sacrifice, illegality, medical/financial promises and targeting non-consenting people. Return typed refusal/help categories; do not modify or censor source artifacts.
  - **References:** approved draft safety decisions; `src/lib/orixas/contracts.ts` disclaimer patterns; `docs/BLUEPRINT.md`; `AGENTS.md:product identity/security`.
  - **Acceptance:** policy applies to planner creation/update/export, not only UI copy; raw source view and generated guidance have visibly different contracts.
  - **QA happy:** benign study/planning goals produce bounded checklists (`.../T20/safety-happy.txt`).
  - **QA failure:** adversarial harmful/coercive variants consistently refuse without echoing instructions (`.../T20/safety-redteam.txt`).
  - **Commit:** `feat(ceremonial): enforce safe planning policy`.

- [x] **21. Freeze domain versions, cross-source conflict behavior and coverage — FEITA em 31 de agosto de 2026.** `src/domain/ceremonial/domain-freeze.ts` congela as cinco superfícies determinísticas — eleições, política de orientação, hora planetária, variantes de fonte e discriminantes de sistema — com fingerprint por superfície além do global, de modo que uma quebra diga **onde** mudou. O fingerprint cobre o par entrada/saída: só a saída deixaria duas fixtures diferentes que coincidem no resultado indistinguíveis uma da outra. `frozenDomainVersions` reúne as sete versões declaradas pelos módulos e o teste as escreve literalmente — alterar qualquer saída quebra ali e obriga a `ANTES/DEPOIS/MOTIVO/IMPACTO` antes do bump. `createSourceCoverageReport` mede obra, edição, entidade, correspondência com locator e completude de timing, e expõe `collapsedWorkGroups`: as famílias que contribuíram com mais de uma atribuição para a mesma função, que somam material e não somam concordância. `createDomainConflictReport` não possui campo para vencedor, média ou resolução. **Dois desvios do texto original, ambos deliberados.** A task diz "all five system discriminants", mas `workspaceKindSchema` tem **seis** desde a task 19 — `AFRO_DIASPORIC` entrou depois de o roteiro ser escrito; o congelamento cobre os seis e o teste falha se um sétimo aparecer sem golden. E a evidência sanitizada não vira arquivo JSON: o diretório de evidências foi removido na consolidação de 28 de agosto, então o relatório é asserção de teste e entra no índice de evidências abaixo. **Achado que o congelamento produziu:** o grafo real já contém o colapso de linhagem que a task previa apenas como fixture — `function:passage-between-planes` tem duas atribuições e uma única família, ambas de Saraceni, e por isso permanece corretamente `single_school`. 15 testes; cobertura do código novo em 96,46% de statements e 94,54% de branches.
  - **Implement:** add golden datasets for planetary timing, elections, source variants, policy and all five system discriminants; create coverage reports showing source/edition/entity/correspondence/timing completeness without treating duplicate editions as independent consensus.
  - **References:** `src/domain/orixas/regency/dataset-freeze.test.ts`; `evidence-graph.test.ts`; `robustness.test.ts`; tasks 17-20.
  - **Acceptance:** same snapshots are deterministic; changing any output requires explicit version bump and `ANTES/DEPOIS/MOTIVO/IMPACTO`; new pure code maintains ≥80% coverage.
  - **QA happy:** targeted domain suite and snapshot hash pass (`.../T21/domain-freeze.txt`).
  - **QA failure:** duplicate-source and conflicting-rule fixtures remain observable and never silently reconcile; task 21 will persist the sanitized conflict report as JSON evidence.
  - **Commit:** `test(ceremonial): freeze domain and conflict behavior`.

#### Wave 5 — Condensar as tradições numa gramática de funções

> **Reenquadrada.** Estas tasks foram escritas como catálogos isolados, com a Task 27 impedindo
> cruzamento entre eles. A direção é o oposto: cada tradição alimenta **um** grafo de funções, e
> o registro por escola vira peso de evidência em vez de barreira. Ver `docs/BLUEPRINT.md`
> §5.0.1. Os títulos abaixo permanecem como referência do material a cobrir; o entregável de
> cada uma é a contribuição daquela tradição para a gramática comum, não um workspace próprio.

- [x] **22. Implement the Angelical adapters and catalog — FEITA em 31 de agosto de 2026, no enquadramento novo.** O entregável não é um workspace angélico isolado, e sim a contribuição da tradição angélica para a gramática comum de funções — é o que a nota de reenquadramento desta Wave determina. Cinco atribuições novas, todas com passagem conferida no texto: Gabriel/Lua e Raphael/Mercúrio em `function:divination-and-counsel`, Khamael/Marte em `function:iron-and-war-craft` por duas escolas, e Uriel/Vênus em `function:attraction-and-concord`. **Duas escolas, uma linhagem:** _Alta Magia Angelical_ (Frater Dalton R.F, O.G.B) e _Mágica Planetária Prática_ (Rankine e d'Este, Avalonia 2007) entram como `school:` distintos dentro de `family:renaissance-ceremonial`, porque ambos transmitem o mesmo fluxo solomônico-renascentista — somam testemunho, não somam convergência. **Defeito corrigido:** `school:trithemius` não era sustentado pela obra; a bibliografia declarada (p. 194) traz Vacchiano, Goddard, Mathers, Vitor Sanches, Sistemagia e Ordem Lótus Negro, e Trithemius não aparece. Virou `school:dalton-alta-magia-angelical`, com registro em `method-corrections.ts`. **Primeiro conflito real do grafo:** Dalton põe Haniel em Vênus, Rankine e d'Este põem Uriel; não são variantes do mesmo nome, e a discordância ficou registrada em vez de arbitrada. Grafo de 0.3.0 para 0.4.0-research, 27 para 32 atribuições, **sem que nenhuma força de convergência mudasse**. O que ficou de fora está justificado no docblock de `function-graph-data.ts`: Cassiel/Saturno e Phul/Aratron sustentam só metade de `affliction-and-cure`, a Lua é de elemento água mas de obras divinatórias, "projeção astral" é obra do operador e não regência da potência, e o material de videoaula não tem fontes declaradas.
  - **Implement:** create one distinct `sourceSystemId` and adapter for Heptameron, Ars Paulina, Dee/Enochian and every explicitly named Shem-derived modern school; group them only under `workspaceKind=ANGELICAL`. Model hierarchies, names, offices, seals and timing per edition without a universal angel hierarchy. Ingest only locator-backed records.
  - **References:** `/mnt/e/Ocultismo/Angelical e olimpicos`; `/mnt/e/Ocultismo/Magia Angelical e Olimpicos`; `docs/METHOD.md`; tasks 14, 18, 19.
  - **Acceptance:** UI/API can filter by system/edition; variants and conflicts remain visible; public projection follows rights policy.
  - **QA happy:** fixture per Angelical system renders source-specific record/timing; task 22 will persist sanitized Angelical JSON evidence.
  - **QA failure:** a name shared across systems remains separate and locatorless data is quarantined; task 22 will persist a sanitized conflict report.
  - **Commit:** `feat(ceremonial): add source-specific angelical workspace`.

- [x] **23. Implement Ars Goetia as its own source family — FEITA em 31 de agosto de 2026, no enquadramento novo.** Cinco atribuições do Lemegeton, todas com o ofício citado literalmente: Marbas em `affliction-and-cure`, Bune em `passage-between-planes`, Gusion em `divination-and-counsel`, Leraie em `iron-and-war-craft` e Beleth em `attraction-and-concord`. O acervo tem **três cópias** do Lemegeton mais a edição de Crowley e DuQuette, e elas entram como **uma** `family:lemegeton` — quatro exemplares, uma voz. Categoria `goetic_spirit` acrescentada ao vocabulário para que a condensação não funda panteões: espírito goético e Orixá podem ocupar a mesma função sem que um vire o outro, e a relação declarada segue sendo `analogous_position`. A fonte permanece registro histórico; converter descrição de arquivo em conselho acionável é recusado pela política da task 20. **Impacto real:** as duas funções mais frágeis do grafo deixaram de ser sustentadas por uma escola só — Marbas sustenta aflição e cura **nas duas metades**, que é justamente o que as fontes angélicas não faziam, e Bune sustenta a passagem entre planos. Nenhuma função continua `single_school`. Grafo de 0.5.0 para 0.6.0-research, 32 para 37 atribuições. **Exclusão exemplar:** Bael não entrou em `generative-waters` apesar de a tradução o chamar "senhor da tempestade e da fecundidade" — isso é o tradutor sobrepondo Baal, o deus cananeu, ao Bael do grimório, cujo ofício declarado na mesma frase é tornar invisível. Codificá-lo daria estatuto de tradição a um deslize de tradução. Focalor e Vepar governam águas para afogar e naufragar, não para gerar vida; Buer remedia sem impor limite.
  - **Implement:** model 72-spirit records by manuscript/edition with rank, office, seal variants, correspondences and source locators; keep archival descriptions distinct from safe planner guidance and do not convert coercive source language into recommendations.
  - **References:** `/mnt/e/Ocultismo`; `docs/METHOD.md`; tasks 14, 19, 20.
  - **Acceptance:** variant seals/offices can coexist; entity count is evidence-derived, not hardcoded as universal; no Theurgia record appears in Ars Goetia queries.
  - **QA happy:** representative multi-edition spirit fixture preserves both variants, recorded as sanitized task-23 JSON evidence.
  - **QA failure:** harmful planner goal refuses while archival source remains provenance-visible locally (`.../T23/goetia-safety.txt`).
  - **Commit:** `feat(ceremonial): add ars goetia workspace`.

- [x] **24. Implement Ars Theurgia-Goetia separately from Ars Goetia — FEITA em 31 de agosto de 2026.** O Livro II do Lemegeton está no acervo na edição de Benjamin Rowe (1999), conferida contra o microfilme do Sloane MS 2731 do Museu Britânico. Ele declara um ofício **coletivo** para os Espíritos Chefes — "mostrar & descobrir todas as coisas que estão escondidas […] & também os segredos dos Reis" — e é assim que entra em `function:divination-and-counsel`: a atribuição é da classe que a fonte nomeia, não de um espírito que ela não singularizou. Categoria `aerial_spirit` criada para que não sejam lidos como os 72 da Goetia. **Mesma `family:lemegeton`, de propósito:** Goetia, Theurgia e Almadel são três livros de uma compilação, não três testemunhas independentes, e há teste provando que as três obras contam como uma linhagem. Entrou junto o Ars Almadel, cujos anjos da Primeira Altitude sustentam `generative-waters` literalmente — "promovendo o bom nascimento e desenvolvimento das crianças, e fazendo a mulher que é estéril, fértil" —, levando aquela função a `convergent`.
  - **Implement:** add directional/aerial hierarchy, ranks, offices, seals and timing using Theurgia-specific adapters and routes; prohibit inheritance from Ars Goetia schemas except shared generic provenance/media primitives.
  - **References:** Lemegeton separation in `docs/METHOD.md`; `/mnt/e/Ocultismo`; task-19 contracts.
  - **Acceptance:** system discriminator is mandatory in storage/query/URL; Goetia/Theurgia entities cannot merge through aliases or import heuristics.
  - **QA happy:** Theurgia fixture returns only its source family, recorded as sanitized task-24 JSON evidence.
  - **QA failure:** cross-book import/query is rejected by schema and DB constraints (`.../T24/book-separation.txt`).
  - **Commit:** `feat(ceremonial): add theurgia-goetia workspace`.

- [x] **25. Implement Olympic-spirit records from Arbatel variants — FEITA em 31 de agosto de 2026.** **Defeito sistêmico encontrado e corrigido:** o texto do acervo separa a glosa moderna do compilador ("atua em todos os assuntos planetários de X") da citação do grimório, e as **cinco** atribuições olímpicas repousavam na glosa. Conferidas contra o Arbatel original, quatro se sustentaram e uma não: o grimório diz que Ophiel governa as coisas de Mercúrio, dá espíritos familiares e ensina todas as artes, e nada diz sobre abrir, fechar ou ordenar passagem. **Ophiel saiu de `function:path-opening`**, que perdeu uma linhagem — correção registrada em `method-corrections.ts` e publicada em `/metodologia`. Os quatro locators restantes passaram a citar o original. Rankine e d'Este entraram como segunda escola da mesma `family:arbatel` para Hagith, Phaleg e Bethor: catálogo versionado por fonte, sem ganho de convergência. Aratron e Phul continuam fora — "torna fecundo o que é estéril" é geração sem águas, e "cura a hidropepsia […] faz viver 300 anos" é cura sem o limite do corpo.
  - **Implement:** model Olympic spirits, planetary links, offices, seals and aphorism/edition locators; preserve 1575 witness and later translation differences; use an Arbatel timing profile rather than generic planetary recommendations.
  - **References:** `/mnt/e/Ocultismo/Angelical e olimpicos`; `docs/METHOD.md`; task-18 election profiles.
  - **Acceptance:** seven-spirit catalog is source-versioned; translation differences remain edition-scoped; no aliasing to planetary intelligences or angels.
  - **QA happy:** multi-edition Olympic fixture retains locators/timing, recorded as sanitized task-25 JSON evidence.
  - **QA failure:** editionless seal/timing is rejected (`.../T25/olympic-rejections.txt`).
  - **Commit:** `feat(ceremonial): add olympic spirits workspace`.

- [x] **26. Implement planetary intelligences and spirits as distinct entity classes — FEITA em 31 de agosto de 2026.** Categoria `planetary_intelligence` própria, que é o ponto inteiro da task. A inteligência Hagiel entrou em `attraction-and-concord` ("é bom para acabar com conflitos […] ajudar a ganhar amor") e em `generative-waters` ("permitir a concepção livre de esterilidade"). Vênus passou a reunir um arcanjo, um espírito olímpico e uma inteligência planetária, além dos Orixás, e há teste provando que as categorias permanecem distintas: compartilhar planeta é relação, nunca identidade. A própria obra resolve a variância de Marte listando "Camael, Madimiel, Martiel, Samael, Zamael" como outros nomes de Khamael — ali a fonte declara `name_variant` sozinha, e não há divergência a registrar.
  - **Implement:** model Agrippan planetary intelligences/spirits, tables/seals and correspondences with edition locators; link through planet IDs and timing profiles while explicitly preventing identity equivalence with Olympic spirits, angels, demons or Orixás.
  - **References:** Agrippa sources in `docs/METHOD.md`; `/mnt/e/Ocultismo`; `src/domain/astrology` body IDs; tasks 18-19.
  - **Acceptance:** shared planet relation is navigable but does not merge entities; public/local source projections obey rights policy.
  - **QA happy:** Saturn fixture shows linked but separate entities, recorded as sanitized task-26 JSON evidence.
  - **QA failure:** attempted cross-class alias merge fails (`.../T26/planetary-separation.txt`).
  - **Commit:** `feat(ceremonial): add planetary intelligence workspace`.

- [ ] 27. ~~Add cross-workspace ontology and leak regression suite~~ → **Verificar que a condensação preserva a contagem de escolas independentes**
  - **INVERTIDA.** Era uma suíte anti-vazamento entre tradições. Passa a verificar o contrário: que ao condensar por função o método continua distinguindo convergência de escolas independentes de repetição da mesma linhagem, e que nenhuma correspondência afirma identidade entre entes
  - **Implement:** generate a deterministic report over all imported records proving unique IDs, valid locators, system separation and explicit cross-relation types; include known confusing-name fixtures. _(A parte de "rights/access consistency" e "public filtering" caiu com o modelo de direitos em 26 de agosto.)_
  - **FEITA em 27-28 de agosto**, no substrato da Wave 5 em vez de sobre catálogos por tradição: `src/domain/orixas/regency/function-graph.test.ts` prova que a condensação conta **famílias de fonte independentes** e não obras — as quatro obras de Saraceni contam como uma linhagem, e Agrippa/Trithemius/Heptameron como outra —, que divergência vira conflito registrado em vez de média, e que a relação declarada é sempre `analogous_position`, nunca identidade. `entityCategory` impede que entidade de guia seja lida como Orixá. Evidência em `docs/IMPLEMENTATION_STATUS.md` (índice de evidências).
  - **References:** tasks 22-26; `src/domain/orixas/regency/correspondence-generation.test.ts`; task-11 bundle.
  - **Acceptance:** every entity belongs to exactly one primary system; every cross-system edge is explicit and sourced; public bundle contains no local-only body/media.
  - **QA happy:** ontology report passes representative complete fixtures and task 27 persists the sanitized JSON report.
  - **QA failure:** deliberate alias, missing locator and local-body leak each fail with precise reason (`.../T27/ontology-adversarial.txt`).
  - **Commit:** `test(ceremonial): enforce tradition separation`.

#### Wave 6 — Publicar o domínio cerimonial como obra

> **Reescrita em 31 de agosto de 2026.** O texto anterior foi escrito para o modo
> `disabled|public|local`, com bundle filtrado por direitos, rota que servia artefato-fonte e
> proveniência exibida na interface. Nada disso existe desde 26 de agosto: `docs/BLUEPRINT.md`
> §5.0 estabelece runtime único e a separação entre **insumo** e **obra** — o site publica a
> obra e nunca o insumo, e a proveniência por claim **sai da interface**, permanecendo
> registrada internamente para permitir corrigir o método.
>
> A Wave deixa de ser "entregar os dois modos" e passa a ser **dar superfície ao que as waves
> 4 e 5 construíram**. Hoje existem no domínio, sem nenhuma interface que os alcance: horas
> planetárias (T17), quatro perfis de eleição ligados à fonte (T18), registros de entidade
> (T19), política de orientação segura (T20), o congelamento e o relatório de divergências
> (T21) e um grafo de nove funções com 43 atribuições (T22–T27). É código verificado que o
> produto ainda não mostra.
>
> **A regra que governa toda esta Wave:** publica-se o que **nós** afirmamos — função, posição
> análoga, força da sustentação, conflito registrado, limite declarado. Não se publica escola,
> obra, edição nem locator por claim. A regra de linhagem é pública (já está em
> `/metodologia`); as linhagens de cada atribuição não são.

- [x] **28. Dar rota e registro tipado ao domínio cerimonial — FEITA em 31 de agosto de 2026, com a decisão tomada.** A superfície do grafo de funções entrou como **seção nova de `/metodologia`**, que já é o model card e é onde ele pertence conceitualmente — o método explicando a si mesmo. A ferramenta de tempo ganha rota própria na task 30, por ser instrumento interativo e não documentação. O nome `laboratorio-cerimonial` foi descartado junto com o modelo que o originou.
  - **Implement:** criar a superfície pública do domínio cerimonial com um registro tipado no servidor, e não ramificações dentro do `ProfileArchive` de 723 linhas. Uma decisão de produto continua aberta e precisa ser tomada antes de escrever a rota: se a superfície é uma seção nova de `/metodologia` — que já publica o model card — ou uma rota própria. O nome `laboratorio-cerimonial` vem do modelo descartado e descrevia leitura de fonte; se a rota nascer, precisa de nome que descreva o que ela de fato entrega.
  - **References:** `src/app/metodologia/page.tsx`; `src/domain/orixas/regency/public-method.ts`; `src/app/sitemap.ts`; `src/app/robots.ts`.
  - **Acceptance:** rota entra no sitemap; navegável por teclado; não altera a navegação de conta existente; nenhuma resposta carrega escola, obra, edição ou locator.
  - **QA happy:** teste de rota e do registro de módulos.
  - **QA failure:** módulo desconhecido devolve 404 sem vazar o registro.
  - **Commit:** `feat(ceremonial): add ceremonial domain route`.

- [x] **29. Publicar o grafo de funções como síntese, não como catálogo de fontes — FEITA em 31 de agosto de 2026.** `public-function-graph.ts` projeta as nove funções com pergunta, ocupantes, categorias visíveis e rótulo de sustentação. **A garantia é do tipo:** a projeção não possui campo para escola, obra, família, locator ou confiança, então nenhum identificador interno pode atravessar por descuido de quem monta a tela — não existe onde escrevê-lo. Teste varre a saída serializada e a árvore renderizada atrás de `school:`, `work:`, `family:`, `assignment:` e `Corpus local`. A sustentação sai em rótulo e nunca em percentual, e há teste de que nenhum `%` aparece. A divergência de Vênus é publicada como disputa de nome que não derruba a função; divergência que derrubasse a função ganharia nota dizendo isso, em vez de ser apresentada como consenso. Entidade sem nome de leitura **derruba a construção**: omiti-la em silêncio a faria sumir da página e a função apareceria com um ocupante a menos, como se aquela tradição não a sustentasse. A página é estática, então a falha aparece no build, que é onde ela deve aparecer.
  - **Implement:** exibir as nove funções estruturais, a pergunta que cada uma responde, as potências que ocupam posição análoga e a **força da sustentação** em rótulo qualitativo (`convergent`, `corroborated`, `single_school`), nunca em percentual. Mostrar as categorias distintas lado a lado — Orixá, entidade-guia, anjo, espírito olímpico, espírito goético, espírito aéreo, inteligência planetária — porque é a separação delas que impede a leitura sincrética. Divergência com `functionRemainsStable` vira nota de que as fontes discordam do nome e não da função; divergência que derrube a função **não pode** ser publicada como se fosse consenso.
  - **References:** `src/domain/orixas/regency/function-graph.ts` (`condenseStructuralFunctions`, `AnalogousPositionGroup`, `divergences`); `structural-functions.ts`; `public-factors.ts` como precedente de tradução para linguagem de leitura.
  - **Acceptance:** a projeção pública **não pode expressar** `claimSchoolId`, `workId`, `sourceFamilyId`, `locator` nem `extractionConfidence` — garantido por tipo, não por disciplina de quem escreve; a relação exibida é sempre "ocupa a mesma função", nunca identidade; teste prova que nenhum identificador interno atravessa.
  - **QA happy:** fixture das nove funções renderiza com rótulo de força e categorias distintas.
  - **QA failure:** tentativa de projetar locator ou escola falha no tipo e no teste.
  - **Commit:** `feat(ceremonial): publish condensed function graph`.

- [x] **30. Entregar a vista de tempo e de eleições — FEITA em 1º de setembro de 2026.** O motor das tasks 17 e 18 ganhou superfície: rota `/tempo-cerimonial` e API `/api/ceremonial/timing`, ambas sem conta e sem persistência — instante e lugar entram na requisição, produzem a observação e não são gravados. `public-observation.ts` traduz o que o motor observou; **nomear a obra é a informação, apontar para o nosso corpus não é**, então o tipo tem `sourceName` e não tem onde escrever `locator`. Os quatro perfis aparecem lado a lado com `matched`, `conflicted` e `unavailable` distintos e nada os concilia. Agrippa continua `unavailable` e a página diz por quê. O modo polar estrito devolve que não há hora planetária em vez de inventar horário, e o proxy rotula a própria aproximação — a incerteza viaja no resultado. Sem instante, latitude e longitude a página **não responde nada**: sem fuso não há como saber que hora do dia é ali. Não existe campo de nota, ranking ou recomendação, verificado por varredura de chaves e não de prosa. A rota é pública sem conta, como o geocoding, e por isso tem **o mesmo limite por cliente**, identificado por HMAC do IP encaminhado e nunca pelo IP em claro; Redis fora do ar falha fechado com 503 em vez de virar porta aberta. A página entrou no cabeçalho e no rodapé — estava no sitemap e inalcançável pela navegação.
  - **Implement:** entrada de lugar e instante com incerteza declarada, linha do tempo de regente do dia e da hora, contexto lunar e as observações dos perfis de eleição **lado a lado**, sem conciliar. Estados `matched`, `conflicted` e `unavailable` são visíveis e distintos; Agrippa continua `unavailable` enquanto dignidades e figura do céu não forem computáveis, e a interface precisa dizer isso em vez de escondê-lo. Nunca exibir nota de sucesso, ranking ou recomendação de melhor momento.
  - **References:** `src/domain/astrology/elections/` (T18); `src/domain/astrology/planetary-hours/` (T17); `electionProfileGaps`; `LunarIntelligencePanel`; `AGENTS.md` sobre comunicar incerteza.
  - **Acceptance:** timezone, coordenadas e instante atravessam API validada; o modo polar aparece na interface — o estrito diz que não há intervalo solar, o proxy diz que é aproximação; toda observação carrega versão de motor e de perfil.
  - **QA happy:** fixture de lugar e instante fixos rende observação determinística por perfil.
  - **QA failure:** lugar polar e longitudes lunares ausentes rendem explicação delimitada, nunca horário inventado.
  - **Commit:** `feat(ceremonial): add timing and election views`.

- [x] **31. Cifrar os registros privados de prática — módulo criptográfico FEITO em 1º de setembro de 2026; a ligação com o Prisma fica na task 32.** `src/lib/security/record-encryption.ts` faz AES-256-GCM com keyring versionado: exatamente uma chave ativa de 32 bytes, aposentadas mantidas só para leitura, IV de 96 bits aleatório por chamada e AAD ligando `{userId, recordId, fieldName, schemaVersion, keyVersion}` — **mover um envelope para outro usuário, registro ou campo é adulterar**, e a tag não fecha. A rotação é idempotente por versão, de modo que uma rotação interrompida seja retomável sem reprocessar o que já passou, e `retiredKeyIsReferenced` acusa chave ainda em uso antes que alguém a remova, porque apagá-la torna aquele dado ilegível para sempre. As falhas são categorias tipadas sem detalhe: distinguir "tag errada" de "chave errada" na mensagem entregaria ao atacante o que ele quer saber. Os modelos `CeremonialPlan` e `CeremonialSession` já tinham os campos `*Envelope`, herdados do esquema da task 8. **Falta ligar** as rotas a este módulo, o que é o escopo da task 32.
  - **Implement:** AES-256-GCM do `crypto` do Node com keyring versionado contendo exatamente uma chave ativa de 32 bytes mais as aposentadas necessárias à leitura. Envelope `{schemaVersion,keyVersion,iv,tag,ciphertext}` com IV de 96 bits único e AAD ligando `{userId,recordId,fieldName,schemaVersion,keyVersion}`. Cifrar intenção, títulos, seleção de entidades, metadados de agendamento, notas de checklist, observações e desfechos, salvo campo documentado como não sensível. Rotação retomável com transação, checkpoint e rollback; remover chave aposentada é bloqueado enquanto houver envelope que a referencie.
  - **References:** `src/app/api/profiles/[profileId]/journal/route.ts`; `src/lib/config/read-secret.ts`; padrões de propriedade por dono já usados nas rotas de perfil.
  - **Acceptance:** validação estrita de keyring, tamanho e versão de chave; nenhum snapshot de banco, log ou cache contém metadado de prática em claro; tag adulterada, chave ausente ou aposentada falham de forma tipada e sem corromper linha.
  - **QA happy:** fixture determinística de criar, ler, atualizar e rotacionar, com IV aleatório em produção.
  - **QA failure:** adulteração e chave ausente recusam com segurança.
  - **Commit:** `feat(ceremonial): encrypt private ritual records`.

- [ ] 32. Completar o ciclo de vida próprio do dono
  - **Implement:** APIs de mesma origem, delimitadas por Zod, para catálogo, tempo, planos e sessões; CRUD e idempotência por dono nas escritas; rotas dinâmicas e `no-store` onde houver dado próprio. Exportação inclui apenas registros decifrados do próprio usuário, após ação autenticada explícita, e **referências ao método**, nunca texto de fonte. Exclusão seletiva e em cascata, com purga de cache; chaves de cache contêm versões, e componente derivado de usuário ou de lugar entra só como HMAC delimitado por segredo injetado.
  - **References:** rotas de perfil e de diário; `src/app/api/auth/export/route.ts`; `src/lib/security/headers.ts`; tasks 20 e 31.
  - **Acceptance:** o DTO público **não consegue expressar** caminho de acervo nem corpo de fonte; limites de taxa falham fechados; corrupção do Redis vira miss observado, nunca resposta parcial silenciosa.
  - **QA happy:** integração cobrindo CRUD, exportação e exclusão pelo dono.
  - **QA failure:** não-dono, CSRF, corpo excessivo, replay e falha de Redis recusam.
  - **Commit:** `feat(ceremonial): add private lifecycle APIs`.

- [ ] 33. Fechar acessibilidade, responsivo e QA de uso real
  - **Implement:** jornadas Playwright para cada superfície nova em mobile e desktop, só por teclado, cobrindo estados de erro, vazio e desconhecido, a vista de tempo, o planejador cifrado, exportação e exclusão. Fixtures sintéticas apenas; capturar sem corpo de resposta ou sanitizar traces e capturas, e varrer as evidências por sentinela. Preservar a hierarquia do Observatório Ritual, um insight por momento, sem virar catálogo de efeitos.
  - **References:** `tests/e2e/`; `src/components/account/product-modules.test.tsx`; `docs/BLUEPRINT.md` §10.3; `AGENTS.md` sobre UI.
  - **Acceptance:** contraste, foco e semântica em WCAG 2.1 AA; sem corte em 320px, tablet e desktop; movimento reduzido respeitado; nenhum erro de console ou de rede e nenhum deslocamento de layout.
  - **QA happy:** traces e capturas das jornadas.
  - **QA failure:** estado desconhecido de tempo, API offline e conteúdo ausente permanecem utilizáveis.
  - **Commit:** `test(ceremonial): cover accessible ceremonial journeys`.

#### Wave 7 — Operations, isolation and release readiness

- [ ] 34. ~~Verify and harden the physically split public/local runtimes~~ → **Endurecer o runtime único**
  - **REENQUADRADA.** Não há divisão física a verificar. O que resta é o isolamento que continua real: o container de ingest sem rede, o acervo montado read-only, e a garantia de que nenhuma resposta pública carrega caminho de host ou passagem literal de fonte
  - **Implement:** audit the task-7 split: public and local use separate PostgreSQL, Redis, storage, credentials and named volumes; keep `compose.yml` public-safe with no archive/key/derivative mount; local override mounts `/mnt/e/Ocultismo` read-only plus private derivative volume and ingest service. Pin images, non-root users, no-new-privileges, internal networks and healthchecks. Dockerfile public stages never `COPY` corpus/derivatives; process mode is immutable after startup.
  - **References:** `compose.yml:3-161`; `compose.dev.yml`; `Dockerfile`; `.dockerignore`; `docs/OPERATIONS.md`.
  - **Acceptance:** public config has no local path/key/ingest service; local config has no public bind by default beyond loopback; both configs validate and become healthy.
  - **QA happy:** render/start both Compose combinations and save redacted configs (`.../T34/compose/`).
  - **QA failure:** scan public image layers/filesystem for archive markers and fail on any match (`.../T34/image-leak-scan.txt`).
  - **Commit:** `ops(ceremonial): isolate public and local runtimes`.

- [ ] 35. Extend backup, restore and key-rotation runbooks without duplicating source corpus
  - **Implement:** back up PostgreSQL metadata/encrypted records and derivative manifest with checksums; exclude rebuildable derivative/SQLite FTS and archive files. Retain encrypted backups for 30 days. Write deletion tombstones to a separately protected, append-only ledger retained 37 days; every restore replays and verifies all tombstones before app/readiness access, then rebuilds derivatives/search. Document encrypted keyring backup and rotation/revocation separately.
  - **References:** `scripts/backup-postgres.sh`; `scripts/verify-postgres-restore.sh`; `docs/OPERATIONS.md`; task-12 manifest; task-31 encryption.
  - **Acceptance:** restored app stays unready until deletion-ledger replay succeeds; deleted plans/sessions/feedback cannot reappear from any retained backup; backup/tombstone expiry is enforced; public backup has no corpus/derivative/keyring; no `down -v`.
  - **QA happy:** automated isolated backup/restore rehearsal (`.../T35/restore.txt`).
  - **QA failure:** wrong key or changed archive produces explicit degraded state, not data loss (`.../T35/restore-mismatch.txt`).
  - **Commit:** `ops(ceremonial): add private-data restore procedure`.

- [ ] 36. Add privacy-safe observability and SLOs
  - **REENQUADRADA.** "Both modes" não existe mais; é um runtime só
  - **Implement:** instrument counts/durations/status categories only for ingest, policy denies, extraction failures, timing and APIs; update Pino redaction tests for archive paths, source text, ritual notes and encrypted envelopes. Define initial beta SLOs (99.5% monthly availability for public routes, p95 API <2s excluding ingestion, <1% 5xx) and provider-neutral Alertmanager webhook configuration.
  - **References:** `docs/OPERATIONS.md`; `compose.quality.yml`; `compose.yml:111-146`; central logger/redaction tests; `docs/IMPLEMENTATION_STATUS.md:264-269`.
  - **Acceptance:** no sensitive label/high-cardinality IDs; alert payloads contain service/route category only; local ingestion alerts remain local unless explicitly configured.
  - **QA happy:** observability smoke triggers sanitized synthetic alert (`.../T36/observability.txt`).
  - **QA failure:** canary secrets/path/snippet never appear in logs/metrics/alerts (`.../T36/redaction-scan.txt`).
  - **Commit:** `ops(ceremonial): add safe metrics and beta SLOs`.

- [ ] 37. ~~Add adversarial public-isolation and release-smoke gates~~ → **Gates de release e de não-vazamento de fonte**
  - **REENQUADRADA.** O adversário deixou de ser "o modo público alcança dado local". Passa a ser: uma passagem literal de obra de terceiro, um caminho do acervo ou PII aparecendo numa resposta ou num artefato de build
  - **Implement:** seed restricted sentinel `ASTROAXE_LOCAL_ONLY_7F3C91` and publishable sentinel `ASTROAXE_PUBLIC_OK_42A8D0` across work/text/media/path/plan/cache fixtures; run public APIs, pages, RSC/static responses, sitemap, robots, JSON-LD, search, exports, logs, source maps, `.next`, public directory and standalone image/layers; assert zero restricted occurrences and publishable occurrence only in its approved response. Prime local cache first, then switch to public fixture to prove mode-separated keys. Add this to `scripts/release-smoke.sh` and quality documentation without using real protected strings.
  - **References:** `scripts/release-smoke.sh`; `src/app/sitemap.ts`; `src/app/robots.ts`; `src/app/api/auth/export/route.ts`; imagens da task 34. _(O bundle da task 11 não existe desde 26 de agosto.)_
  - **Acceptance:** gate fails on any local canary or internal rule/weight marker; test proves the scanner itself detects an intentionally contaminated fixture.
  - **QA happy:** clean public build passes with report (`.../T37/release-leak-gate.txt`).
  - **QA failure:** contaminated bundle/build is rejected (`.../T37/contamination-proof.txt`).
  - **Commit:** `test(release): block local corpus leakage`.

- [ ] 38. Reconcile privacy, safety and operating documentation
  - **REENQUADRADA.** A parte de direitos saiu; a documentação a reconciliar é privacidade, segurança e operação
  - **Implement:** update privacy page, data inventory, cultural operations, knowledge sources, deployment, backup, quality, changelog, implementation status and project memory. Explain dual modes, local full/public hybrid, lawful publication criteria, sensitive-belief/private-record handling, retention/withdrawal status, no external LLM/analytics, safety boundaries and observed—not claimed—validation.
  - **References:** `src/app/privacidade/page.tsx`; `docs/OPERATIONS.md`; `docs/METHOD.md`; `docs/METHOD.md`; `docs/IMPLEMENTATION_STATUS.md`; `docs/PROJECT_MEMORY.md`.
  - **Acceptance:** public copy never implies local material is licensed; controller/legal/provider items remain explicit blockers until supplied; docs match actual routes/models/migrations/counts.
  - **QA happy:** link/content/release smoke and doc consistency checklist (`.../T38/docs.txt`).
  - **QA failure:** grep-based contradiction fixtures plus code-backed assertions catch “not persisted”/“publicly available” drift (`.../T38/docs-drift.txt`).
  - **Commit:** `docs(ceremonial): reconcile privacy and operating docs`.

- [ ] 39. Run the complete checkpoint and publish the remaining external-dependency roadmap
  - **Implement:** run migration deploy on isolated staging, tests, coverage, build, E2E, performance, observability, release smoke, restore and Sonar. Both public activation and the local sensitive planner/session feature remain blocked until structured, non-revoked approvals exist for sensitive-data governance, legal basis/30-day backup retention/37-day tombstones and adult-access enforcement; public activation additionally requires rights/legal review and exact bundle approval. Read-only local archival access may remain separate behind its own access/safety gate. Keep external SMTP/domain/TLS/secret-manager/analytics/Stripe and Orixá calibration explicitly unclaimed.
  - **References:** `package.json:13-40`; `docs/OPERATIONS.md`; `docs/OPERATIONS.md`; `docs/IMPLEMENTATION_STATUS.md:257-326`; `AGENTS.md:completion criteria`.
  - **Acceptance:** zero new bugs/vulnerabilities, hotspots reviewed, new-code coverage ≥80%, duplication ≤3%, all isolation checks pass; release command machine-validates approval type/scope/reviewer-role/date/coverage/review-or-expiry/revocation without pretending to validate legal correctness; any missing/revoked approval blocks activation.
  - **QA happy:** archive all sanitized gate receipts under `.../T39/` and update dated memory.
  - **QA failure:** deliberately failing isolation/restore test blocks completion and leaves rollback/roll-forward instructions (`.../T39/blocking-proof.txt`).
  - **Commit:** `chore(release): verify AstroAxe release readiness`.

### Final verification wave

- [ ] F1. Plan-compliance audit
  - Verify every task, dependency, Must-NOT-Have and evidence path against the executed diff; reject missing todos, changed scope, edited applied migrations or undocumented deviations. Evidence: `.../F1/compliance.md`.

- [ ] F2. Revisão de qualidade, segurança e privacidade
  - **Reenquadrada.** Não há política de direitos nem isolamento público/local a revisar. Revisar de forma independente tipos estritos, fronteiras Zod, restrições de banco, cifragem, propriedade por dono, CSRF e limites de corpo, log e redação, cache e versionamento, e a fronteira entre insumo e obra; rodar os conselheiros de segurança e desempenho e a análise estática. Evidência: registrada no índice deste documento.

- [ ] F3. QA funcional e visual de uso real
  - **Reenquadrada.** Não existem cinco workspaces nem dois modos. Rodar a jornada autenticada da Tríade e as superfícies cerimoniais da Wave 6 — grafo de funções, tempo e eleições, planejador cifrado — em mobile e desktop, com fixtures sintéticas apenas; capturar traces e imagens sanitizadas e sem corpo de resposta, verificar teclado, foco e movimento reduzido, e cobrir exportação, exclusão e os estados de falha. Evidência: registrada no índice deste documento.

- [ ] F4. Auditoria adversarial de fidelidade e de release
  - **Reenquadrada.** O adversário não é mais "o modo público alcança dado local", porque não há dois modos. Passa a ser: **passagem literal de obra de terceiro, caminho do acervo, locator, escola de claim ou PII aparecendo numa resposta pública ou num artefato de build**. Semear sentinelas no corpus e nos registros privados e provar que nenhuma resposta, exportação, cache, arquivo de SEO, artefato `.next` ou camada de imagem as contém; provar que o scanner detecta uma fixture contaminada de propósito; verificar que as categorias de entidade permanecem distintas na projeção pública e que objetivo de planejador coercitivo continua recusado. Evidência: registrada no índice deste documento.

## Índice de evidências

As evidências completas das tasks concluídas estavam em `docs/IMPLEMENTATION_STATUS.md` (índice de evidências) e foram removidas
com o diretório. O que cada uma registrou:

| Task  | Registro                                                                                        |
| ----- | ----------------------------------------------------------------------------------------------- |
| `T2`  | T2 — Make Tríade calculation and feedback boundaries fail closed (2026-08-26)                   |
| `T2`  | T2 — rejection matrix, table-driven via route.test.ts (2026-08-26)                              |
| `T3`  | T3 — QA failure matrix, feedback-form.test.tsx (2026-08-26)                                     |
| `T3`  | T3 — Bind explicit consent and complete the feedback UI state machine (2026-08-26)              |
| `T4`  | T4 — constraint and DELETE rejection matrix (2026-08-26)                                        |
| `T4`  | T4 — Add additive database hardening and feedback withdrawal (2026-08-26)                       |
| `T5`  | T5 — Complete calibration export and benchmark provenance (2026-08-26)                          |
| `T5`  | T5 — leak scan: no PII/comments/internal weights/claim IDs in the shareable output (2026-08-26) |
| `T6`  | T6 — Lock the Tríade v3 journey, documentation and quality checkpoint (2026-08-26)              |
| `T6`  | T6 — QA failure: rejected consent/version produces no row and no success message (2026-08-26)   |
| `T7`  | T7 — Introduce a parsed, fail-closed deployment-mode contract (2026-08-26)                      |
| `T7`  | T7 — fail-closed rejection matrix (2026-08-26)                                                  |
| `T8`  | T8 — database-level rejection matrix (2026-08-26)                                               |
| `T8`  | T8 — Add the provenance-first ceremonial schema through reviewed migrations (2026-08-26)        |
| `T9`  | T9 — adversarial access-policy cases (2026-08-26)                                               |
| `T9`  | T9 — per-facet access-policy matrix (2026-08-26)                                                |
| `T10` | T10 — artifact delivery adversarial checks (2026-08-26)                                         |
| `T10` | T10 — authenticated local artifact delivery (2026-08-26)                                        |
| `T11` | T11 — deterministic public bundle and rejection evidence (2026-08-26)                           |
| `T12` | T12 — falhas, adversários e defeitos encontrados na execução real (2026-08-26)                  |
| `T13` | T13 — adversários, limites e defeitos encontrados na execução real (2026-08-26)                 |
| `T13` | _(evidência JSON sanitizada: `extraction-manifest-sanitized.json`)_                             |
| `T13` | _(evidência JSON sanitizada: `fixture-matrix-sanitized.json`)_                                  |
| `T14` | T14 — linhagem, conflitos e o que o corpus real revelou (2026-08-26)                            |
| `T14` | _(evidência JSON sanitizada: `import-real-archive-sanitized.json`)_                             |
| `T21` | T21 — congelamento das cinco superfícies e relatório de conflito não conciliado (2026-08-31)    |
| `T27` | T27 — a condensação preserva a contagem de escolas independentes (2026-08-28)                   |

O texto integral de cada evidência permanece recuperável pelo histórico do Git, no commit
anterior a esta consolidação.
