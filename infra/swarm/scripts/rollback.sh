#!/bin/sh
set -eu

script_dir="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
. "$script_dir/common.sh"

require_command docker
require_manager

service_suffixes="app scheduler traefik cloudflared socket-proxy"
for suffix in $service_suffixes; do
  service_name="${stack_name}_${suffix}"
  docker service inspect "$service_name" >/dev/null 2>&1 || fail "Serviço ausente: $service_name"
done

for suffix in app scheduler traefik cloudflared; do
  docker service rollback "${stack_name}_${suffix}"
done

echo "Rollback solicitado. Confirme convergência e execute o smoke antes de encerrar o incidente."
