# AstroAxe — Blueprint 6

**Versão:** 6.1.0

**Data:** 2026-08-19

**Status:** decisão de produto e arquitetura para reconstrução

**Runtime:** Docker-only

## 1. Tese do produto

AstroAxe é uma plataforma brasileira de astrologia personalizada que une três camadas sem confundi-las:

1. **Céu calculado:** posições, casas, aspectos e trânsitos determinísticos e auditáveis.
2. **Leitura astrológica:** interpretação editorial em português, com autoria e versão visíveis.
3. **Tríade de Regências:** leitura autoral e calculada de Orixás de frente, cabeça e costas, produzida por uma matriz ocultista versionada e governança cultural.

O produto assume uma leitura direta dentro do método AstroAxe. Seu diferencial é combinar cálculo astrológico, correspondências ocultistas, narrativas e conhecimento afro-brasileiro em um sistema determinístico, explicável e calibrado. Um disclaimer curto no rodapé identifica o método como autoral.

## 2. Princípios inegociáveis

- **Precisão sem falsa autoridade:** distinguir dado astronômico, regra astrológica, interpretação editorial e texto contextualizado por IA.
- **Primeiro valor antes do paywall:** o primeiro mapa resumido e o primeiro ritual diário são gratuitos.
- **Autoria transparente:** conteúdo humano mostra autor, revisão, fontes internas e versão; conteúdo com IA é rotulado.
- **Tradição viva, não decoração:** pessoas de tradição participam da criação, revisão, veto, atribuição e remuneração do conteúdo de Orixás.
- **Linguagem não fatalista:** apresentar tendências, perguntas e possibilidades; nunca sentenças inevitáveis ou medo como mecanismo de retenção.
- **Privacidade por padrão:** data, hora e local de nascimento são dados pessoais; minimizar coleta, acesso, logs e retenção.
- **Acessibilidade sensorial:** animação e som são opt-in, respeitam `prefers-reduced-motion` e possuem controles persistentes.
- **Hipóteses são hipóteses:** preço, trial, paywall e retenção serão validados por dados do próprio produto, sem alegações universais não demonstradas.

## 3. Integridade cultural e religiosa

### 3.1 Decisão sobre Orixás

O Blueprint 6.1 substitui a antiga ressonância não conclusiva pela **Tríade de Regências AstroAxe**:

- calcula e apresenta Orixá de frente, Orixá de cabeça e Orixá de costas;
- combina planetas, signos, casas, ângulos, dignidades, aspectos, elementos, modalidades, ciclos e correspondências ocultistas documentadas;
- relaciona os indicadores a uma ontologia versionada de Orixás, qualidades, elementos, narrativas e símbolos;
- explica os fatores determinantes sem transformar a tela em uma sucessão de ressalvas;
- informa acurácia somente quando medida em conjunto de validação separado;
- mantém um disclaimer discreto no rodapé: “Método autoral AstroAxe; consulte a metodologia”.

Universalidade é uma hipótese operacional do método. O grafo conserva a origem de cada correspondência — Ketu/Nagô, Ifá, Umbanda, Batuque, hermetismo ou outra escola — para testar convergências sem perder rastreabilidade.

### 3.2 Conselho cultural

**Revisto em 26 de agosto de 2026.** A versão anterior condicionava a publicação da camada de Axé
à formação de um conselho remunerado, com escopo reservado, licenças e direito de veto. Isso foi
descartado junto com o modelo de direitos por fonte (§5.0): a publicação não depende mais de
aprovação externa, e o que o site entrega é síntese escrita por nós.

O que permanece é o processo de correção. O método é versionado e avaliado, e quando uma leitura
se mostra errada — por leitura equivocada de uma fonte, por convergência mal pesada ou por
apontamento de quem pratica — isso gera nova versão com registro do que mudou e por quê. Correção
é mecanismo de qualidade do método, não permissão para operar.

Casos sacerdotais podem ser usados com consentimento específico e dados minimizados. Casos públicos exigem autodeclaração inequívoca da regência e fonte natal verificável. Rumor, atribuição por terceiros, inferência por aparência ou dado reservado não são ground truth. Calibração e validação usam conjuntos separados, e o repositório guarda somente IDs opacos, features derivadas e rótulos necessários.

## 4. Experiência principal

### 4.1 Onboarding

Fluxo em quatro etapas: nome de exibição, data, hora e local de nascimento. Exibir progresso, permitir retorno e explicar por que cada dado é necessário.

Hora desconhecida não será silenciosamente convertida em um mapa completo ao meio-dia:

- ativar modo explícito **“não sei minha hora”**;
- não exibir Ascendente, Meio do Céu ou casas como resultados válidos;
- sinalizar quando a Lua pode mudar de signo no intervalo do dia;
- excluir regras e trânsitos dependentes de casas/ângulos;
- permitir recalcular quando o usuário obtiver a hora correta.

### 4.2 Primeiro resultado

Antes de qualquer oferta paga, entregar:

- mandala explorável;
- Sol, Lua quando estável e Ascendente quando disponível;
- três insights curtos com a evidência astrológica acessível;
- uma introdução opcional às ressonâncias simbólicas;
- indicação clara da qualidade dos dados.

### 4.3 Ritual diário “Tempo do Céu”

A home deve ser compreendida em poucos segundos e aprofundada sob demanda:

1. **Agora:** tema principal do céu pessoal, em linguagem simples.
2. **Por quê:** trânsito/aspecto, início, pico, fim e intensidade relativa.
3. **Como trabalhar:** pergunta de reflexão e ação pequena opcional.
4. **Ressonância:** conteúdo cultural revisado, somente quando houver relação editorial legítima; nunca um “Orixá regente automático do dia”.
5. **Aprofundar:** mandala, demais trânsitos e texto técnico.

Cadências complementares: céu coletivo diário, leitura semanal, fases da Lua, trânsitos longos e retrospectiva anual. A conta já permite consultar o Tempo do Céu diário dos últimos 366 dias sem duplicar snapshots no banco. Notificações são opt-in, configuráveis por frequência e sem mensagens alarmistas.

## 5. Conteúdo e IA

### 5.0 Decisão de arquitetura — 26 de agosto de 2026

**Runtime único, cobertura total.** O modelo anterior — dois runtimes, modo
`disabled|public|local`, bundle público filtrado por direitos, classificação de direitos e
sensibilidade por artefato, fila de revisão bloqueando publicação — foi descartado por
decisão do responsável. Ele resolvia um problema que o produto não tem.

A separação real não é entre dois ambientes. É entre **insumo** e **obra**:

- **Insumo:** o acervo privado do responsável. Alimenta a derivação do método. Usado por
  inteiro, sem trava por fonte, sem fila, sem classificação prévia.
- **Obra:** o que o site publica. Método, correspondências, regências, regras de tempo,
  síntese escrita por nós. Original, e por isso publicável sem ressalva.

O site publica a obra, nunca o insumo. Não porque um gate impeça, mas porque texto-fonte de
terceiros não é o produto — o método derivado dele é. Isso resolve a questão jurídica pela
via correta: fato e ideia não são protegidos, expressão é, e a nossa expressão é nossa.

Consequências práticas:

