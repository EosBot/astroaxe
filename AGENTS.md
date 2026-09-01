# AstroAxe — Manual operacional para agentes

Este arquivo governa todo o repositório. Instruções mais específicas em um
`AGENTS.md` descendente prevalecem apenas dentro daquela subárvore. Se uma regra
local conflitar com a solicitação explícita do usuário, pare e peça direção.

## 1. Produto, identidade e cultura

AstroAxe combina cálculo astrológico ocidental determinístico com uma camada
simbólica afro-brasileira. Preserve estes princípios:

- precisão astronômica, rastreabilidade e explicação em linguagem acessível;
- experiência premium, calma e ritual, sem transformar a interface em um
  catálogo genérico de efeitos;
- correspondências astrológicas com Orixás são interpretações culturais, nunca
  confirmação religiosa, diagnóstico ou substituto do jogo de búzios;
- o acervo é insumo e o site publica obra derivada: todo texto publicado é
  síntese original escrita por nós, nunca transcrição de fonte. Isso está
  decidido em `docs/BLUEPRINT.md` §5.0 — não reabra a questão de direitos por
  fonte, elegibilidade ou parecer como pré-condição de publicação;
- **condense as tradições.** Muitas se complementam e seus fundamentos se
  cruzam; agrupar isso num sistema único é o produto, não um risco. Condense
  pela **função estrutural** — abridor de caminhos, limiar, ofício da guerra,
  regência de hora — e não pelo nome que cada escola usa;
- condensar não é achatar. A proveniência fica na camada de baixo porque é ela
  que dá **peso**: convergência de escolas independentes é evidência forte, e só
  continua contável enquanto dá para ver que eram independentes. Cópia e
  tradução da mesma linhagem não valem como duas confirmações. Onde divergem,
  registre o conflito em vez de tirar média;
- a saída é um método único; a máquina sabe de onde cada peça veio. Afirme
  posição análoga, não identidade: "ocupa a mesma função" é o que foi
  descoberto e se sustenta, "é o mesmo" é falsificável e derruba o método;
- símbolos e selos são redesenhados em SVG próprio, não recortados de scan;
- profundidade é requisito. Um texto raso ocupa o lugar do conhecimento sem
  entregá-lo;
- comunique incerteza. Hora desconhecida, geocoding ambíguo e baixa confiança
  precisam aparecer no produto, não ser escondidos pelo texto;
- o primeiro resultado deve gerar valor antes do paywall, sem medo, fatalismo,
  coerção espiritual ou alegações de certeza.

## 2. Stack e mapa do repositório

Stack autoritativa: Node 24, npm 11, Next.js 16 App Router, React 19,
TypeScript 5.9 strict, Tailwind CSS 4, Prisma 7, PostgreSQL 18 com pgvector,
Redis 8, Zod 4, Pino, Vitest 4 e Docker Compose. Use somente npm e preserve as
versões e o `package-lock.json`.

Áreas principais:

- `src/app/`: páginas, layouts e route handlers Next.js;
- `src/components/`: UI e componentes de produto;
- `src/domain/`: cálculo puro, determinístico e independente de framework;
- `src/lib/`: boundaries, contratos, infraestrutura e serviços;
- `prisma/`: schema e migrations versionadas;
- `infra/`: infraestrutura como código — `swarm/`, `cloudflare/`, `prometheus/`, `security/`;
- `tests/`: E2E Playwright em `e2e/` e apoio de runtime em `support/`. Teste unitário fica
  ao lado do código que testa, nunca aqui;
- `src/generated/`: artefatos gerados; nunca edite à mão;
- `docs/`: **cinco documentos canônicos, sem duplicata** (ver abaixo);
- `compose.yml`: runtime; `compose.dev.yml`: desenvolvimento;
- `compose.quality.yml`: SonarQube e banco dedicados.

**Os arquivos Compose ficam na raiz, e isso é deliberado.** O Docker Compose deriva o nome do
projeto do diretório do arquivo: movê-los para uma subpasta renomearia o projeto de
`orixas-mapa-astral` para o nome dela e **órfãos todos os volumes existentes** — inclusive o
volume PostgreSQL histórico que não pode ser perdido. Foi verificado empiricamente em 28 de
agosto de 2026, com `docker compose config` reportando `name:` derivado da pasta. Também é o
diretório onde o Compose procura o `.env`.

