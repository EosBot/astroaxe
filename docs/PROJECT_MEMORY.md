# Memória canônica do projeto

## Atualização 2026-08-26 — Wave 2 dual-mode concluída

- A divergência anterior foi corrigida: as Tasks 7–11 do roteiro estão concluídas e a Wave 2 está
  fechada. O total observado é 11 de 39 tasks de implementação.
- T7 criou os modos imutáveis e fail-closed `disabled|public|local`, com runtime local isolado em
  loopback, Compose/credenciais/volumes próprios e vocabulário congelado de direitos, acesso,
  sensibilidade e facetas.
- T8 adicionou a migration `20260826020000_ceremonial_corpus`, com 15 tabelas aditivas para
  proveniência, sistemas separados, obras/edições/artefatos/locators, entidades/variantes, mídia,
  correspondências, timing, revisões estruturadas e envelopes privados. O banco observado possui
  22 migrations aplicadas.
- T9 centralizou a autorização pura por faceta. Modo público exige acesso público, escopos atuais
  de revisão RIGHTS e EDITORIAL e direitos elegíveis para corpo/exportação; conhecimento restrito
  fica metadata-only. Modo local exige autenticação. Entrada adulterada, modo desabilitado,
  aprovação expirada/revogada ou registro local-only negam de forma explícita.
- T10 adicionou armazenamento local seguro e uma rota dinâmica autenticada. Caminhos são sempre
  relativos e normalizados; o arquivo é aberto com `O_NOFOLLOW`, verificado como regular e
  confirmado sob o root canônico pelo descritor já aberto. MIME é validado pelos bytes; ranges usam
  o mesmo descritor. Modo público/desabilitado nega antes de autenticação, banco ou filesystem, e
  respostas nunca revelam caminho local.
- T11 adicionou bundle público canônico e estrito, seleção por política T9, hash SHA-256, relatório
  de exclusões, mídia apenas por hash e verificação independente de schema/direitos/revisões no
  destino. A migration `20260826120000_ceremonial_public_bundles` cria namespaces imutáveis e um
  ponteiro singleton ativo/anterior; ativação e rollback são transacionais e revalidam mídia.
- Checkpoint direcionado T9: typecheck e lint passaram; 28 testes de modo/política passaram. O
  checkpoint completo de coverage/build/E2E/Sonar permanece reservado ao gate da Wave 2.
- Em 26 de agosto de 2026, o responsável autorizou prosseguir com acesso/processamento do corpus
  local nas Tasks 12–13 e com as decisões de produto das Tasks 15 e 22–26. A autorização permite o
  trabalho, mas não presume licença, domínio público, competência sacerdotal ou aprovação cultural:
  classificações sem evidência continuam fail-closed e material protegido não se torna publicável.
- Checkpoint T11: 10 testes de bundle/store, typecheck, lint, migration deploy e build Docker de
  produção passaram. O banco possui 23 migrations. O primeiro build Docker sofreu `ECONNRESET` no
  `npm ci`; a repetição passou e compilou Next/TypeScript integralmente.
- Próxima retomada: Task 12, inventário read-only e retomável de `/mnt/e/Ocultismo`.

## Atualização 2026-08-26 — Wave 1 do roteiro cerimonial: Tríade v3 fechada

- Concluída a Wave 1 (`.omo/plans/astroaxe-roadmap-ceremonial-laboratory.md`, tarefas 1-6):
  baseline congelada, boundaries da Tríade endurecidas (mesma origem em POST/PUT/DELETE, leitor
  JSON limitado com 413/415, erro de cálculo sanitizado 503), consentimento do feedback vinculado
  a estado controlado (não é mais possível enviar sem marcar, mesmo contornando o botão),
  `orisa-research-lab.tsx` dividido em componentes menores que 250 linhas.
- Nova migration `20260826000000_regency_feedback_constraints` adiciona CHECK constraints
  (verdict, confirmation_basis, forma JSON, consistência knows_orisas/corrected_triad) como
  última defesa. Nova rota `DELETE` permite retirar um feedback específico sem apagar o mapa.
- Exportação pessoal passou a incluir as cinco versões (método/matriz/config/scorer/questionário)
  de cada feedback. Novo relatório agregado internamente restrito
  (`regency:evaluate -- --aggregate-release`) publica contagens sobre dimensões fixas
  predeclaradas com amostra mínima de 30, supressão primária abaixo de 10, supressão
  complementar e bloqueio por risco de ataque de diferenciação contra releases anteriores,
  persistidos na nova tabela `regency_benchmark_releases` (decisão explícita do responsável:
  Postgres, não arquivo). Migration `20260826010000_regency_benchmark_releases`.
- Corrigida uma regressão pré-existente no worktree sujo: `v2-config.ts`/`v2-matrix.ts` ganharam
  `import "server-only"`, o que quebrava silenciosamente `npm run regency:evaluate` fora do
  Next.js. Corrigido com `--conditions=react-server` nos scripts do `package.json`.
- Golden fixtures da Tríade v3 congelam o catálogo exato de 27 Orixás elegíveis, a tripla de
  versões matriz/config/scorer e o caso em que todos os papéis ficam em aberto sem evidência.
- O E2E autenticado (`tests/e2e/authenticated-mvp.spec.ts`) estava desatualizado desde a v3: pulava
  o questionário obrigatório antes de esperar o resultado. Passou a responder as sete perguntas,
  submeter feedback consentido, verificar as versões no export pessoal e exercitar a retirada
  seletiva (`DELETE`) antes da exclusão do perfil. Duas regressões pré-existentes foram
  descobertas e corrigidas nesse processo: `scripts/release-smoke.sh` e
  `tests/e2e/methodology.spec.ts` ainda verificavam a string "AstroAxe Regências 2.1", desatualizada
  desde a virada para 3.0 — ambas falhavam silenciosamente sob `set -e`/timeout sem imprimir erro.