- não existe modo de runtime; não existe bundle público; não existe rota que entregue
  artefato-fonte; não existe matriz de facetas ou de direitos por registro;
- símbolos, selos e pontos riscados são **redesenhados em SVG próprio**. O símbolo é
  tradicional e livre; o que carrega autoria é o traço de um artista numa edição específica.
  Redesenhar também rende vetor escalável, temático e acessível, em vez de recorte de scan;
- a proveniência continua registrada **internamente** — de onde veio a ideia — para permitir
  corrigir o método quando uma fonte se mostrar errada. Ela sai da interface;
- a página de metodologia explica o método como um _model card_: entradas, processo,
  versionamento, avaliação e limites conhecidos, em profundidade.

### 5.0.1 Condensação das tradições

Decidido em 26 de agosto de 2026, corrigindo uma formulação anterior que proibia fundir
tradições. A proibição era errada: muitas se complementam, os fundamentos se cruzam, e
agrupá-los num sistema único é o produto.

O que o método faz é **condensar por função estrutural**, em três camadas com uma saída:

1. **Fonte.** Cada tradição afirma o que afirma, com identidade própria — escola, obra,
   edição. Camada interna, nunca exposta como aparato de citação.
2. **Função abstrata.** Extrai-se a posição estrutural independente do nome: abridor de
   caminhos, limiar, ferro e ofício da guerra, regência de hora, quadrante elemental. É
   aqui que as tradições se encontram, porque é aqui que elas de fato respondem à mesma
   pergunta.
3. **Condensação.** Agrupa por função. **Convergência entre escolas independentes aumenta
   o peso**; divergência é registrada como conflito, não resolvida por média.

A saída é um método único e robusto. A pessoa vê um sistema; a máquina sabe de onde cada
peça veio e o quanto ela é sustentada.

**Por que a proveniência sobrevive à condensação.** Não é freio: é o que dá peso. Três
escolas independentes atribuindo a mesma função à mesma posição é evidência forte — mas só
enquanto for possível ver que eram independentes. Achatar tudo numa tabela plana antes de
pesar destrói exatamente esse sinal: uma linha só não distingue consenso de três escolas de
repetição de uma. É a mesma razão pela qual o grafo do método v2 já separa arquivo, obra,
família de fonte e escola, e não conta cópia nem tradução como confirmação independente.

**O único limite, e ele é técnico.** Afirmamos **posição análoga**, não identidade. "Ocupa
a mesma função estrutural" é o que a comparação de fato estabelece e se sustenta sob
escrutínio; "é o mesmo ente" é uma afirmação diferente, falsificável, que nenhuma fonte
sustenta e que derrubaria o método junto. A distinção não custa nada e é o que separa
síntese comparativa de sincretismo ingênuo.

### 5.1 Cadeia de confiança

`dados higienizados → motor astronômico → mapa validado → regras astrológicas → corpus derivado → composição → validação → apresentação`

- O motor calcula; o LLM nunca calcula posições.
- O corpus de composição contém apenas texto que escrevemos, derivado do estudo do acervo.
- A resposta referencia os placements e trânsitos usados.
- Zod valida o formato, mas validadores semânticos verificam coerência com o mapa e proíbem fatos não presentes no contexto.
- Falha de validação não é exibida como interpretação; o job é reprocessado ou enviado para revisão.

### 5.2 Política de IA

A IA atua como copiloto de explicação e composição, não como astrólogo humano, sacerdote ou oráculo. A interface informa quando houve geração por IA e permite abrir “Como esta leitura foi criada”. Conteúdo editorial principal pode ser reutilizado sem nova geração quando a combinação determinística já existir.

Bloquear aconselhamento médico, jurídico e financeiro; diagnóstico psicológico; previsões de morte, doença, gravidez ou violência; incentivo a dependência; e afirmações religiosas autoritativas. Em contexto de crise, interromper a leitura e direcionar para ajuda adequada.

## 6. Motor e qualidade de dados

O domínio astrológico permanece puro, sem dependência de React ou Next.js. O adapter Caelus fica isolado e sua versão permanece pinada até regressões golden aprovarem atualização.

Toda execução persiste:

- input normalizado e nível de precisão;
- hash do input;
- versão do motor, configuração e conteúdo;
- resultado estruturado e checks de sanidade;
- data de cálculo apenas como metadado, não como fonte de aleatoriedade.

Validações obrigatórias:

- schemas Zod em entrada, integração, cache, fila e saída;
- constraints equivalentes no PostgreSQL para invariantes essenciais;
- coordenadas, timezone histórico e data coerentes;
- posições em `[0, 360)`, cúspides e aspectos dentro da configuração;
- testes golden comparados a referências independentes antes de mudanças de engine/config.

“Frescor” aplica-se a trânsitos, efemérides externas e conteúdo diário; mapa natal é imutável para o mesmo input e versões.

## 7. Monetização

O lançamento usa dois planos e complementos, evitando criar um Premium sem operação humana real:

| Oferta            |                           Hipótese inicial | Inclui                                                                                          |
| ----------------- | -----------------------------------------: | ----------------------------------------------------------------------------------------------- |
| Free              |                                       R$ 0 | mapa resumido, ritual diário, até 3 perfis, preview de leituras profundas                       |
| Pro               | R$ 19,90/mês; anual com desconto a validar | perfis ilimitados, trânsitos completos, histórico, sinastria, interpretações e compartilhamento |
| Avulsos           |                          preço por produto | ano pessoal, relatório temático e conteúdos especiais                                           |
| Consultas futuras |                          preço do parceiro | atendimento humano somente após rede verificada e regras operacionais                           |

O paywall é contextual e mostra o valor bloqueado sem esconder o primeiro resultado. Trial, desconto anual e limites serão experimentos explícitos. Não afirmar que três tiers maximizam receita nem que trials falham no nicho sem dados próprios.

## 8. Arquitetura técnica alvo

### 8.1 Baseline

Pins de reconstrução, a validar novamente ao gerar o lockfile:

- Node.js `24.18.0` LTS, Next.js `16.3.1`, React `19.2.8`;
- TypeScript `5.9.3`, Tailwind CSS `4.3.3`;
- Prisma `7.9.1`, PostgreSQL `18.4`, pgvector `0.8.6`;
- Redis `8.10.0`, BullMQ `6.1.2`, ioredis `6.0.0`;
- Traefik `3.7.10` e npm com versões exatas e lockfile.

Bibliotecas de UI entram apenas quando houver uso concreto. Componentes copy-paste de shadcn/ui, Magic UI, Aceternity UI e Origin UI tornam-se código próprio e devem passar por revisão de acessibilidade, segurança e manutenção. Evitar múltiplas engines de animação na mesma interação; Framer Motion é o padrão, GSAP/Three.js são exceções justificadas.

### 8.2 Serviços Docker

- `postgres`: dados persistentes e extensão vector;
- `redis`: cache, rate limit, filas e heartbeat;
- `migrate`: execução única antes dos consumidores;
- `app`: Next standalone, usuário não-root;
- `worker`: jobs, métricas e graceful shutdown;
- `traefik`: entrada HTTP local e roteamento; em produção ele permanece privado e é alcançado
  apenas pelo Cloudflare Tunnel, conforme `docs/OPERATIONS.md`;