### A documentação, em cinco documentos

Consolidada em 28 de agosto de 2026. Antes existiam vinte arquivos em `docs/`, mais um
roteiro paralelo em `.omo/` e artefatos de sessão em `.planning/`, com sobreposição e
contradição entre eles. Hoje cada assunto tem exatamente um lugar:

| Documento                       | O que responde                                                                    |
| ------------------------------- | --------------------------------------------------------------------------------- |
| `docs/BLUEPRINT.md`             | O que o produto é e por quê. Decisões, princípios, design, posicionamento.        |
| `docs/IMPLEMENTATION_STATUS.md` | O que está feito, o que falta e em que ordem — incluindo o roteiro granular.      |
| `docs/METHOD.md`                | O método de regências, as fontes, o protocolo de pesquisa e a operação editorial. |
| `docs/OPERATIONS.md`            | Como rodar: borda, orquestração, deploy, backup, email, qualidade, ingestão.      |
| `docs/PROJECT_MEMORY.md`        | O histórico datado, em ordem cronológica inversa.                                 |

**Ordem de leitura para retomar:** este manual → `PROJECT_MEMORY.md` (o que mudou por
último) → `IMPLEMENTATION_STATUS.md` (o que fazer agora) → `BLUEPRINT.md` ou `METHOD.md`
conforme o assunto. Rode `git status --short` antes de editar e preserve mudanças alheias.

Não crie um sexto documento em `docs/`. Se um assunto não couber em nenhum dos cinco, o
problema é o recorte de um deles, e a correção é ajustá-lo — não abrir um arquivo novo, que
foi exatamente como se chegou a vinte.

Antes de assumir que o blueprint histórico ainda representa o projeto, confira
`package.json`, Compose, Prisma e o código atual.

## 3. Skills: descoberta e carregamento obrigatório

Skills são instruções operacionais, não simples referências. Para toda tarefa:

1. Examine o catálogo de skills exposto na sessão e identifique as que o
   usuário nomeou ou cuja descrição coincide claramente com o trabalho.
2. Selecione o menor conjunto que cubra a tarefa. Use múltiplas skills apenas
   quando suas responsabilidades forem complementares.
3. Antes de agir, anuncie ao usuário quais skills serão usadas, em que ordem e
   por quê. Se uma skill óbvia não for usada, explique brevemente.
4. O agente principal lê cada `SKILL.md` selecionado integralmente. Não delegue
   a leitura, resumo ou interpretação das instruções.
5. Resolva referências relativas a partir da pasta da skill e carregue apenas
   os arquivos, scripts, assets e referências exigidos para a tarefa. Se houver
   paginação ou truncamento, continue até o fim.
6. Siga a skill enquanto ela permanecer no escopo. A solicitação explícita do
   usuário prevalece sobre preferências da skill.
7. Se a skill causar uma ação, pausa ou decisão material, informe isso durante
   o trabalho e registre a influência relevante na entrega.

Uma skill presente no disco não está necessariamente exposta ao modelo na
sessão atual. Instalação, descoberta e disponibilidade são estados diferentes:

- confira primeiro o catálogo fornecido na sessão;
- nunca invoque por nome uma skill que não esteja exposta;
- após instalar ou atualizar uma skill, avise que uma nova conversa ou reinício
  pode ser necessário para ela aparecer;
- se uma skill nomeada estiver ausente ou ilegível, diga isso e aplique o melhor
  fallback sem fingir que a executou.

### Inventário local conhecido

O inventário abaixo serve para descoberta futura; ele não garante exposição na
sessão corrente.

- `grill-me`: atalho instalado que encaminha para `grilling`; não assuma que o
  atalho está invocável na mesma sessão em que foi instalado.
- `grilling`: entrevista rigorosa para eliminar ambiguidades de uma ideia ou
  decisão. Use somente quando pedida ou claramente compatível; enquanto ativa,
  não implemente antes de atingir entendimento compartilhado.
- conjunto Emil Kowalski:
  - `emil-design-eng`: filosofia geral de craft, interação e polimento;
  - `animate`: implementação de motion web com propósito;
  - `animate-expo`: motion específico para React Native/Expo;
  - `animation-vocabulary`: identifica o nome exato de um efeito;
  - `apple-design`: gestos, springs, continuidade e materiais;
  - `ask-sonner`: implementação e uso correto de toasts Sonner;
  - `find-animation-opportunities`: auditoria read-only de oportunidades;
  - `improve-animations`: auditoria read-only e planos de melhoria;
  - `review-animations`: revisão explícita de código de motion;
  - `pick-ui-library`: escolha de biblioteca apenas quando invocada;
  - `prototype`: cria variantes isoladas quando invocada.

