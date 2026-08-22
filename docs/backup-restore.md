# Backup e restauração do PostgreSQL

Este runbook cria backups lógicos no formato custom do PostgreSQL e comprova cada artefato por
restauração em um banco temporário isolado. Um arquivo que nunca foi restaurado não é considerado
backup válido.

## Objetivos operacionais

- RPO inicial: 24 horas, com backup diário antes da janela de menor movimento.
- RTO inicial: 2 horas para provisionar PostgreSQL compatível, restaurar, validar e redirecionar a
  aplicação.
- Retenção inicial: 7 backups diários, 4 semanais e 6 mensais, sujeita à política LGPD definitiva.
- Backups devem permanecer criptografados fora do host do banco e ter acesso auditável. A pasta
  local `backups/` é ignorada pelo Git e serve somente para operação/teste local.

RPO, RTO e retenção são metas iniciais, não garantias observadas em produção. Revise-as após medir
volume, duração, custo e criticidade reais.

## Criar e verificar

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

## Recuperação de incidente

1. Declare o incidente, congele migrations e preserve logs sanitizados.
2. Escolha PostgreSQL 18 com pgvector compatível e confirme espaço livre.
3. Verifique o SHA-256 e restaure primeiro em banco isolado.
4. Confirme `vector`, `_prisma_migrations`, tabelas críticas e contagens esperadas.
5. Execute healthchecks e smoke tests contra a restauração antes de trocar tráfego.
6. Registre instante do backup, perda efetiva, duração, validações e decisão de retorno.
7. Prefira roll-forward. Descarte o banco anterior somente após retenção e autorização explícitas.

Nunca use `down -v`, apague o banco de origem ou restaure por cima dele como procedimento de teste.

## Volume legado PostgreSQL 16

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

### Roll-forward local autorizado em 2026-08-21

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