- `sonarqube`: análise local em profile de qualidade;
- `backup`: profile sob demanda com restore testado.

Banco e Redis não publicam portas no host. Redes internas separam backend e observabilidade. App e worker recebem egress apenas quando necessário.

### 8.3 Cache

Toda chave inclui versão do contrato e todos os inputs que alteram a saída:

- natal: sem TTL operacional, mas versionado por engine/config;
- geocoding: TTL longo e revalidação;
- trânsitos/ritual diário: data e timezone na chave;
- interpretação: mapa, versão de conteúdo/modelo e contexto temporal;
- sorteios realmente aleatórios: sem cache.

Cache inválido ou fora do schema vira miss. Warming deve ser dimensionado com métricas reais; pré-computar 12 signos para 10 mil leituras reduz até cerca de 833 vezes as gerações, não 4000 vezes.

## 9. Segurança, privacidade e observabilidade

- Autenticação, autorização e feature gates são server-side.
- Rate limit Redis fail-closed apenas em boundaries de abuso; health e recuperação operacional não devem criar indisponibilidade circular.
- Logger JSON sanitiza tokens, cookies, emails, dados natais, localização precisa e snapshots.
- CSP e demais headers são definidos por rota e testados; não usar uma política nominalmente “strict” incompatível com a aplicação.
- Stripe processa webhooks com assinatura, transação e idempotência. Retornar `2xx` somente quando o evento estiver persistido ou deliberadamente descartado; erros transitórios devem permitir retry.
- Métricas não carregam PII nem IDs de usuário/mapa. Logs, traces e backups possuem retenção definida.
- Healthchecks distinguem live e ready; métricas do worker são autenticadas e acessíveis apenas na rede de observabilidade.

## 10. Qualidade local e experiência de desenvolvimento

### 10.1 SonarQube Community em container

Codacy não faz parte do gate. O profile `quality` sobe SonarQube Community Build localmente com volume persistente e token fora do repositório. O scanner consome LCOV e resultados de testes.

Gate de projeto:

- cobertura de novo código ≥ 80%;
- duplicação de novo código ≤ 3%;
- zero issues blocker/critical de confiabilidade e segurança;
- revisão de Security Hotspots antes de concluir a tarefa.

As limitações da edição Community para branches/PRs devem ser respeitadas; o gate local não substitui testes, typecheck, lint, revisão humana ou scan de dependências/imagens.

### 10.2 LSPs e extensões recomendadas

Instalar de forma reproduzível, preferencialmente no dev container/workspace:

- TypeScript/JavaScript Language Service;
- ESLint language server;
- Tailwind CSS IntelliSense;
- Prisma Language Server;
- JSON e YAML Language Servers;
- Docker Language Server;
- Markdown language server/Marksman;
- SonarQube for IDE conectado ao servidor local.

Extensões úteis e amplamente adotadas: Docker DX, Prisma, ESLint, Prettier, Tailwind CSS IntelliSense, SonarQube for IDE, Vitest, Playwright e CSpell com português brasileiro. Evitamos Error Lens, GitLens e múltiplos formatadores por padrão para reduzir ruído, telemetria e responsabilidades duplicadas. Fix-on-save fica limitado a regras determinísticas; migrations, geração de schema e mudanças semânticas nunca rodam automaticamente.

### 10.3 Princípios visuais do Observatório Ritual

- Usar a mandala como instrumento espacial e educativo, com objetos selecionáveis e evidência ancorada, não como fundo decorativo.
- Usar a **Carta em formação** no onboarding e a futura **Janela de Trânsito** no dashboard; cada tela mantém apenas um gesto cinematográfico e superfícies de leitura calmas.
- Preferir noite, marfim, dendê e cobre ao clichê preto+ciano/Web3; cor de Orixá só aparece em conteúdo cultural aprovado.
- No desktop, combinar palco orbital e trilho editorial; no mobile, reenquadrar a mandala e mover a ficha para o fluxo/bottom sheet.
- Nenhum texto ou controle essencial fica preso ao WebGL. Sem JS/motion, a hierarquia e a leitura continuam completas.
- Motion é semântico, interrompível, respeita redução de movimento e pausa fora de viewport. Não usar scroll-jacking, autoplay sonoro ou densidade fixa de partículas.
- Preservar a identidade afro-brasileira por autoria, linguagem e padrões aprovados, nunca por símbolos sagrados usados como ornamento.

A análise, tokens, layouts e critérios estão em [`docs/BLUEPRINT.md`](./BLUEPRINT.md).

## 11. Métricas de produto

Instrumentar com consentimento e eventos sem conteúdo sensível:

- conclusão do onboarding e tempo até primeiro insight;
- percentual com hora conhecida versus desconhecida;
- abertura e conclusão do ritual diário;
- expansão de “Por quê” e interação com mandala;
- ativação D1/D7, retenção D30 e frequência saudável de notificação;
- conversão após primeiro valor, cancelamento e motivo;
- taxa de validação/retry/revisão de interpretações;
- correções culturais recebidas e prazo de resolução.

Não usar “precisão sentida” ou dependência diária como North Star. A métrica principal de ativação é concluir um primeiro insight compreendido e acionável.

## 12. Ordem de reconstrução

1. **Fase 0 — Governança:** Blueprint, contexto de produto, ADRs, conselho cultural e políticas de conteúdo/IA.
2. **Fase 1 — Fundação:** Docker, banco, Redis, migrations, health, worker mínimo, SonarQube e tooling.
3. **Fase 2 — Motor:** domínio astrológico, data hygiene, unknown-time mode, golden tests e cache.
4. **Fase 3 — Conta e mapa:** guest-first, autenticação, ownership, onboarding e primeiro resultado.
5. **Fase 4 — Conteúdo:** CMS/corpus autorizado, autoria, Tríade de Regências e revisão cultural.
6. **Fase 5 — Ritual e IA:** trânsitos, Tempo do Céu, RAG, validação semântica e streaming.
7. **Fase 6 — Receita:** Free/Pro, avulsos, Stripe, limites e experimentação.
8. **Fase 7 — Polimento:** acessibilidade, E2E, performance, SEO, backups e observabilidade.

### Atualização operacional em 2026-08-21

- A memória curta e canônica para retomada entre sessões está em `docs/PROJECT_MEMORY.md`; o estado
  detalhado continua em `docs/IMPLEMENTATION_STATUS.md`.
- A busca real de cidades e a criação sintética de mapa foram validadas pela stack local. A
  apresentação de signos e Ascendente foi corrigida sem alterar o núcleo astronômico.
- O onboarding já implementa palco orbital, motion com propósito, redução de movimento e partículas
  Canvas limitadas. A próxima entrega da experiência principal é a mandala natal real e interativa
  no primeiro resultado.
- O runtime local foi migrado por restore lógico para PostgreSQL 18 no volume
  `astroaxe_postgres18_data`, com 16 migrations e pgvector validados. O volume PostgreSQL 16
  `astroaxe_postgres_data` permanece preservado para retorno.
- O checkpoint mais recente passou com 238 testes, typecheck, lint, build e release smoke. O Sonar
  passou antes do incremento visual e deve ser reexecutado no próximo checkpoint funcional.

### Estado implementado em 2026-08-19

