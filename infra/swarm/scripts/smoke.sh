#!/bin/sh
set -eu

[ -n "${SITE_URL:-}" ] || {
  echo "SITE_URL é obrigatória para o smoke." >&2
  exit 2
}

RELEASE_BASE_URL="$SITE_URL" exec sh scripts/release-smoke.sh
