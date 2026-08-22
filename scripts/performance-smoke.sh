#!/bin/sh
set -eu

base_url="${PERFORMANCE_BASE_URL:-http://127.0.0.1}"
requests="${PERFORMANCE_REQUESTS:-100}"
concurrency="${PERFORMANCE_CONCURRENCY:-10}"
max_p95_ms="${PERFORMANCE_MAX_P95_MS:-750}"

case "$base_url" in
  http://*|https://*) ;;
  *) echo "PERFORMANCE_BASE_URL deve usar http:// ou https://." >&2; exit 2 ;;
esac

case "$requests:$concurrency:$max_p95_ms" in
  *[!0-9:]*|0:*|*:0:*|*:*:0) echo "Requests, concorrência e limite p95 devem ser inteiros positivos." >&2; exit 2 ;;
esac

result_file="$(mktemp)"
cleanup() {
  rm -f "$result_file"
}
trap cleanup EXIT HUP INT TERM

completed=0
while [ "$completed" -lt "$requests" ]; do
  batch=0
  while [ "$batch" -lt "$concurrency" ] && [ $((completed + batch)) -lt "$requests" ]; do
    curl --silent --show-error --output /dev/null \
      --connect-timeout 2 --max-time 10 \
      --write-out '%{http_code} %{time_total}\n' \
      "$base_url/api/health/ready" >>"$result_file" &
    batch=$((batch + 1))
  done
  wait
  completed=$((completed + batch))
done

failures="$(awk '$1 != 200 { count += 1 } END { print count + 0 }' "$result_file")"
p95_seconds="$(awk '{ print $2 }' "$result_file" | sort -n | awk -v total="$requests" 'NR == int((total * 95 + 99) / 100) { print; exit }')"
p95_ms="$(awk -v seconds="$p95_seconds" 'BEGIN { printf "%d", seconds * 1000 + 0.5 }')"

echo "Smoke HTTP: ${requests} requisições, concorrência ${concurrency}, falhas ${failures}, p95 ${p95_ms} ms."

if [ "$failures" -ne 0 ]; then
  echo "O smoke encontrou respostas diferentes de HTTP 200." >&2
  exit 1
fi

if [ "$p95_ms" -gt "$max_p95_ms" ]; then
  echo "O p95 excedeu o limite de ${max_p95_ms} ms." >&2
  exit 1
fi
