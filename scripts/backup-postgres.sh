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

# Retenção: apaga backups mais velhos que a janela declarada, junto com o
# respectivo checksum. O padrão é 30 dias, que é a janela que a task 35 declara.
#
# O filtro é deliberadamente estreito — só arquivos que este script nomeia, no
# diretório de backup, e nada mais. Uma varredura ampla aqui apagaria o que não
# devia num diretório que alguém tenha apontado por engano.
retention_days="${ASTROAXE_BACKUP_RETENTION_DAYS:-30}"
case "$retention_days" in
  ''|*[!0-9]*)
    echo "ASTROAXE_BACKUP_RETENTION_DAYS deve ser um número de dias." >&2
    exit 1
    ;;
esac

removed=0
if [ "$retention_days" -gt 0 ]; then
  for expired in $(find "$backup_dir" -maxdepth 1 -type f -name 'astroaxe-*.dump' -mtime "+$retention_days" 2>/dev/null); do
    rm -f "$expired" "$expired.sha256"
    removed=$((removed + 1))
  done
fi

printf 'Backup criado: %s\nChecksum: %s\n' "$backup_path" "$backup_path.sha256"
printf 'Retenção: %s dia(s); %s backup(s) expirado(s) removido(s).\n' "$retention_days" "$removed"
