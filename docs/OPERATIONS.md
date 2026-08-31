# Operação

Documento único de operação do AstroAxe: borda pública, orquestração, deploy, backup,
email transacional, ferramentas de qualidade, observabilidade, ingestão do acervo e
inventário de dados.

Consolidado em 28 de agosto de 2026 a partir de nove documentos separados. Nada foi
reescrito na consolidação — o conteúdo é o mesmo, reorganizado sob um índice só.

## Borda pública Cloudflare

Este runbook registra a camada pública de produção: zona DNS, TLS, WAF, cache,
Zero Trust e postura de e-mail. O runtime correspondente está em
`docs/OPERATIONS.md`; os gates de release, em `docs/OPERATIONS.md`.

A configuração foi aplicada em 2026-08-26, antes de qualquer VPS existir. Até o
`cloudflared` conectar, o domínio responde erro 1033 — comportamento esperado.

| Item              | Valor                                               |
| ----------------- | --------------------------------------------------- |
| Zona              | `astroaxe.net` — `b1ede1dc5187528fc6597d6262f6c3ab` |
| Conta             | `36febb0027e351e5058a1d81a94438c7`                  |
| Plano             | Free                                                |
| Hostname canônico | `astroaxe.net` (apex); `www` redireciona 301        |
| Org Zero Trust    | `eosbot.cloudflareaccess.com`                       |

### Princípio de origem

Não existe nenhum registro `A` e nenhum wildcard nesta zona. O tráfego alcança a
aplicação exclusivamente por Cloudflare Tunnel, cujo `cloudflared` abre conexões
de saída até um Traefik privado. Consequência operacional: **não há IP de origem
que possa ser descoberto e atacado diretamente, e não existe rota que contorne a
Cloudflare.** O break-glass é o próprio Tunnel, não uma porta publicada.

Um Tunnel por ambiente, para isolar o raio de alcance de cada token:

| Ambiente | Tunnel             | ID                                     | Ingress                                        |
| -------- | ------------------ | -------------------------------------- | ---------------------------------------------- |
| Produção | `astroaxe-prod`    | `bcdae972-63e8-47d2-b064-72b0e9394863` | `astroaxe.net` → `http://traefik:8080`         |
| Staging  | `astroaxe-staging` | `04e8bbff-646f-4f23-b257-7246fa9e6acb` | `staging.astroaxe.net` → `http://traefik:8080` |

Ambos usam configuração gerenciada remotamente (`config_src: cloudflare`) e caem
em `http_status:404` para qualquer hostname não declarado.

O token de cada Tunnel é secret e nunca aparece em arquivo de ambiente, log,
comando persistido ou neste repositório. Ele é obtido no painel e entregue ao
Swarm como `astroaxe_cloudflare_tunnel_v1`, conforme `docs/OPERATIONS.md`.

### Registros DNS

| Nome             | Tipo  | Conteúdo                            | Proxy |
| ---------------- | ----- | ----------------------------------- | ----- |
| `astroaxe.net`   | CNAME | `bcdae972-….cfargotunnel.com`       | sim   |
| `www`            | CNAME | `astroaxe.net`                      | sim   |
| `staging`        | CNAME | `04e8bbff-….cfargotunnel.com`       | sim   |
| `astroaxe.net`   | CAA   | `0 issue "letsencrypt.org"`         | —     |
| `astroaxe.net`   | CAA   | `0 issue "pki.goog"`                | —     |
| `astroaxe.net`   | CAA   | `0 issuewild ";"`                   | —     |
| `astroaxe.net`   | MX    | `0 .`                               | —     |
| `astroaxe.net`   | TXT   | `v=spf1 -all`                       | —     |
| `_dmarc`         | TXT   | `v=DMARC1; p=reject; fo=1; pct=100` | —     |
| `_dmarc.www`     | TXT   | `v=DMARC1; p=reject`                | —     |
| `_dmarc.staging` | TXT   | `v=DMARC1; p=reject`                | —     |

Os registros CAA restringem quais autoridades certificadoras podem emitir
certificado para o domínio. **A restrição efetiva é mais ampla do que os três
registros acima sugerem:** a Cloudflare sintetiza, na resolução, registros CAA
adicionais para as CAs que ela própria usa — `comodoca.com`, `digicert.com` e
`ssl.com` — inclusive `issuewild`, de modo a não quebrar a emissão do Universal
SSL. O `issuewild ";"` publicado aqui é, portanto, neutralizado, e o
comportamento não é configurável no plano Free.

O ganho real permanece: sem CAA, qualquer CA do mundo pode emitir para o
domínio; com CAA, a emissão fica limitada a um conjunto conhecido e auditável.
Confira o que é efetivamente servido, não o que está na zona:

```bash
curl -sS -H 'accept: application/dns-json' \
  'https://cloudflare-dns.com/dns-query?name=astroaxe.net&type=CAA'
```

### TLS

| Ajuste                     | Valor    | Razão                                                |
| -------------------------- | -------- | ---------------------------------------------------- |
| `ssl`                      | `strict` | valida o certificado da origem                       |
| `min_tls_version`          | `1.2`    | TLS 1.0 e 1.1 recusados                              |
| `tls_1_3`                  | `on`     | —                                                    |
| `always_use_https`         | `on`     | —                                                    |
| `automatic_https_rewrites` | `on`     | —                                                    |
| `0rtt`                     | `off`    | 0-RTT permite replay de requisições não idempotentes |

#### HSTS permanece desligado — e isso é deliberado

Habilitar HSTS antes de a origem responder em HTTPS grava, no navegador de cada
visitante, uma instrução de longa duração que não pode ser revogada remotamente.
A ativação é faseada e só começa depois do primeiro deploy bem-sucedido:

1. origem no ar e HTTPS confirmado;
2. `max_age=86400`, sem `includeSubDomains`, sem preload;
3. observar uma semana, incluindo `staging` e qualquer subdomínio de e-mail;
4. `max_age=31536000` com `includeSubDomains`;
5. preload somente depois disso, e sabendo que a remoção da lista é lenta.

### WAF, bots e rate limiting

O plano Free permite cinco regras WAF custom e uma regra de rate limiting.

- **Managed Free Ruleset** — ativado (estava desligado por padrão).
- **DDoS L7** — gerenciado pela Cloudflare, sempre ativo.
- **Bot Fight Mode** e **JS detections** — ativados.
- **Bloqueio de crawlers de treino de IA** (`ai_bots_protection: block`) —
  ativado por causa do acervo cultural. `crawler_protection` permanece desligado:
  bloquearia buscadores legítimos e inutilizaria o sitemap.

#### Regras custom

| #   | Condição                                                             | Ação              |
| --- | -------------------------------------------------------------------- | ----------------- |
| 1   | `/wp-*`, `/xmlrpc.php`, `/.env`, `/.git/`, `/vendor/`, `/phpmyadmin` | Block             |
| 2   | `/api/health/*` vindo da internet                                    | Block             |
| 3   | `POST` em `/api/auth/*` sem user agent de navegador                  | Managed Challenge |
| 4   | `/api/geocoding` sem user agent de navegador                         | Managed Challenge |

O quinto slot fica reservado para resposta a incidente. As expressões usam
`starts_with` e `contains` em vez de expressão regular, porque o operador
`matches` exige plano Business.

A regra 2 é segura porque as probes de liveness e readiness do Swarm alcançam o
container diretamente pela rede interna e nunca atravessam a Cloudflare.

A regra 4 protege `/api/geocoding`, que faz proxy para o Nominatim usando o
`NOMINATIM_USER_AGENT` do projeto. Abuso dessa rota não gera custo interno: gera
bloqueio do nosso user agent no Nominatim, um dano externo e difícil de reverter.
O front chama a rota por `fetch` do navegador, então o desafio não afeta uso
legítimo. O rate limiting não pôde ser usado aqui porque o plano Free permite
uma única regra, já gasta em `/api/auth/*`.

Não existe regra para `TRACE` e `TRACK`: a Cloudflare já recusa esses métodos na
borda com `405`, antes do WAF. Uma regra para eles nunca seria avaliada e
desperdiçaria um slot. Verificado em 2026-08-26.

#### Rate limiting

Regra única do plano, gasta onde o risco é maior: `/api/auth/*`, 15 requisições
por 10 segundos por IP e colo, bloqueio por 10 segundos. Cobre login, registro,
troca de senha, reset e verificação de e-mail contra força bruta e enumeração de
contas. O Free exige `mitigation_timeout` igual ao período.

### Cache

Nenhuma resposta autenticada pode ser servida do edge.

| Regra | Escopo                                                                                     | Efeito                                    |
| ----- | ------------------------------------------------------------------------------------------ | ----------------------------------------- |
| 1     | `/api/*`, `/conta*`, `/entrar`, `/recuperar-senha`, `/redefinir-senha`, `/verificar-email` | cache desabilitado                        |
| 2     | `/_next/static/*`                                                                          | cache com TTL de um ano, edge e navegador |

A regra 1 cumpre a exigência do runbook de Swarm: APIs autenticadas, conta,
diário, exports e qualquer resposta com cookie permanecem fora do cache. A regra
2 é segura porque os assets do Next já são imutáveis por hash no nome.

### Zero Trust Access

`staging.astroaxe.net` inteiro fica atrás do Access. A requisição não autenticada
é encerrada na borda e nunca alcança o Tunnel.

| Item       | Valor                                                       |
| ---------- | ----------------------------------------------------------- |
| Aplicação  | `AstroAxe staging` — `0e4a5e65-2540-46fd-a9f7-cac8d8ee4985` |
| Identidade | One-time PIN por e-mail                                     |
| Sessão     | 24h, cookie `HttpOnly`, binding cookie ativo                |
| Política   | allowlist explícita de e-mails                              |

`/api/editorial/*` fica fora do Access: é uma API sem interface, consumida
programaticamente, e o Access quebraria seus clientes. A autorização continua na
aplicação. Se depois houver automação externa, o caminho correto é um service
token do Access, não a remoção do controle.

### Postura de e-mail

O domínio hoje **não envia nem recebe e-mail**, e isso está declarado
explicitamente no DNS em vez de ficar omisso:

- `MX 0 .` — null MX, conforme RFC 7505: nenhum servidor aceita mensagem;
- `v=spf1 -all` — nenhum remetente está autorizado;
- `DMARC p=reject` no apex e nos subdomínios que não enviam.

Um domínio sem esses registros é um alvo fácil de spoofing. Esta é a postura mais
restritiva possível e deve ser mantida até existir relay contratado.

#### Transição para envio transacional

Quando houver conta no relay e endereço de contato, nesta ordem:

1. publicar o DKIM e o subdomínio remetente com os valores do painel do provedor,
   como `DNS only` — a Cloudflare não faz proxy de SMTP;
2. trocar o SPF por um único registro incluindo o mecanismo do relay;
3. recuar o DMARC para `p=none` com `rua` apontando para uma caixa que exista;
4. observar alinhamento SPF e DKIM em tráfego real;
5. avançar para `quarantine` e depois retomar `reject`.

Nunca copiar valores de DKIM deste repositório: eles vêm da conta real.

Para receber `contato@astroaxe.net`, habilitar o Email Routing substitui o null
MX pelos MX da Cloudflare e exige um endereço de destino verificado.

### Página de espera na borda

Enquanto a VPS não existe, o apex não devolve erro 1033: um Worker responde antes do Tunnel e
publica a página "em construção".

| Item     | Valor                                                  |
| -------- | ------------------------------------------------------ |
| Worker   | `astroaxe-holding`                                     |
| Rota     | `astroaxe.net/*` — `cd79257c55d24c389bec6fb3f7ae6df8`  |
| Fonte    | `infra/cloudflare/holding-page/worker.js`              |
| Resposta | `503` + `Retry-After: 86400` + `X-Robots-Tag: noindex` |

