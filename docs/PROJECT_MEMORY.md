# Memória canônica do projeto

Atualizada em **22 de agosto de 2026**, no fuso `America/Sao_Paulo`. Este é o ponto de retomada
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
- O onboarding possui composição orbital, entradas e transições com CSS e partículas em Canvas por
  `src/components/onboarding/celestial-particles.tsx`.

## Contrato atual de motion e partículas

- Partículas determinísticas: até 38 no desktop e 20 no mobile, alvo de 30 fps e DPR limitado a
  `1.5`.
- A animação pausa quando a cena sai do viewport ou a aba fica oculta. Com redução de movimento, o
  estado é estático.
- A camada visual não intercepta o formulário e não contém texto ou ação essenciais.
- Viewports `1440×1000`, `390×844` e `320×700` foram inspecionados visualmente sem quebra material
  no fluxo, overflow horizontal, overlay de erro ou erro de console.
- O próximo marco visual é substituir a revelação genérica do resultado por uma **mandala natal
  real e interativa**, derivada do mapa calculado, com um objeto selecionado por vez e ficha
  editorial equivalente no DOM.

## PostgreSQL e runtime local

- O Compose usa PostgreSQL 18 no volume nomeado `astroaxe_postgres18_data`.
- O volume legado `astroaxe_postgres_data`, identificado como PostgreSQL 16, permanece preservado e
  é a base da janela de retorno. Não o monte em uma imagem PostgreSQL 18 e não execute `down -v`.
- O dump `backups/astroaxe-20260820T024048Z.dump` teve checksum verificado, foi restaurado no volume
  novo e passou pelo script de verificação de restore.
- O destino restaurado usa PostgreSQL `18.6`, possui a extensão `vector` e 16 migrations Prisma
  aplicadas, terminando em `20260820010000_private_journaling`.
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
- testes: 61 arquivos e 218 testes passaram;
- cobertura: 88,57% statements, 73,03% branches, 94,57% functions e 90,61% lines;
- componente de partículas: 97,18% statements e 100% lines;
- `npm run build`: passou;
- E2E em Chromium desktop e mobile: oito cenários passaram;
- `npm run test:release-smoke`: passou na stack local;
- performance local: 100 requisições, concorrência 10, zero falhas e p95 de 129 ms;
- observabilidade: target, séries e quatro regras passaram;
- restore isolado do dump `backups/astroaxe-20260820T024048Z.dump`: passou;
- navegação real em Chromium: onboarding até resultado, cadastro, conta, acervo, metodologia e
  exclusão da conta sintética passaram em desktop e mobile, sem erros de console;
- `git diff --check`: passou antes deste handoff.

O Quality Gate do Sonar foi reexecutado em 22 de agosto de 2026 e passou após a correção semântica
do Canvas decorativo: zero novas violações, 83,0% de cobertura no código novo e 0,54482% de
duplicação no código novo.

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
  passou sem erros. O upstream não continha `.codex-plugin/plugin.json` e seu teste de empacotamento
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

## Próximos passos recomendados

1. Implementar a mandala natal real no resultado, usando somente dados calculados e mantendo a
   leitura completa no DOM. Cobrir seleção, teclado, touch, redução de movimento e fallback sem
   Canvas/WebGL.
2. Integrar a ficha do corpo selecionado e a revelação do mapa sem competir com o formulário nem
   duplicar efeitos ambientes.
3. Validar desktop, mobile a `320px` e um dispositivo intermediário real; medir frame time, consumo
   e resposta do input antes de elevar densidade visual.
4. Repetir checkpoint completo, Playwright e Sonar após o próximo marco funcional.
5. Tratar o aviso `vm.overcommit_memory` e definir backup externo criptografado, alertas externos e
   SLOs antes de produção.
6. Prosseguir com Tríade/regências somente pelo protocolo cultural e de pesquisa documentado, sem
   transformar hipóteses em resultado público.

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
