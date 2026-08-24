# Release containerizado, validação e retorno

Há dois contratos de deploy: homologação local por Docker Compose e produção por Docker Swarm nas
VPS Contabo atrás da Cloudflare. A topologia, comandos e secrets de Swarm estão em
`docs/swarm-runbook.md`. Este documento conserva os gates compartilhados de release e retorno.

Antes de promover produção, a mesma release deve passar na homologação local:

```bash
npm run homolog:up
npm run homolog:smoke
```

Mailpit captura todos os emails de homologação. Nenhuma credencial Cloudflare, Brevo ou de produção
é usada localmente.

O contrato da outbox, retries, configuração SMTP e autenticação do domínio está em
`docs/transactional-email.md`.

Este runbook não pressupõe Vercel nem um provedor específico. O artefato autoritativo é a imagem
construída pelo `Dockerfile`; PostgreSQL, Redis, app, worker, migrations e Traefik são operados por
Compose ou por uma plataforma compatível com containers.

## Pré-condições

- domínio, TLS e ambiente de destino definidos;
- segredos independentes entregues pelo secret manager, nunca copiados para a imagem;
- PostgreSQL 18 com pgvector e Redis 8 acessíveis somente pelas redes internas;
- backup recente restaurado com sucesso em banco isolado;
- imagens identificadas por digest imutável no ambiente de destino;
- retenção de logs, métricas e backups aprovada antes de conectar coletores externos.

## Staging

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

## Produção

Promova exatamente os digests validados em staging. Aplique migrations compatíveis antes de trocar
tráfego e mantenha a versão anterior disponível durante a janela de observação. Confirme `live`,
`ready`, home, metodologia, robots, sitemap, `noindex` da conta e headers pelo smoke automatizado.

Registre somente versão, digest, migrations, horários, responsáveis operacionais, resultados
agregados e decisão. Não registre URLs com credenciais, cookies, tokens, email, nascimento,
localização ou corpo de requisição.

## Falha e roll-forward

1. Pare a promoção e preserve logs sanitizados.
2. Se a migration ainda não começou, mantenha a versão anterior.
3. Se migrations compatíveis já foram aplicadas, prefira corrigir e promover uma nova imagem.
4. Só retorne à imagem anterior quando o schema continuar compatível e o smoke confirmar a versão.
5. Restauração de banco ocorre em instância isolada conforme `docs/backup-restore.md`; nunca restaure
   por cima da origem durante diagnóstico.
6. Não use `down -v`, prune ou remoção de volumes como procedimento de rollback.

O primeiro deploy só pode ser declarado concluído depois de observado no destino real. Sem domínio,
TLS, infraestrutura e política operacional definidos, este documento é preparação verificável, não
evidência de produção.