O status é `503`, não `200`, de propósito. Uma placeholder devolvendo `200` seria indexada pelos
buscadores como se fosse o conteúdo real de `astroaxe.net` e depois competiria com as páginas
verdadeiras. `503` com `Retry-After` é a resposta correta para indisponibilidade temporária. O
Worker também serve `/robots.txt` com `Disallow: /`.

`staging.astroaxe.net` não recebe a página: continua atrás do Zero Trust Access.

#### Direção visual

Os tokens vêm de `docs/BLUEPRINT.md` e a marca é idêntica a
`src/components/site/astroaxe-logo.tsx`. A página não usa JavaScript no cliente, webfont de
terceiro nem WebGL — permanece legível sem qualquer dessas camadas, conforme os critérios de aceite
permanentes daquele documento.

A assinatura é o meridiano de cobre atravessando a página, com um readout instrumental sobre ele:
instante UTC e posição aproximada do observador. O readout **não faz nenhuma afirmação
astrológica**. Não calcula fase da Lua nem posição de planeta: cálculo é responsabilidade do
domínio astrológico, com efemérides e golden tests, e não de uma página de espera. O instrumento
mostra tempo e coordenada; a leitura é justamente o que ainda não abriu.

Movimento: uma única revelação de 1100ms no meridiano e entradas de 260ms, dentro das faixas da
direção visual. Com `prefers-reduced-motion`, a página entrega o estado final sem animação.

#### Privacidade do readout

O readout usa apenas o que a Cloudflare já anexa à requisição — cidade, país, fuso e colo — e
devolve esses valores ao próprio visitante que os originou. Nada é registrado, armazenado, agregado
ou enviado a terceiro. A política de resposta é `default-src 'none'`, sem qualquer origem externa.

#### Remoção no go-live

Quando o `cloudflared` estiver conectado, apague a rota. Nenhum registro DNS muda, e o tráfego passa
a alcançar o Tunnel na requisição seguinte.

```
DELETE /zones/b1ede1dc5187528fc6597d6262f6c3ab/workers/routes/cd79257c55d24c389bec6fb3f7ae6df8
```

Mantenha o Worker publicado: ele volta a ser útil em qualquer janela de manutenção planejada.

### Fora de escopo

`next.config.ts` aplica bons headers de resposta, mas não emite
`Content-Security-Policy` nas páginas HTML; a CSP restritiva de
`src/lib/security/headers.ts` cobre apenas respostas de API. CSP de página é
decisão de aplicação — uma política genérica aplicada na borda quebraria o Next.
Fica registrado como trabalho separado.

### Verificação após o primeiro deploy

```bash
## TLS e redirect
curl -sI http://astroaxe.net | grep -i location
curl -sI https://www.astroaxe.net | grep -i location
curl -sI https://astroaxe.net | head -1

## TLS 1.1 deve falhar; 1.2 deve funcionar
curl -sI --tlsv1.1 --tls-max 1.1 https://astroaxe.net || echo "TLS 1.1 recusado, correto"

## Página de espera, enquanto a rota do Worker existir
curl -sI https://astroaxe.net | head -1                   # 503
curl -s https://astroaxe.net/robots.txt                   # Disallow: /

## Regras WAF
curl -sI https://astroaxe.net/.env | head -1              # 403
curl -sI https://astroaxe.net/api/health/live | head -1   # 403
curl -sI -X TRACE https://astroaxe.net | head -1          # 405, recusado pela borda
curl -sI -A curl/8 "https://astroaxe.net/api/geocoding?q=x" | head -1  # 403, desafio

## Cache
curl -sI https://astroaxe.net/api/auth/status | grep -i cf-cache-status   # BYPASS/DYNAMIC

## E-mail
dig +short TXT astroaxe.net
dig +short TXT _dmarc.astroaxe.net
dig +short MX astroaxe.net
dig +short CAA astroaxe.net
```

## Orquestração Docker Swarm

Este runbook registra a migração incremental do runtime de produção para Docker Swarm. O Compose
atual continua autoritativo para desenvolvimento e E2E; produção usará imagens previamente
construídas, publicadas em registry e identificadas por tag imutável ou digest.

### Dois contratos de deploy

O projeto possui exatamente dois destinos de deploy, além do ambiente de desenvolvimento:

| Destino     | Execução                     | Entrada                   | Dados                        | Email                       | Cloudflare |
| ----------- | ---------------------------- | ------------------------- | ---------------------------- | --------------------------- | ---------- |
| Homologação | Docker Compose local         | `127.0.0.1:3200`          | volumes locais isolados      | Mailpit em `127.0.0.1:8025` | não        |
| Produção    | Docker Swarm nas VPS Contabo | `astroaxe.net` via Tunnel | PostgreSQL/Redis gerenciados | relay interno para Brevo    | sim        |

Homologação não é um terceiro ambiente remoto e não usa credenciais de produção. O E2E automatizado
em `127.0.0.1:3100` continua sendo uma stack efêmera separada, executada e desmontada pelo próprio
script de testes.

#### Homologação local

```bash
npm run homolog:up
npm run homolog:smoke
npm run homolog:down
```

`homolog:up` usa `compose.yml` com `compose.homolog.yml`, constrói os mesmos targets de produção,
aplica migrations, espera os healthchecks e executa o release smoke. O projeto Compose é sempre
`astroaxe_homolog`; PostgreSQL, Redis e Mailpit possuem volumes próprios e não reutilizam o runtime
principal nem o E2E. `homolog:down` preserva todos os volumes e nunca usa `-v`.

As credenciais do script são sintéticas, fixas e exclusivas do loopback local. Não use dados pessoais
reais na homologação. Mailpit captura mensagens e não entrega email à internet; a interface não possui
autenticação e por isso só pode ser publicada em `127.0.0.1`.

### Topologia aprovada

- três managers para quorum, distribuídos entre VPS/failure domains quando possível;
- workers rotulados para `edge`, `app` e `data`; manager não executa workload comum;
- Cloudflare Tunnel redundante inicia conexões de saída e alcança somente o Traefik privado;
- app Next.js replicado, scheduler singleton, email worker replicável e SMTP relay interno;
- PostgreSQL e Redis não publicam portas e não são declarados HA sem storage/failover testado;
- Prometheus e Alertmanager observam serviços, backup e fila de email sem PII.

Na Contabo, distribua os três managers em failure domains distintos quando a região contratada
oferecer essa possibilidade. Três VPS no mesmo host físico, storage backend ou rede não constituem
alta disponibilidade real. Managers devem usar IP privado/VPN para o control plane e permanecer
indisponíveis ao tráfego público de aplicação.

### Rede e firewall dos nós

Permita entre os nós do cluster, somente pelos IPs privados/VPN autorizados:

- TCP `2377` para controle do Swarm;
- TCP/UDP `7946` para descoberta entre nós;
- UDP `4789` para overlay VXLAN.

Não exponha `2375`, `2376`, PostgreSQL, Redis, métricas ou Docker socket à internet. A stack não
publica portas no host: `cloudflared` abre conexões de saída e alcança Traefik pela overlay interna.
O firewall de egress precisa permitir Cloudflare Tunnel, registry, PostgreSQL/Redis gerenciados e o
Nominatim; restrinja destinos quando o provedor e a operação suportarem manutenção segura da lista.

Rotule dois ou mais nós de edge e dois ou mais nós de aplicação:

```bash
docker node update --label-add astroaxe.role=edge --label-add astroaxe.zone=zone-a <node-id>
docker node update --label-add astroaxe.role=edge --label-add astroaxe.zone=zone-b <node-id>
docker node update --label-add astroaxe.role=app --label-add astroaxe.zone=zone-a <node-id>
docker node update --label-add astroaxe.role=app --label-add astroaxe.zone=zone-b <node-id>
```

Um nó pode acumular `edge` e `app` somente em bootstrap pequeno; como o label possui um único valor,
nesse caso use workers adicionais ou adapte conscientemente a política de placement antes do deploy.
O desenho de produção recomendado mantém funções separadas.

### Imagens e registry

`docker stack deploy` não realiza build. CI deve construir os targets `app-runner`, `worker-runner`
e `migrate-runner` do mesmo commit, gerar SBOM, verificar vulnerabilidades/licenças, publicar no
registry e resolver cada referência para digest `sha256`. Traefik, cloudflared e socket proxy também
entram por digest completo; `latest` e tags mutáveis falham no preflight.

O registry pode ser Docker Hub privado, GitHub Container Registry ou outro OCI compatível. Conceda
ao deploy somente leitura e ao pipeline de build somente escrita no namespace AstroAxe. Habilite MFA,
retenção e revogação. Não execute registry de produção improvisado dentro do mesmo Swarm sem backup,
TLS, autenticação e disponibilidade próprios.

### Secrets da aplicação

Desenvolvimento continua usando `DATABASE_URL`, `REDIS_URL` e os segredos de sessão/fingerprint no
`.env` ignorado. Serviços Swarm devem omitir esses valores diretos e montar secrets versionados,
informando somente seletores `*_FILE`:

```text
DATABASE_URL_FILE=/run/secrets/astroaxe_database_url_v1
REDIS_URL_FILE=/run/secrets/astroaxe_redis_url_v1
GUEST_SESSION_SECRET_FILE=/run/secrets/astroaxe_guest_session_v1
AUTH_SESSION_SECRET_FILE=/run/secrets/astroaxe_auth_session_v1
FINGERPRINT_SECRET_FILE=/run/secrets/astroaxe_fingerprint_v1
```

Configurar simultaneamente a variável direta e sua variante `_FILE` é erro. Arquivo ausente, vazio,
maior que 64 KiB, não regular ou contendo byte NUL também falha fechado. O conteúdo nunca aparece na
mensagem de erro.

Os secrets do app são montados para UID/GID `1001`; os do scheduler, inclusive a senha SMTP, para UID/GID `1000`, refletindo
os usuários não-root dos respectivos targets do Dockerfile. Alterar esses usuários exige atualizar a
stack e verificar leitura dos secrets antes do rollout.

Rotação futura usa nomes versionados: criar a nova versão, concedê-la ao serviço no mesmo target,
forçar atualização monitorada e somente então revogar/remover a anterior. Não reutilize um nome de
secret para conteúdo novo.

Nunca passe conteúdo sensível como argumento de linha de comando. Crie cada secret a partir de stdin
seguro ou de um arquivo temporário com permissão `600`, fora do repositório, e elimine esse arquivo
de forma apropriada ao storage utilizado. O runbook registra apenas o nome e a versão do secret.

### Cloudflare

A zona `astroaxe.net` já está provisionada. A configuração completa — registros, TLS, WAF, rate
limiting, cache, Zero Trust e postura de e-mail — está em `docs/OPERATIONS.md`, que é a
referência autoritativa. Esta seção registra apenas o que o Swarm precisa saber.

Dois Tunnels gerenciados remotamente já existem, um por ambiente, para isolar o raio de alcance de
cada token:

| Ambiente | Tunnel             | ID                                     | Hostname               |
| -------- | ------------------ | -------------------------------------- | ---------------------- |
| Produção | `astroaxe-prod`    | `bcdae972-63e8-47d2-b064-72b0e9394863` | `astroaxe.net`         |
| Staging  | `astroaxe-staging` | `04e8bbff-646f-4f23-b257-7246fa9e6acb` | `staging.astroaxe.net` |

