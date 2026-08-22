#!/bin/sh
set -eu

base_url="${RELEASE_BASE_URL:-}"
case "$base_url" in
  http://*|https://*) ;;
  *) echo "RELEASE_BASE_URL deve informar a origem HTTP(S) explícita da stack." >&2; exit 2 ;;
esac
base_url="${base_url%/}"

work_dir="$(mktemp -d)"
cleanup() {
  rm -rf "$work_dir"
}
trap cleanup EXIT HUP INT TERM

request() {
  name="$1"
  path="$2"
  curl --silent --show-error --fail \
    --connect-timeout 3 --max-time 15 \
    --dump-header "$work_dir/$name.headers" \
    --output "$work_dir/$name.body" \
    "$base_url$path"
}

request live /api/health/live
grep -q '"status":"ok"' "$work_dir/live.body"
request ready /api/health/ready
grep -q '"status":"ready"' "$work_dir/ready.body"
grep -q '"database":"up"' "$work_dir/ready.body"
grep -q '"redis":"up"' "$work_dir/ready.body"

request home /
request methodology /metodologia
grep -q "Da posição no céu à decisão explicável" "$work_dir/methodology.body"
grep -q "Método autoral AstroAxe" "$work_dir/methodology.body"

request robots /robots.txt
grep -q "Disallow: /api/" "$work_dir/robots.body"
request sitemap /sitemap.xml
grep -q "/metodologia" "$work_dir/sitemap.body"

request account /conta
grep -Eqi '<meta[^>]+name="robots"[^>]+content="[^"]*noindex' "$work_dir/account.body"

for header in \
  "x-content-type-options: nosniff" \
  "x-frame-options: DENY" \
  "referrer-policy: strict-origin-when-cross-origin" \
  "cross-origin-opener-policy: same-origin"
do
  grep -Fqi "$header" "$work_dir/home.headers"
done

if grep -Fqi "x-powered-by:" "$work_dir/home.headers"; then
  echo "A resposta pública expôs X-Powered-By." >&2
  exit 1
fi

echo "Smoke de release aprovado: saúde, páginas públicas, SEO e headers de segurança."