- Documentação reconciliada (`/privacidade`, `/metodologia`, `docs/IMPLEMENTATION_STATUS.md`) para
  declarar explicitamente: as sete respostas do questionário são cálculo-apenas e nunca
  persistidas; o feedback exige consentimento separado, é persistido versionado e pode ser
  retirado individualmente. `docs/astrology-calculation-changelog.md` e o relatório de pesquisa já
  declaravam essa regra corretamente.
- Checkpoint observado nesta sessão: `npm run typecheck` e `npm run lint` passaram; `npm test`
  (sem coverage) — 93 arquivos, 351 testes, todos passando; `npm run test:coverage` — mesma
  contagem, 86,45% statements / 71,98% branches / 89,17% functions / 88,62% lines (uma
  instabilidade de timeout pré-existente e não relacionada a este trabalho, em
  `profile-archive.test.tsx` sob paralelismo total, some ao rodar com `--fileParallelism=false`;
  `vitest.config.ts` ganhou `testTimeout: 15_000` como mitigação geral); `npm run build` passou;
  `npm run test:e2e` — 14 cenários passaram (5,6 min) via o wrapper oficial após as duas correções
  acima; Quality Gate do SonarQube passou após corrigir os quatro achados reais introduzidos nesta
  sessão (um bug MAJOR de `reduce()` sem valor inicial e três code smells MAJOR de espaçamento
  JSX ambíguo) — 0 novas violações, 81,6% de cobertura em código novo, 1,52275% de duplicação.
- A fundação dual-mode foi concluída posteriormente pelas Tasks 7–11, conforme a atualização acima. A
  ingestão, os workspaces e a criptografia continuam pendentes e agora possuem autorização do
  responsável para execução incremental, preservando os gates jurídicos e culturais fail-closed.

## Atualização 2026-08-25 — regências v3 e nomenclatura astrológica

- A Tríade passou a exigir um questionário de sete movimentos antes do cálculo. As respostas são
  sinais auxiliares usados somente na requisição e incluem opções “ambos” e “prefiro não responder”.
- Ao final, um coletor consentido pergunta se o usuário conhece seus Orixás de frente, cabeça e
  costas e aceita correções por papel. O servidor recalcula a predição antes de congelar o exemplo;
  feedbacks são versionados, exportáveis e removidos em cascata com o perfil.
- O catálogo elegível foi ampliado de 25 para 27 com Logunan e Egunitá; Oxumarê continua explícito.
  Os pares de Saraceni entram como uma família de evidência da Umbanda Sagrada, cruzável com todas
  as demais no agregado e ainda mensurável separadamente por proveniência.
- Versões: matriz `0.5.0-v3`, configuração `0.2.0-v3`, scorer `0.6.0`, questionário `1.0.0` e
  contrato público `AstroAxe Regências 3.0 — pesquisa aplicada`.
- Corpos, pontos e aspectos dos módulos astrológicos agora usam rótulos portugueses centrais e
  fallbacks seguros; o caso `sun`/`true_node`/`sextile` possui regressão textual exata.
- Checkpoint observado: 315 testes em 89 arquivos; 86,21% de statements e 88,39% de linhas;
  typecheck, lint, formatação, build de produção, E2E e Quality Gate passaram. O cache webpack do
  host voltou a apresentar a falha interna `WasmHash`; o build isolado compilou integralmente. A
  stack principal foi reconstruída e permaneceu saudável em `http://localhost`.

## Atualização 2026-08-25 — revisão integral de módulos e conteúdo

- Todos os módulos públicos e autenticados foram confrontados com o estado real do produto. Textos
  natais permanentes deixaram de se apresentar como leitura do período; trânsitos distinguem
  proximidade geométrica do pico de uma alegação de exatidão; cards com hora desconhecida não
  prometem casas ou ângulos.
- A Regência pública foi elevada para `AstroAxe Regências 2.1 — pesquisa aplicada`, sem alteração
  da matriz ou dos resultados. O módulo ganhou retry explícito e preserva o perfil quando a rota
  falha. O histórico ANTES/DEPOIS/MOTIVO/IMPACTO está no changelog de cálculo.
- `/privacidade` descreve a coleta e os controles realmente implementados, declara integrações
  inativas e separa pendências jurídicas de funcionalidades existentes. Rodapé, sitemap e release
  smoke cobrem a nova rota.
- Foram removidos a cena Canvas substituída e um contrato especulativo de analytics sem chamadores,
  com seus testes e estilos exclusivos. O TypeScript estrito com verificações de símbolos não
  utilizados passou depois da limpeza.
- O breakpoint do cabeçalho compacto passou a cobrir tablets de até 820 px, eliminando overflow no
  limiar de 768 px. As expectativas E2E foram alinhadas à interface e às versões atuais.
- Checkpoint final observado: 300 testes em 87 arquivos, 86,11% de statements e 88,31% de linhas;
  typecheck, lint, formatação, build Docker, release smoke, 14 cenários E2E e Quality Gate passaram.
  A stack principal foi reconstruída e permaneceu saudável. Sessenta e cinco arquivos estáticos do
  cliente foram examinados sem marcador proprietário.

## Atualização 2026-08-25 — aplicação do método v2 e revisão pública

