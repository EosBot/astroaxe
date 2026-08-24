# Docker Swarm — arquitetura e operação

Este runbook registra a migração incremental do runtime de produção para Docker Swarm. O Compose
atual continua autoritativo para desenvolvimento e E2E; produção usará imagens previamente
construídas, publicadas em registry e identificadas por tag imutável ou digest.

## Dois contratos de deploy

O projeto possui exatamente dois destinos de deploy, além do ambiente de desenvolvimento:

| Destino     | Execução                     | Entrada            | Dados                        | Email                       | Cloudflare |
| ----------- | ---------------------------- | ------------------ | ---------------------------- | --------------------------- | ---------- |
| Homologação | Docker Compose local         | `127.0.0.1:3200`   | volumes locais isolados      | Mailpit em `127.0.0.1:8025` | não        |
| Produção    | Docker Swarm nas VPS Contabo | domínio HTTPS real | PostgreSQL/Redis gerenciados | relay interno para Brevo    | sim        |

Homologação não é um terceiro ambiente remoto e não usa credenciais de produção. O E2E automatizado
em `127.0.0.1:3100` continua sendo uma stack efêmera separada, executada e desmontada pelo próprio
script de testes.

### Homologação local

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

## Topologia aprovada

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

## Rede e firewall dos nós

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

## Imagens e registry

`docker stack deploy` não realiza build. CI deve construir os targets `app-runner`, `worker-runner`
e `migrate-runner` do mesmo commit, gerar SBOM, verificar vulnerabilidades/licenças, publicar no
registry e resolver cada referência para digest `sha256`. Traefik, cloudflared e socket proxy também
entram por digest completo; `latest` e tags mutáveis falham no preflight.

O registry pode ser Docker Hub privado, GitHub Container Registry ou outro OCI compatível. Conceda
ao deploy somente leitura e ao pipeline de build somente escrita no namespace AstroAxe. Habilite MFA,
retenção e revogação. Não execute registry de produção improvisado dentro do mesmo Swarm sem backup,
TLS, autenticação e disponibilidade próprios.

## Secrets da aplicação

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

## Cloudflare

Crie um Tunnel gerenciado e configure o hostname público para o serviço interno
`http://traefik:8080`. O token fica em `astroaxe_cloudflare_tunnel_v1`; ele não entra em arquivo de
ambiente, log ou comando persistido. Use duas réplicas de `cloudflared`, `--no-autoupdate` e imagem
fixada, de modo que atualização seja decisão de deploy e não mutação dentro do container.

Na zona pública, habilite TLS estrito, WAF gerenciado, rate limiting compatível com as rotas e cache
somente para superfícies públicas explicitamente revisadas. APIs autenticadas, conta, diário,
exports e respostas com cookie permanecem sem cache. Mantenha procedimento break-glass por VPN/IP
restrito; não deixe uma origem pública permanente contornando a Cloudflare.

## Preflight e deploy

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

## Estado da implementação

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
