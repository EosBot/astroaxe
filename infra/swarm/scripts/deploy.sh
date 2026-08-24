#!/bin/sh
set -eu

script_dir="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
. "$script_dir/common.sh"

"$script_dir/preflight.sh"

release_id="${ASTROAXE_RELEASE_ID:-$(date -u +%Y%m%dT%H%M%SZ)}"
case "$release_id" in
  *[!A-Za-z0-9_.-]*) fail "ASTROAXE_RELEASE_ID contém caracteres inválidos." ;;
esac

migration_service="${stack_name}_migrate_${release_id}"
database_secret="${DATABASE_URL_SECRET:-astroaxe_database_url_v1}"

cleanup_migration() {
  docker service rm "$migration_service" >/dev/null 2>&1 || true
}
trap cleanup_migration EXIT HUP INT TERM

docker service create \
  --name "$migration_service" \
  --constraint 'node.labels.astroaxe.role==app' \
  --restart-condition none \
  --secret "source=$database_secret,target=database_url,mode=0400" \
  --env DATABASE_URL_FILE=/run/secrets/database_url \
  "$ASTROAXE_MIGRATE_IMAGE" >/dev/null

attempt=0
while [ "$attempt" -lt 60 ]; do
  task_state="$(docker service ps "$migration_service" --no-trunc --format '{{.CurrentState}}|{{.Error}}' | head -n 1)"
  case "$task_state" in
    Complete*) break ;;
    Failed*|Rejected*) fail "Migration de release falhou; consulte docker service ps sem expor secrets." ;;
  esac
  attempt=$((attempt + 1))
  sleep 2
done
[ "$attempt" -lt 60 ] || fail "Migration não concluiu dentro de 120 segundos."

docker stack deploy --with-registry-auth --prune --compose-file "$stack_file" "$stack_name"

attempt=0
while [ "$attempt" -lt 60 ]; do
  pending=0
  for service_name in \
    "${stack_name}_socket-proxy" \
    "${stack_name}_traefik" \
    "${stack_name}_cloudflared" \
    "${stack_name}_app" \
    "${stack_name}_scheduler"
  do
    service_is_converged "$service_name" || pending=$((pending + 1))
  done
  [ "$pending" -eq 0 ] && break
  attempt=$((attempt + 1))
  sleep 3
done
[ "$attempt" -lt 60 ] || fail "A stack não convergiu dentro de 180 segundos."

echo "Deploy Swarm convergiu para a release $release_id. Execute o smoke pela origem Cloudflare."
