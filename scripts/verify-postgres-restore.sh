#!/bin/sh
set -eu

backup_path="${1:-}"
project_name="${ASTROAXE_COMPOSE_PROJECT:-astroaxe}"

if [ -z "$backup_path" ] || [ ! -f "$backup_path" ]; then
  echo "Uso: ASTROAXE_COMPOSE_PROJECT=<projeto> $0 <backup.dump>" >&2
  exit 1
fi
case "$project_name" in
  *[!A-Za-z0-9_.-]* | "")
    echo "ASTROAXE_COMPOSE_PROJECT inválido." >&2
    exit 1
    ;;
esac

if [ -f "$backup_path.sha256" ]; then
  (cd "$(dirname "$backup_path")" && sha256sum --check "$(basename "$backup_path").sha256")
fi

restore_database="astroaxe_restore_$(date -u +%Y%m%d%H%M%S)_$$"
case "$restore_database" in
  astroaxe_restore_[0-9]*) ;;
  *)
    echo "Nome do banco temporário inválido." >&2
    exit 1
    ;;
esac

drop_restore_database() {
  docker compose --project-name "$project_name" exec -T -e RESTORE_DATABASE="$restore_database" \
    postgres sh -c 'dropdb --if-exists --force --username "$POSTGRES_USER" "$RESTORE_DATABASE"' \
    >/dev/null 2>&1 || true
}
trap drop_restore_database EXIT HUP INT TERM

docker compose --project-name "$project_name" exec -T -e RESTORE_DATABASE="$restore_database" \
  postgres sh -c 'createdb --username "$POSTGRES_USER" "$RESTORE_DATABASE"'

docker compose --project-name "$project_name" exec -T -e RESTORE_DATABASE="$restore_database" \
  postgres sh -c \
  'exec pg_restore --dbname "$RESTORE_DATABASE" --username "$POSTGRES_USER" --exit-on-error --no-owner --no-privileges' \
  <"$backup_path"

extension_count=$(docker compose --project-name "$project_name" exec -T \
  -e RESTORE_DATABASE="$restore_database" postgres sh -c \
  'psql --username "$POSTGRES_USER" --dbname "$RESTORE_DATABASE" --tuples-only --no-align --command "SELECT count(*) FROM pg_extension WHERE extname = '\''vector'\''"')
migration_state=$(docker compose --project-name "$project_name" exec -T \
  -e RESTORE_DATABASE="$restore_database" postgres sh -c \
  'psql --username "$POSTGRES_USER" --dbname "$RESTORE_DATABASE" --tuples-only --no-align --command "SELECT count(*) || '\''|'\'' || count(*) FILTER (WHERE finished_at IS NULL OR rolled_back_at IS NOT NULL) FROM _prisma_migrations"')

case "$extension_count" in
  1) ;;
  *)
    echo "A extensão pgvector não foi restaurada corretamente." >&2
    exit 1
    ;;
esac
migration_total=${migration_state%%|*}
migration_invalid=${migration_state#*|}
case "$migration_total" in
  "" | *[!0-9]*)
    echo "O histórico de migrations restaurado é inválido." >&2
    exit 1
    ;;
  *) ;;
esac
if [ "$migration_total" = "0" ] || [ "$migration_invalid" != "0" ]; then
  echo "O histórico de migrations restaurado está vazio." >&2
  exit 1
fi

printf 'Restore verificado em banco temporário: pgvector presente; migrations íntegras.\n'
