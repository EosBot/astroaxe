#!/bin/sh
set -eu

script_dir="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
. "$script_dir/homolog-common.sh"

RELEASE_BASE_URL="$base_url" sh "$script_dir/release-smoke.sh"
curl --fail --silent --show-error --connect-timeout 2 --max-time 10 \
  "http://${mailpit_bind}:${mailpit_port}/livez" >/dev/null

echo "Homologação e Mailpit responderam corretamente."