Skills de produto/marketing instaladas em outros catálogos, como onboarding,
CRO, paywalls, pricing, analytics e copywriting, também obedecem ao processo de
descoberta acima. Não as aplique automaticamente por proximidade temática.

## 4. Plugins, LSPs e MCPs

### Plugins

Um plugin pode fornecer skills, MCPs e conectores. Pasta em cache ou manifesto
local não prova que o plugin está habilitado. Política:

- o repositório não declara atualmente um plugin próprio;
- bundles `openai-templates` e `plugin-management` foram observados no cache
  local, mas cache não equivale a instalação ativa nem disponibilidade;
- conectores recomendados como GitHub, Figma, Notion, Slack e Google Drive são
  opções externas e voláteis: confira o catálogo da sessão antes de citá-los ou
  solicitar instalação;

- use somente capacidades explicitamente expostas na sessão;
- instale um plugin apenas quando o usuário pedir aquele plugin, a busca de
  ferramentas não encontrar a capacidade e ele constar entre os recomendados;
- antes de conectar serviço externo, confira escopo, permissões, telemetria,
  retenção e dados enviados;
- acesso de leitura não autoriza comentário, issue, commit, push ou PR;
- conectores privados exigem autenticação própria; busca web não substitui
  acesso a conteúdo privado.

### LSPs e extensões do editor

`.vscode/extensions.json` recomenda o conjunto sem sobreposição desnecessária:

- TypeScript/JavaScript embutido no VS Code usando a versão do workspace;
- ESLint (`dbaeumer.vscode-eslint`) para regras de código;
- Tailwind CSS IntelliSense (`bradlc.vscode-tailwindcss`);
- Prisma (`prisma.prisma`);
- YAML (`redhat.vscode-yaml`) para Compose e workflows;
- Docker (`docker.docker`);
- SonarQube for IDE (`sonarsource.sonarlint-vscode`);
- Vitest Explorer e Playwright;
- Prettier somente como formatter, não como substituto do ESLint;
- cSpell pt-BR para documentação e conteúdo.

JSON/JSONC e TypeScript já têm suporte nativo; não instale servidores duplicados.
Use diagnostics do editor nos arquivos alterados, mas confirme no CLI. Preserve
as opções de telemetria desabilitadas em `.vscode/settings.json`. Uma extensão é
uma recomendação local: revise publisher e permissões antes de instalar.

### MCPs

O MCP opcional documentado é o SonarQube oficial, executado em container com
token de usuário, projeto `astroaxe` e telemetria desabilitada. Ele auxilia a
consulta; não substitui `npm run sonar` nem o Quality Gate. Não habilite Prisma
MCP, GitHub MCP ou qualquer conector por inferência. Para adicionar um MCP:

1. confirme que a tarefa precisa dele;
2. prefira fornecedor oficial e fixe versão/imagem;
3. conceda o menor escopo e use segredo por ambiente;
4. documente transporte, comandos, permissões e telemetria;
5. teste em dados não sensíveis e forneça procedimento de revogação.

Detalhes de bootstrap estão em `docs/OPERATIONS.md`.

## 5. Setup do zero

Pré-requisitos: Docker Engine com Compose v2, Git e, para comandos rápidos no
host, Node/npm compatíveis com `package.json`.

```bash
cp .env.example .env
openssl rand -hex 32
docker compose -f compose.yml -f compose.dev.yml config
docker compose -f compose.yml -f compose.dev.yml up -d --build --wait
docker compose -f compose.yml -f compose.dev.yml ps
curl --fail http://127.0.0.1/api/health/live
```

Gere valores independentes para cada segredo. Preencha `.env` sem versioná-lo,
sem colar valores em logs e sem registrar comandos com segredos no histórico.
As variáveis obrigatórias estão em `.env.example`: credenciais PostgreSQL e
Redis, URLs internas, segredos de sessão/fingerprint, identificação Nominatim,
URL do site e nível de log.

Para instalar dependências no host, somente quando necessário:

```bash
npm ci
npm run prisma:generate
```

O lockfile é autoritativo. Não misture npm, pnpm e yarn; não use
`--legacy-peer-deps` como solução permanente.

## 6. Workflow por tipo de tarefa

### Leitura, explicação ou revisão

Faça inspeção read-only, cite arquivos e evidências e entregue achados por
severidade. Não transforme uma revisão em implementação sem autorização.

### Diagnóstico

Reproduza, reduza o problema, identifique causa raiz e diferencie fato de
hipótese. Capture logs sanitizados e proponha correção; implemente somente se o
pedido incluir correção.

### Feature, fix ou refatoração

1. Leia instruções e skills aplicáveis.
2. Inspecione estado do Git, implementação, contratos e testes com `rg`.
3. Defina objetivo, critérios de aceite, boundaries Zod, cache, migração e risco.
4. Para trabalho não trivial, mantenha plano curto com uma etapa ativa.
5. Implemente a menor mudança coesa com `apply_patch`.
6. Execute diagnostics e testes direcionados enquanto trabalha.
7. Rode o checkpoint de qualidade proporcional ao risco.
8. Revise diff, PII, segredos, compatibilidade e documentação.
9. Entregue resultado, arquivos, comandos e validações não executadas.

### Mudança de UI/UX

Comece pelo fluxo, conteúdo, acessibilidade e estados; escolha efeitos depois.
Mantenha identidade “Observatório Ritual”, hierarquia clara e um insight por
momento. Requisitos mínimos:

- teclado, foco visível, semântica e contraste WCAG 2.1 AA;
- `prefers-reduced-motion`, sem som automático e controles persistentes de som;
- mobile-first, estados loading/empty/error/unknown e layout estável;
- animações com propósito, geralmente curtas e interruptíveis;
- nenhum componente copy-paste entra sem revisão de acessibilidade, bundle,
  licença, dependências e aderência visual;
- valide interação em viewport móvel e desktop e, quando material, Playwright.

### Mudança de domínio astrológico ou Orixás

Exige função pura, input snapshot auditável, validação de sanidade, teste golden
e registro `ANTES / DEPOIS / MOTIVO / IMPACTO`. Faça bump da versão de engine ou
config quando o mesmo input passar a produzir outro resultado. O método autoral
de Orixás pode produzir regências diretas de frente, cabeça e costas, desde que
declare versão, matriz, pesos, proveniência, acurácia observada e população de
validação. Casos sacerdotais consentidos e autodeclarações públicas verificáveis
podem compor datasets separados, anonimizados no repositório e sem conteúdo
ritual reservado.

### Dependência ou integração externa

Consulte documentação oficial atual, verifique compatibilidade real com a stack,
licença, manutenção, bundle, permissões e política de dados. Fixe versões quando
reprodutibilidade ou segurança exigir. Uma nova dependência precisa resolver um
problema que o código existente não resolve adequadamente.

## 7. Regras de código e dados

- Nunca use `as any`, `@ts-ignore`, `@ts-expect-error` ou `catch` vazio.
- Prefira narrowing, tipos explícitos, erros tipados e `unknown` validado.
- Valide toda boundary com Zod compartilhado: formulário, route handler,
  serviço externo, job, cache, webhook e saída de LLM.
- Prisma e constraints do banco são a última defesa, não a primeira.
- Não importe React/Next no domínio. Cálculos são determinísticos, sem
  `Math.random()`, relógio implícito, rede ou side effects.
- Injete tempo quando ele fizer parte do caso de uso.
- LLM interpreta somente dados calculados e validados; nunca calcula posições.
  Valide output estruturado e preserve source anchors.
- Cache keys contêm versão e todos os inputs que alteram o output. Natal é
  imutável por versão; trânsitos são date-keyed; sorteios não são cacheados.
- Valide o valor recuperado do Redis. Corrupção vira miss observável.
- Timeout, retry limitado com backoff e idempotência são obrigatórios nas
  boundaries externas adequadas.

## 8. Prisma e migrations

Toda alteração de schema deve gerar migration revisável. Não use `db push` como
substituto de migration e nunca edite migration já aplicada em ambiente
compartilhado.

Desenvolvimento:

```bash
docker compose -f compose.yml -f compose.dev.yml run --rm app \
  npx prisma migrate dev --name <descricao-curta>
docker compose -f compose.yml -f compose.dev.yml run --rm app \
  npm run prisma:generate
```