- A área autenticada de Orixás passou da matriz baseline para `regency-matrix-0.4.0-v2-research`
  com a configuração v2 composta e feature numerológica derivada da data natal já armazenada.
- A interface apresenta intensidades qualitativas, não percentuais que possam ser confundidos com
  certeza. A Tríade continua podendo se abster quando a convergência não fecha um papel.
- `/metodologia` agora publica entradas, controles de qualidade, versionamento e limites, preservando
  matriz, coeficientes, limiares, regras de desempate e corpus como propriedade intelectual.
- O benchmark `regency:evaluate-v2` substitui o comando derivado antigo. O contrato sem consumidor
  de “ressonância simbólica” e o diagnóstico HTML datado foram removidos como código/artefato morto.
- Homepage, onboarding, dashboard, acervo, metadados e rodapé foram alinhados ao posicionamento v2.
  Nenhuma prova social, precisão espiritual ou acurácia sem amostra foi inventada.
- Matriz e configuração v2 foram marcadas `server-only`; a conta busca um DTO mínimo na rota
  autenticada de regência. O gate pós-build final examinou 61 chunks cliente contra quatro
  marcadores proprietários e não encontrou vazamento.
- Checkpoint observado: 305 testes em 88 arquivos passaram; cobertura global de 86,17% em
  statements e 88,45% em linhas; typecheck, lint, formatação, build de produção e Quality Gate do
  SonarQube passaram. O primeiro build encontrou cache webpack corrompido; a repetição com cache
  isolado compilou integralmente, confirmando que não era regressão da aplicação.
- O Acervo Cultural passou a distinguir visualmente o corpus técnico ampliado dos quatro verbetes
  culturalmente publicados. A página mostra apenas métricas agregadas da pesquisa e preserva a
  coleção privada, a matriz e os critérios proprietários fora da resposta pública.

## Atualização 2026-08-25 — início do método autoral v2

- O responsável autorizou cruzamento amplo do acervo `E:\Ocultismo` com astrologia, numerologia,
  Odù, Ifá, Umbandas, Candomblé, Cabala e sistemas cerimoniais para criar um novo método autoral.
- O desenho implementado está em `docs/research/orixa-method-v2/report-source.md`: grafo de
  evidências, facetas, famílias independentes, canais numerológicos e desempate por estabilidade.
- O inventário encontrou 801 arquivos, 737 hashes únicos e 64 duplicatas exatas. Há 124 PDFs únicos;
  123 possuem artefato de extração por página e 121 geraram texto útil; a única renderização ausente
  tem outra edição da mesma obra extraída, além dos documentos Office/ODT/RTF/TXT.
- Relações preliminares fortes incluem Ogum/Marte, Oxalá/Sol e Xangô/Júpiter em duas famílias. O
  mesmo trabalho do Templo da Pena contém alternativas Oxóssi/Vênus e Oxóssi/Mercúrio, reforçando a
  necessidade de facetas e conflito explícito.
- Foram adicionados cálculo numerológico puro, matriz 1–16, matriz/config v2, suporte no avaliador e
  robustez, e grafo `regency-evidence-graph-0.1.0-research`. Nenhum resultado público mudou. O
  próximo marco é ampliar locators/OCR e validar pesos em dataset consentido congelado.

## Atualização 2026-08-24 — numerologia, Odù e Ifá

- O estudo das três páginas fornecidas, literatura acadêmica e acervo privado `E:\Ocultismo` foi
  registrado em `docs/research/orixa-numerology/report-source.md`.
- Soma decimal da data, associação signo→Orixá e tabela por dia da semana são lentes editoriais
  distintas. A soma 1–16 agora pode entrar somente no scorer v2 de pesquisa e não revela Odù de Ifá.
- A variante 1–16 possui viés estrutural: após reduzir totais acima de 16, os resultados tendem a
  1–9; qualquer protótipo exige auditoria de distribuição e versão própria.
- Fontes divergem dentro das próprias Umbandas: uma etnografia registra numerologia composta em
  uma casa, enquanto Rubens Saraceni rejeita que a data natal identifique Orixá regente.
- Nenhum código, endpoint, cache ou resultado público foi alterado. Próximo passo cultural é obter
  genealogia da “Cabala de Odù” e revisão por praticantes de correntes distintas e por especialista
  de Ifá/iorùbá.

## Atualização 2026-08-24 — cadernos imersivos personalizados

- Nodos Lunares, Mapa do Amor, Mapa Sexual e Mapa Profissional ganharam cadernos longos com índice,
  leitura de posições e casas, manifestação cotidiana, potência, sombra, integração e reflexão.
- Revolução Solar libera 20 capítulos somente após calcular o retorno para a cidade do aniversário:
  oito funções planetárias e as doze casas anuais, sempre em diálogo explícito com o mapa natal.
- Área Lua passou a explicar as oito fases, distingue fase natal de fase mensal e conecta a Lua à
  casa apenas quando há hora conhecida.
- A camada narrativa pura usa `western-editorial-reports-1.0.0`; não altera efemérides nem inventa
  dados ausentes. O benchmark de concorrência foi persistido em `competitor-profiles/raw/`.

## Atualização 2026-08-24 — módulos comerciais e QA visual

- Meu céu separa Mapa Astral Completo, Revolução Solar, Mapa Sexual, Mapa Profissional, Horóscopo
  Sombrio, Biorritmo e demais leituras.
- A navegação principal usa seis opções em uma linha e “Mais módulos” para o painel secundário, sem
  scrollbar horizontal.
- Revolução Solar exige a cidade onde ocorreu ou ocorrerá o aniversário; não reutiliza
  silenciosamente o local natal.
