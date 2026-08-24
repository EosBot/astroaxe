#!/bin/sh
set -eu

script_dir="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
. "$script_dir/homolog-common.sh"

test_email="homolog-outbox-$(date +%s)-$$@example.invalid"
test_password="homolog-smoke-password-2026"
mailpit_url="http://${mailpit_bind}:${mailpit_port}"

cleanup() {
  docker compose $compose_files exec -T postgres \
    psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
    -c "DELETE FROM users WHERE email = '$test_email';" >/dev/null 2>&1 || true
}
trap cleanup EXIT HUP INT TERM

payload="$(printf '{"email":"%s","password":"%s"}' "$test_email" "$test_password")"
response_file="$(mktemp)"
trap 'rm -f "$response_file"; cleanup' EXIT HUP INT TERM

status_code="$(curl --silent --show-error --output "$response_file" --write-out '%{http_code}' \
  --connect-timeout 2 --max-time 15 \
  --header "Origin: $base_url" \
  --header "Content-Type: application/json" \
  --data "$payload" \
  "$base_url/api/auth/register")"

if [ "$status_code" != "201" ]; then
  echo "O cadastro sintético retornou HTTP $status_code." >&2
  exit 1
fi

sent="false"
attempt=0
while [ "$attempt" -lt 30 ]; do
  outbox_status="$(docker compose $compose_files exec -T postgres \
    psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -tAc \
    "SELECT eo.status FROM email_outbox eo JOIN users u ON u.id = eo.user_id WHERE u.email = '$test_email' ORDER BY eo.created_at DESC LIMIT 1;")"
  if [ "$outbox_status" = "SENT" ]; then
    sent="true"
    break
  fi
  attempt=$((attempt + 1))
  sleep 1
done

if [ "$sent" != "true" ]; then
  echo "O worker não marcou o email sintético como SENT no prazo esperado." >&2
  exit 1
fi

if ! curl --fail --silent --show-error --connect-timeout 2 --max-time 10 \
  "$mailpit_url/api/v1/messages" | grep --fixed-strings --quiet "$test_email"; then
  echo "O email sintético não apareceu no Mailpit." >&2
  exit 1
fi

echo "Cadastro, outbox, worker SMTP e Mailpit validados com dados sintéticos descartáveis."