Aplicação de migrations existentes, como produção:

```bash
docker compose run --rm migrate
```

Revise SQL, índices, constraints, extensão pgvector, locks e impacto em dados.
Mudança destrutiva ou backfill precisa de plano de rollback/roll-forward e
backup testado. Nunca apague volume para “corrigir” migration.

## 9. Testes, build e SonarQube

Testes devem ser proporcionais ao risco e cobrir sucesso, falha, timeout,
boundary values, idempotência e regressão. Use mocks nas boundaries, fake timers
para tempo e fixtures determinísticas.

Feedback rápido:

```bash
npm run typecheck
npm run lint
npm test -- <arquivo-ou-padrao>
npm run format:check
```

Checkpoint completo:

```bash
npm run typecheck
npm run lint
npm run test:coverage
npm run build
```

`npm run build` é obrigatório para alterações de runtime, configuração Next,
dependências ou integração. Novo código deve manter pelo menos 80% de cobertura.
Não fragilize thresholds, exclusions ou testes para obter verde.

SonarQube roda em checkpoint funcional e antes da conclusão, não após cada
arquivo:

```bash
docker compose -f compose.quality.yml --profile quality up -d --wait
npm run test:coverage
SONAR_HOST_URL=http://127.0.0.1:9000 SONAR_TOKEN="$SONAR_TOKEN" npm run sonar
docker compose -f compose.quality.yml --profile quality down
```

O gate exige zero novos bugs/vulnerabilidades, hotspots novos revisados,
cobertura de novo código de pelo menos 80% e duplicação máxima de 3%. Use
Project Analysis Token no scanner e User Token no Connected Mode/MCP. A
Community Build possui limitações de branches; a análise da branch principal é
o contrato autoritativo. Nunca use `down -v` na rotina.

## 10. Docker e operação

Docker é o runtime autoritativo. PostgreSQL, Redis e Traefik não rodam no host.

```bash
docker compose config
docker compose build app migrate
docker compose up -d --wait
docker compose ps
docker compose logs --tail=200 app migrate postgres redis traefik
```

Política operacional:

- PostgreSQL e Redis permanecem em redes internas, sem portas públicas;
- só Traefik expõe tráfego do app;
- use healthchecks e `depends_on` por saúde, não sleeps arbitrários;
- mantenha imagens fixadas e atualize com changelog e teste de integração;
- não copie `.env`, tokens ou artefatos de desenvolvimento para a imagem;
- preserve usuário não-root nos runners;
- não execute `down -v`, prune, remoção de volume ou restauração sem alvo
  explícito, backup e autorização.

## 11. Segurança, privacidade e PII

Use somente o logger Pino central. Nunca registre password, token,
`Authorization`, cookie, secret/API key, email, data/hora de nascimento,
endereço/localização precisa, coordenadas, input snapshot integral ou URL com
credenciais/query sensível. Registre IDs opacos, status, duração e categorias.
Ao adicionar campo sensível, atualize e teste a redaction.

Em endpoints, jobs e integrações:

- valide Content-Type, tamanho, schema, autenticação, autorização e output;
- aplique headers de segurança, CSP adequada, CORS restrito e redirect seguro;
- rate limit é fail-closed quando Redis falha;
- webhooks e jobs são idempotentes e verificam assinatura antes de persistir;
- mensagens públicas não expõem stack, SQL ou detalhes internos;
- use queries parametrizadas e transações para invariantes multi-etapa;
- segredos vêm do ambiente/secret manager e possuem rotação/revogação;
- minimize coleta, retenção e acesso a dados de nascimento conforme LGPD;
- nunca envie PII a LLM, analytics, MCP ou plugin sem necessidade documentada,
  base legal e consentimento aplicável.

## 12. Git e GitHub

O workspace pode conter mudanças do usuário. Antes de editar:

```bash
git status --short
git diff -- <arquivos-em-escopo>
```

Não reverta, formate ou inclua mudanças alheias. Não use `git reset --hard`,
`git checkout --`, limpeza ou rebase destrutivo. Commits, branches, push, issues
e PRs são ações externas: execute apenas quando solicitadas.

