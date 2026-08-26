# Camada de borda Cloudflare — `astroaxe.net`

**Data:** 2026-08-26
**Zona:** `astroaxe.net` (`b1ede1dc5187528fc6597d6262f6c3ab`), plano Free, ativa
**Conta:** `36febb0027e351e5058a1d81a94438c7`
**Org Zero Trust:** `eosbot.cloudflareaccess.com`

## Contexto

A VPS de produção ainda não existe. Esta spec configura tudo que pode ser
provisionado antes da origem: zona DNS, TLS, WAF, cache, Zero Trust e postura de
e-mail. A topologia alvo permanece a de `docs/swarm-runbook.md`: Cloudflare Tunnel
alcançando um Traefik privado, sem portas publicadas no host.

Estado inicial da zona: nenhum registro DNS, nenhum Tunnel, e todas as
configurações no default de fábrica — incluindo `min_tls_version=1.0`,
`always_use_https=off`, HSTS desabilitado, `ssl=full` e WAF gerenciado desligado.

## Decisões

| Decisão | Escolha | Motivo |
| --- | --- | --- |
| Hostname canônico | `astroaxe.net` (apex) | `www` redireciona 301 |
| Plano | Free | cobre lançamento; Pro fica para quando houver tráfego real |
| Origem | Cloudflare Tunnel | nenhum IP de origem existe para ser exposto |
| HSTS | faseado, desligado no dia 1 | evita travar o domínio antes da origem responder |
| E-mail | domínio declarado não-remetente | não há relay nem endereço de contato ainda |

## Arquitetura DNS

Dois Tunnels gerenciados remotamente (`config_src: cloudflare`), um por ambiente,
para isolar o raio de alcance de cada token.

| Nome | Tipo | Conteúdo | Proxy |
| --- | --- | --- | --- |
| `astroaxe.net` | CNAME | `<id-prod>.cfargotunnel.com` | sim |
| `www` | CNAME | `astroaxe.net` | sim |
| `staging` | CNAME | `<id-staging>.cfargotunnel.com` | sim |

Nenhum registro `A` e nenhum wildcard. O break-glass é o próprio Tunnel; não
existe origem pública permanente contornando a Cloudflare.

### CAA

Restringe globalmente quais autoridades podem emitir certificado para o domínio.
`letsencrypt.org` e `pki.goog` cobrem o Universal SSL da Cloudflare.

### Postura de e-mail (domínio não-remetente)

| Nome | Tipo | Conteúdo |
| --- | --- | --- |
| `astroaxe.net` | MX | `0 .` (null MX, RFC 7505) |
| `astroaxe.net` | TXT | `v=spf1 -all` |
| `_dmarc` | TXT | `v=DMARC1; p=reject; fo=1; pct=100` |
| `_dmarc.www`, `_dmarc.staging` | TXT | `v=DMARC1; p=reject` |

Transição futura, quando houver relay e endereço de contato: publicar o DKIM
vindo do painel do provedor, trocar o SPF para incluir o mecanismo do relay,
recuar o DMARC para `p=none` com `rua`, observar alinhamento e só então avançar
para `quarantine` e `reject`. Valores de DKIM nunca saem deste repositório: vêm
da conta real do provedor.

## TLS

| Ajuste | Valor |
| --- | --- |
| `ssl` | `strict` |
| `min_tls_version` | `1.2` |
| `tls_1_3` | `on` |
| `always_use_https` | `on` |
| `automatic_https_rewrites` | `on` |
| `0rtt` | `off` (risco de replay em requisições não idempotentes) |

HSTS permanece desligado até a origem responder. Sequência de ativação:
`max_age=86400` sem `includeSubDomains` → observar uma semana →
`max_age=31536000` com `includeSubDomains` → considerar preload.

## WAF, bots e rate limiting

Limites do plano Free: cinco regras custom e uma regra de rate limiting.

- Managed Free Ruleset ativado.
- Bot Fight Mode ativado (não afeta bots verificados).

| # | Condição | Ação |
| --- | --- | --- |
| 1 | Paths de scanner (`/wp-*`, `/xmlrpc.php`, `.env`, `.git/`, `/vendor/`, `/phpmyadmin`) | Block |
| 2 | `/api/health/*` vindo da internet | Block |
| 3 | `POST` em rotas de autenticação com bot score baixo | Managed Challenge |
| 4 | Métodos `TRACE` e `TRACK` | Block |

O quinto slot fica reservado para resposta a incidente.

Rate limiting: `/api/auth/*`, 15 requisições por 10s por IP, bloqueio de 60s.
Protege login, registro e reset de senha contra força bruta e enumeração.

## Cache

Sem cache, obrigatoriamente: `/api/*`, `/conta*`, `/entrar`, `/recuperar-senha`,
`/redefinir-senha`, `/verificar-email`. Nenhuma resposta com cookie de sessão ou
dado natal pode ser servida do edge.

Cache agressivo: `/_next/static/*`, que já é imutável por hash.

## Zero Trust Access

`staging.astroaxe.net` inteiro atrás do Access, autenticação por One-time PIN,
sessão de 24h, allowlist explícita de e-mails. A requisição não autenticada é
encerrada na borda e nunca alcança o Tunnel.

`/api/editorial/*` fica fora do Access: é uma API sem interface, consumida
programaticamente, e o Access quebraria seus clientes. A autorização permanece na
aplicação. Um service token pode ser adicionado depois, se necessário.

## Fora de escopo

`next.config.ts` aplica headers de segurança, mas não emite
`Content-Security-Policy` nas páginas HTML — a CSP restritiva existente em
`src/lib/security/headers.ts` cobre apenas respostas de API. CSP de página é
decisão de aplicação: uma política genérica aplicada na borda quebraria o Next.
Fica registrado como trabalho separado.

## Riscos aceitos

1. Com os CNAMEs publicados e sem `cloudflared` conectado, o domínio responde
   erro 1033 até a VPS existir. O domínio não está divulgado, então o impacto é
   nulo.
2. O token da integração Cloudflare tem escopo reduzido: a leitura de
   `/subscriptions` retorna erro de autenticação. Qualquer permissão faltante
   para Tunnel ou Zero Trust é reportada, não contornada.