- Fases 0–2 concluídas no primeiro checkpoint.
- Fase 3 concluída no escopo de conta e primeiro mapa: sessão guest HMAC com retenção de 24 horas,
  onboarding em quatro etapas, geocoding com cache, cálculo persistido e primeiro resultado antes
  da conta; autenticação local com senha derivada por `scrypt`, sessão opaca de 30 dias, claim
  idempotente no cadastro/login e exclusão do perfil filtrada pelo titular.
- O worker remove sessões guest e de conta vencidas a cada hora. O cascade elimina somente perfis
  que ainda pertencem ao guest; perfis reivindicados têm ownership transferido ao usuário na mesma
  operação e permanecem preservados.
- A conta agora lista somente os perfis do titular e permite atualizar/recalcular dados natais. O
  resultado substituído é preservado em `natal_chart_revisions`, com fingerprint, versões, modo,
  resultado, motivo e instante da substituição.
- Fase 4 avançou da infraestrutura para o primeiro corpus público: conteúdo versionado, autoria, revisão independente,
  fontes, claims e retirada editorial possuem persistência auditável. A API pública expõe somente
  versões publicadas e claims ativas ou contestadas, sem pareceres internos.
- A aprovação coletiva em lote declarada pelo responsável foi registrada sem inferir nomes ou
  credenciais. Quatro verbetes longos estão publicados: três contextos IPHAN e uma leitura situada
  do capítulo VI de _Yoruba Legends_ (1929), acompanhada de crítica ao enquadramento colonial do
  prefácio. A página `/acervo-cultural` mostra texto, versão, autoria, revisão, claims e fontes.
- A existência de quatro textos aprovados não determina sozinha a Tríade. O método direto foi
  autorizado em 20 de agosto de 2026 e ainda exige ontologia, matriz versionada, dataset de
  calibração, validação separada e testes golden antes da publicação.
- O workflow editorial possui identidade explicitamente vinculada a uma conta e papéis de autoria,
  revisão ou administração. As APIs exigem sessão, mesma origem e segregação de funções; ninguém
  pode aprovar o próprio verbete, e toda publicação registra o parecer na mesma transação.
- A Fase 5 foi iniciada pelo domínio puro de trânsitos. Um snapshot versionado calcula aspectos
  entre sete corpos em trânsito e os placements natais, com orbe, movimento aplicante/separante,
  intensidade relativa e fingerprint determinístico. Cache, API e primeira apresentação do
  `Tempo do Céu` e janelas temporais de início, pico e fim estão implementados.
- O snapshot diário agora possui cache Redis validado e uma API autenticada por perfil. A data é
  resolvida no timezone do titular, a chave contém todas as dimensões que alteram o resultado e a
  consulta ao mapa é filtrada server-side por ownership.
- A leitura diária passa a usar biblioteca editorial preexistente, não geração obrigatória por
  requisição. Templates longos são selecionados por trânsito, ponto natal e aspecto, possuem versão,
  autoria, método de geração e revisão independente. Três textos assistidos por IA inauguram o
  acervo publicado com validação automatizada explicitamente identificada; conteúdo cultural
  continua exigindo revisão humana. O seletor fail-closed devolve apenas versões publicadas. Na
  ficha do perfil, a primeira apresentação organiza a narrativa em `Agora / Por quê / Como
trabalhar`, expõe autoria e revisão e recusa improvisar quando não existe template publicado.
- O benchmark público de Astrolink e Personare orientou um feed de múltiplos ciclos, sem copiar
  redação ou interface. A biblioteca `modular-ptbr-1` materializa 350 textos longos a partir de
  blocos editoriais originais por agente em trânsito, função natal e aspecto. O runtime apenas
  seleciona registros publicados; a aprovação estrutural é feita em lote e permanece separada da
  revisão cultural.
- A primeira fatia da Fase 7 adiciona Playwright fixado, E2E em Chromium desktop/mobile, skip link,
  foco visível e verificação de overflow e proveniência. Onboarding autenticado, performance, SEO,
  backup/restore e observabilidade continuam como próximos checkpoints.

### Registro do snapshot de trânsitos

- **ANTES:** o produto calculava apenas o mapa natal e não possuía contrato determinístico para o
  céu de uma data posterior.
- **DEPOIS:** o domínio produz um snapshot validado e ordenado dos aspectos de trânsito para um
  instante explícito, sem relógio implícito, rede, IA ou conteúdo cultural.
- **MOTIVO:** separar o fato astronômico da interpretação editorial antes de construir o ritual
  diário e o RAG.
- **IMPACTO:** o contrato inicial foi `transits-2026-08-19`; o mapa natal e suas versões não
  mudaram. O snapshot passou depois a alimentar a experiência diária, sempre descrito como contexto
  astrológico e não como previsão certa ou conselho.

### Registro das janelas de trânsitos

- **ANTES:** o snapshot descrevia apenas o aspecto no instante diário; a interface não distinguia
  quando a passagem começou, quando atingiria seu menor orbe local ou quando terminaria.
- **DEPOIS:** os cinco aspectos prioritários carregam a janela contínua que contém o instante de
  referência, com `startsAt`, `peaksAt`, `endsAt` e `peakOrb`. O cálculo possui teste golden e a
  configuração mudou de `transits-2026-08-19` para `transits-2026-08-19-window-1`.
- **MOTIVO:** dar contexto temporal observável sem transformar um trânsito em previsão fatalista e
  sem fundir passagens distintas durante movimentos retrógrados.
- **IMPACTO:** o mesmo mapa/data passa a produzir campos adicionais e uma nova cache key. Snapshots
  anteriores não são reutilizados; nenhuma posição ou regra de aspecto natal foi alterada.

### Registro de recálculo de perfil

- **ANTES:** o mapa natal persistido era imutável na interface; corrigir data, hora ou cidade exigia
  criar outro perfil e não havia uma relação auditável com o resultado anterior.
- **DEPOIS:** o titular pode corrigir seus dados e solicitar novo cálculo; a transação arquiva o
  mapa anterior antes de atualizar perfil e resultado atual.
- **MOTIVO:** hora de nascimento pode ser descoberta ou corrigida depois do primeiro valor, e o
  produto precisa comunicar essa mudança sem perder rastreabilidade.
- **IMPACTO:** o mesmo input e as mesmas versões continuam produzindo o mesmo resultado. Não há
  bump de engine/config; cada mudança decorre de input explícito do titular e mantém histórico
  técnico. A revisão não é exposta como previsão nem enviada a analytics/LLM.

## 13. Fontes verificadas

### Mercado e produto

