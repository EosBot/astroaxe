# Estado de implementação e handoff

Atualizado em 26 de agosto de 2026. Este documento registra o estado observável do workspace; não
representa deploy, revisão humana externa ou commit Git.

O ponto curto de retomada entre sessões é `docs/PROJECT_MEMORY.md`.

## Resumo executivo por fase

| Fase                   | Estado                                       | Entrega observável                                                           | Próxima fronteira                                                           |
| ---------------------- | -------------------------------------------- | ---------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| 0 — Governança         | Concluída no escopo local                    | Blueprint, política cultural/IA, fontes e operação editorial                 | Formalizar créditos, contratos e remuneração quando fornecidos              |
| 1 — Fundação           | Concluída                                    | Docker, PostgreSQL/pgvector, Redis, Traefik, health, Sonar e restore testado | Endurecer e medir a operação containerizada                                 |
| 2 — Motor              | Concluída no escopo natal e trânsitos atuais | Cálculo determinístico, hora desconhecida, golden tests, cache e janelas     | Ampliar efemérides/regras somente com snapshots e bump de versão            |
| 3 — Conta e mapa       | Concluída no MVP local                       | Guest-first, autenticação, ownership, arquivo, edição, histórico e E2E       | Exercitar continuamente os fluxos completos em desktop e mobile             |
| 4 — Conteúdo           | V3 dirigida, validação em curso              | Workflow editorial, corpus público e Tríade v3 auditável                     | Calibrar com casos elegíveis congelados e publicar métricas suficientes     |
| 5 — Ritual e IA        | Parcial avançada                             | Tempo do Céu, diário privado versionado e exportável; sem LLM em runtime     | Histórico longitudinal e RAG opcional quando houver chave/corpus autorizado |
| 6 — Receita            | Não iniciada                                 | Hipóteses documentadas, sem cobrança simulada                                | Free/Pro, limites, Stripe e webhooks após decisões e credenciais de teste   |
| 7 — Polimento/operação | Parcial avançada                             | Acessibilidade, E2E, SEO, backup/restore, métricas/alertas locais e gate     | Destino externo de alertas e SLOs do ambiente real                          |

## Concluído

### Laboratório Cerimonial — fundação dual-mode

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
  metadata-only ou negado. Próxima task executável: T12, inventário read-only do corpus local.

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
  mesmo quando passa, a versão fica somente elegível para revisão cultural, nunca ativa
  automaticamente.
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

A migration 11 adiciona `REFERENCE_ONLY`, `CLAIM_ELIGIBLE` e `WITHDRAWN` às fontes. Oito livros
de Rubens Saraceni e dos corpus/estudos iorubás foram catalogados apenas como referência. O fluxo
editorial bloqueia claims sem locator ou baseadas em obra ainda não lida e habilitada.

A migration 12 adiciona uma constraint de profundidade para textos astrológicos publicados e
materializa 350 leituras `modular-ptbr-1`. No banco isolado, os mínimos observados foram 398
caracteres de abertura, 1.591 de aprofundamento, 352 de explicação técnica, 80 de reflexão e 182 de
prática. Essa aprovação automatizada não se aplica a claims culturais.

As migrations 13–15 registram a aprovação cultural declarada, publicam quatro verbetes profundos,
adicionam a fonte integral de Ogumefu como elegível apenas para síntese original e corrigem a
vigência para o início da data aprovada. No banco isolado há quatro verbetes culturais publicados;
os corpos possuem entre 2.904 e mais de 3.000 caracteres nas versões IPHAN, e o bloco narrativo
também satisfaz a constraint de 1.800 caracteres.

### Experiência, motion e acessibilidade

- A apresentação de signos e Ascendente deriva os nomes em português da longitude e exibe o grau
  dentro do signo, sem alterar o núcleo astronômico. A mudança possui função pura, testes e registro
  em `docs/astrology-calculation-changelog.md`.
