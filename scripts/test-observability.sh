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

curl --silent --show-error --fail --max-time 10 "$base_url/-/ready" >"$work_dir/ready"
grep -q "Prometheus Server is Ready" "$work_dir/ready"

curl --silent --show-error --fail --get --max-time 10 \
  --data-urlencode 'query=up{job="traefik"}' \
  "$base_url/api/v1/query" >"$work_dir/target"
grep -q '"status":"success"' "$work_dir/target"
grep -Eq '"value":\[[0-9.]+,"1"\]' "$work_dir/target"

curl --silent --show-error --fail --max-time 10 \
  "$base_url/api/v1/rules?type=alert" >"$work_dir/rules"
for alert in \
  AstroAxeMetricsTargetDown \
  AstroAxeBackendDown \
  AstroAxeHttpErrorRateHigh \
  AstroAxeHttpP95High
do
  grep -q "\"name\":\"$alert\"" "$work_dir/rules"
done

curl --silent --show-error --fail --get --max-time 10 \
  --data-urlencode 'query=traefik_service_requests_total' \
  "$base_url/api/v1/query" >"$work_dir/http-metrics"
grep -q '"status":"success"' "$work_dir/http-metrics"

if grep -Eqi 'authorization|cookie|email|birth|useragent|requestpath|clienthost' \
  "$work_dir/http-metrics"; then
  echo "As séries HTTP expuseram um label proibido." >&2
  exit 1
fi

echo "Observabilidade local aprovada: target, métricas agregadas e quatro regras de alerta."