O ingress de ambos aponta para o serviço interno `http://traefik:8080` e cai em `http_status:404`
para qualquer hostname não declarado. Os dois tokens foram validados em 2026-08-26 executando
`cloudflared` contra a Cloudflare: ambos autenticaram, registraram conexões de borda e receberam a
configuração remota de ingress. O token fica em `astroaxe_cloudflare_tunnel_v1`; ele não entra
em arquivo de ambiente, log ou comando persistido. Use duas réplicas de `cloudflared`,
`--no-autoupdate` e imagem fixada, de modo que atualização seja decisão de deploy e não mutação
dentro do container.

A zona não possui nenhum registro `A` e nenhum wildcard: não existe IP de origem descobrível e não
existe rota que contorne a Cloudflare. O break-glass é o próprio Tunnel, nunca uma porta publicada
temporariamente no host.

### Preflight e deploy

Prepare um arquivo de variáveis fora do repositório a partir de
`infra/swarm/swarm.env.example`, carregue-o no shell controlado do manager e execute:

```bash
infra/swarm/scripts/preflight.sh
infra/swarm/scripts/deploy.sh
infra/swarm/scripts/smoke.sh
```

O deploy executa primeiro a imagem de migration como serviço efêmero, com acesso apenas ao secret de
`DATABASE_URL`. A migration precisa ser retrocompatível com a versão ainda em tráfego. Depois do
sucesso, a stack atualiza serviços stateless um por vez, monitora saúde e solicita rollback quando a
update falha. A migration não é revertida automaticamente; mudanças incompatíveis exigem estratégia
expand/contract e roll-forward.

Para rollback de imagens compatíveis com o schema:

```bash
infra/swarm/scripts/rollback.sh
infra/swarm/scripts/smoke.sh
```

Confirme sempre `docker service ps`, convergência, health e smoke. O script não declara produção
concluída nem altera DNS automaticamente.

### Estado da implementação

- Phase 1: boundary `*_FILE` implementada para app, worker e Prisma migrate;
- Phase 2: stack Swarm, preflight, migration efêmera, Cloudflare Tunnel, rolling update, rollback e
  smoke implementados; provisionamento real e ensaio em staging ainda pendentes;
- Phase 3: storage, placement e recuperação dos serviços de dados ainda pendentes;
- Phase 4: outbox, email worker, Mailpit de homologação e relay SMTP Brevo configuráveis estão
  implementados. O smoke sintético `npm run homolog:email-smoke` validou cadastro, persistência,
  worker e entrega no Mailpit; verificação do domínio, credencial real e ensaio de entrega em
  staging permanecem pendentes.

Não execute `docker swarm init`, crie secrets reais, abra firewall ou faça deploy sem inventário dos
nós, backup verificado e autorização operacional explícita.

## Arquitetura Swarm de produção

> Input: solicitação de infraestrutura integral em Swarm, Cloudflare, SMTP e avaliação de microserviços
> Date: 2026-08-22
> Mode: feature

### Objective

Criar uma plataforma de produção reproduzível em Docker Swarm, com origem HTTP privada atrás da Cloudflare, secrets de menor privilégio, deploy por imagem imutável, observabilidade, backup verificável e envio transacional idempotente. Preservar o Compose atual como ambiente local/E2E.

### Target Topology

```text
Cloudflare DNS/WAF/CDN/TLS
          |
     Cloudflare Tunnel (2+ replicas, outbound-only)
          |
    Traefik Swarm ingress (2 replicas, private overlay)
          |
    AstroAxe web/API (2+ replicas, stateless)
       |             |
       |             +--> Redis (cache/rate limit/locks)
       +----------------> PostgreSQL 18 + pgvector
       |
       +--> Nominatim (egress allowlist/controlled)

Scheduler (1 active + distributed lock) --> PostgreSQL/Redis
Email worker (replicated, idempotent) ----> PostgreSQL outbox
                                         -> SMTP relay (internal only)
                                         -> transactional provider/MTA

Prometheus -> Traefik/app/worker metrics -> Alertmanager (destination pending)
Backup job -> encrypted external object storage (provider pending)
```

### File Tree

Only new or modified files are shown.

```text
+ .planning/infra-manifest.md
+ .planning/architecture-docker-swarm-production.md
~ .env.example
~ Dockerfile
~ package.json
~ package-lock.json
~ prisma/schema.prisma
~ src/lib/env.ts
~ src/lib/env.test.ts
~ src/worker.ts
+ prisma/migrations/<timestamp>_transactional_email_outbox/migration.sql
+ src/lib/config/read-secret.ts
+ src/lib/config/read-secret.test.ts
+ src/lib/email/contracts.ts
+ src/lib/email/contracts.test.ts
+ src/lib/email/outbox.ts
+ src/lib/email/outbox.test.ts
+ src/lib/email/smtp.ts
+ src/lib/email/smtp.test.ts
+ src/email-worker.ts
+ infra/swarm/stack.yml
+ infra/swarm/stack.observability.yml
+ infra/swarm/stack.smtp-relay.yml
+ infra/swarm/config/traefik-static.yml
+ infra/swarm/config/traefik-dynamic.yml
+ infra/swarm/config/prometheus.yml
+ infra/swarm/config/alerts.yml
+ infra/swarm/config/postfix-main.cf
+ infra/swarm/scripts/preflight.sh
+ infra/swarm/scripts/deploy.sh
+ infra/swarm/scripts/smoke.sh
+ infra/swarm/scripts/rollback.sh
+ infra/swarm/scripts/rotate-secret.sh
+ docs/swarm-runbook.md          (hoje: seção "Orquestração Docker Swarm" deste documento)
+ docs/email-operations.md       (nunca criado; ver "Email transacional" neste documento)
~ docs/deployment-runbook.md     (hoje: seção "Runbook de deploy")
~ docs/backup-restore.md         (hoje: seção "Backup e restauração")
~ docs/data-inventory.md         (hoje: seção "Inventário de dados")
~ docs/PROJECT_MEMORY.md
```

### Component Breakdown

#### Swarm control and ingress

- **Files**: `infra/swarm/stack.yml`, Traefik configs, deploy scripts
- **Dependencies**: registry, three manager nodes for quorum, labeled workers
- **Complexity**: high
- **Boundary**: only `cloudflared` reaches Traefik; app/database/cache expose no host ports

#### Stateless application

- **Files**: existing Next.js image plus secret-file reader
- **Dependencies**: PostgreSQL, Redis
- **Complexity**: medium
- **Scaling**: replicated, rolling update `start-first`, healthcheck, rollback on failure

#### Data services

- **Files**: Swarm stack, backup runbook
- **Dependencies**: durable storage and explicit node labels
- **Complexity**: high
- **Boundary**: PostgreSQL remains source of truth; Redis remains disposable for cache but security-critical for rate limits

#### Email delivery

- **Files**: outbox migration, email worker, SMTP adapter, internal relay config
- **Dependencies**: PostgreSQL and an outbound SMTP provider or consciously operated MTA
- **Complexity**: high
- **Boundary**: app never opens SMTP directly in a request; it commits an outbox row with the product transaction

#### Observability and operations

- **Files**: observability stack, alerts, smoke/rollback/runbooks
- **Dependencies**: external alert destination and encrypted backup destination
- **Complexity**: high

### Data Model

#### EmailOutbox

- `id: UUID`
- `kind: enum-like varchar` — verification, password reset, security notification
- `recipientCiphertext: bytea/text` — or recipient encrypted at application level if operationally required
- `templateVersion: varchar`
- `payload: jsonb` — strict schema without arbitrary HTML
- `idempotencyKey: varchar unique`
- `status: PENDING | PROCESSING | SENT | FAILED | DEAD`
- `attemptCount: integer`
- `nextAttemptAt: timestamptz`
- `leaseOwner: varchar nullable`
- `leaseExpiresAt: timestamptz nullable`
- `providerMessageId: varchar nullable`
- `lastErrorCategory: varchar nullable` — no raw provider response or recipient
- `createdAt/sentAt: timestamptz`

The worker claims rows with a short lease inside a transaction, retries with bounded exponential backoff and moves permanent failures to `DEAD`. Logs contain only outbox ID, template, attempt, category and duration.

### Key Decisions

#### Production orchestration: dedicated Swarm stack

- **Chosen**: preserve Compose for local/E2E and add `infra/swarm/stack.yml` using prebuilt images and `deploy` policies. This avoids breaking a validated developer workflow and respects `docker stack deploy` limitations.
- **Rejected**: reuse `compose.yml` unchanged. It contains `build`, `depends_on` assumptions and Compose project constraints that do not provide Swarm scheduling semantics.
- **Rejected**: migrate directly to Kubernetes. It conflicts with the explicit platform choice and adds a second orchestrator.

#### Cloudflare origin: replicated Tunnel

- **Chosen**: `cloudflared` replicas initiate outbound connections and route to private Traefik. No public origin port is required.
- **Rejected**: publish Swarm 80/443 to the Internet and only filter Cloudflare IPs. It increases origin exposure and firewall drift.
- **Rejected**: bypass Traefik and point Tunnel directly to one app task. It loses internal routing, health/load balancing and future service boundaries.

#### SMTP: internal relay plus external delivery authority

- **Chosen**: a hardened Postfix-compatible relay container accepts mail only on the encrypted overlay from the email worker and authenticates to a transactional provider. No inbound MX, mailbox, IMAP or public SMTP is introduced.
- **Rejected**: a full self-hosted mail platform in the application Swarm. Deliverability requires reverse DNS, static IP reputation, DKIM rotation, abuse handling, feedback loops, blocklist response and port 25 policy; Swarm alone does not solve those duties.
- **Rejected**: call a provider HTTP/SMTP API synchronously from account routes. A provider outage would couple user transactions to delivery.

#### Service boundaries: modular monolith plus operational workers

- **Chosen**: keep auth, astrology, profiles, journal and editorial APIs in the Next.js service; separate scheduler and email worker because they have different scaling/retry/failure semantics.
- **Rejected**: split each domain into a microservice now. There is one team/repository/database, no independent scaling evidence, and distributed transactions would weaken ownership and privacy boundaries.
- **Evolution trigger**: extract a domain only after independent scale, deployment cadence, data ownership and SLO justify its own service and schema.

#### Stateful HA: no false portability

- **Chosen**: initial Swarm release pins PostgreSQL/Redis to labeled data nodes with tested backup/restore; HA is declared only after replicated storage or a managed data plane is selected and failover is exercised.
- **Rejected**: add multiple PostgreSQL/Redis replicas without consensus and storage design. Container replicas do not replicate database state.
- **Candidate for later**: Patroni/etcd and Redis Sentinel on three failure domains, but only with operational ownership and tested fencing; managed PostgreSQL/Redis remains the lower-risk market-standard alternative if “all in Swarm” is relaxed.

#### Secrets: versioned Docker secrets with `*_FILE`

- **Chosen**: non-sensitive values use Swarm configs/environment; passwords, tokens and DSNs use versioned secrets mounted in `/run/secrets`, read by shared boundary code.
- **Rejected**: secrets directly in stack YAML or environment. They are easier to expose through repository history, process inspection and support bundles.

### Build Phases

#### Phase 0: Baseline

- **Goal**: freeze the current validated behavior and document Swarm prerequisites.
- **Files**: planning documents only
- **Dependencies**: none
- **End Conditions**:
  - [ ] `npm run typecheck`, `npm run lint`, `npm run test:coverage` and `npm run build` pass
  - [ ] existing E2E and release smoke pass on Compose
  - [ ] current database backup restores successfully
  - [ ] no new typecheck errors and existing tests pass

#### Phase 1: Secret/config boundary

- **Goal**: allow the same image to consume environment variables locally and Docker secret files in Swarm.
- **Files**: env/config reader, tests, `.env.example`, Dockerfile
- **Dependencies**: Phase 0
- **End Conditions**:
  - [ ] every sensitive production variable supports `*_FILE`
  - [ ] invalid/missing/oversized secret fails closed without printing content
  - [ ] app, worker and migrate start locally with existing `.env`
  - [ ] no new typecheck errors and existing tests pass

