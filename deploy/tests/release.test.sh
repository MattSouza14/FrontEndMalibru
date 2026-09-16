#!/usr/bin/env bash
# Teste de estados e falhas sem servidor, registry ou Docker real.
set -Eeuo pipefail
root=$(cd "$(dirname "$0")/../.." && pwd)
fixture=$(mktemp -d)
trap 'rm -rf -- "$fixture"' EXIT
export FAKE_DOCKER_ROOT="$fixture/docker"
mkdir -p "$fixture/bin" "$fixture/server" "$FAKE_DOCKER_ROOT"
cp "$root/deploy/tests/fake-docker.sh" "$fixture/bin/docker"
cp "$root/deploy/tests/fake-curl.sh" "$fixture/bin/curl"
printf '#!/usr/bin/env bash\nexit 0\n' > "$fixture/bin/sleep"
chmod +x "$fixture/bin/"*
export PATH="$fixture/bin:$PATH"
repo=ghcr.io/test/frontend
a="$repo@sha256:$(printf 'a%.0s' {1..64})"
b="$repo@sha256:$(printf 'b%.0s' {1..64})"
c="$repo@sha256:$(printf 'c%.0s' {1..64})"
cat > "$fixture/server/deploy.env" <<EOF
IMAGE_REPOSITORY=$repo
APP_NAME=malibru-frontend
BACKEND_ORIGIN=http://backend:8080
DOCKER_NETWORK=malibru
HTTP_PORT=8081
API_HEALTH_PATH=/api/empresas
EOF
release() { bash "$root/deploy/release.sh" "$1" "${2:-}" "$fixture/server"; }
active() { cat "$FAKE_DOCKER_ROOT/malibru-frontend/image"; }
state() { sed -n "${1}p" "$fixture/server/state/releases"; }
reject() { if "$@" >"$fixture/failure.log" 2>&1; then printf 'Esperava falha: %s\n' "$*" >&2; exit 1; fi; }
release deploy "$a" >/dev/null
[[ $(active) == "$a" && $(state 1) == "$a" && -z $(state 2) ]]
printf 'PASS primeira publicação\n'
release deploy "$b" >/dev/null
[[ $(active) == "$b" && $(state 2) == "$a" ]]
printf 'PASS atualização preserva versão anterior\n'
release rollback >/dev/null
[[ $(active) == "$a" && $(state 2) == "$b" ]]
printf 'PASS rollback manual sem recompilar\n'
release deploy "$a" >/dev/null
[[ $(state 2) == "$b" ]]
printf 'PASS operação idempotente preserva histórico\n'
export FAKE_FAILURE=candidate
reject release deploy "$c"
[[ $(active) == "$a" && $(state 1) == "$a" ]]
printf 'PASS candidata inválida preserva serviço\n'
export FAKE_FAILURE=live
reject release deploy "$c"
[[ $(active) == "$a" && $(state 1) == "$a" && ! -e "$fixture/server/state/pending" ]]
printf 'PASS falha após troca restaura versão anterior\n'
export FAKE_FAILURE=pull
reject release deploy "$c"
[[ $(active) == "$a" ]]
printf 'PASS falha de pull preserva serviço\n'
release rollback >/dev/null
[[ $(active) == "$b" ]]
release rollback >/dev/null
[[ $(active) == "$a" ]]
printf 'PASS rollback usa cache local mesmo com registry indisponível\n'
unset FAKE_FAILURE
reject release deploy "ghcr.io/other/frontend@sha256:$(printf 'a%.0s' {1..64})"
reject release deploy "$repo:latest"
[[ $(active) == "$a" ]]
printf 'PASS rejeita tags mutáveis e outro repositório\n'
touch "$fixture/server/state/pending"
reject release deploy "$c"
rm "$fixture/server/state/pending"
printf 'PASS bloqueia operação interrompida\n'
printf 'intruso' > "$FAKE_DOCKER_ROOT/malibru-frontend/owner"
reject release deploy "$c"
printf 'PASS protege contêiner não gerenciado\n'
rm -rf "$fixture/server/state" "$FAKE_DOCKER_ROOT/malibru-frontend"
export FAKE_FAILURE=live
reject release deploy "$c"
[[ ! -d "$FAKE_DOCKER_ROOT/malibru-frontend" && ! -e "$fixture/server/state/releases" ]]
printf 'PASS falha no primeiro deploy não inventa rollback\n'
unset FAKE_FAILURE
reject release rollback
printf 'PASS rollback sem versão anterior falha claramente\n'
