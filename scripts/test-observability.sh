#!/bin/sh
set -eu

base_url="${OBSERVABILITY_URL:-http://127.0.0.1:9090}"
case "$base_url" in
  http://*|https://*) ;;
  *) echo "OBSERVABILITY_URL deve usar http:// ou https://." >&2; exit 2 ;;
esac
base_url="${base_url%/}"

work_dir="$(mktemp -d)"
cleanup() {
  rm -rf "$work_dir"
}
trap cleanup EXIT HUP INT TERM

require_pattern() {
  file="$1"
  pattern="$2"
  message="$3"
  if ! grep -Eq "$pattern" "$file"; then
    echo "$message" >&2
    exit 1
  fi
}

curl --silent --show-error --fail --max-time 10 "$base_url/-/ready" >"$work_dir/ready"
require_pattern "$work_dir/ready" "Prometheus Server is Ready" \
  "O Prometheus respondeu, mas ainda não declarou readiness."

target_ready="false"
attempt=0
while [ "$attempt" -lt 10 ]; do
  curl --silent --show-error --fail --get --max-time 10 \
    --data-urlencode 'query=up{job="traefik"}' \
    "$base_url/api/v1/query" >"$work_dir/target"
  if grep -q '"status":"success"' "$work_dir/target" && \
    grep -Eq '"value":\[[0-9.]+,"1"\]' "$work_dir/target"; then
    target_ready="true"
    break
  fi
  attempt=$((attempt + 1))
  sleep 1
done
if [ "$target_ready" != "true" ]; then
  echo "O target agregado do Traefik não ficou disponível no Prometheus." >&2
  exit 1
fi

curl --silent --show-error --fail --max-time 10 \
  "$base_url/api/v1/rules?type=alert" >"$work_dir/rules"
for alert in \
  AstroAxeMetricsTargetDown \
  AstroAxeBackendDown \
  AstroAxeHttpErrorRateHigh \
  AstroAxeHttpP95High
do
  require_pattern "$work_dir/rules" "\"name\":\"$alert\"" \
    "A regra de alerta $alert não foi carregada."
done

curl --silent --show-error --fail --get --max-time 10 \
  --data-urlencode 'query=traefik_service_requests_total' \
  "$base_url/api/v1/query" >"$work_dir/http-metrics"
require_pattern "$work_dir/http-metrics" '"status":"success"' \
  "A consulta de métricas HTTP não retornou sucesso."

if grep -Eqi 'authorization|cookie|email|birth|useragent|requestpath|clienthost' \
  "$work_dir/http-metrics"; then
  echo "As séries HTTP expuseram um label proibido." >&2
  exit 1
fi

echo "Observabilidade local aprovada: target, métricas agregadas e quatro regras de alerta."
