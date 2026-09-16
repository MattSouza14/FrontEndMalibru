#!/usr/bin/env bash
set -Eeuo pipefail
operation=${1:?Operação ausente}
image=${2:-}
[[ "$operation" == deploy || "$operation" == rollback ]]
: "${DEPLOY_HOST:?Configure DEPLOY_HOST}"
: "${DEPLOY_USER:?Configure DEPLOY_USER}"
: "${DEPLOY_SSH_KEY:?Configure DEPLOY_SSH_KEY}"
: "${DEPLOY_KNOWN_HOSTS:?Configure DEPLOY_KNOWN_HOSTS}"
port=${DEPLOY_PORT:-22}
directory=${DEPLOY_PATH:-/opt/malibru-frontend}
[[ "$DEPLOY_HOST" =~ ^[a-zA-Z0-9][a-zA-Z0-9.-]*$ ]]
[[ "$DEPLOY_USER" =~ ^[a-z_][a-z0-9_-]*$ ]]
[[ "$port" =~ ^[0-9]{1,5}$ ]] && ((10#$port > 0 && 10#$port < 65536))
[[ "$directory" =~ ^/[a-zA-Z0-9/_-]+$ && "$directory" != / && "$directory" != *'..'* ]]
[[ -z "$image" || "$image" =~ ^ghcr\.io/[a-z0-9._/-]+@sha256:[a-f0-9]{64}$ ]]
temporary=$(mktemp -d)
trap 'rm -rf -- "$temporary"' EXIT
umask 077
printf '%s\n' "$DEPLOY_SSH_KEY" > "$temporary/key"
printf '%s\n' "$DEPLOY_KNOWN_HOSTS" > "$temporary/known_hosts"
ssh -i "$temporary/key" -p "$port" -o BatchMode=yes -o IdentitiesOnly=yes \
  -o StrictHostKeyChecking=yes -o "UserKnownHostsFile=$temporary/known_hosts" \
  -o ConnectTimeout=15 -o ServerAliveInterval=15 -o ServerAliveCountMax=4 \
  "$DEPLOY_USER@$DEPLOY_HOST" \
  "bash -s -- '$operation' '$image' '$directory'" < deploy/release.sh