#### Phase 2: Swarm stateless foundation

- **Goal**: deploy immutable app, migrate, worker, Traefik and cloudflared services safely.
- **Files**: stack, configs, preflight/deploy/smoke/rollback scripts, runbook
- **Dependencies**: Phase 1, registry, Cloudflare tunnel token/credentials
- **End Conditions**:
  - [ ] stack config renders without unresolved secret/config/image placeholders
  - [ ] every app image is referenced by digest or immutable release tag
  - [ ] rolling update failure triggers rollback
  - [ ] origin has no public app/database/cache port
  - [ ] liveness, readiness and release smoke pass through Cloudflare staging
  - [ ] no new typecheck errors and existing tests pass

#### Phase 3: Stateful data plane and recovery

- **Goal**: run PostgreSQL/Redis with explicit placement, persistence, monitoring and recoverability.
- **Files**: stack data services, backup scripts/runbooks, alert rules
- **Dependencies**: Phase 2, labeled nodes, durable volume decision, encrypted object storage
- **End Conditions**:
  - [ ] tasks cannot relocate silently to an empty local volume
  - [ ] PostgreSQL 18, pgvector and all migrations pass readiness
  - [ ] backup leaves the cluster encrypted and restore passes on an isolated target
  - [ ] Redis persistence and fail-closed rate-limit behavior are exercised
  - [ ] node loss behavior and documented RPO/RTO are observed, not assumed
  - [ ] no new typecheck errors and existing tests pass

#### Phase 4: Transactional email

- **Goal**: send verification/recovery/security email asynchronously and idempotently.
- **Files**: outbox migration/domain, email worker, SMTP adapter/relay stack, tests/runbook
- **Dependencies**: Phase 3, sending domain, SPF/DKIM/DMARC, provider credentials
- **End Conditions**:
  - [ ] outbox creation and business mutation commit atomically
  - [ ] duplicate delivery is prevented by idempotency key and provider correlation
  - [ ] transient failure retries with bounded backoff; permanent failure becomes dead-letter state
  - [ ] SMTP is reachable only from the internal overlay and never exposed publicly
  - [ ] email address, token and body never appear in logs/metrics
  - [ ] SPF, DKIM and DMARC pass in provider test messages
  - [ ] no new typecheck errors and existing tests pass

#### Phase 5: Observability and operational hardening

- **Goal**: make deploy, saturation, queue age, backup and delivery failures actionable.
- **Files**: Prometheus/Alertmanager configs, dashboards/runbooks and security checks
- **Dependencies**: Phases 2–4, approved alert destination
- **End Conditions**:
  - [ ] alerts cover service availability, p95/5xx, outbox age/dead letters, DB/Redis, disk and backup age
  - [ ] alert payloads contain no PII or secrets
  - [ ] manager quorum loss, worker loss, failed deploy and restore are rehearsed
  - [ ] Docker socket access is restricted to the proxy boundary
  - [ ] `docker service` tasks run non-root/read-only wherever compatible
  - [ ] no new typecheck errors and existing tests pass

#### Phase 6: Production promotion

- **Goal**: promote the exact staging digests after functional, security and recovery gates.
- **Files**: deployment and project-memory updates
- **Dependencies**: Phases 0–5, domain, TLS, DNS, providers and human approval
- **End Conditions**:
  - [ ] full quality gate, E2E, release smoke, restore and Sonar pass
  - [ ] Cloudflare WAF/rate limiting/caching rules are documented and verified
  - [ ] rollback/roll-forward succeeds with the previous application digest
  - [ ] production is observed through the agreed SLO window
  - [ ] no new typecheck errors and existing tests pass

### Phase Dependency Graph

```text
Phase 0 -> Phase 1 -> Phase 2 -> Phase 3 -> Phase 4 -> Phase 5 -> Phase 6
                         \---------------------> Phase 5
```

### Risk Register

1. **Regression in existing functionality**: keep local Compose and E2E untouched; deploy the same immutable image in staging before production.
2. **Manager quorum loss**: use three or five managers across failure domains, odd quorum, autolock and tested unlock-key custody.
3. **Stateful task starts on empty storage**: placement constraints, node labels, volume preflight and restore drills; never rely on Swarm volume names as replication.
4. **Secret rotation causes outage**: version secret names, grant new/redeploy/revoke old, and document rollback.
5. **Cloudflare dependency/outage**: retain documented break-glass origin access restricted by firewall/VPN, never a permanently open bypass.
6. **Email reputation and abuse**: relay through a provider, verify SPF/DKIM/DMARC, rate-limit templates, suppress bounces and maintain revocation procedures.
7. **Outbox leaks PII**: strict template payloads, minimum retention, encrypted recipient where required, redacted logs and cascade/erasure policy.
8. **Premature microservices**: keep one transactional database boundary until scale/team/SLO evidence justifies extraction.
9. **Swarm feature limitations**: validate every stack key with `docker stack config`; do not assume modern Compose keys are honored by `docker stack deploy`.

### Deployment Strategy

- **Platform**: Docker Engine Swarm mode on Linux, minimum three managers and separate labeled workers/data nodes.
- **Method**: CI builds once, scans/SBOM-signs, pushes immutable images, then a manager executes preflight and `docker stack deploy --with-registry-auth --prune` under change control.
- **Environment variables**: non-sensitive configs only; secrets mounted from versioned Docker secrets.
- **Pre-deploy checks**: manager quorum, registry access, image digest, stack render, secrets/configs present, backup verified, migrations compatible, capacity, Cloudflare tunnel health.
- **Update policy**: `start-first` for stateless services, health monitored, failure action rollback; stateful services use controlled stop-first maintenance.
- **Rollback**: application digest rollback when schema-compatible; otherwise roll-forward. Database restore occurs only to an isolated target.

### External Decisions Required Before Phase 2/3/4

- registry and image signing/SBOM destination;
- number and failure domains of Swarm nodes;
- durable volume/storage implementation for PostgreSQL/Redis;
- Cloudflare plan, zone, tunnel and break-glass policy;
- transactional email provider and sending domain;
- encrypted external backup and Alertmanager destination;
- whether “all in Swarm” permits managed PostgreSQL/Redis if HA/RPO/RTO make self-operation unjustifiable.

---HANDOFF---

- Architecture: AstroAxe Docker Swarm production
- Document: `.planning/architecture-docker-swarm-production.md`
- Phases: 7
- Estimated complexity: high
- Next: implementation campaign only after architecture approval and external choices
- Reversibility: green — delete the architecture document to undo

---

## Manifesto de infraestrutura

> Generated: 2026-08-22
> Project: astroaxe

### Current Systems

#### PostgreSQL 18 + pgvector — primary transactional store

- **Type**: database and vector extension
- **Product**: PostgreSQL 18, pgvector 0.8.6, Prisma 7.9.1 and `@prisma/adapter-pg`
- **Config**: `compose.yml:4`, `prisma/schema.prisma:1`, `prisma.config.ts:12`
- **Connection**: one process-global Prisma Client backed by the node-postgres adapter; connection
  string comes from `DATABASE_URL` or `DATABASE_URL_FILE` (`src/lib/prisma.ts:6`)
- **Used by**: route handlers, account/session ownership, charts, journals, cultural corpus,
  retention and the transactional email outbox
- **Production state**: the Swarm stack consumes an external connection secret but does not yet
  provision PostgreSQL (`infra/swarm/stack.yml:163`)

#### Redis 8 — rate limiting and geocoding cache

- **Type**: cache and coordination dependency
- **Product**: Redis 8.4.0 with AOF locally; ioredis 6.0.0
- **Config**: `compose.yml:22`, `src/lib/redis.ts:5`
- **Connection**: lazy process singleton, ready check, 3-second timeouts, one retry per command and
  bounded reconnect delay
- **Used by**: fail-closed API rate limiting (`src/lib/rate-limit.ts:10`), 30-day validated
  Nominatim response cache (`src/lib/geocoding/nominatim.ts:27`) and readiness
- **Production state**: the Swarm stack consumes an external connection secret but does not yet
  provision Redis (`infra/swarm/stack.yml:163`)

#### SMTP relay / Mailpit — transactional delivery

- **Type**: email transport
- **Product**: Nodemailer 9.0.5; Mailpit 1.31.0 in homologation; Brevo SMTP proposed for production
- **Config**: `compose.homolog.yml:8`, `infra/swarm/stack.yml:262`
- **Connection**: scheduler-only SMTP client with timeouts; password from Docker Secret in Swarm
- **Used by**: PostgreSQL outbox worker (`src/lib/email/outbox.ts:16`)

#### Traefik + Cloudflare Tunnel — ingress

- **Type**: reverse proxy, metrics endpoint and outbound tunnel
- **Product**: Traefik 3.7.0 locally; digest-pinned Traefik and cloudflared in production
- **Config**: `compose.yml:111`, `infra/swarm/stack.yml:42`, `infra/swarm/stack.yml:107`
- **Connection**: Cloudflare Tunnel reaches private Traefik over encrypted overlay; Traefik reads
  filtered Swarm metadata through docker-socket-proxy
- **Used by**: public application ingress; no database, Redis or Docker socket ports are published

#### Nominatim — birthplace geocoding

- **Type**: external HTTP API
- **Product**: OpenStreetMap Nominatim
- **Config**: `src/lib/geocoding/nominatim.ts:42`
- **Connection**: HTTPS fetch with a five-second timeout, identified user agent, strict Zod response
  validation and Redis caching
- **Used by**: geocoding route during onboarding and profile maintenance

#### SonarQube + PostgreSQL — isolated quality tooling

- **Type**: static analysis and dedicated quality database
- **Product**: SonarQube Community Build and PostgreSQL 18
- **Config**: `compose.quality.yml`
- **Connection**: local loopback UI/scanner; independent volume and database from application data
- **Used by**: local quality gate only, outside production runtime

### Connection Graph

```text
Browser
   |
Cloudflare Tunnel -> Traefik -> Next.js app
                               |-- Prisma adapter -> PostgreSQL + pgvector
                               |-- ioredis -------> Redis
                               `-- HTTPS --------> Nominatim

Scheduler -------------------->|-- Prisma adapter -> PostgreSQL email outbox
                               `-- SMTP ---------> Mailpit (homolog) / Brevo (production)

Sonar scanner --------------------> SonarQube -> dedicated PostgreSQL
```

### Access Patterns

- Request/response OLTP: account, profile, chart, journal and editorial handlers query PostgreSQL
  through the shared Prisma boundary.
- Cache-assisted external lookup: normalized birthplace queries use Redis before Nominatim and
  validate cached values before use.
- Coordination: rate limits use an atomic Redis Lua script and fail closed on dependency failure.
- Durable asynchronous work: registration writes to the PostgreSQL email outbox; the singleton
  scheduler polls every two seconds and claims records with leases.
- Batch maintenance: the same scheduler removes expired sessions hourly.

### Opportunities

#### Define the production data topology before provisioning

- **Signal**: production app and scheduler require external `DATABASE_URL` and `REDIS_URL`, while no
  stateful services or managed endpoints are declared in the Swarm stack.
- **System**: choose either managed PostgreSQL/Redis or dedicated, labeled Contabo data nodes with
  node-local volumes, tested backup and explicit failover procedure.
- **Impact**: turns the current stateless production blueprint into an operable deployment contract.
- **Effort**: high

#### Add explicit PostgreSQL pool limits

- **Signal**: `PrismaPg` receives only a connection string while two or more app replicas plus the
  scheduler create independent pools (`src/lib/prisma.ts:8`, `infra/swarm/stack.yml:219`).
