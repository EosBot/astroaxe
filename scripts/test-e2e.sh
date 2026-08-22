#!/bin/sh
set -eu

project_name="astroaxe_e2e"
http_bind="${ASTROAXE_HTTP_BIND:-127.0.0.1}"
http_port="${ASTROAXE_HTTP_PORT:-3100}"
base_url="http://${http_bind}:${http_port}"
compose_files="-f compose.yml -f compose.e2e.yml"

export COMPOSE_PROJECT_NAME="$project_name"
export ASTROAXE_HOST="$http_bind"
export ASTROAXE_HTTP_BIND="$http_bind"
export ASTROAXE_HTTP_PORT="$http_port"
export PLAYWRIGHT_BASE_URL="${PLAYWRIGHT_BASE_URL:-$base_url}"
export SITE_URL="$base_url"
export POSTGRES_DB="astroaxe_e2e"
export POSTGRES_USER="astroaxe_e2e"
export POSTGRES_PASSWORD="e2e-postgres-password"
export REDIS_PASSWORD="e2e-redis-password"
export DATABASE_URL="postgresql://astroaxe_e2e:e2e-postgres-password@postgres:5432/astroaxe_e2e?schema=public"
export REDIS_URL="redis://:e2e-redis-password@redis:6379/0"
export GUEST_SESSION_SECRET="e2e-guest-session-secret-at-least-32-characters"
export AUTH_SESSION_SECRET="e2e-account-session-secret-at-least-32-characters"
export FINGERPRINT_SECRET="e2e-fingerprint-secret-at-least-32-characters"
export NOMINATIM_USER_AGENT="AstroAxe-E2E/1.0 (e2e@example.invalid)"
export LOG_LEVEL="warn"

cleanup() {
  docker compose $compose_files down --remove-orphans
}
trap cleanup EXIT HUP INT TERM

docker compose $compose_files config --quiet
docker compose $compose_files up -d --build
ready="false"
attempt=0
while [ "$attempt" -lt 90 ]; do
  if curl --fail --silent --output /dev/null "$base_url/api/health/ready"; then
    ready="true"
    break
  fi
  attempt=$((attempt + 1))
  sleep 1
done
if [ "$ready" != "true" ]; then
  echo "A entrada HTTP E2E não ficou pronta em ${base_url}." >&2
  docker compose $compose_files ps
  exit 1
fi
RELEASE_BASE_URL="$base_url" sh scripts/release-smoke.sh
npx playwright test "$@"
