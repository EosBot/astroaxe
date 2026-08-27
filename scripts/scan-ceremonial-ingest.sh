#!/bin/sh
set -eu

# Supply-chain gate for the ceremonial ingest image.
#
# Builds the image, records a complete SBOM, scans OS packages, npm dependencies and the
# extraction binaries with a pinned Trivy, then applies the policy in
# src/domain/ceremonial/vulnerability-policy.ts: Critical and High block outright, and a
# Medium only passes against an unexpired exception that names an owner and a remediation.
#
#   npm run ceremonial:scan
#
# Trivy runs on the host and needs network access to refresh its vulnerability database.
# The ingest container itself never has a network — that isolation is not weakened here.

trivy_image="${TRIVY_IMAGE:-aquasec/trivy:0.74.0}"
ingest_image="${INGEST_IMAGE:-astroaxe_ceremonial_ingest-ceremonial-ingest:latest}"
output_dir="${SCAN_OUTPUT_DIR:-ops/ceremonial}"
sbom_path="$output_dir/sbom-ingest.cdx.json"
report_path="$output_dir/trivy-ingest.json"

if ! command -v docker >/dev/null 2>&1; then
  echo "docker não está disponível; o scan não pode ser executado." >&2
  exit 2
fi

mkdir -p "$output_dir"

# The archive path is only needed so Compose can interpolate the file; the build never
# mounts it, and nothing in this script reads the archive.
CEREMONIAL_ARCHIVE_HOST_PATH="${CEREMONIAL_ARCHIVE_HOST_PATH:-/nonexistent}" \
CEREMONIAL_WORK_HOST_PATH="${CEREMONIAL_WORK_HOST_PATH:-/nonexistent}" \
  docker compose -f compose.ingest.yml build ceremonial-ingest

# A cache volume keeps the vulnerability database between runs. Trivy itself is pinned:
# an unpinned scanner is not a reproducible gate.
docker volume create astroaxe_trivy_cache >/dev/null

# Run as the invoking user, with the cache redirected away from /root: otherwise the SBOM
# and report land in the repository owned by root, where the next run cannot rewrite them.
run_trivy() {
  docker run --rm \
    --user "$(id -u):$(id -g)" \
    -e TRIVY_CACHE_DIR=/cache \
    -v /var/run/docker.sock:/var/run/docker.sock:ro \
    -v astroaxe_trivy_cache:/cache \
    -v "$PWD/$output_dir:/out" \
    "$trivy_image" "$@"
}

echo "Gerando SBOM CycloneDX de $ingest_image…" >&2
run_trivy image --quiet --format cyclonedx --output "/out/$(basename "$sbom_path")" \
  "$ingest_image"

echo "Escaneando OS, npm e binários de extração…" >&2
# Every severity is reported; the policy, not the scanner flag, decides what blocks.
run_trivy image --quiet --format json --output "/out/$(basename "$report_path")" \
  --scanners vuln \
  --pkg-types os,library \
  --severity UNKNOWN,LOW,MEDIUM,HIGH,CRITICAL \
  "$ingest_image"

if [ ! -s "$sbom_path" ]; then
  echo "SBOM vazio ou ausente em $sbom_path; um SBOM incompleto não libera o ingest." >&2
  exit 1
fi

echo "Aplicando a política de vulnerabilidades…" >&2
node --import tsx scripts/check-vulnerability-policy.ts "$report_path"

echo "SBOM: $sbom_path" >&2
echo "Relatório: $report_path" >&2
