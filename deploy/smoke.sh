#!/usr/bin/env bash
set -Eeuo pipefail
image=${1:?Informe a imagem}
name="malibru-smoke-${RANDOM}-$$"
trap 'docker rm -f "$name" >/dev/null 2>&1 || true' EXIT
docker run -d --name "$name" --network none \
  -e BACKEND_ORIGIN=http://127.0.0.1:65535 "$image" >/dev/null
for _ in {1..30}; do
  if docker exec "$name" wget -q -O /dev/null http://127.0.0.1/healthz; then break; fi
  sleep 1
done
docker exec "$name" nginx -t
docker exec "$name" wget -q -O /dev/null http://127.0.0.1/healthz
docker exec "$name" wget -q -O /dev/null http://127.0.0.1/chamados
docker exec "$name" sh -c 'test -n "$(find /usr/share/nginx/html/assets -name "*.js" -print -quit)"'
if docker exec "$name" wget -q -O /dev/null http://127.0.0.1/assets/arquivo-inexistente.js; then
  printf 'Erro: asset inexistente retornou sucesso\n' >&2
  exit 1
fi
