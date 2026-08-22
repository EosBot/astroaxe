#!/bin/sh
set -eu

project_name="${ASTROAXE_COMPOSE_PROJECT:-astroaxe}"
backup_dir="${1:-backups}"

case "$project_name" in
  *[!A-Za-z0-9_.-]* | "")
    echo "ASTROAXE_COMPOSE_PROJECT inválido." >&2
    exit 1
    ;;
esac

umask 077
mkdir -p "$backup_dir"
timestamp=$(date -u +%Y%m%dT%H%M%SZ)
backup_path="$backup_dir/astroaxe-$timestamp.dump"
temporary_path=$(mktemp "$backup_path.tmp.XXXXXX")

cleanup() {
  rm -f "$temporary_path"
}
trap cleanup EXIT HUP INT TERM

docker compose --project-name "$project_name" exec -T postgres sh -c \
  'exec pg_dump --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" --format=custom --compress=9 --no-owner --no-privileges' \
  >"$temporary_path"

if [ ! -s "$temporary_path" ]; then
  echo "O PostgreSQL produziu um backup vazio." >&2
  exit 1
fi

mv "$temporary_path" "$backup_path"
(cd "$backup_dir" && sha256sum "$(basename "$backup_path")") >"$backup_path.sha256"
trap - EXIT HUP INT TERM

printf 'Backup criado: %s\nChecksum: %s\n' "$backup_path" "$backup_path.sha256"
