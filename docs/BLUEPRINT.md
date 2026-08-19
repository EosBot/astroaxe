# AstroAxe — Blueprint 6

**Versão:** 6.0.0

**Data:** 2026-08-19

**Status:** decisão de produto e arquitetura para reconstrução

**Runtime:** Docker-only

## 1. Tese do produto

AstroAxe é uma plataforma brasileira de astrologia personalizada que une três camadas sem confundi-las:

1. **Céu calculado:** posições, casas, aspectos e trânsitos determinísticos e auditáveis.
2. **Leitura astrológica:** interpretação editorial em português, com autoria e versão visíveis.
3. **Ressonância de Axé:** aproximação simbólica e educativa com arquétipos de Orixás, produzida com governança cultural.

O produto não determina Orixá religioso, não substitui jogo de búzios, terreiro, sacerdote, terapia ou aconselhamento profissional. Seu diferencial é transformar dados astrológicos complexos em uma experiência diária brasileira, acolhedora e culturalmente responsável.

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

O Blueprint 6 remove a tabela signo→Orixá como mecanismo de determinação e cancela o plano de treinar um classificador de “Orixá confirmado”. No Candomblé, a composição da cabeça é tratada por práticas oraculares e iniciáticas, varia entre tradições e pode permanecer provisória. Um mapa natal não equivale a esse processo.

O resultado de produto passa a se chamar **Tríade de Ressonâncias Simbólicas**:

- apresenta até três arquétipos para exploração, sem os rótulos religiosos “de frente”, “de cabeça” ou “de costas”;
- explica quais símbolos astrológicos e quais conteúdos editoriais motivaram cada aproximação;
- não usa Odú, “confiança alta” ou linguagem de confirmação espiritual;
- inclui a mensagem persistente “ressonância simbólica; não determina seu Orixá”;
- oferece conteúdo educativo sobre diversidade entre Candomblé, Umbanda e suas diferentes nações, sem fundi-las em uma tradição genérica.

### 3.2 Conselho cultural

Antes de publicar a camada de Axé, formar um conselho remunerado com lideranças e pesquisadores de mais de uma tradição. O acordo deve definir escopo público versus reservado, autoria, licenças, remuneração, direito de veto, processo de correção e repartição de receita quando aplicável.

Não coletar filiação religiosa ou “Orixá confirmado” para treinamento. Pesquisa futura exige consentimento específico, minimização, governança comunitária, benefício compartilhado e direito de retirada.

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

Cadências complementares: céu coletivo diário, leitura semanal, fases da Lua, trânsitos longos e retrospectiva anual. Notificações são opt-in, configuráveis por frequência e sem mensagens alarmistas.

## 5. Conteúdo e IA

### 5.1 Cadeia de confiança

`dados higienizados → motor astronômico → mapa validado → regras astrológicas → corpus autorizado → composição → validação → apresentação`

- O motor calcula; o LLM nunca calcula posições.
- O corpus RAG contém apenas material licenciado, assinado e versionado.
- A resposta referencia os placements e trânsitos usados e preserva autoria do conteúdo-base.
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
- `traefik`: entrada HTTP local e roteamento;
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

A análise, tokens, layouts e critérios estão em [`docs/design-references.md`](./design-references.md).

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
5. **Fase 4 — Conteúdo:** CMS/corpus autorizado, autoria, Tríade de Ressonâncias e revisão cultural.
6. **Fase 5 — Ritual e IA:** trânsitos, Tempo do Céu, RAG, validação semântica e streaming.
7. **Fase 6 — Receita:** Free/Pro, avulsos, Stripe, limites e experimentação.
8. **Fase 7 — Polimento:** acessibilidade, E2E, performance, SEO, backups e observabilidade.

### Estado implementado em 2026-08-19

- Fases 0–2 concluídas no primeiro checkpoint.
- Fase 3 parcial: sessão guest HMAC com retenção de 24 horas, modelos de perfil/mapa, onboarding
  em quatro etapas, geocoding com cache, cálculo persistido e primeiro resultado antes de conta.
- Próximo incremento da Fase 3: autenticação, claim idempotente do mapa guest, exclusão pelo
  titular e política automatizada de expiração.

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

- **6.0.0 (2026-08-19):** atualiza stack e mercado; substitui determinação automatizada de Orixá por ressonância simbólica governada; formaliza hora desconhecida, autoria/IA transparente, monetização em dois planos, SonarQube Community local e LSPs.