- [Co–Star — FAQ e modelo](https://www.costarastrology.com/faq/)
- [Midjourney — aquisição do Co–Star, 2026](https://updates.midjourney.com/midjourneys-first-acquisition/)
- [CHANI — produto e política de conteúdo humano](https://www.chani.com/app)
- [The Pattern — recursos e IA In-Depth](https://www.thepattern.com/)
- [TimePassages — produto atual](https://apps.apple.com/us/app/timepassages-astrology/id488946918)
- [Astrolink — aplicativo atual](https://apps.apple.com/br/app/astrolink-mapa-astral/id1598327566)
- [Astrolink — Orbia](https://www.astrolink.com.br/mapa-astral-orbia)
- [Personare — Horóscopo Personalizado](https://www.personare.com.br/horoscopo-personalizado)

### Integridade cultural

- [SciELO — Relações e narrativas: o enredo no candomblé da Bahia](https://www.scielo.br/j/rs/a/BQZmgvKQLQNp9Z6vYCxbHcD/?lang=pt)
- [SciELO — Oogun Àṣẹ: estratégias de cuidado](https://www.scielo.br/j/icse/a/8r94PCz5zyGKbjhTDQ6PdDM/?format=pdf&lang=pt)
- [IPHAN — Dossiê Bembé do Mercado](https://portal.iphan.gov.br/uploads/ckfinder/arquivos/Dossie_Bembe_do_Mercado.pdf)

### Design e interação

- [Awwwards — NFTmap: Explore a solar system](https://www.awwwards.com/inspiration/ntfmap-provenance-record-nftmap-buy-yourself-a-planet)
- [Astrarise — galáxia interativa](https://astrarise.vercel.app/)

## 14. Registro de mudanças

- **6.1.0 (2026-08-22):** formaliza a Tríade de Regências como resultado direto do método autoral
  AstroAxe, condicionado a matriz versionada, proveniência, validação separada e governança
  cultural; o resultado não constitui confirmação religiosa nem substitui consulta tradicional.
- **6.0.0 (2026-08-19):** atualiza stack e mercado; substitui determinação automatizada de Orixá por ressonância simbólica governada; formaliza hora desconhecida, autoria/IA transparente, monetização em dois planos, SonarQube Community local e LSPs.

---

# Anexos absorvidos em 28 de agosto de 2026

## Referências de design

**Análise inicial:** 2026-08-19

**Implementação revisada:** 2026-08-21

**Escopo:** contrato de experiência e direção visual do AstroAxe

### Método e limites

As referências foram abertas em Chromium a `1440×1000` e `390×844`. Astrarise foi inspecionado diretamente. No caso do NFTmap, foi possível analisar o registro visual responsivo publicado pelo Awwwards; o domínio original `nftmap.com` não concluiu o carregamento e não deve ser tratado como referência funcional atual.

- [NFTmap — Explore a solar system, Awwwards](https://www.awwwards.com/inspiration/ntfmap-provenance-record-nftmap-buy-yourself-a-planet)
- [Astrarise](https://astrarise.vercel.app/)

Screenshots de trabalho ficaram somente em `/tmp`; não foram incorporados ao repositório nem usados como assets.

### Leitura das referências

#### NFTmap

O elemento publicado coloca o sistema solar no centro da interface: fundo quase preto, órbitas concêntricas, Sol luminoso, planetas em escalas distintas e um card ancorado ao corpo selecionado. Navegação e ações ficam nas bordas para preservar o palco central.

**Aproveitável:**

- espaço orbital como estrutura de navegação, não apenas decoração;
- um objeto selecionado por vez, com anotação próxima à origem;
- profundidade produzida por escala, brilho e sobreposição controlada;
- centro visual forte e controles periféricos;
- mandala como instrumento explorável.

**Limites observados:**

- a miniatura mobile reduz a cena inteira até perder legibilidade e área de toque;
- estética preto+ciano e glow aproxima o produto de Web3/jogo espacial;
- tooltip claro sobre cena escura parece um elemento importado se não compartilhar tokens;
- muitos corpos simultâneos competem com a ação principal.

#### Astrarise

Astrarise usa uma galáxia Three.js de partículas em tela cheia como hero e suporte para uma narrativa de scroll. Há marca condensada em caixa alta, CTA branco no canto, texto grande sobre a cena e controles que alteram cor, quantidade de partículas, raio, ramificações e aleatoriedade. O projeto declara Three.js, GSAP e Tailwind CSS em sua apresentação.

**Aproveitável:**

- uma única cena generativa memorável como assinatura;
- narrativa editorial que emerge depois do impacto visual;
- sensação de profundidade e resposta direta à interação;
- parâmetros visuais que tornam o universo pessoal, quando ligados a dados reais.

**Anti-patterns visíveis no mobile:**

- o mesmo enquadramento desktop é recortado, não recomposto;
- título e parágrafo ocupam a cena e sofrem clipping na dobra;
- badges flutuantes cobrem conteúdo e reduzem a área útil;
- marca e CTA disputam o topo;
- partículas densas prejudicam leitura, bateria e hierarquia;
- dependência de WebGL deixa pouco valor sem a camada visual.

### Síntese para o Observatório Ritual

AstroAxe deve herdar **a lógica espacial do NFTmap** e **a presença imersiva do Astrarise**, mas não suas identidades. A metáfora não é “viajar pelo espaço” nem “comprar um planeta”: é observar o próprio céu com calma e abrir camadas de significado.

#### Elementos-assinatura por momento

**Carta em formação (onboarding):** data, hora e local acrescentam coordenadas legíveis ao instrumento. No cálculo, as marcas resolvem na mandala natal real. Nome personaliza a leitura, mas não finge participar do cálculo.

**Janela de Trânsito (dashboard futuro):** uma mandala tratada como instrumento de observatório. Um meridiano de cobre cruza a roda; ao abrir a leitura, o trânsito principal percorre uma única vez sua órbita e ancora uma ficha editorial com planeta, aspecto, início, pico e fim. Depois da revelação, a cena fica estável.

Cada tela escolhe no máximo um desses gestos. Partículas, shimmer, parallax e sons não devem competir com ele.

#### Matéria visual

Usar referências de observação — latão envelhecido, vidro fumê, papel de efemérides, tinta noturna e linhas cartográficas — em vez de “misticismo neon”. A identidade afro-brasileira deve vir de linguagem, conteúdo com autoria e padrões encomendados/aprovados, nunca de glifos sagrados usados como ornamento.

### Tokens de direção

Os valores são ponto de partida e exigem teste de contraste antes de implementação.

#### Cor

| Token                |     Valor | Uso                                  |
| -------------------- | --------: | ------------------------------------ |
| `breu`               | `#070A10` | fundo principal                      |
| `azul-atlantico`     | `#123047` | superfícies e profundidade           |
| `nevoa`              | `#D8D3C7` | texto principal                      |
| `cobre-instrumento`  | `#C47A4A` | foco, seleção e CTA primário         |
| `verde-agua-tecnico` | `#68A8A4` | dados, foco secundário e coordenadas |

- Não usar ciano elétrico como cor dominante.
- Cor ligada a Orixá aparece apenas dentro de conteúdo cultural aprovado e não redefine os tokens globais.
- Glow é consequência de foco/seleção, nunca borda padrão de todo card.

#### Tipografia

- **Display:** `Anybody Variable`, explorando largura condensada com moderação para títulos de observatório.
- **Leitura:** `Literata`, para narrativa e interpretações longas.
- **Dados:** `IBM Plex Mono`, para graus, duração, engine/config e labels técnicos.
- Títulos não devem ficar permanentemente em caixa alta; usar caixa alta somente em marcações instrumentais curtas.
- Corpo mobile mínimo de `1rem`, entrelinha de `1.5–1.65` e linha de leitura entre 45–72 caracteres no desktop.

#### Espaço, forma e grid

- escala espacial: `4, 8, 12, 16, 24, 32, 48, 72, 96`;
- raio instrumental `6px`, cards editoriais `18px`, pills apenas para estados;
- desktop: grid de 12 colunas, palco/mandala em 7 e trilho editorial em 5;
- largura de conteúdo `min(1280px, calc(100vw - 64px))`;
- linhas de órbita e divisores codificam relações reais; não adicionar círculos decorativos sem semântica.

### Layout por breakpoint

#### Desktop

```text
┌ marca ───── navegação ───────────── ações ┐
│                                            │
│  mandala / janela de trânsito │ leitura   │
│  palco estável, 7 colunas      │ 5 col.    │
│                                │ evidência │
│                                            │
└ tempo do céu ─ próximos movimentos ───────┘
```

- O canvas pode ocupar `60–72vh`, sem esconder o início do conteúdo.
- Ficha do objeto selecionado fica ancorada quando houver espaço; caso contrário, usa o trilho lateral.
- Navegação, privacidade e ações essenciais continuam DOM/HTML, nunca dentro do canvas.

#### Mobile

```text
┌ marca ───────────── menu ┐
│ mandala simplificada     │
│ 42–50vh, foco central    │
├ ficha do trânsito        ┤
│ leitura em fluxo normal  │
│ evidência / ação         │
└ navegação inferior       ┘
```

- Reenquadrar a cena; nunca apenas encolher o desktop.
- Reduzir corpos, partículas e DPR; preservar o objeto relevante.
- Tooltip vira ficha abaixo da mandala ou bottom sheet acessível.
- Tap substitui hover; nenhuma informação depende de gesto oculto.
- Badges, selos e controles de demonstração não flutuam sobre o conteúdo.

### Motion

| Movimento                       | Duração alvo | Regra                          |
| ------------------------------- | -----------: | ------------------------------ |
| revelação da Janela de Trânsito | `900–1400ms` | uma vez, interrompível         |
| entrada de ficha/painel         |  `220–280ms` | opacity + pequeno deslocamento |
| hover/foco                      |  `140–180ms` | sem escala excessiva           |
| troca de planeta/camada         |  `300–450ms` | continuidade espacial          |
| ambiente                        |        lento | pausar fora de viewport/aba    |

- Não usar scroll-jacking.
- Com `prefers-reduced-motion`, mostrar estado final sem órbita animada, parallax ou partículas.
- Limitar DPR do canvas e densidade por viewport/capacidade; o número “200000 partículas” do Astrarise é demonstração, não meta.
- Canvas deve pausar em aba oculta e nunca bloquear input, formulário ou leitura.
- Som é opt-in e não participa do feedback essencial.

### Estado implementado até 2026-08-23

- O onboarding usa palco orbital, entradas em sequência e transições curtas com CSS.
- A cena WebGL `celestial-observatory-3d.tsx` concentra o ambiente orbital. A antiga camada Canvas
  paralela foi removida para evitar dois loops visuais concorrentes e código sem consumidor.
- A cena pausa fora do viewport e com a aba oculta. `prefers-reduced-motion` entrega uma composição
  estática.
- Formulário, mensagens, foco e ações permanecem no DOM; a camada visual não intercepta input.
- As composições foram verificadas em `1440×1000` e `390×844`.
- O resultado possui mandala natal real, explorável e ligada aos dados calculados, com ficha
  equivalente no DOM e composição própria para mobile.

### Evolução da abertura em 2026-08-22

- A página inicial passou a usar um palco de viewport inteira, com nebulosa em camadas e profundidade
  controlada pela cena orbital única.
- O formulário virou uma superfície de vidro fumê sobre a cena, sem retirar foco, semântica ou
  contraste dos campos.
- No mobile, observação celeste e coleta de coordenadas são momentos consecutivos no scroll, em vez
  de uma miniatura da composição desktop.
- Canvas continua decorativo, limitado a 30 fps e DPR `1.5`, pausando fora do viewport e com a aba
  oculta. Redução de movimento remove avanço em profundidade e resposta ao ponteiro.

### Critérios de aceite permanentes

- A página permanece compreensível e navegável com WebGL, JS, motion ou som indisponíveis.
- Nenhum texto essencial é renderizado dentro do canvas.
- Mobile possui composição própria e não apresenta clipping horizontal a `320px`.
- A mandala mantém alvo de toque, foco visível, alternativa textual e ficha equivalente por teclado/leitor de tela.
- O conteúdo conserva contraste sobre o pior frame possível da cena.
- Uma tela usa no máximo um efeito ambiente e um momento de revelação.
- Performance é medida em dispositivo intermediário real; reduzir densidade é preferível a degradar interação.
- Elementos culturais têm proveniência e aprovação registradas; não são aplicados como textura genérica.

### Evidência normativa aplicada à conta

Na revisão autenticada de 2026-08-23, o desenho foi confrontado com fontes primárias atuais:

- WCAG 2.2, critérios 1.4.10 (reflow), 2.4.11 (foco não obscurecido) e 2.5.8 (tamanho de alvo),
  publicados pelo W3C;
- padrão de diálogo modal do WAI-ARIA Authoring Practices, adotando o elemento `dialog` nativo para
  confinamento de foco, tecla Escape e retorno ao fluxo;
- documentação oficial do Motion para animação de layout e preferência de movimento reduzido.

Consequências no produto: nenhuma coordenada essencial fica em rótulo flutuante sujeito a colisão;
ações destrutivas exigem etapa separada e confirmação digitada; grids recompõem para uma coluna; e
motion nunca é requisito para compreender ou concluir o fluxo.

### Decisão

Adotar as referências como estudos de **espacialidade, foco e coreografia**, não como moodboard cromático. O Observatório Ritual será mais quente, editorial e legível: o céu fornece estrutura; a tradição fornece contexto; a interface fornece calma.

O próximo marco visual é medir frame time e resposta ao toque em dispositivo físico intermediário,
antes de elevar novamente a densidade. A memória de retomada está em `docs/PROJECT_MEMORY.md`.

### Complemento editorial — Astrolink e Personare

**Revisão:** 2026-08-22

As superfícies públicas de [Astrolink sobre a Casa 1](https://www.astrolink.com.br/casa1) e do
[Personare sobre Ascendente e Descendente](https://www.personare.com.br/conteudo/ascendente-descendente-m242633)
foram usadas como referência de arquitetura da informação, não como fonte para copiar identidade,
texto ou componentes. Ambas tratam Ascendente/Casa 1 como parte central do mapa e relacionam o
Descendente à Casa 7; o Personare também organiza a compreensão do mapa por planetas, signos, casas
e aspectos.

O resultado do AstroAxe passa a aplicar essa profundidade por camadas: mandala em uma primeira dobra
dedicada, eixo ASC–DSC explícito, casas numeradas e capítulos editoriais no scroll. A interpretação
continua separada dos dados astronômicos calculados, declara seu caráter simbólico e não imita a
linguagem visual, comercial ou autoral das referências.

## Contexto de produto e marketing

**Versão do documento:** v2

**Última atualização:** 2026-08-25

**Status:** posicionamento vigente; preços continuam hipóteses até pesquisa com usuários

### Visão do produto

**One-liner:** Seu céu calculado, explicado com clareza e conectado a uma leitura autoral brasileira.

**O que faz:** AstroAxe calcula mapa natal, ciclos e trânsitos, explica o que está ativo e apresenta
uma Tríade de Regências pelo método autoral AstroAxe. A leitura não confirma identidade religiosa
nem substitui consulta tradicional.

**Categoria:** aplicativo de astrologia personalizada, autoconhecimento e ritual diário.

**Tipo:** SaaS B2C freemium, inicialmente web responsivo/PWA.

**Modelo:** assinatura Pro e leituras avulsas; consultas humanas somente em fase posterior.

### Posicionamento

#### Declaração

Para brasileiros que gostam de astrologia, mas querem ir além do horóscopo genérico, AstroAxe é um observatório ritual pessoal que mostra o céu calculado sobre o mapa natal e oferece uma leitura clara para o momento. Diferente de aplicativos importados ou de associações superficiais com Orixás, combina rastreabilidade técnica, autoria visível e governança afro-brasileira.

#### Promessa

**Entenda seu céu de hoje, saiba de onde a leitura veio e escolha como caminhar com ela.**

#### Pilares

1. **Clareza:** primeiro insight em linguagem simples; técnica disponível sob demanda.
2. **Rastreabilidade:** placements, trânsito, duração, versão e autoria acessíveis.
3. **Método verificável:** versão, classes de entrada, fatores explicativos e limites visíveis; matriz,
   pesos e regras proprietárias protegidos.
4. **Ritual possível:** uma ação pequena, opcional e não fatalista.
5. **Brasil real:** português natural, referências locais e estética própria.

### Audiência

#### Público primário

Adultos brasileiros de 20–45 anos que já consomem signos, mapa astral, Tarot, espiritualidade ou wellness digital e buscam uma leitura mais pessoal do que conteúdo por signo solar.

#### Segmentos prioritários

| Segmento                          | Necessidade                                          | Entrada no produto                     |
| --------------------------------- | ---------------------------------------------------- | -------------------------------------- |
| Curioso em astrologia             | entender o mapa sem jargão                           | primeiro mapa e mandala educativa      |
| Praticante de ritual/reflexão     | criar uma rotina curta e significativa               | Tempo do Céu diário                    |
| Usuário avançado                  | conferir cálculo, aspectos e duração                 | detalhes técnicos e histórico          |
| Brasileiro buscando representação | encontrar linguagem e símbolos locais sem exotização | conteúdo de Axé com autoria e contexto |

#### Jobs to be done

- “Quando o meu dia parece confuso, quero entender quais temas estão ativos para refletir com mais clareza.”
- “Quando vejo meu mapa, quero compreender cada elemento sem precisar estudar um manual antes.”
- “Quando encontro conteúdo sobre Orixás, quero saber quem criou, de qual contexto vem e o que ele não pretende afirmar.”
- “Quando uma leitura parece certeira, quero abrir a evidência astrológica em vez de confiar numa caixa-preta.”

#### Anti-personas

- quem procura previsão garantida, diagnóstico ou decisão médica, jurídica ou financeira;
- quem espera que um aplicativo revele seu Orixá ou substitua prática religiosa;
- quem busca chat psíquico irrestrito, medo, dependência ou promessa de destino inevitável;
- menores sem fluxo de consentimento e proteção apropriado.

### Problema e tensão

**Problema central:** o mercado alterna entre horóscopos genéricos, interfaces técnicas difíceis e textos hiperpersonalizados cuja autoria ou origem não é clara.

**Limitações das alternativas:**

- conteúdo apenas por signo solar perde contexto natal;
- mapas detalhados podem intimidar iniciantes;
- IA sem fonte pode inventar ou uniformizar interpretações;
- estética “mística genérica” não representa a experiência brasileira;
- associação automática signo→Orixá transforma tradição religiosa em quiz de personalidade.

**Tensão emocional:** a pessoa quer sentir-se compreendida, mas não manipulada; quer profundidade, mas não fatalismo; quer identidade cultural, mas não apropriação.

### Ritual diário

O ritual **Tempo do Céu** é o principal loop de valor e deve caber em 60–90 segundos:

1. ler o tema mais relevante do mapa para agora;
2. abrir “Por quê” para ver trânsito, duração e pico;
3. escolher uma pergunta de journaling ou ação pequena;
4. explorar uma ressonância cultural somente quando houver conteúdo revisado pertinente;
5. salvar a reflexão ou encerrar sem punição de streak.

Princípios de retenção:

- notificações opt-in, com frequência e horário controlados pelo usuário;
- sem culpa por ausência e sem alertas alarmistas;
- cadências diária, semanal, lunar e anual conectadas, não feeds infinitos;
- compartilhamento gera um card sem expor dados natais;
- streak, gamificação e áudio só entram após validação de bem-estar e acessibilidade.

### Planos e oferta

| Plano      |           Hipótese de preço | Valor entregue                                                                             |
| ---------- | --------------------------: | ------------------------------------------------------------------------------------------ |
| Free       |                        R$ 0 | mapa resumido, mandala educativa, Tempo do Céu, até 3 perfis e previews                    |
| Pro mensal |                    R$ 19,90 | perfis e leituras ilimitadas, trânsitos completos, histórico, sinastria e compartilhamento |
| Pro anual  | desconto de 20–30% a testar | mesmos benefícios, faturamento anual                                                       |
| Avulsos    |       a definir por produto | ano pessoal, relatório de relacionamento e conteúdos especiais                             |

Não lançar um plano Premium baseado em “consultor” ou voz até que exista operação real, segura e economicamente validada. Paywall vem após o primeiro valor e deve mostrar claramente o que será desbloqueado. Trial e desconto são experimentos, não dogmas do nicho.

### Concorrência e benchmarks

| Produto          | Força observada                                               | Espaço para AstroAxe                                                        |
| ---------------- | ------------------------------------------------------------- | --------------------------------------------------------------------------- |
| Co–Star          | snapshot, social, notificações e voz editorial                | mais contexto, menos opacidade e experiência brasileira                     |
| CHANI            | autoria humana, ritual, áudio, journaling e missão social     | personalização natal diária em português e camada afro-brasileira governada |
| The Pattern      | linguagem psicológica, relações e ciclos sem jargão           | evidência astrológica acessível e autoria mais clara                        |
| TimePassages     | profundidade técnica, educação e conteúdo humano              | acolhimento, narrativa e ritual sem perder auditabilidade                   |
| Astrolink        | ecossistema brasileiro, social, Tarot e IA Orbia              | foco mais nítido, governança cultural e cadeia de confiança da IA           |
| Personare        | autoridade editorial brasileira, trânsitos e serviços humanos | experiência diária mais coesa e visualmente explorável                      |
| Sanctuary/Nebula | marketplace de especialistas                                  | futura rede local verificada, sem misturar consulta com automação           |

#### Fatos usados como referência

- Co–Star combina humanos, dados astronômicos e IA; monetiza assinatura e leituras avulsas. [FAQ](https://www.costarastrology.com/faq/) e [App Store](https://apps.apple.com/us/app/co-star-personalized-astrology/id1264782561).
- CHANI declara conteúdo escrito e gravado por astrólogos, usa horóscopo diário, leitura semanal, trânsitos, meditações e journaling. [Produto](https://www.chani.com/app) e [App Store](https://apps.apple.com/us/app/chani-your-astrology-guide/id1532791252).
- The Pattern oferece ciclos, relacionamentos, comunidade, “Time Travel” e conversa com IA “In-Depth”. [Site](https://www.thepattern.com/) e [App Store](https://apps.apple.com/us/app/the-pattern-astrology/id1071085727).
- TimePassages destaca interpretação humana, mapa/horóscopo gratuito, detalhes técnicos e modelo de assinatura mais compras por mapa. [App Store](https://apps.apple.com/us/app/timepassages-astrology/id488946918) e [preços](https://support.astrograph.com/support/solutions/articles/66000530329-how-does-the-timepassages-3-1-update-affect-my-desktop-software-license-).
- Astrolink reúne mapa, sinastria, Tarot, ciclo lunar, diário/social e a IA Orbia. [App Store Brasil](https://apps.apple.com/br/app/astrolink-mapa-astral/id1598327566) e [Orbia](https://www.astrolink.com.br/mapa-astral-orbia).
- Personare oferece horóscopo gratuito calculado pelo mapa completo e conteúdo assinado por astrólogo. [Horóscopo](https://www.personare.com.br/horoscopo-personalizado) e [App Store Brasil](https://apps.apple.com/br/app/personare-hor%C3%B3scopo-e-tarot/id1588090821).

Preços e ratings de lojas são fotografias por país/data. Não usar ratings como prova de causalidade nem repetir alegações de “10× retenção”, “três tiers maximizam receita” ou “trials não funcionam” sem fonte e dados próprios.

### Diferenciação defensável

- Motor e versões auditáveis; IA não calcula o céu.
- Modo honesto para hora desconhecida, sem Ascendente/casas falsamente precisos.
- Conteúdo-base assinado, licenciado e rastreável.
- Separação explícita entre astrologia ocidental e ressonância afro-brasileira.
- Conselho cultural remunerado com poder de revisão e veto.
- Português brasileiro e design “Observatório Ritual”, não cópia visual de concorrentes.

### Mensagem e voz

**Tom:** acolhedor, lúcido, poético com contenção, brasileiro e respeitoso.

**Estilo:** insight primeiro; explicação depois; técnica quando solicitada.

**Personalidade:** observadora, calorosa, rigorosa, curiosa e não dogmática.

#### Usar

- “tema”, “tendência”, “possibilidade”, “ressonância”, “reflexão”;
- “calculado a partir do seu mapa”;
- “veja por que esta leitura apareceu”;
- “regência calculada pelo método autoral AstroAxe”;
- “se fizer sentido para você”.

#### Evitar

- “seu destino”, “vai acontecer”, “garantido”, “cientificamente comprovado”;
- “descubra seu Orixá pelo signo” ou porcentagem de certeza sem calibração publicada;
- “cura”, “diagnóstico”, “a IA sabe quem você é”;
- “ancestral” como adjetivo decorativo sem origem, autoria e contexto;
- medo, urgência artificial e jargão sem explicação.

### Objeções

| Objeção                                | Resposta de produto                                                                                                                                                        |
| -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| “É só um horóscopo genérico.”          | Mostrar mapa natal, trânsito exato, período e motivo da seleção.                                                                                                           |
| “A IA inventou isso.”                  | Rotular a composição, abrir fontes/placements e identificar o conteúdo-base e seu autor.                                                                                   |
| “Um app não pode confirmar meu Orixá.” | Concordar explicitamente: o produto apresenta uma regência calculada pelo método autoral AstroAxe, não uma confirmação religiosa nem substituição de consulta tradicional. |
| “Não sei minha hora de nascimento.”    | Oferecer modo sem hora, retirar resultados dependentes dela e explicar como atualizar depois.                                                                              |
| “Isso parece apropriação.”             | Expor conselho, autoria, contexto, remuneração, política de correção e limites do produto.                                                                                 |

### Provas e limites

Ainda não existem clientes, métricas de retenção ou depoimentos do AstroAxe. Não fabricar prova social. As primeiras provas publicáveis devem ser:

- regressões do motor contra referências independentes;
- autores e revisores identificados;
- política cultural e de IA publicada;
- métricas de compreensão, acessibilidade e satisfação de pesquisa beta;
- depoimentos consentidos e apresentados sem editar seu sentido.

### Objetivos e métricas

**Objetivo inicial:** validar que usuários compreendem e retornam ao ritual sem perder confiança na origem da leitura.

**Conversão principal:** concluir o primeiro mapa e abrir o primeiro “Por quê”.

**Conversão paga:** assinar Pro depois de experimentar valor personalizado.

Métricas prioritárias:

- conclusão do onboarding e tempo até primeiro insight;
- compreensão declarada do insight e da diferença entre cálculo/interpretação/IA;
- ativação D1/D7 e retenção D30;
- uso saudável do Tempo do Céu e opt-out de notificações;
- expansão da evidência astrológica;
- conversão Free→Pro, churn e motivo;
- incidentes/correções culturais e tempo de resposta.

### Perguntas de pesquisa abertas

- “Ressonância de Axé” é compreendida como simbólica ou ainda parece determinação religiosa?
- Quais tradições e termos devem permanecer fora do produto público?
- Usuários preferem autoria humana na leitura principal e IA apenas em perguntas, ou aceitam composição rotulada?
- O ritual diário ajuda a refletir ou cria pressão de uso?
- Qual benefício sustenta Pro no Brasil: profundidade, histórico, sinastria ou relatórios avulsos?

### Changelog

- **v2 (2026-08-25):** incorpora a Tríade v2 aplicada, linguagem pública sem percentuais de certeza
  e política de transparência técnica com proteção da propriedade intelectual.
- **v1 (2026-08-19):** contexto inicial consolidado com posicionamento, audiência, ritual diário, oferta em dois planos, benchmarks atuais e limites culturais/IA.

## Analytics e privacidade

### Estado atual

Não existe coletor, SDK, endpoint, variável de ativação ou envio de analytics. O contrato Zod que
não possuía chamador foi removido na auditoria de código morto de 25 de agosto de 2026: manter uma
API especulativa não criava proteção real e poderia parecer uma integração pronta.

Uma implementação futura deverá nascer junto do fluxo de consentimento, fornecedor e finalidade
aprovados. Até lá, ausência de código de coleta é o comportamento fail-closed.

### Vocabulário mínimo permitido

O vocabulário candidato permanece limitado a três eventos estruturais: conclusão do onboarding,
abertura da explicação do mapa e conclusão do claim da conta. Uma futura boundary deverá aceitar
apenas superfície e classe de viewport e rejeitar IDs, texto livre, email, data/hora natal,
localização e quaisquer campos extras.

Antes de ativar coleta é obrigatório definir e revisar:

- finalidade, base legal, texto e mecanismo de retirada do consentimento;
- fornecedor, região, subprocessadores, retenção, acesso e exclusão;
- agregação, limites de cardinalidade e teste de redaction;
- responsável por incidentes e procedimento de revogação;
- UI acessível que não use dark patterns nem bloqueie funções essenciais.

Até esse contrato externo e a política LGPD final existirem, nenhum módulo de analytics deve ser
reintroduzido.
