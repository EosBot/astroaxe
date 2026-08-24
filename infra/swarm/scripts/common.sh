#!/bin/sh
set -eu

stack_name="${ASTROAXE_STACK_NAME:-astroaxe}"
stack_file="${ASTROAXE_STACK_FILE:-infra/swarm/stack.yml}"

fail() {
  echo "$1" >&2
  exit 1
}

require_command() {
  command -v "$1" >/dev/null 2>&1 || fail "Comando obrigatório ausente: $1"
}

require_variable() {
  variable_name="$1"
  eval "variable_value=\${$variable_name:-}"
  [ -n "$variable_value" ] || fail "Variável obrigatória ausente: $variable_name"
}

require_digest_image() {
  variable_name="$1"
  require_variable "$variable_name"
  eval "image_reference=\${$variable_name}"
  printf '%s\n' "$image_reference" | grep -Eq '@sha256:[0-9a-f]{64}$' ||
    fail "$variable_name deve referenciar uma imagem por digest sha256 completo."
}

require_manager() {
  manager_state="$(docker info --format '{{.Swarm.LocalNodeState}} {{.Swarm.ControlAvailable}}')"
  [ "$manager_state" = "active true" ] || fail "Execute em um manager ativo do Swarm."
}

secret_exists() {
  docker secret inspect "$1" >/dev/null 2>&1
}

service_is_converged() {
  service_name="$1"
  replicas="$(docker service ls --filter "name=$service_name" --format '{{.Replicas}}')"
  [ -n "$replicas" ] && [ "${replicas%/*}" = "${replicas#*/}" ]
}