- O onboarding adotou o contrato visual de `docs/design-references.md`: palco orbital, foco claro e
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

### P1 — Completar conteúdo e regências culturais

1. A primeira Tríade direta já está modelada em modo de pesquisa, com inputs, pesos, claims,
   tradição, justificativa, abstenção e testes golden. A ativação pública continua bloqueada até a
   calibração por casos sacerdotais consentidos e autodeclarações públicas verificáveis, conforme
   autorização de 20 de agosto de 2026.
2. Ampliar o corpus com fontes efetivamente lidas e locators. As obras de Rubens Saraceni, Prandi,
   Verger, Juana Elbein dos Santos, Abimbola e Bascom continuam `REFERENCE_ONLY` enquanto houver
   apenas catálogo ou registro bibliográfico. Não copiar texto protegido nem misturar Umbanda
   Sagrada, Candomblé Ketu/Nagô e corpus de Ifá.
3. Criar novas versões longas e claims para cada narrativa aprovada, mantendo fonte, tradição,
   limites e correção versionada. A aprovação é por bloco reutilizável, não por tela renderizada.
4. Conectar o conteúdo cultural ao produto somente depois de ontologia, matriz, calibração e teste
   congelado. A interface apresentará diretamente frente, cabeça e costas como resultado do método
   autoral AstroAxe, com versão, fatores determinantes e disclaimer discreto no rodapé.
5. Implementar RAG somente quando houver corpus autorizado e necessidade validada. Exigir anchors,
   saída Zod, política contra PII, timeouts, retry limitado, fallback para texto preexistente e
   rótulo de IA. A ausência de chave de IA não bloqueia o produto atual.

### P2 — Produto, receita e crescimento responsável

1. Definir limites reais dos planos Free/Pro e quais benefícios sustentam assinatura. Validar com
   usuários antes de cristalizar os preços que hoje são hipóteses.
2. Validar com usuários a navegação longitudinal do Tempo do Céu; o histórico diário de um ano,
   journaling privado, exportação e exclusão LGPD explícita já estão implementados.
3. Preparar beta e integrar analytics apenas após o contrato de finalidade/fornecedor e a política
   LGPD. A fronteira fail-closed e o vocabulário mínimo já existem; nenhum dado natal, coordenada ou
   texto de diário pode ser enviado.

### P3 — Produção

1. Definir provedor, domínio, TLS, secret manager, banco/Redis gerenciados ou operação equivalente.
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
- Deploy, domínio, email transacional, monitoramento externo e política LGPD final exigem escolhas e
  credenciais do responsável pelo produto.

## Estado Git e operação

- As mudanças permanecem no working tree e não foram commitadas, conforme ausência de autorização.
- `.env` local existe, está ignorado e não deve ser versionado ou exibido.
- SonarQube usa tokens permanentes distintos no `.env` local, por decisão explícita do responsável;
  eles devem ser rotacionados e nunca versionados.
- Banco isolado observado: 16 migrations aplicadas, 3 rascunhos históricos, 4 verbetes publicados
  e 4 pareceres `APPROVED`. App, PostgreSQL e Redis estavam saudáveis no último checkpoint.
- O volume persistente histórico do projeto Compose principal é PostgreSQL 16 e não inicia com a
  imagem PostgreSQL 18 atual. Ele foi preservado intacto: a correção exige clone, backup e
  `pg_upgrade`/restore planejado, nunca exclusão do volume. As validações recentes usaram projetos e
  volumes isolados.
- Não existe evidência de deploy, CI remoto, domínio público ou monitoramento externo; esses itens
  não devem ser apresentados como concluídos. Backup local possui restauração comprovada, mas ainda
  não existe cópia externa criptografada nem teste em infraestrutura hospedada.
- Antes de retomar: leia `AGENTS.md`, `docs/BLUEPRINT.md`, este arquivo e
  `docs/cultural-content-operations.md`; execute `git status --short` e preserve mudanças alheias.