- Horóscopo Sombrio possui áreas equivalentes ao Horóscopo, mecanismos natais e trânsitos
  atuais/futuros em linguagem de integração.
- Biorritmo usa `classical-primary-secondary-alerts-3.0.0`, com 61 dias, dias zero e
  compatibilidade; permanece explicitamente não científico.
- QA autenticado passou em desktop e Pixel 7, navegando por todas as abas e capturando evidências em
  `.planning/screenshots/comparison/`.
- Próximo marco: área Lua com progressões secundárias, Retorno Lunar, trânsitos lunares, fase natal,
  sinastria lunar e Lua fora de curso.

Atualizada em **25 de agosto de 2026**, no fuso `America/Sao_Paulo`. Este é o ponto de retomada
para novas sessões de desenvolvimento. Ele registra o estado observado no workspace local; não
representa commit, CI, revisão externa ou deploy em produção.

## Ordem de leitura para continuar

1. `AGENTS.md`: regras obrigatórias do repositório, segurança e critérios de conclusão;
2. este documento: decisões vigentes, estado operacional e próximos passos;
3. `docs/IMPLEMENTATION_STATUS.md`: inventário funcional detalhado;
4. `docs/BLUEPRINT.md`: arquitetura e fases do produto;
5. `docs/design-references.md`: contrato de experiência e motion;
6. `docs/backup-restore.md`: operação e retorno do PostgreSQL.

Antes de editar, execute `git status --short` e preserve todas as mudanças existentes. O worktree
estava com alterações ainda não commitadas neste handoff.

## Decisões que permanecem vigentes

- O produto é um **Observatório Ritual**: premium, calmo, editorial e legível. Não deve virar uma
  coleção de efeitos, uma estética Web3 ou uma cópia visual das referências.
- NFTmap orienta espacialidade, navegação orbital e foco em um objeto por vez. Astrarise orienta
  presença imersiva, profundidade e coreografia. AstroAxe mantém identidade própria, quente e
  instrumental.
- Mobile é recomposto, não apenas reduzido. Cada tela admite no máximo um efeito ambiente e um
  momento de revelação.
- Canvas e motion nunca carregam conteúdo essencial. Teclado, foco, contraste, alternativa textual
  e `prefers-reduced-motion` são requisitos, não melhorias opcionais.
- O cálculo ocidental continua determinístico e independente da camada narrativa. Correspondências
  com Orixás são interpretações culturais versionadas, com proveniência e incerteza explícitas.

## Estado funcional observado

- A central autenticada foi reorganizada em Visão geral, Mapa natal, Ciclos e vínculos e
  Configurações. Segurança/Privacidade deixou o fim da página e passou para Configurações junto à
  edição e remoção do mapa. A versão autenticada da mandala usa um navegador compacto de posições,
  sem reaproveitar as alturas de viewport da jornada inicial. O header passou a ocupar a largura
  real da tela, com drawer mobile ancorado, e ganhou paisagem sonora sintetizada localmente,
  silenciosa por padrão e acionada somente por controle explícito.
- A área autenticada ganhou uma superfície própria de Segurança e Privacidade, com portabilidade,
  troca de senha e exclusão de conta em cartões responsivos. A senha da zona irreversível não é
  mais compartilhada implicitamente com o formulário de troca. Cada mapa salvo agora pode ser
  excluído por sua própria zona de gerenciamento, usando diálogo modal nativo, confirmação digitada
  e atualização imediata do arquivo após o `204` da API.
- ASC, DSC, MC e FC permanecem desenhados pelos eixos astronômicos na mandala, mas seus rótulos e
  graus passaram para um trilho instrumental responsivo e sem coordenadas flutuantes. Isso elimina
  colisões quando o meridiano se aproxima do horizonte e mantém os quatro valores legíveis a 320px.
  Motion 13.1.1, MIT e compatível com React 19, foi incorporado somente para entrada da superfície
  de segurança e confirmação destrutiva, respeitando redução de movimento.
- O site possui agora um shell global com marca vetorial AstroAxé, navegação responsiva, entrada
  direta e rodapé. Após o login, /conta abre uma central de módulos em vez de apenas uma ficha.
- Novos mapas calculam treze posições persistidas: dez planetas, Quíron, Nodo Norte verdadeiro e
  Lilith média. Nodo Sul é derivado na apresentação; MC e Fundo do Céu possuem capítulos com signo e
  grau. A configuração foi elevada para western-2026-08-23-extended-points; mapas legados de dez
  posições permanecem legíveis e precisam de recálculo explícito para receber os novos pontos.
- Sinastria entre dois perfis salvos e biorritmo por data estão disponíveis na central. A sinastria
  inicial usa aspectos maiores entre corpos pessoais; o biorritmo é rotulado como tradição popular
  sem comprovação científica. Regências de Orixás continuam em pesquisa e não são simuladas.

- A busca real de cidades voltou a funcionar. `GET /api/geocoding?q=Salvador` retornou candidatos
  pela stack local após a recuperação do PostgreSQL.
- Um mapa sintético foi criado pela API com status `201`, dez planetas e Ascendente. O perfil e a
  sessão de teste foram removidos pelo identificador exato ao final.
- A apresentação dos signos agora deriva o nome em português da longitude e mostra o grau do
  Ascendente dentro do signo. A correção está em
  `src/domain/astrology/western/zodiac.ts`; o histórico e o impacto estão em
  `docs/astrology-calculation-changelog.md`.
- Essa correção alterou a apresentação, não o núcleo astronômico. Uma divergência futura deve ser
  reproduzida com input auditável de data, hora, cidade/timezone e modo de hora conhecida antes de
  alterar engine ou configuração.
