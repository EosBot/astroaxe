# Performance e observabilidade da stack Docker

## Contrato

A medição usa a entrada HTTP do Traefik. PostgreSQL e Redis continuam sem portas públicas. O smoke
não cria conta, não consulta geocoding e não envia email, data natal, localização, cookie ou token.

Com a stack principal saudável:

```bash
npm run test:performance
```

Para outra porta ou volume:

```bash
PERFORMANCE_BASE_URL=http://127.0.0.1:3100 \
PERFORMANCE_REQUESTS=200 PERFORMANCE_CONCURRENCY=20 PERFORMANCE_MAX_P95_MS=750 \
npm run test:performance
```

O comando falha se houver resposta diferente de HTTP 200 ou se o p95 ultrapassar o limite. O
resultado é um smoke local, não uma capacidade prometida de produção. Testes de carga maiores devem
usar uma stack isolada, dados sintéticos e limites definidos a partir do ambiente de destino.

## Diagnóstico operacional

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

## Prometheus local em containers

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
