# Borda Cloudflare — `astroaxe.net`

Este runbook registra a camada pública de produção: zona DNS, TLS, WAF, cache,
Zero Trust e postura de e-mail. O runtime correspondente está em
`docs/swarm-runbook.md`; os gates de release, em `docs/deployment-runbook.md`.

A configuração foi aplicada em 2026-08-26, antes de qualquer VPS existir. Até o
`cloudflared` conectar, o domínio responde erro 1033 — comportamento esperado.

| Item              | Valor                                               |
| ----------------- | --------------------------------------------------- |
| Zona              | `astroaxe.net` — `b1ede1dc5187528fc6597d6262f6c3ab` |
| Conta             | `36febb0027e351e5058a1d81a94438c7`                  |
| Plano             | Free                                                |
| Hostname canônico | `astroaxe.net` (apex); `www` redireciona 301        |
| Org Zero Trust    | `eosbot.cloudflareaccess.com`                       |

## Princípio de origem

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
Swarm como `astroaxe_cloudflare_tunnel_v1`, conforme `docs/swarm-runbook.md`.

## Registros DNS

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

## TLS

| Ajuste                     | Valor    | Razão                                                |
| -------------------------- | -------- | ---------------------------------------------------- |
| `ssl`                      | `strict` | valida o certificado da origem                       |
| `min_tls_version`          | `1.2`    | TLS 1.0 e 1.1 recusados                              |
| `tls_1_3`                  | `on`     | —                                                    |
| `always_use_https`         | `on`     | —                                                    |
| `automatic_https_rewrites` | `on`     | —                                                    |
| `0rtt`                     | `off`    | 0-RTT permite replay de requisições não idempotentes |

### HSTS permanece desligado — e isso é deliberado

Habilitar HSTS antes de a origem responder em HTTPS grava, no navegador de cada
visitante, uma instrução de longa duração que não pode ser revogada remotamente.
A ativação é faseada e só começa depois do primeiro deploy bem-sucedido:

1. origem no ar e HTTPS confirmado;
2. `max_age=86400`, sem `includeSubDomains`, sem preload;
3. observar uma semana, incluindo `staging` e qualquer subdomínio de e-mail;
4. `max_age=31536000` com `includeSubDomains`;
5. preload somente depois disso, e sabendo que a remoção da lista é lenta.

## WAF, bots e rate limiting

O plano Free permite cinco regras WAF custom e uma regra de rate limiting.

- **Managed Free Ruleset** — ativado (estava desligado por padrão).
- **DDoS L7** — gerenciado pela Cloudflare, sempre ativo.
- **Bot Fight Mode** e **JS detections** — ativados.
- **Bloqueio de crawlers de treino de IA** (`ai_bots_protection: block`) —
  ativado por causa do acervo cultural. `crawler_protection` permanece desligado:
  bloquearia buscadores legítimos e inutilizaria o sitemap.

### Regras custom

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

### Rate limiting

Regra única do plano, gasta onde o risco é maior: `/api/auth/*`, 15 requisições
por 10 segundos por IP e colo, bloqueio por 10 segundos. Cobre login, registro,
troca de senha, reset e verificação de e-mail contra força bruta e enumeração de
contas. O Free exige `mitigation_timeout` igual ao período.

## Cache

Nenhuma resposta autenticada pode ser servida do edge.

| Regra | Escopo                                                                                     | Efeito                                    |
| ----- | ------------------------------------------------------------------------------------------ | ----------------------------------------- |
| 1     | `/api/*`, `/conta*`, `/entrar`, `/recuperar-senha`, `/redefinir-senha`, `/verificar-email` | cache desabilitado                        |
| 2     | `/_next/static/*`                                                                          | cache com TTL de um ano, edge e navegador |

A regra 1 cumpre a exigência do runbook de Swarm: APIs autenticadas, conta,
diário, exports e qualquer resposta com cookie permanecem fora do cache. A regra
2 é segura porque os assets do Next já são imutáveis por hash no nome.

## Zero Trust Access

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

## Postura de e-mail

O domínio hoje **não envia nem recebe e-mail**, e isso está declarado
explicitamente no DNS em vez de ficar omisso:

- `MX 0 .` — null MX, conforme RFC 7505: nenhum servidor aceita mensagem;
- `v=spf1 -all` — nenhum remetente está autorizado;
- `DMARC p=reject` no apex e nos subdomínios que não enviam.

Um domínio sem esses registros é um alvo fácil de spoofing. Esta é a postura mais
restritiva possível e deve ser mantida até existir relay contratado.

### Transição para envio transacional

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

## Página de espera na borda

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

### Direção visual

Os tokens vêm de `docs/design-references.md` e a marca é idêntica a
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

### Privacidade do readout

O readout usa apenas o que a Cloudflare já anexa à requisição — cidade, país, fuso e colo — e
devolve esses valores ao próprio visitante que os originou. Nada é registrado, armazenado, agregado
ou enviado a terceiro. A política de resposta é `default-src 'none'`, sem qualquer origem externa.

### Remoção no go-live

Quando o `cloudflared` estiver conectado, apague a rota. Nenhum registro DNS muda, e o tráfego passa
a alcançar o Tunnel na requisição seguinte.

```
DELETE /zones/b1ede1dc5187528fc6597d6262f6c3ab/workers/routes/cd79257c55d24c389bec6fb3f7ae6df8
```

Mantenha o Worker publicado: ele volta a ser útil em qualquer janela de manutenção planejada.

## Fora de escopo

`next.config.ts` aplica bons headers de resposta, mas não emite
`Content-Security-Policy` nas páginas HTML; a CSP restritiva de
`src/lib/security/headers.ts` cobre apenas respostas de API. CSP de página é
decisão de aplicação — uma política genérica aplicada na borda quebraria o Next.
Fica registrado como trabalho separado.

## Verificação após o primeiro deploy

```bash
# TLS e redirect
curl -sI http://astroaxe.net | grep -i location
curl -sI https://www.astroaxe.net | grep -i location
curl -sI https://astroaxe.net | head -1

# TLS 1.1 deve falhar; 1.2 deve funcionar
curl -sI --tlsv1.1 --tls-max 1.1 https://astroaxe.net || echo "TLS 1.1 recusado, correto"

# Página de espera, enquanto a rota do Worker existir
curl -sI https://astroaxe.net | head -1                   # 503
curl -s https://astroaxe.net/robots.txt                   # Disallow: /

# Regras WAF
curl -sI https://astroaxe.net/.env | head -1              # 403
curl -sI https://astroaxe.net/api/health/live | head -1   # 403
curl -sI -X TRACE https://astroaxe.net | head -1          # 405, recusado pela borda
curl -sI -A curl/8 "https://astroaxe.net/api/geocoding?q=x" | head -1  # 403, desafio

# Cache
curl -sI https://astroaxe.net/api/auth/status | grep -i cf-cache-status   # BYPASS/DYNAMIC

# E-mail
dig +short TXT astroaxe.net
dig +short TXT _dmarc.astroaxe.net
dig +short MX astroaxe.net
dig +short CAA astroaxe.net
```