- O onboarding abre em um palco galáctico de viewport inteira, com formulário em vidro fumê e uma
  única cena orbital em `src/components/onboarding/celestial-observatory-3d.tsx`. A camada Canvas
  antiga, sem consumidor após essa substituição, foi removida com seus estilos e testes exclusivos.

## Contrato atual de motion e cena orbital

- A cena WebGL é progressiva e decorativa; falha de inicialização não bloqueia o conteúdo nem o
  formulário. Com redução de movimento, o estado permanece estático.
- A camada visual não intercepta o formulário e não contém texto ou ação essenciais.
- Viewports `1440×1000`, `390×844` e `320×700` foram inspecionados visualmente sem quebra material
  no fluxo, overflow horizontal, overlay de erro ou erro de console.
- A revelação do resultado usa uma **mandala natal real e interativa**, derivada do mapa calculado,
  com um objeto selecionado por vez, ficha editorial equivalente no DOM, ASC/DSC e casas quando a
  hora é conhecida e modo planetário explícito quando ela é desconhecida.

## PostgreSQL e runtime local

- O bootstrap de desenvolvimento executa `npm ci` antes do Turbopack. Isso mantém o volume nomeado
  `dev_node_modules` sincronizado com o `package-lock.json` após mudanças de dependências; antes
  desse ajuste, o volume antigo ocultava `motion` mesmo após reconstruir a imagem.
- O Compose usa PostgreSQL 18 no volume nomeado `astroaxe_postgres18_data`.
- O volume legado `astroaxe_postgres_data`, identificado como PostgreSQL 16, permanece preservado e
  é a base da janela de retorno. Não o monte em uma imagem PostgreSQL 18 e não execute `down -v`.
- O dump `backups/astroaxe-20260820T024048Z.dump` teve checksum verificado, foi restaurado no volume
  novo e passou pelo script de verificação de restore.
- A base restaurada usa PostgreSQL `18.6` e possui a extensão `vector`. A homologação isolada está
  com 18 migrations Prisma aplicadas, terminando em
  `20260823010000_account_verification_and_recovery`.
- App, PostgreSQL, Redis, worker, Traefik e Prometheus estavam saudáveis no fechamento; release
  smoke, métricas e regras de alerta passaram. Esse estado é volátil: uma nova sessão deve confirmar
  com `docker compose ps` e os endpoints de health antes de assumir que a stack continua no ar.
- O E2E usa volume PostgreSQL 18 isolado pelo nome do projeto Compose e não reutiliza o volume do
  runtime principal. A execução mais recente usou `ASTROAXE_HTTP_PORT=3101` porque a porta padrão
  `3100` já pertencia a outra stack preservada.
- O Redis emitiu aviso do host sobre `vm.overcommit_memory`. Não bloqueou os testes, mas deve ser
  corrigido no host antes de tratar a operação como endurecida.

O procedimento detalhado e o rollback estão em `docs/backup-restore.md`. O volume legado e o dump
não podem ser removidos sem backup, alvo explícito e nova autorização.

## Validação mais recente

- `npm run typecheck`: passou;
- `npm run lint`: passou;
- testes: 74 arquivos e 265 testes passaram;
- cobertura: 87,54% statements, 72,27% branches, 93,81% functions e 89,68% lines;
- a antiga implementação Canvas de partículas foi removida por não possuir consumidor;
- `npm run build`: passou;
- E2E em Chromium desktop e mobile: 14 cenários passaram;
- `npm run test:release-smoke`: passou na stack local;
- performance local: 100 requisições, concorrência 10, zero falhas e p95 de 127 ms;
- observabilidade: target, séries e quatro regras passaram;
- restore isolado do dump `backups/astroaxe-20260820T024048Z.dump`: passou;
- navegação real em Chromium: onboarding até resultado, cadastro, conta, acervo, metodologia e
  exclusão da conta sintética passaram em desktop e mobile, sem erros de console;
- `git diff --check`: passou antes deste handoff.

O Quality Gate do Sonar foi reexecutado em 23 de agosto de 2026 e passou: zero novas violações,
81,9% de cobertura no código novo e 0,61511% de duplicação no código novo.

O trabalho está consolidado na branch local `develop`, ainda sem push. A branch remota `main`
permanece intacta até aprovação humana explícita. Depois da aprovação, o fluxo autorizado é enviar
`develop` e, em seguida, reduzir `main` a um README de desenvolvimento por commit normal, sem
force-push.

## Plugins globais de desenvolvimento

Em 21 de agosto de 2026, o marketplace comunitário
`hashgraph-online/awesome-codex-plugins` foi adicionado à configuração global do Codex. Após revisão
de licença, privacidade e runtime, ficaram instalados:

- `citadel@citadel-local` `1.3.5`, fixado no tag oficial: estado/memória de código e workflows
  locais. Seus MCPs `citadel-state` e `codebase-memory` responderam a `tools/list`. O plugin é
  privilegiado e não deve iniciar workflows, branches ou comandos sem solicitação compatível;
- `codexqb@codexqb` `0.3.0`: compreensão, planejamento e QA com ativação exclusivamente explícita
  por `$codexqb`;
- `codex-rg-guard@awesome-codex-plugins` `0.2.4`: skill de busca limitada, complementada pelo MCP
  global `cxs-rg-guard` executado a partir do source tag `v0.2.4`. O servidor respondeu a
  `tools/list` e permanece somente leitura.