- **System**: configure bounded node-postgres pools now; evaluate PgBouncer only when measured
  connection pressure or replica count justifies another stateful component.
- **Impact**: prevents a small VPS database from being exhausted during rollout overlap.
- **Effort**: low

#### Separate scheduler loops as workload grows

- **Signal**: email polling and hourly retention share one process and `setInterval`
  (`src/worker.ts:34`).
- **System**: keep the durable PostgreSQL outbox now; split email and maintenance workers when their
  resource profiles or scaling requirements diverge. No new queue is justified yet.
- **Impact**: isolates failure and permits independent scaling without premature infrastructure.
- **Effort**: medium

#### Formalize backup destinations and restore evidence

- **Signal**: local named volumes exist and backup scripts are documented, but the Swarm contract has
  no declared data volume, encrypted off-host destination or scheduled restore verification.
- **System**: restic-compatible encrypted object storage for PostgreSQL dumps/WAL policy and config;
  Redis remains reconstructible where used only for cache/rate-limit state.
- **Impact**: establishes measurable RPO/RTO and protects against loss of a Contabo node.
- **Effort**: medium

### Multi-Repo Considerations

No shared database, sibling repository or cross-repository writer was found. Cloudflare, Brevo,
Nominatim and an eventual backup destination are external services but do not require multi-repo
coordination.

## Runbook de deploy

Há dois contratos de deploy: homologação local por Docker Compose e produção por Docker Swarm nas
VPS Contabo atrás da Cloudflare. A topologia, comandos e secrets de Swarm estão em
`docs/OPERATIONS.md`. Este documento conserva os gates compartilhados de release e retorno.

Antes de promover produção, a mesma release deve passar na homologação local:

```bash
npm run homolog:up
npm run homolog:smoke
```

Mailpit captura todos os emails de homologação. Nenhuma credencial Cloudflare, Brevo ou de produção
é usada localmente.

O contrato da outbox, retries, configuração SMTP e autenticação do domínio está em
`docs/OPERATIONS.md`.

Este runbook não pressupõe Vercel nem um provedor específico. O artefato autoritativo é a imagem
construída pelo `Dockerfile`; PostgreSQL, Redis, app, worker, migrations e Traefik são operados por
Compose ou por uma plataforma compatível com containers.

### Pré-condições

- domínio, TLS e ambiente de destino definidos — a borda pública está configurada e
  documentada em `docs/OPERATIONS.md`;
- segredos independentes entregues pelo secret manager, nunca copiados para a imagem;
- PostgreSQL 18 com pgvector e Redis 8 acessíveis somente pelas redes internas;
- backup recente restaurado com sucesso em banco isolado;
- imagens identificadas por digest imutável no ambiente de destino;
- retenção de logs, métricas e backups aprovada antes de conectar coletores externos.

### Staging

1. Valide a composição efetiva com `docker compose config`.
2. Construa `app`, `worker` e `migrate` a partir do mesmo commit e lockfile.
3. Registre os digests das imagens sem registrar variáveis de ambiente.
4. Crie e verifique um backup antes de aplicar migrations.
5. Execute o serviço `migrate` uma única vez e exija saída zero.
6. Inicie app e worker; libere Traefik somente depois de `ready` confirmar PostgreSQL e Redis.
7. Rode o smoke de release pela mesma origem que receberá tráfego:

```bash
RELEASE_BASE_URL=https://staging.seu-dominio.example npm run test:release-smoke
```

8. Execute o Playwright contra a stack iniciada e o smoke de performance com SLO próprio do
   ambiente. Nenhum dado pessoal real participa desses testes.
9. Suba `compose.observability.yml`, rode `npm run test:observability` e confirme as quatro regras
   antes de conectar o destino externo de alertas.

### Produção

Promova exatamente os digests validados em staging. Aplique migrations compatíveis antes de trocar
tráfego e mantenha a versão anterior disponível durante a janela de observação. Confirme `live`,
`ready`, home, metodologia, robots, sitemap, `noindex` da conta e headers pelo smoke automatizado.

Registre somente versão, digest, migrations, horários, responsáveis operacionais, resultados
agregados e decisão. Não registre URLs com credenciais, cookies, tokens, email, nascimento,
localização ou corpo de requisição.

### Falha e roll-forward

1. Pare a promoção e preserve logs sanitizados.
2. Se a migration ainda não começou, mantenha a versão anterior.
3. Se migrations compatíveis já foram aplicadas, prefira corrigir e promover uma nova imagem.
4. Só retorne à imagem anterior quando o schema continuar compatível e o smoke confirmar a versão.
5. Restauração de banco ocorre em instância isolada conforme `docs/OPERATIONS.md`; nunca restaure
   por cima da origem durante diagnóstico.
6. Não use `down -v`, prune ou remoção de volumes como procedimento de rollback.

O primeiro deploy só pode ser declarado concluído depois de observado no destino real. Sem domínio,
TLS, infraestrutura e política operacional definidos, este documento é preparação verificável, não
evidência de produção.

## Backup e restauração

Este runbook cria backups lógicos no formato custom do PostgreSQL e comprova cada artefato por
restauração em um banco temporário isolado. Um arquivo que nunca foi restaurado não é considerado
backup válido.

### Objetivos operacionais

- RPO inicial: 24 horas, com backup diário antes da janela de menor movimento.
- RTO inicial: 2 horas para provisionar PostgreSQL compatível, restaurar, validar e redirecionar a
  aplicação.
- Retenção inicial: 7 backups diários, 4 semanais e 6 mensais, sujeita à política LGPD definitiva.
- Backups devem permanecer criptografados fora do host do banco e ter acesso auditável. A pasta
  local `backups/` é ignorada pelo Git e serve somente para operação/teste local.

RPO, RTO e retenção são metas iniciais, não garantias observadas em produção. Revise-as após medir
volume, duração, custo e criticidade reais.

### Criar e verificar

Identifique explicitamente o projeto Compose que contém o banco de origem:

```bash
ASTROAXE_COMPOSE_PROJECT=astroaxe_fase3 ./scripts/backup-postgres.sh
ASTROAXE_COMPOSE_PROJECT=astroaxe_fase3 \
  ./scripts/verify-postgres-restore.sh backups/astroaxe-AAAAmmddTHHMMSSZ.dump
```

O backup usa `pg_dump --format=custom`, sem owner nem privilégios do ambiente de origem, e grava um
SHA-256 ao lado do artefato. A verificação confere o checksum, restaura com `--exit-on-error`, exige
a extensão `vector` e rejeita histórico Prisma vazio, incompleto ou revertido. O banco temporário
possui prefixo `astroaxe_restore_` e é removido ao fim, inclusive após falha. Nenhum volume é
apagado.

Não registre credenciais, URL de banco ou conteúdo do dump. Antes de mover o artefato para storage
externo, use criptografia autenticada e chave gerenciada fora do arquivo.

### Recuperação de incidente

1. Declare o incidente, congele migrations e preserve logs sanitizados.
2. Escolha PostgreSQL 18 com pgvector compatível e confirme espaço livre.
3. Verifique o SHA-256 e restaure primeiro em banco isolado.
4. Confirme `vector`, `_prisma_migrations`, tabelas críticas e contagens esperadas.
5. Execute healthchecks e smoke tests contra a restauração antes de trocar tráfego.
6. Registre instante do backup, perda efetiva, duração, validações e decisão de retorno.
7. Prefira roll-forward. Descarte o banco anterior somente após retenção e autorização explícitas.

Nunca use `down -v`, apague o banco de origem ou restaure por cima dele como procedimento de teste.

### Volume legado PostgreSQL 16

O volume local `astroaxe_postgres_data` foi identificado, por leitura de `PG_VERSION`, como
PostgreSQL 16. A imagem atual é PostgreSQL 18 e usa o novo mount `/var/lib/postgresql`; ela não deve
iniciar diretamente esse diretório antigo.

A migração segura é lógica e preserva a origem:

1. pare qualquer container que use o volume e confirme um snapshot/clone recuperável dele;
2. inicie **o clone**, nunca a origem, com `pgvector/pgvector:0.8.6-pg16-bookworm` e o mount legado
   `/var/lib/postgresql/data`;
3. gere `pg_dump --format=custom --no-owner --no-privileges`, checksum e inventário de contagens;
4. restaure o dump em um volume novo PostgreSQL 18 com pgvector;
5. execute `prisma migrate status`, `npm run backup:verify`, health, release smoke e E2E contra o
   destino;
6. só altere o tráfego depois de comparar migrations e contagens; retenha origem, clone e dump
   durante a janela de retorno.

Esse procedimento foi executado localmente em uma janela autorizada em 21 de agosto de 2026. A
existência do volume legado continua sem autorizar sua alteração ou remoção; nunca use `down -v`
como migração.

#### Roll-forward local autorizado em 2026-08-21

O Compose passa a usar `astroaxe_postgres18_data`. O volume legado
`astroaxe_postgres_data`, identificado como PostgreSQL 16, deve permanecer sem
alterações durante a janela de retorno. Para rollback, pare o stack, restaure a
configuração compatível com PostgreSQL 16 em ambiente isolado e aponte para o
volume legado; nunca monte o volume 16 diretamente na imagem PostgreSQL 18.

O dump `backups/astroaxe-20260820T024048Z.dump` teve checksum confirmado e foi restaurado no novo
volume. O destino foi verificado com PostgreSQL `18.6`, extensão `vector`, 16 migrations Prisma sem
estado inválido e a migration final `20260820010000_private_journaling`. Healthchecks, busca real
de Salvador, criação sintética de mapa e release smoke passaram. O dump e o volume legado devem ser
retidos até uma decisão explícita de encerramento da janela de retorno.

## Email transacional

O AstroAxe usa uma outbox persistida no PostgreSQL. O cadastro do usuário e a mensagem
`ACCOUNT_WELCOME/v1` são gravados na mesma transação; o scheduler reivindica a mensagem com lease,
envia por SMTP e registra somente IDs opacos, tipo e categoria de erro. Endereço, assunto, corpo e
credenciais não entram nos logs.

Boas-vindas incluem confirmação de email. Reenvio e recuperação de senha usam tokens opacos de uso
único: a URL contém ID e verificador derivado por HMAC, enquanto o PostgreSQL guarda somente
SHA-256. Confirmação expira em 24 horas; recuperação expira em 30 minutos, revoga todas as sessões
anteriores e cria uma nova sessão após a troca. Pedidos de recuperação devolvem a mesma mensagem
para emails existentes e inexistentes.

### Contratos por ambiente

- homologação local: `mailpit` recebe SMTP em `mailpit:1025` e expõe a caixa apenas em
  `http://127.0.0.1:8025`;
- produção: o scheduler no Swarm conecta diretamente ao relay gerenciado. A configuração inicial
  recomendada é Brevo na porta 587 com STARTTLS; a senha fica no Docker Secret versionado
  `astroaxe_smtp_password_v1`;
- o app web não recebe a credencial SMTP. Só o scheduler tem acesso ao secret de envio.

SMTP não garante entrega exatamente uma vez. O sistema usa `idempotency_key` única, lease de dois
minutos e `Message-ID` derivado do ID da outbox. Isso evita concorrência entre workers e reduz
duplicações, mas uma interrupção depois do aceite do relay e antes do commit pode reenviar a mesma
mensagem. O processamento faz até seis tentativas com backoff e então move a mensagem para `DEAD`.

### Preparação do domínio na Cloudflare

> **Estado atual:** `astroaxe.net` está declarado no DNS como domínio que não envia nem recebe
> e-mail — `MX 0 .`, `v=spf1 -all` e `DMARC p=reject`. Essa é a postura mais restritiva contra
> spoofing e deve ser mantida até existir relay contratado. Os passos abaixo descrevem a transição
> a partir desse estado; a sequência exata está em `docs/OPERATIONS.md`.

