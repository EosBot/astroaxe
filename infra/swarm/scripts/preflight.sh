#!/bin/sh
set -eu

script_dir="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
. "$script_dir/common.sh"

require_command docker
require_command curl
require_manager

for variable_name in \
  ASTROAXE_HOST SITE_URL NOMINATIM_USER_AGENT \
  ASTROAXE_APP_IMAGE ASTROAXE_WORKER_IMAGE ASTROAXE_MIGRATE_IMAGE \
  TRAEFIK_IMAGE CLOUDFLARED_IMAGE SOCKET_PROXY_IMAGE
do
  require_variable "$variable_name"
done

for image_variable in \
  ASTROAXE_APP_IMAGE ASTROAXE_WORKER_IMAGE ASTROAXE_MIGRATE_IMAGE \
  TRAEFIK_IMAGE CLOUDFLARED_IMAGE SOCKET_PROXY_IMAGE
do
  require_digest_image "$image_variable"
done

case "$SITE_URL" in
  https://*) ;;
  *) fail "SITE_URL de produção deve usar https://." ;;
esac

case "$ASTROAXE_HOST" in
  *[!A-Za-z0-9.-]*|.*|*.) fail "ASTROAXE_HOST inválido." ;;
esac

for secret_name in \
  "${DATABASE_URL_SECRET:-astroaxe_database_url_v1}" \
  "${REDIS_URL_SECRET:-astroaxe_redis_url_v1}" \
  "${GUEST_SESSION_SECRET_NAME:-astroaxe_guest_session_v1}" \
  "${AUTH_SESSION_SECRET_NAME:-astroaxe_auth_session_v1}" \
  "${FINGERPRINT_SECRET_NAME:-astroaxe_fingerprint_v1}" \
  "${CLOUDFLARE_TUNNEL_SECRET:-astroaxe_cloudflare_tunnel_v1}"
do
  secret_exists "$secret_name" || fail "Docker secret ausente: $secret_name"
done

edge_nodes="$(docker node ls --filter node.label=astroaxe.role=edge --format '{{.ID}}' | wc -l | tr -d ' ')"
app_nodes="$(docker node ls --filter node.label=astroaxe.role=app --format '{{.ID}}' | wc -l | tr -d ' ')"
[ "$edge_nodes" -ge 2 ] || fail "São necessários ao menos dois nós rotulados astroaxe.role=edge."
[ "$app_nodes" -ge 2 ] || fail "São necessários ao menos dois nós rotulados astroaxe.role=app."

docker stack config --compose-file "$stack_file" >/dev/null
echo "Preflight aprovado: manager, digests, secrets, labels e stack válidos."