- `codex-lsp@codex-lsp-local` `0.2.0-local.1`: build local MIT do upstream `code-yeongyu/codex-lsp`,
  com submodule compilado e MCP validado. A configuração do projeto está em `.codex/lsp-client.json`
  e cobre TypeScript/JavaScript, ESLint, CSS, JSON, YAML e Prisma. O diagnóstico do arquivo de signos
  passou sem erros. O upstream não continha um manifesto de plugin e seu teste de empacotamento
  falhava; por isso a instalação usa um wrapper local mínimo, sem alterar o código-fonte do projeto.

O Waggle foi testado e removido: mesmo com checksum válido do release `v0.1.24`, o runtime Linux
falhou com `ImportError` interno. `claude-smart/Reflexio` e `codex-usage-tracker` não foram
instalados porque persistem interações ou prompts sem uma política de retenção/redaction compatível
com os dados sensíveis do produto. Os plugins instalados só aparecem integralmente em uma nova
sessão do Codex.

Em 22 de agosto de 2026, o carregador do Codex iniciou os MCPs do Citadel a partir da raiz do
projeto, embora o manifest `1.3.5` usasse argumentos relativos à raiz do plugin. A instalação local
foi corrigida para usar caminhos absolutos em `citadel-state` e `codebase-memory`; ambos responderam
ao handshake `initialize` a partir da raiz do AstroAxe e aparecem habilitados em `codex mcp list`.
O timeout de `SessionEnd` também foi alinhado ao limite de 3 segundos aplicado pelo Codex. Essas
alterações inicialmente viviam apenas no cache global e foram sobrescritas pelo carregador. Para
torná-las persistentes, o marketplace global `citadel-local` passou a apontar para a cópia local
fixada `/home/thalis/.codex/local-marketplaces/citadel-1.3.5-fixed`, que contém os caminhos MCP
absolutos e `SessionEnd` limitado a 3 segundos. O cache ativo recebeu a mesma correção, os dois MCPs
responderam novamente ao handshake `initialize` e `codex mcp list` resolveu ambos pela cópia fixa.
Uma atualização futura do Citadel deve ser aplicada conscientemente nessa instalação local e
revalidar manifests, hooks e handshakes antes de substituir a versão fixada.

Ainda em 22 de agosto de 2026, o A5C Babysitter foi instalado globalmente e seu processo de
onboarding foi concluído. A falha recorrente de `PostToolUse` foi rastreada ao wrapper local do
Codex LSP sem a dependência empacotada; o wrapper foi reconstruído e seus oito testes passaram.
O servidor MCP do Citadel também passou a aceitar o campo MCP `_meta`, validado por 21 chamadas
JSON-RPC. Como o AstroAxe usa ESLint/Prettier, `.codex/lsp-client.json` desabilita explicitamente o
Biome embutido para impedir que arquivos HTML acionem um servidor inexistente. O relatório HTML
temporário das 14 verificações do Babysitter não é mais retido no repositório; o estado canônico
permanece registrado nesta memória. Uma nova sessão do Codex é necessária para recarregar o
processo Citadel que já estava em memória antes da correção.

## Próximos passos recomendados

Em 22 de agosto de 2026 foi aprovada a migração da infraestrutura de produção para Docker Swarm em
VPS Contabo, mantendo Compose para desenvolvimento/E2E. A arquitetura usa Cloudflare Tunnel e
Traefik privados, app replicado, workers separados e SMTP relay gerenciado. A primeira fase adicionou
suporte fail-closed a Docker secrets por `*_FILE` no app, worker e Prisma migrate; o runbook está em
`docs/swarm-runbook.md`. Brevo SMTP é o candidato inicial de menor custo, sujeito à criação da conta,
verificação do domínio e teste de SPF/DKIM/DMARC. Nenhum cluster, secret real ou integração externa
foi criado nesta fase. A fundação stateless da Phase 2 está em `infra/swarm`: imagens exclusivamente
por digest, socket proxy filtrado, Traefik privado, duas réplicas de Cloudflare Tunnel, app replicado,
scheduler singleton, redes overlay criptografadas, migration efêmera antes da atualização, preflight,
rolling update, rollback e smoke. Esses artefatos ainda precisam ser exercitados em um Swarm de
staging com os nós, registry, tunnel e secrets reais antes de serem considerados operacionais.
O contrato de deploy foi esclarecido: homologação roda exclusivamente em Docker Compose local, pelo
projeto isolado `astroaxe_homolog`, na porta `3200`, com PostgreSQL/Redis próprios e Mailpit em
`127.0.0.1:8025`; produção roda em Docker Swarm nas VPS Contabo com domínio e Cloudflare. Os comandos
locais são `npm run homolog:up`, `homolog:smoke` e `homolog:down`; o último preserva volumes.
O primeiro startup da homologação detectou que o target `migrate-runner` não copiava a nova boundary
de Docker secrets importada por `prisma.config.ts`; o Dockerfile foi corrigido para incluir somente
esse arquivo adicional antes da repetição do smoke. A repetição também revelou a janela curta entre
o health do container Traefik e o carregamento do primeiro router; `homolog:up` passou a aguardar
explicitamente `/api/health/ready` pela entrada antes de executar o release smoke.
O email transacional agora usa a tabela `email_outbox`: o cadastro e a mensagem de boas-vindas são
atômicos, e o scheduler entrega por SMTP com lease, seis tentativas, backoff, estado `DEAD` e
`Message-ID` determinístico. Homologação envia apenas ao Mailpit; produção lê a senha Brevo por
Docker Secret e não entrega a credencial ao app web. O contrato e a preparação SPF/DKIM/DMARC estão
em `docs/transactional-email.md`. A migration foi aplicada na homologação e
`npm run homolog:email-smoke` validou cadastro sintético, outbox, worker e Mailpit com limpeza exata
do usuário de teste. Ainda falta validar uma entrega com domínio e conta reais em staging; nenhum
provedor externo foi configurado nesta sessão.
Verificação de email e recuperação de senha foram adicionadas sobre a mesma outbox. Tokens de ação
são de uso único, persistidos apenas como hash, expiram em 24 horas/30 minutos e são removidos pelo
worker após expirar. A redefinição revoga sessões anteriores e cria uma nova. Em homologação, uma
conta sintética confirmou o email, redefiniu a senha pelo link recebido, recebeu `401` na sessão
antiga, `200` na nova e `400` ao tentar reutilizar o token; a conta foi excluída ao final.
A primeira mandala natal funcional foi integrada ao resultado do onboarding e ao arquivo autenticado. Ela usa somente as
longitudes, casas e ângulos já calculados, oferece seleção por botões acessíveis no instrumento e na
lista, mantém as dez posições legíveis no DOM e omite casas/ASC/DSC quando a hora é desconhecida.
Marcadores próximos usam lanes radiais determinísticas que não alteram os graus exibidos. A
verificação Playwright cobriu 320px, 768px e 1440px, ausência de overflow, teclado, reduced-motion,
dez posições no DOM e colisões sintéticas; a inspeção visual corrigiu o overflow interno do primeiro
layout. O resultado pós-onboarding agora é uma jornada independente: a primeira dobra é dedicada à
mandala, as doze casas são numeradas, ASC/DSC exibem seus signos e a leitura continua em capítulos
editoriais de scroll para os ângulos e dez planetas. A entrada da mandala ocorre uma vez e os capítulos
são revelados uma vez ao entrar no viewport, com alternativa estática para redução de movimento. O
mobile possui enquadramento próprio e mantém o conteúdo editorial abaixo do instrumento. O snapshot
natal persistido é validado na API antes de alimentar a mesma componente na área
da conta, sem recalcular no navegador.