1. Cadastre e verifique um subdomínio dedicado, por exemplo `mail.seu-dominio.example`, no relay.
2. Publique exatamente os registros DKIM e de tracking fornecidos pelo painel do provedor. Registros
   de e-mail ficam como DNS only quando o painel assim exigir; o proxy HTTP da Cloudflare não é um
   proxy SMTP.
3. Mantenha um único SPF no domínio remetente e incorpore o mecanismo informado pelo relay. Não
   publique dois registros SPF concorrentes.
4. Publique DMARC inicialmente com monitoramento (`p=none`) e endereço de relatórios controlado.
   Depois de observar alinhamento SPF/DKIM, avance conscientemente para `quarantine` e `reject`.
5. Use remetente do domínio verificado, configure reply-to quando existir suporte e teste Gmail,
   Outlook e provedores brasileiros antes da promoção.

Nunca copie valores DNS de exemplo deste repositório: eles devem vir da conta real do provedor.
Cloudflare protege a superfície HTTP, enquanto reputação, bounce, complaint e suppression pertencem
ao relay. Antes de marketing ou newsletter, crie consentimento e unsubscribe separados; esta outbox
é exclusivamente transacional.

### Operação

Consulte a fila sem selecionar relações de usuário ou conteúdo sensível:

```sql
SELECT status, kind, count(*) FROM email_outbox GROUP BY status, kind;
```

Alertas mínimos: crescimento contínuo de `PENDING`/`RETRY`, qualquer `DEAD`, falha de autenticação e
taxa de bounce/complaint no painel do relay. Reprocessamento manual exige causa raiz corrigida e deve
alterar somente status, lease e próximo horário; nunca apague a outbox para silenciar falhas.

Na homologação, execute `npm run homolog:email-smoke`. O comando cria uma conta sintética única,
confirma o estado `SENT`, verifica a mensagem na API local do Mailpit e remove exatamente o usuário
de teste ao terminar. Nenhuma mensagem desse ambiente sai para a internet.

## Ferramentas de qualidade

Esta fase mantém o SonarQube separado da aplicação. O arquivo
`compose.quality.yml` sobe somente o SonarQube Community Build e seu PostgreSQL
dedicado, sob o profile `quality`.

### Pré-requisitos do host Linux

O Elasticsearch embutido no SonarQube exige estes limites no host:

```bash
sysctl vm.max_map_count
sysctl fs.file-max
ulimit -n
ulimit -u
```

Os valores mínimos são, respectivamente, `524288`, `131072`, `131072` e
`8192`. Ajustes de `sysctl` são administrativos e não são feitos pelo Compose.
Reserve pelo menos 4 GB de RAM, 2 CPUs e 30 GB de armazenamento livre para a
stack de qualidade.

### Primeiro bootstrap

Crie uma senha local sem registrá-la no histórico e suba o profile:

```bash
read -rsp 'Senha do PostgreSQL do Sonar: ' SONAR_DB_PASSWORD
export SONAR_DB_PASSWORD
docker compose -f compose.quality.yml --profile quality up -d --wait
```

Abra `http://127.0.0.1:9000`, entre inicialmente com `admin` / `admin` e troque
a senha imediatamente. Em seguida:

1. crie um projeto privado com a chave `astroaxe`;
2. mantenha o Quality Gate `Sonar way` — novos issues zero, hotspots revisados,
   cobertura de novo código maior ou igual a 80% e duplicação menor ou igual a
   3%;
3. crie um **Project Analysis Token** para o scanner;
4. crie um **User Token** separado para Connected Mode e para o MCP.

Tokens nunca devem entrar em arquivos versionados. O scanner recebe o token
por `SONAR_TOKEN`, e o endereço por `SONAR_HOST_URL`. A ordem obrigatória é: gerar
`coverage/lcov.info`, executar o scanner e aguardar o Quality Gate conforme
`sonar-project.properties`.

Quando tokens locais permanentes forem autorizados pelo responsável, guarde o Project Analysis
Token em `SONAR_TOKEN` e o User Token em `SONARQUBE_TOKEN` exclusivamente no `.env` ignorado, com
permissão `600`. Use nomes distintos, menor escopo e rotação explícita; nunca copie os valores para
Compose, documentação, terminal compartilhado ou arquivos de exemplo.

O diretório de trabalho do scanner é `.scannerwork-user`. Essa separação evita conflito com o
artefato histórico `.scannerwork` criado por container com outro UID; ambos permanecem ignorados.

Para parar sem apagar os dados:

```bash
docker compose -f compose.quality.yml --profile quality down
```

Não use `down -v` salvo quando a intenção for apagar definitivamente banco,
histórico, configuração e índices do SonarQube.

O volume do PostgreSQL 18 é montado em `/var/lib/postgresql`, conforme o layout
versionado atual da imagem oficial; não altere esse destino para o caminho
legado `/var/lib/postgresql/data`.

### VS Code, LSPs e Connected Mode

`extensions.json` recomenda apenas uma implementação por responsabilidade:

- TypeScript, JavaScript, JSON, CSS e HTML usam os language services nativos do
  VS Code e o TypeScript instalado no workspace;
- ESLint diagnostica e corrige código; Prettier apenas formata;
- Tailwind CSS IntelliSense, Prisma e YAML fornecem seus próprios language
  servers;
- Docker DX cobre Dockerfile e Compose;
- SonarQube for IDE complementa os LSPs com as regras do servidor;
- Vitest e Playwright integram os testes ao painel nativo;
- CSpell usa os dicionários inglês e português brasileiro localmente.

No SonarQube for IDE, crie uma conexão para `http://127.0.0.1:9000` usando o
**User Token**, associe o workspace ao projeto `astroaxe` e mantenha o token no
secret storage do editor. O Connected Mode analisa arquivos abertos/salvos; ele
não substitui o scan completo nem o Quality Gate.

As telemetrias do SonarQube, SonarQube for IDE e YAML estão desativadas. Docker
DX exige acesso ao Docker Engine; conceder esse acesso equivale a uma permissão
administrativa no host e deve ocorrer apenas em uma máquina confiável. O schema
store do YAML pode acessar a rede para baixar schemas públicos.

### MCP SonarQube opcional

O MCP oficial é útil para consultar issues e o Quality Gate por agentes, mas
não é necessário para compilar ou analisar o projeto. Ele exige um **User
Token**, não aceita o Project Analysis Token para essa integração e possui
telemetria própria, desativada abaixo.

Exporte o token no ambiente que inicia o cliente MCP e configure um servidor
stdio equivalente a:

```json
{
  "mcpServers": {
    "sonarqube": {
      "command": "docker",
      "args": [
        "run",
        "--init",
        "--rm",
        "-i",
        "--network=host",
        "-e",
        "SONARQUBE_TOKEN",
        "-e",
        "SONARQUBE_URL=http://127.0.0.1:9000",
        "-e",
        "SONARQUBE_PROJECT_KEY=astroaxe",
        "-e",
        "TELEMETRY_DISABLED=true",
        "sonarsource/sonarqube-mcp:1.22.0.3040"
      ]
    }
  }
}
```

`--network=host` é específico para Docker em Linux e permite que o container
acesse o SonarQube publicado apenas no loopback. Não grave
`SONARQUBE_TOKEN` no JSON: o argumento `-e SONARQUBE_TOKEN` apenas encaminha a
variável já presente no ambiente do cliente.

### Limites conhecidos

O Community Build não oferece a experiência completa de análise de múltiplas
branches das edições pagas. O contrato desta fase é a análise da branch
principal. Também não substitui testes, TypeScript, ESLint, revisão de
acessibilidade ou análise de dependências.

### Atualização do `.gitignore`

O script `scripts/gitignore-preview.sh` implementa o fluxo de linha de comando documentado pelo
gitignore.io usando a API pública da Toptal. A lista padrão cobre Node, VS Code, macOS, Windows e
Linux:

```bash
npm run gitignore:preview > /tmp/astroaxe.gitignore
diff -u .gitignore /tmp/astroaxe.gitignore
```

É possível fornecer outra lista de templates como primeiro argumento. O script aceita apenas
letras, números, vírgula, hífen e sublinhado, imprime a resposta em stdout e nunca sobrescreve o
arquivo do projeto. Revise cada diferença: regras específicas do AstroAxe, exceções de exemplo e
artefatos de ferramentas têm precedência sobre uma base gerada.

## Desempenho e observabilidade

### Contrato

A medição usa a entrada HTTP do Traefik. PostgreSQL e Redis continuam sem portas públicas. O smoke
não cria conta, não consulta geocoding e não envia email, data natal, localização, cookie ou token.

Com a stack principal saudável:

```bash
npm run test:performance
```

Por padrão, o smoke usa `http://localhost`, o host aceito pelo roteamento local do Traefik. Para
outro ambiente, informe uma origem explícita em `PERFORMANCE_BASE_URL`.

Para outra porta ou volume:

```bash
PERFORMANCE_BASE_URL=http://127.0.0.1:3100 \
PERFORMANCE_REQUESTS=200 PERFORMANCE_CONCURRENCY=20 PERFORMANCE_MAX_P95_MS=750 \
npm run test:performance
```

O comando falha se houver resposta diferente de HTTP 200 ou se o p95 ultrapassar o limite. O
resultado é um smoke local, não uma capacidade prometida de produção. Testes de carga maiores devem
usar uma stack isolada, dados sintéticos e limites definidos a partir do ambiente de destino.

### Diagnóstico operacional

Use apenas dados agregados e logs sanitizados:

```bash
docker compose ps
docker compose stats --no-stream
docker compose logs --tail=200 app worker postgres redis traefik
curl --fail http://127.0.0.1/api/health/live
curl --fail http://127.0.0.1/api/health/ready
```

`live` confirma o processo; `ready` confirma PostgreSQL e Redis com timeout. Alertas mínimos futuros
devem cobrir indisponibilidade, latência, erros HTTP, saturação de CPU/memória/disco, conexões do
banco, memória/evictions do Redis, falha do worker e idade do último backup verificado.

Não exporte corpo de requisição, query string, cabeçalhos, cookies ou identificadores de sessão.
Antes de ligar um coletor externo, documente fornecedor, retenção, região, acesso, base legal e
revogação. A ausência desse contrato impede observabilidade externa, mas não o diagnóstico local.

### Prometheus local em containers

A sobreposição `compose.observability.yml` adiciona Prometheus `3.13.1` LTS e mantém sua coleta em
uma rede interna. O Traefik expõe `/metrics` apenas no entrypoint interno `metrics`; a interface do
Prometheus fica limitada a `127.0.0.1:9090` por padrão. PostgreSQL e Redis continuam sem portas no
host.

```bash
docker compose -f compose.yml -f compose.dev.yml -f compose.observability.yml \
  --profile observability up -d --build --wait
npm run test:observability
```

O armazenamento possui retenção dupla: 15 dias ou 1 GB, o que ocorrer primeiro. Os valores podem
ser reduzidos por `PROMETHEUS_RETENTION` e `PROMETHEUS_RETENTION_SIZE`. O volume é persistente e não
deve ser removido na rotina.

As séries HTTP usam somente código, método, protocolo, router e serviço. Não são adicionados labels
de header, IP, URL, query, cookie, sessão, email ou dados natais. O access log do Traefik conserva
somente instante, duração, método, nomes técnicos, status e retries; headers, query parameters,
caminho e endereço do cliente são descartados antes da emissão.

Quatro regras locais ficam carregadas, ainda sem encaminhamento externo:

- target de métricas indisponível por dois minutos;
- backend reprovado no healthcheck por dois minutos;
- taxa agregada de HTTP 5xx acima de 5% por cinco minutos;
- p95 agregado acima de 750 ms por dez minutos.