Quando houver histórico/remoto configurados, use branch curta e descritiva e
commits Conventional Commits (`feat:`, `fix:`, `test:`, `docs:`, `chore:`),
atômicos e sem segredo ou artefato gerado desnecessário. Antes de PR:

- revise diff e arquivos não rastreados;
- execute o checkpoint completo e o Quality Gate;
- descreva problema, solução, testes, migrations, riscos e rollback;
- nunca alegue CI, review ou deploy que não foi observado.

Se ainda não houver commits ou remoto GitHub, documente a ausência; não invente
URL, branch protection ou pipeline.

## 13. Troubleshooting

| Sintoma                       | Diagnóstico seguro                                 | Ação preferida                                      |
| ----------------------------- | -------------------------------------------------- | --------------------------------------------------- |
| Compose rejeita variáveis     | `docker compose config`                            | complete `.env`; não use defaults fracos            |
| Serviço não fica healthy      | `docker compose ps` e logs do serviço              | corrija causa raiz/healthcheck                      |
| Prisma Client desatualizado   | compare schema e generated client                  | rode `npm run prisma:generate` no ambiente correto  |
| Migration falha               | leia SQL e logs do `migrate`                       | corrija migration nova; não apague volume           |
| `next build` morre no webpack | `TypeError` em `WasmHash._updateWithBuffer`        | cache corrompido: limpe `.next` e reconstrua        |
| Teste pendura                 | localize handle/timer/conexão aberta               | shutdown explícito e fake timers quando cabível     |
| Redis indisponível            | verifique health/logs e timeout                    | preserve fail-closed; não faça bypass silencioso    |
| Sonar não inicia              | confirme memória/`vm.max_map_count`, health e logs | ajuste host conforme `docs/OPERATIONS.md`           |
| Scanner sem cobertura         | confira `coverage/lcov.info`                       | rode `npm run test:coverage` antes do scan          |
| Connected Mode não sincroniza | confira URL, token de usuário e project key        | refaça binding sem expor token                      |
| Tailwind IntelliSense falha   | use workspace TS e configuração v4                 | recarregue editor; não instale LSP duplicado        |
| Build difere do dev           | reproduza no target Docker/webpack                 | corrija import, env ou boundary server/client       |
| Skill instalada não aparece   | confira catálogo da sessão                         | abra nova conversa/reinicie; use fallback declarado |

Se uma verificação essencial falhar por infraestrutura, reporte comando,
mensagem e impacto. Não marque a tarefa como concluída com gate essencial
desconhecido.

## 14. Delegação especializada

Use subagentes somente quando a sessão/instrução autorizar e houver subtarefas
independentes. A especialização esperada é:

- planejamento: `prometheus`, revisão `metis`, validação `momus`;
- arquitetura/debug complexo: `oracle` ou `deep`;
- implementação grande: `hephaestus`;
- busca interna: `explore`; documentação externa: `librarian`;
- UI: `artistry`; visual fornecido: `multimodal-looker`;
- mudança trivial e isolada: `quick`.

Não delegue leitura de `SKILL.md`, integração final ou tarefa de uma linha.
Agentes paralelos não editam os mesmos arquivos. O integrador revisa os
resultados, resolve conflitos e executa a validação final.

## 15. Critério de conclusão

Uma tarefa termina somente quando:

- o comportamento e os critérios solicitados estão atendidos;
- contracts, erros, cache, PII e segurança foram revisados;
- diagnostics e testes proporcionais passam;
- build e Sonar passam quando exigidos pelo risco/checkpoint;
- migrations, engine/config e operação estão documentadas quando alteradas;
- o diff permanece no escopo e não contém suppressions, segredos ou mudanças
  alheias;
- a entrega informa arquivos, resultado, comandos executados e qualquer
  validação que não pôde ser realizada.

## 16. Memória e retomada do projeto

`docs/PROJECT_MEMORY.md` é o ponto canônico de retomada entre sessões. Leia-o
depois deste manual e antes de assumir o estado do runtime, do banco, das
validações ou das decisões recentes de produto. Atualize-o quando uma mudança
alterar comportamento entregue, infraestrutura ativa, decisão de experiência,
risco conhecido ou próximo marco.

O documento é um snapshot local datado, não substitui `git status`, healthchecks,
testes, runbooks nem os documentos temáticos. Divergências devem ser resolvidas
pela evidência mais recente e registradas tanto na memória quanto no documento
autoritativo da área.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
