#!/bin/sh
set -eu

script_dir="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
. "$script_dir/homolog-common.sh"

docker compose $compose_files config --quiet
docker compose $compose_files up -d --build --wait

ready="false"
attempt=0
while [ "$attempt" -lt 60 ]; do
  if curl --fail --silent --output /dev/null --connect-timeout 2 --max-time 5 \
    "$base_url/api/health/ready"; then
    ready="true"
    break
  fi
  attempt=$((attempt + 1))
  sleep 1
done
if [ "$ready" != "true" ]; then
  echo "A entrada da homologação não ficou pronta em $base_url." >&2
  docker compose $compose_files ps
  exit 1
fi

RELEASE_BASE_URL="$base_url" sh "$script_dir/release-smoke.sh"

echo "Homologação pronta em $base_url. Caixa SMTP local: http://${mailpit_bind}:${mailpit_port}."