Prometheus avalia e mantém o estado das regras. Notificação exige Alertmanager ou destino externo;
essa ligação permanece bloqueada até definir fornecedor, destinatários, retenção e procedimento de
revogação.

O provider Docker do Traefik aceita somente containers cujo label de projeto Compose coincide com
o projeto em execução. Isso evita colisão de routers quando stacks isoladas coexistem no mesmo
daemon.

Referências operacionais oficiais: [instalação do Prometheus](https://prometheus.io/docs/prometheus/latest/installation/),
[ciclo de versões](https://prometheus.io/docs/introduction/release-cycle/),
[métricas do Traefik](https://doc.traefik.io/traefik/v3.5/reference/install-configuration/observability/metrics/)
e [access logs do Traefik](https://doc.traefik.io/traefik/observability/access-logs/).

## Ingestão do acervo cerimonial

Runbook da Task 13 do roteiro `docs/IMPLEMENTATION_STATUS.md`. A T12
respondeu **o que existe** no acervo; esta task responde **o que dele vira texto**, sob quais
limites e com qual prova de integridade.

O acervo é material privado do responsável. Nada aqui o copia, move ou altera, e nenhum
caminho do acervo entra em documento versionado.

### O que o pipeline faz

1. Lê o manifesto da T12 e percorre uma linha por vez, em ordem estável.
2. Escolhe o adaptador pelo tipo detectado. **Só abre o arquivo quando existe adaptador** —
   os 538 MP3 do acervo nunca são lidos.
3. Reverifica a fonte antes de extrair: abre com `O_NOFOLLOW`, confirma arquivo regular,
   compara tamanho e SHA-256 com o censo. Divergência vira quarentena, não ingestão.
4. Roda o adaptador com o **descritor já verificado** como stdin. O binário nunca recebe um
   caminho, então não há janela para troca de nome entre a verificação e a leitura.
5. Reconfere `fstat` depois da extração (inode, device, tamanho, mtime). Se mudou durante a
   leitura, o derivado é descartado.
6. Normaliza o texto de forma determinística, grava em quarentena, relê, reconfere o hash e
   só então promove por rename atômico para o volume reconstruível.

Cada linha do censo termina em exatamente um estado. Não existe omissão silenciosa.

### Cobertura de extração: o que entra e o que não entra

| Tipo                 | Adaptador               | Ferramenta                    |
| -------------------- | ----------------------- | ----------------------------- |
| PDF                  | `pdf-text`              | `pdftotext` (poppler)         |
| JPEG, PNG, GIF, WebP | `ocr-image`             | `tesseract` (por+eng)         |
| Texto simples        | `plain-text`            | código puro                   |
| RTF                  | `rtf`                   | código puro                   |
| DOCX / ODT           | `ooxml`, `opendocument` | `bsdtar` + transformação pura |

**Áudio e vídeo não são transcritos.** Os registros recebem `NO_ADAPTER` com motivo
`AUDIO_NOT_TRANSCRIBED` ou `VIDEO_NOT_TRANSCRIBED`. Três razões, nesta ordem:

- não existe transcritor local determinístico aceitável — ASR neural não reproduz saída byte
  a byte, e o hash do derivado deixaria de valer como prova de integridade;
- o plano proíbe modelo externo na camada de busca local (T16);
- transcrever ponto cantado é decisão cultural sobre material sagrado, e essa decisão não foi
  tomada por ninguém com autoridade para tomá-la. A ausência é declarada, não suprida.

`.doc` legado (OLE2) também fica `UNSUPPORTED_FORMAT`: as ferramentas disponíveis são
abandonadas e não vale ampliar a superfície do container por um arquivo.

A cobertura reportada é sobre **todas** as linhas do censo, não sobre as tentadas. Um número
baixo aqui é a verdade sobre um acervo majoritariamente sonoro, não uma falha.

### Isolamento do container

`compose.ingest.yml` é um projeto Compose separado — sem banco, sem Redis, sem segredo, sem
rede:

- `network_mode: "none"` — não existe interface dentro do container. Um bug de parser não tem
  para onde mandar o que leu.
- `read_only: true`, `user: "1000:1000"`, `cap_drop: [ALL]`, `no-new-privileges:true`.
- `cpus`, `mem_limit`, `memswap_limit` e `pids_limit` limitados; `/tmp` é tmpfs com
  `noexec,nosuid,nodev`.
- O acervo é montado `:ro`. Os únicos destinos graváveis são o volume de derivados e `/work`.

**Desvio declarado — seccomp.** O plano pede um allowlist seccomp próprio. O container roda
sob o **perfil padrão do Docker**, que já é um allowlist (nega ~44 syscalls por
`SCMP_ACT_ERRNO`) e que não foi desabilitado. Um perfil escrito à mão com ~350 entradas
quebraria o Node de formas silenciosas e específicas de versão, e um allowlist errado é pior
que o padrão testado. Combinado com `network_mode: none` e `cap_drop: ALL`, a superfície
efetiva já exclui rede, mount, ptrace e escalonamento de privilégio. Se um perfil próprio for
exigido, ele deve ser derivado do perfil upstream do moby e validado rodando o acervo inteiro,
não escrito de memória.

### Limites do pipeline

Definidos em `src/domain/ceremonial/extraction.ts` e cobertos por teste:

- fonte acima de 512 MiB não chega a nenhum adaptador;
- saída acima de 32 MiB é **recusada** (`OUTPUT_TOO_LARGE`), nunca truncada — é assim que uma
  bomba de descompressão termina;
- 180 s de relógio por execução de adaptador; estourar é `ADAPTER_TIMEOUT`, sem resultado parcial;
- no `pdf-ocr`, onde há uma execução por página, vale também um teto de 1 h por documento e de
  400 páginas. São os dois necessários: sem o teto por documento, um livro longo ocuparia o
  container por um dia sem que nenhuma execução isolada estourasse.

Os limites do container ficam por fora dos limites do pipeline, então o processo bate no
limite lógico antes de bater no limite físico.

### Comandos

```bash
## 1. Gate de suprimentos: SBOM + Trivy fixado + política. Precisa de rede no host.
npm run ceremonial:scan

## 2. Censo, se ainda não existir um manifesto atual.
CEREMONIAL_ARCHIVE_ROOT=<acervo> \
  npm run ceremonial:inventory -- <dir-local>/inventory.json --baseline 801/737/64

## 3. Extração, dentro do container sem rede.
CEREMONIAL_ARCHIVE_HOST_PATH=<acervo> CEREMONIAL_WORK_HOST_PATH=<dir-local> \
  docker compose -f compose.ingest.yml run --rm ceremonial-ingest \
    /work/inventory.json /work/extraction.json \
    --sanitized /work/extraction-sanitized.json
```

Uma execução interrompida retoma pelo checkpoint `extraction.json.checkpoint.jsonl`. Apague o
checkpoint para forçar extração completa.

#### Custo de tempo — leia antes de disparar

Sem OCR de PDF, o acervo inteiro (801 arquivos) roda em poucos minutos: os 539 MP3 não são
abertos e a extração de camada de texto é rápida.

**Com o fallback `pdf-ocr`, a mesma execução leva horas.** Um livro escaneado de 58 MiB e ~220
páginas ocupa dezenas de minutos sozinho, porque cada página é renderizada a 300 dpi e
reconhecida individualmente. Medido no acervo real: 20 PDFs sem camada de texto, somando 1.044
páginas.

Duas consequências práticas:

- o checkpoint por linha não é conforto, é requisito — sem ele, qualquer interrupção custaria
  a corrida inteira;
- os 300 dpi são fixos de propósito. Baixar para 200 quase dobra a velocidade e muda o texto
  reconhecido, e o texto reconhecido é o que o hash do derivado promete. Mudar a resolução é
  mudar a identidade do adaptador, não afinar um parâmetro.

### Dois manifestos, um privado e um compartilhável

O manifesto completo tem uma linha por arquivo, e neste acervo **um caminho é o título de um
livro que alguém possui**. Ele não vai para o repositório.

`--sanitized` grava a visão compartilhável: versão do pipeline, fingerprint, contagens por
estado/adaptador/motivo, versões das ferramentas e total de páginas. Nenhum caminho, nenhum
hash. É essa visão que vai para `docs/IMPLEMENTATION_STATUS.md` (índice de evidências) e é essa que o comando imprime no
stdout.

### Importação da linhagem (Task 14)

Depois da extração, `npm run ceremonial:import` mapeia artefatos para
`obra → edição → artefato → locator`:

```bash
CEREMONIAL_ARCHIVE_ROOT=<acervo> DATABASE_URL=<banco> \
  npm run ceremonial:import -- <extraction.json> [--mappings <arquivo.json>] \
    [--apply] [--sanitized <saida.json>]
```

Sem `--apply` nada é gravado: o primeiro resultado útil é o tamanho da fila de revisão, e
vale ler esse número antes de tocar no banco.

**Um nome de arquivo é uma pista, nunca uma identidade.** Sem mapeamento, cada artefato abre
quatro itens de fila — título, autoria, edição e idioma — e permanece impublicável. Só um
`--mappings` escrito por pessoa, com nota de evidência, estabelece identidade. No acervo
real isso significa 1.201 itens abertos e zero resolvidos na primeira execução: é o estado
honesto de um corpus que ninguém catalogou.

Formato do arquivo de mapeamento:

```json
{
  "pipelineVersion": "ceremonial-import-1.0.0",
  "mappings": [
    {
      "contentHash": "<sha256 do artefato>",
      "sourceSystemSlug": "lemegeton",
      "workTitle": "Ars Goetia",
      "authorLabel": null,
      "editionLabel": "tradução Mathers 1904",
      "language": "en",
      "publishedYear": 1904,
      "evidenceNote": "conferido contra o exemplar impresso, folha de rosto e colofão"
    }
  ]
}
```

`editionLabel` é o testemunho, não a obra: compilação e texto-fonte são edições distintas,
e duas traduções são edições distintas da mesma obra. `authorLabel: null` é uma afirmação
positiva — a pessoa olhou e a obra é anônima.

Locators saem apenas do que a extração estabeleceu: uma posição `PAGE` por página. O
vocabulário de posições foi congelado pela Task 8 e a importação não o amplia; um artefato
sem páginas fica com `NO_LOCATOR_SCHEME` em vez de ganhar uma âncora falsa que nenhuma
citação poderia usar.

Reexecutar é idempotente e **nunca reabre um item já resolvido**: rodar um script de novo
não é evidência nova de que a pessoa errou.

### O que o site faz com isso

Nada diretamente. O texto extraído é **insumo de autoria**: alguém o lê, estuda e escreve a
síntese que o site publica. Não existe rota que entregue artefato-fonte, nem classificação de
direitos por artefato, nem fila bloqueando publicação — o modelo híbrido que exigia tudo isso
foi descartado (`docs/BLUEPRINT.md` §5.0).

O que o pipeline entrega é um corpus legível e endereçável por conteúdo, mais a linhagem que
diz de qual obra e edição cada trecho veio. Isso serve para nós: quando uma leitura do método
se mostra errada, sabemos o que reestudar.

### Política de vulnerabilidades

`infra/security/vulnerability-exceptions.json` declara as exceções vigentes. As regras estão
em código (`src/domain/ceremonial/vulnerability-policy.ts`), não em convenção:

- **Critical e High bloqueiam.** Não existe forma de exceção para elas.
- **Medium** só passa com exceção que nomeia responsável, descreve a remediação real e vence
  em no máximo 30 dias. Vencida, volta a bloquear.
- Exceção que não corresponde a nenhum achado é reportada como ruído a remover.

O relógio é injetado, então "a exceção venceu ontem" é fato testável e não depende de quando o
scan rodou.

## Inventário de dados

Este inventário descreve o código e o schema atuais. Ele não substitui política de privacidade,
registro de operações, avaliação jurídica ou definição de base legal.

### Dados de conta e sessão

| Grupo              | Campos persistidos                                      | Uso técnico                     | Retenção implementada                                            |
| ------------------ | ------------------------------------------------------- | ------------------------------- | ---------------------------------------------------------------- |
| Conta              | email normalizado, hash de senha, criação e confirmação | autenticação e ownership        | até exclusão integral da conta                                   |
| Sessão autenticada | hash de token, user ID, criação e expiração             | sessão opaca                    | worker remove sessões expiradas; logout revoga a sessão corrente |
| Sessão guest       | hash de token, criação e expiração                      | ownership temporário e claim    | worker remove sessões expiradas em cascata                       |
| Ação de conta      | finalidade, hash, criação, expiração e uso              | confirmar email/recuperar senha | worker remove tokens expirados; cascade com a conta              |

Tokens em claro existem somente no cookie de sessão ou no link de uso único entregue por email. O
banco conserva apenas hashes; logger, access log e métricas não conservam cookie, header, query ou
token. Links de confirmação expiram em 24 horas e links de recuperação em 30 minutos.

### Dados natais e conteúdo privado

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

### Dados editoriais

Fontes culturais, claims, verbetes, pareceres, templates de trânsito e perfis de contribuidores são
dados editoriais versionados. Um contribuidor pode estar vinculado a uma conta, mas autoria e
revisão possuem retenção histórica própria e `onDelete: Restrict`/`SetNull` conforme o vínculo. Essa
retenção precisa constar dos contratos com colaboradores antes de uso real.

### Dados transitórios e externos

- geocoding envia ao Nominatim somente a consulta necessária; identificação do cliente é definida
  por `NOMINATIM_USER_AGENT` e a boundary possui cache/timeout;
- Redis contém cache e rate limit, nunca é fonte autoritativa dos dados privados;
- Pino aplica redaction e registra IDs opacos, status, duração e categorias, não payloads;
- Prometheus recebe métricas HTTP agregadas; access logs descartam caminho, query, IP e headers;
- SMTP recebe somente o email destinatário e o conteúdo transacional necessário; homologação usa
  Mailpit local e produção continua bloqueada até contrato/credencial do relay;
- analytics, LLM e Stripe não recebem dados porque não existem integrações ativas.

### Lacunas antes de produção

- aprovar finalidade/base legal, prazos por categoria e política pública LGPD;
- definir atendimento, identidade do controlador, contato e prazo operacional para solicitações;
- definir expurgo de backups e validar exclusão após o período de retenção;
- revisar transferência internacional e subprocessadores antes de qualquer fornecedor externo;
- testar inventário e restauração no ambiente de destino com dados sintéticos;
- documentar retenção editorial e direitos de colaboradores em contrato.

## Desenho aprovado da borda Cloudflare

**Data:** 2026-08-26
**Zona:** `astroaxe.net` (`b1ede1dc5187528fc6597d6262f6c3ab`), plano Free, ativa
**Conta:** `36febb0027e351e5058a1d81a94438c7`
**Org Zero Trust:** `eosbot.cloudflareaccess.com`

### Contexto

A VPS de produção ainda não existe. Esta spec configura tudo que pode ser
provisionado antes da origem: zona DNS, TLS, WAF, cache, Zero Trust e postura de
e-mail. A topologia alvo permanece a de `docs/OPERATIONS.md`: Cloudflare Tunnel
alcançando um Traefik privado, sem portas publicadas no host.

Estado inicial da zona: nenhum registro DNS, nenhum Tunnel, e todas as
configurações no default de fábrica — incluindo `min_tls_version=1.0`,
`always_use_https=off`, HSTS desabilitado, `ssl=full` e WAF gerenciado desligado.

### Decisões

| Decisão           | Escolha                         | Motivo                                                     |
| ----------------- | ------------------------------- | ---------------------------------------------------------- |
| Hostname canônico | `astroaxe.net` (apex)           | `www` redireciona 301                                      |
| Plano             | Free                            | cobre lançamento; Pro fica para quando houver tráfego real |
| Origem            | Cloudflare Tunnel               | nenhum IP de origem existe para ser exposto                |
| HSTS              | faseado, desligado no dia 1     | evita travar o domínio antes da origem responder           |
| E-mail            | domínio declarado não-remetente | não há relay nem endereço de contato ainda                 |

### Arquitetura DNS

Dois Tunnels gerenciados remotamente (`config_src: cloudflare`), um por ambiente,
para isolar o raio de alcance de cada token.

| Nome           | Tipo  | Conteúdo                        | Proxy |
| -------------- | ----- | ------------------------------- | ----- |
| `astroaxe.net` | CNAME | `<id-prod>.cfargotunnel.com`    | sim   |
| `www`          | CNAME | `astroaxe.net`                  | sim   |
| `staging`      | CNAME | `<id-staging>.cfargotunnel.com` | sim   |

Nenhum registro `A` e nenhum wildcard. O break-glass é o próprio Tunnel; não
existe origem pública permanente contornando a Cloudflare.

#### CAA

Restringe globalmente quais autoridades podem emitir certificado para o domínio.
`letsencrypt.org` e `pki.goog` cobrem o Universal SSL da Cloudflare.

#### Postura de e-mail (domínio não-remetente)

| Nome                           | Tipo | Conteúdo                            |
| ------------------------------ | ---- | ----------------------------------- |
| `astroaxe.net`                 | MX   | `0 .` (null MX, RFC 7505)           |
| `astroaxe.net`                 | TXT  | `v=spf1 -all`                       |
| `_dmarc`                       | TXT  | `v=DMARC1; p=reject; fo=1; pct=100` |
| `_dmarc.www`, `_dmarc.staging` | TXT  | `v=DMARC1; p=reject`                |

Transição futura, quando houver relay e endereço de contato: publicar o DKIM
vindo do painel do provedor, trocar o SPF para incluir o mecanismo do relay,
recuar o DMARC para `p=none` com `rua`, observar alinhamento e só então avançar
para `quarantine` e `reject`. Valores de DKIM nunca saem deste repositório: vêm
da conta real do provedor.

### TLS

| Ajuste                     | Valor                                                   |
| -------------------------- | ------------------------------------------------------- |
| `ssl`                      | `strict`                                                |
| `min_tls_version`          | `1.2`                                                   |
| `tls_1_3`                  | `on`                                                    |
| `always_use_https`         | `on`                                                    |
| `automatic_https_rewrites` | `on`                                                    |
| `0rtt`                     | `off` (risco de replay em requisições não idempotentes) |

HSTS permanece desligado até a origem responder. Sequência de ativação:
`max_age=86400` sem `includeSubDomains` → observar uma semana →
`max_age=31536000` com `includeSubDomains` → considerar preload.

### WAF, bots e rate limiting

Limites do plano Free: cinco regras custom e uma regra de rate limiting.

- Managed Free Ruleset ativado.
- Bot Fight Mode ativado (não afeta bots verificados).

| #   | Condição                                                                              | Ação              |
| --- | ------------------------------------------------------------------------------------- | ----------------- |
| 1   | Paths de scanner (`/wp-*`, `/xmlrpc.php`, `.env`, `.git/`, `/vendor/`, `/phpmyadmin`) | Block             |
| 2   | `/api/health/*` vindo da internet                                                     | Block             |
| 3   | `POST` em rotas de autenticação com bot score baixo                                   | Managed Challenge |
| 4   | Métodos `TRACE` e `TRACK`                                                             | Block             |

O quinto slot fica reservado para resposta a incidente.

Rate limiting: `/api/auth/*`, 15 requisições por 10s por IP, bloqueio de 60s.
Protege login, registro e reset de senha contra força bruta e enumeração.

### Cache

Sem cache, obrigatoriamente: `/api/*`, `/conta*`, `/entrar`, `/recuperar-senha`,
`/redefinir-senha`, `/verificar-email`. Nenhuma resposta com cookie de sessão ou
dado natal pode ser servida do edge.

Cache agressivo: `/_next/static/*`, que já é imutável por hash.

### Zero Trust Access

`staging.astroaxe.net` inteiro atrás do Access, autenticação por One-time PIN,
sessão de 24h, allowlist explícita de e-mails. A requisição não autenticada é
encerrada na borda e nunca alcança o Tunnel.

`/api/editorial/*` fica fora do Access: é uma API sem interface, consumida
programaticamente, e o Access quebraria seus clientes. A autorização permanece na
aplicação. Um service token pode ser adicionado depois, se necessário.

### Fora de escopo

`next.config.ts` aplica headers de segurança, mas não emite
`Content-Security-Policy` nas páginas HTML — a CSP restritiva existente em
`src/lib/security/headers.ts` cobre apenas respostas de API. CSP de página é
decisão de aplicação: uma política genérica aplicada na borda quebraria o Next.
Fica registrado como trabalho separado.

### Riscos aceitos

1. Com os CNAMEs publicados e sem `cloudflared` conectado, o domínio responde
   erro 1033 até a VPS existir. O domínio não está divulgado, então o impacto é
   nulo.
2. O token da integração Cloudflare tem escopo reduzido: a leitura de
   `/subscriptions` retorna erro de autenticação. Qualquer permissão faltante
   para Tunnel ou Zero Trust é reportada, não contornada.

### Desvios verificados na implementação

Registrados após verificar a configuração contra a borda real, no mesmo dia. O runbook
`docs/OPERATIONS.md` é a referência autoritativa; esta seção preserva o que mudou em relação
ao desenho aprovado acima e por quê.

**CAA é menos restritivo do que este desenho afirmava.** A zona contém exatamente os três registros
projetados, mas a Cloudflare sintetiza, na resolução, registros CAA adicionais para as CAs que ela
própria usa — `comodoca.com`, `digicert.com` e `ssl.com` — inclusive `issuewild`. O `issuewild ";"`
publicado fica neutralizado e o comportamento não é configurável no plano Free. O ganho real
permanece, porque sem CAA qualquer CA do mundo pode emitir para o domínio, mas a restrição não é o
par `letsencrypt.org` + `pki.goog` que a seção de arquitetura descreve.

**A regra WAF de `TRACE`/`TRACK` era inerte e foi substituída.** A Cloudflare recusa esses métodos
na borda com `405`, antes de o WAF ser avaliado, então a regra nunca disparava e ocupava um dos
cinco slots do plano Free. O slot foi realocado para exigir Managed Challenge em `/api/geocoding`
quando o user agent não é de navegador. Essa rota faz proxy para o Nominatim usando o user agent do
projeto: o abuso dela não gera custo interno, gera bloqueio da nossa reputação junto a um terceiro,
que é mais lento de reverter. O front chama a rota por `fetch` do navegador e não é afetado.

**Rate limiting no plano Free exige `mitigation_timeout` igual ao período.** O desenho previa
bloqueio de 60s sobre janela de 10s; a API recusou. O valor efetivo é 10s.

**Página de espera.** Não estava no desenho original. Um Worker responde `503` com `noindex` no apex
enquanto a VPS não existe, evitando erro 1033 e impedindo que a placeholder seja indexada como
conteúdo real do domínio. Sai do ar apagando a rota, sem tocar em DNS.

**Resultado da verificação.** TLS 1.1 recusado e 1.2 aceito; `403` em `/.env`, `/wp-login.php`,
`/phpmyadmin/` e `/api/health/live`; rate limiting liberando 15 requisições e bloqueando a partir da
16ª; Access redirecionando `staging.astroaxe.net` para login antes da origem; `www` redirecionando
301 para o apex; SPF, DMARC e null MX publicados; e os dois tokens de Tunnel autenticando e
registrando conexões de borda.