Em 24 de agosto de 2026, a área autenticada passou a apresentar Quíron, Lilith média e o eixo nodal
em um painel próprio, usando exclusivamente as longitudes já presentes no snapshot natal. O Nodo
Sul é derivado como ponto oposto ao Nodo Norte. O módulo de Orixás deixou o placeholder e abriu o
laboratório da matriz aprovada: ele mostra rankings de frente, cabeça e costas, preserva abstenções,
expõe versões e declara que a pesquisa não substitui confirmação religiosa ou jogo de búzios. Isso
não promove a matriz de pesquisa a regência religiosa validada. O áudio ambiente foi removido; há
somente tons curtos de interação em botões e links, desligados por padrão e ativados por controle
persistente na interface. A comparação visual direta com Astrarise, NFTmap, Astrolink/Orbia e
Personare está em `.planning/research/reference-sites-visual-comparison.md`, com capturas em
`.planning/screenshots/references` e `.planning/screenshots/comparison`. O fluxo autenticado passou
em Playwright desktop e Pixel 7; o checkpoint registrou 268 testes, 87,2% de statements, build Next
16 aprovado e Quality Gate SonarQube aprovado.

Ainda em 24 de agosto, Quíron, Lilith média e os Nodos passaram a aparecer também dentro da aba
“Mapa natal”; snapshots legados mostram os quatro slots e encaminham para recálculo, em vez de
sumirem silenciosamente. O módulo de Orixás agora se identifica visualmente como Beta/em
desenvolvimento e executa `regency-robustness-0.1.0-beta`, uma análise determinística de estabilidade
por retirada de cada escola de correspondência. Ela complementa, mas não substitui, o benchmark
com autodeclarações verificáveis. Fóruns foram usados apenas para descobrir linguagem, divergências
entre tradições e riscos metodológicos; posts anônimos sem identidade, consentimento e nascimento
verificáveis não entram no dataset. A home ganhou uma cena orbital em perspectiva 3D construída com
canvas e transformações CSS, sem nova dependência, com pausa fora da viewport e alternativa para
movimento reduzido. O som continua restrito a interações opt-in.

Após revisão visual, a primeira tentativa em CSS 3D foi substituída integralmente por uma cena
Three.js/WebGL 2. A home limita DPR, pausa fora da viewport/aba, respeita redução de movimento,
libera recursos da GPU e oferece fallback estático. A narrativa sticky e toda resposta a scroll ou
ponteiro foram removidas após feedback: a home voltou a ser uma composição única e estável. O Sol
permanece fixo, com superfície procedural e corona baseada nas referências SDO; os oito planetas
orbitam com velocidades relativas distintas. Os materiais planetários derivam do mosaico NASA/JPL
PIA01341 (Mariner 10, Magellan, Galileo, Viking e Voyager), e Saturno usa PIA01364; originais,
derivados e créditos estão em `public/assets/nasa`. Ordem, inclinações relevantes e sentidos são
preservados, mas tamanhos e distâncias são visualmente comprimidos para manter os planetas visíveis.
Não há anéis orbitais decorativos. O sistema ocupa o wallpaper da experiência, enquanto copy e
formulário possuem superfícies legíveis próprias. Three.js 0.185.1 e seus tipos foram fixados após
consulta à documentação e licença MIT.

