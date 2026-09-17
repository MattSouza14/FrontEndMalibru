#!/usr/bin/env bash
# Regressão: o proxy deve reencontrar a API quando o IP do contêiner mudar.
set -Eeuo pipefail
image=${1:?Informe a imagem frontend}
prefix="malibru-dns-$(date +%s)-$$"
network=$prefix
frontend="$prefix-front"
backend="$prefix-back"
holder="$prefix-holder"
cleanup() {
  local status=$?
  trap - EXIT
  docker rm -f "$frontend" "$backend" "$holder" >/dev/null 2>&1 || true
  docker network rm "$network" >/dev/null 2>&1 || true
  exit "$status"
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM
docker network create "$network" >/dev/null
start_backend() {
  docker run -d --name "$backend" --network "$network" --network-alias api \
    --entrypoint /bin/sh "$image" -c \
    'printf "server { listen 80; location / { return 200 %s; } }\n" "$1" > /etc/nginx/conf.d/default.conf; exec nginx -g "daemon off;"' sh "$1" >/dev/null
}
await_body() {
  for _ in {1..30}; do
    if [[ $(docker exec "$frontend" wget -q -O - http://127.0.0.1/api/empresas 2>/dev/null) == "$1" ]]; then return 0; fi
    sleep 1
  done
  return 1
}
start_backend first
old_ip=$(docker inspect --format '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' "$backend")
docker run -d --name "$frontend" --network "$network" -e BACKEND_ORIGIN=http://api:80 "$image" >/dev/null
await_body first
docker rm -f "$backend" >/dev/null
# Reserva a próxima alocação antes de recriar a API e confirma a mudança.
docker run -d --name "$holder" --network "$network" --entrypoint /bin/sh "$image" -c 'sleep 120' >/dev/null
start_backend second
new_ip=$(docker inspect --format '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' "$backend")
[[ "$new_ip" != "$old_ip" ]]
await_body second
printf 'PASS proxy recupera DNS após mudança de IP do backend\n'
