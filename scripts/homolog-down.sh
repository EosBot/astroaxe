#!/bin/sh
set -eu

script_dir="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
. "$script_dir/homolog-common.sh"

docker compose $compose_files down --remove-orphans
echo "Homologação parada. Volumes e dados sintéticos foram preservados."