Ainda em 24 de agosto, a Sinastria deixou de encaminhar “Adicionar mapa” para o onboarding da home.
O segundo nascimento agora é criado dentro da conta autenticada, recarregado no arquivo e
selecionado automaticamente para comparação. A engine editorial
`major-cross-aspects-editorial-2.0.0` passou de cinco para treze corpos e pontos natais, com 36
aspectos maiores, nove capítulos e textos determinísticos que variam por par, aspecto, signos e
orbe. A leitura cobre também expansão, compromisso, transformação, Quíron, Lilith e Nodo Norte; o
cálculo natal persistido não foi alterado.

1. Medir frame time e resposta do input em dispositivo físico antes de elevar a densidade visual da
   mandala; a validação automatizada não substitui teste em GPU/touch real.
2. Tratar o aviso `vm.overcommit_memory` e definir backup externo criptografado, alertas externos e
   SLOs antes de produção.
3. Prosseguir com Tríade/regências somente pelo protocolo cultural e de pesquisa documentado, sem
   transformar hipóteses em resultado público.

Sinastria e Biorritmo agora possuem abas independentes na área autenticada; Ciclos permanece
dedicado a trânsitos e diário. O Biorritmo ganhou leitura por fase para os ciclos físico, emocional
e intelectual. Quíron, Lilith média, Nodo Norte e Nodo Sul passaram de cartões de coordenadas para
capítulos breves com significado próprio e interpretação variável pelo signo calculado.

O antigo destino Ciclos foi ampliado e renomeado para Horóscopo. Ele reúne resumo natal por áreas,
trânsitos atuais, sombras e navegação de previsões por até 90 dias, com fallback editorial
pré-escrito e versionado quando não há template publicado. A conta também recebeu destinos próprios
para Nodos Lunares, Mapa do Amor, Guia Astrológico do ano vigente e Ciclo Lunar. O Biorritmo agora
mostra curvas de 31 dias, capítulos dos ciclos primários e os secundários Domínio, Paixão e
Sabedoria.

Ainda em 24 de agosto, “Ciclo lunar” foi substituído por uma Área Lua calculada e versionada. A
engine `lunar-dashboard-1.0.0` oferece fase natal exata, mansão tropical árabe explicitamente
identificada, Lua progredida por progressão secundária, fase progredida, casa natal quando há hora
conhecida e Lua fora de curso segundo uma definição operacional documentada. A cidade atual ergue
um Retorno Lunar exato com Ascendente, Meio do Céu e capítulos mensais; a interface também reúne
aspectos lunares atuais, comparação Lua–Lua e a casa que cada Lua ocupa no mapa do outro quando os
dois mapas possuem casas. Referenciais védicos e árabes não são misturados. Calendário eletivo é
descrito como tradição simbólica e não fornece indicação médica, cirúrgica ou financeira.

O checkpoint desta ampliação registrou 292 testes, 86,11% de statements e 88,26% de linhas, build
Next 16 aprovado e Quality Gate SonarQube aprovado após eliminar uma atribuição redundante apontada
pelo analisador. O fluxo autenticado completo passou em desktop Chrome e Pixel 7. As APIs de
Revolução Solar e Área Lua responderam `200`; o E2E passou a sincronizar com essas respostas em vez
de depender do timeout visual padrão durante a primeira compilação Turbopack.

Na revisão visual seguinte da home, foram removidos os últimos círculos decorativos herdados de
CSS no fundo do planetário e no painel do formulário. A cena WebGL não desenha trilhas orbitais: o
único sistema de anéis visível pertence a Saturno e vem da imagem NASA. Capturas desktop e Pixel 7
sem os círculos estão em `.planning/screenshots/comparison/astroaxe-home-no-decorative-rings-*`.

## Borda pública configurada antes da VPS

Em 2026-08-26 a zona `astroaxe.net` deixou de estar no default de fábrica. O estado anterior aceitava
TLS 1.0, não redirecionava HTTP, não validava o certificado da origem e mantinha o WAF gerenciado
desligado, sem nenhum registro DNS publicado.

A borda passou a ter TLS estrito com mínimo 1.2, redirecionamento HTTPS, Managed Free Ruleset ativo,
quatro regras WAF custom, rate limiting nas rotas de autenticação, regras de cache que excluem toda
superfície autenticada, Bot Fight Mode com bloqueio de crawlers de treino de IA, e Zero Trust Access
por One-time PIN no staging. O acesso à aplicação existe apenas por Cloudflare Tunnel: a zona não
tem registro `A`, então nenhum IP de origem é descobrível.

O domínio está declarado como não-remetente no DNS até existir relay e endereço de contato. HSTS
permanece desligado de propósito e só deve ser ativado, de forma faseada, depois do primeiro deploy
com HTTPS confirmado — ligá-lo antes grava nos navegadores uma instrução que não se revoga
remotamente.

Enquanto a VPS não existe, o apex não devolve erro: um Worker (`astroaxe-holding`) publica uma
página de espera na borda, respondendo `503` com `noindex` para não ser indexada como se fosse o
site real. O fonte está em `infra/cloudflare/holding-page/worker.js` e sai do ar apagando a rota,
sem tocar em DNS.

O runbook autoritativo é `docs/cloudflare-edge.md`; o desenho aprovado está em
`docs/superpowers/specs/2026-08-26-cloudflare-edge-design.md`.

## Checklist curto de retomada

```bash
git status --short
docker compose -f compose.yml -f compose.dev.yml config
docker compose -f compose.yml -f compose.dev.yml ps
curl --fail http://127.0.0.1/api/health/live
curl --fail http://127.0.0.1/api/health/ready
npm run typecheck
npm run lint
```

Consulte os documentos temáticos antes de modificar domínio, banco, conteúdo cultural ou motion.
Não repita a migração PostgreSQL já concluída e não descarte o volume legado durante a janela de
retorno.
