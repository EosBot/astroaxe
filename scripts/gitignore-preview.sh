#!/usr/bin/env sh
set -eu

templates="${1:-node,visualstudiocode,macos,windows,linux}"

case "$templates" in
  *[!a-zA-Z0-9,_-]*)
    echo "Templates inválidos. Use nomes separados por vírgula." >&2
    exit 2
    ;;
esac

curl --fail --silent --show-error --location \
  "https://www.toptal.com/developers/gitignore/api/${templates}"
printf '\n'
