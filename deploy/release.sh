#!/usr/bin/env bash
# Executado no servidor via SSH. Não requer checkout, Node ou npm no servidor.
set -Eeuo pipefail
umask 077
operation=${1:?Use deploy ou rollback}
target=${2:-}
directory=${3:-/opt/malibru-frontend}
die() { printf '%s\n' "$*" >&2; exit 1; }
[[ "$operation" == deploy || "$operation" == rollback ]] || die 'Operação inválida'
[[ "$directory" == /* && "$directory" != / ]] || die 'Diretório deve ser absoluto e dedicado'
for command in docker curl flock; do command -v "$command" >/dev/null || die "Instale $command"; done
[[ -f "$directory/deploy.env" ]] || die "Configure $directory/deploy.env"
APP_NAME=malibru-frontend
BIND_ADDRESS=127.0.0.1
HTTP_PORT=8081
API_HEALTH_PATH=/api/empresas
while IFS= read -r line || [[ -n "$line" ]]; do
  line=${line%$'\r'}
  [[ -z "$line" || "$line" == \#* ]] && continue
  [[ "$line" == *=* ]] || die 'Linha inválida em deploy.env'
  key=${line%%=*}; value=${line#*=}
  case "$key" in
    IMAGE_REPOSITORY|APP_NAME|BACKEND_ORIGIN|DOCKER_NETWORK|BIND_ADDRESS|HTTP_PORT|API_HEALTH_PATH) printf -v "$key" '%s' "$value" ;;
    *) die "Configuração desconhecida: $key" ;;
  esac
done < "$directory/deploy.env"
[[ ${IMAGE_REPOSITORY:-} =~ ^ghcr\.io/[a-z0-9._/-]+$ ]] || die 'IMAGE_REPOSITORY inválido'
[[ "$APP_NAME" =~ ^[a-z0-9][a-z0-9_-]{0,48}$ ]] || die 'APP_NAME inválido'
[[ ${DOCKER_NETWORK:-} =~ ^[a-zA-Z0-9][a-zA-Z0-9_.-]*$ ]] || die 'DOCKER_NETWORK inválido'
[[ ${BACKEND_ORIGIN:-} =~ ^https?://[a-zA-Z0-9][a-zA-Z0-9.-]*(:[0-9]{1,5})?$ ]] || die 'BACKEND_ORIGIN deve ser uma origem sem caminho ou barra final'
[[ "$BIND_ADDRESS" == 127.0.0.1 || "$BIND_ADDRESS" == 0.0.0.0 ]] || die 'BIND_ADDRESS inválido'
[[ "$HTTP_PORT" =~ ^[0-9]{1,5}$ ]] && ((10#$HTTP_PORT > 0 && 10#$HTTP_PORT < 65536)) || die 'HTTP_PORT inválido'
[[ -z "$API_HEALTH_PATH" || "$API_HEALTH_PATH" =~ ^/api/[a-zA-Z0-9/_-]+$ ]] || die 'API_HEALTH_PATH inválido'
mkdir -p "$directory/state"
exec 9>"$directory/state/lock"
flock -w 60 9 || die 'Outra publicação está em andamento'
[[ ! -e "$directory/state/pending" ]] || die 'Há uma troca interrompida. Consulte state/pending e o procedimento de recuperação antes de continuar.'
current=''; previous=''
if [[ -f "$directory/state/releases" ]]; then
  current=$(sed -n '1p' "$directory/state/releases")
  previous=$(sed -n '2p' "$directory/state/releases")
fi
if [[ "$operation" == rollback && -z "$target" ]]; then target=$previous; fi
valid_image() { [[ "$1" == "$IMAGE_REPOSITORY"@sha256:* && "${1##*@sha256:}" =~ ^[a-f0-9]{64}$ ]]; }
valid_image "$target" || die 'Informe um digest válido do repositório autorizado; talvez não exista versão anterior'
[[ -z "$current" ]] || valid_image "$current" || die 'Estado atual inválido'
[[ -z "$previous" ]] || valid_image "$previous" || die 'Estado anterior inválido'
docker info >/dev/null
docker network inspect "$DOCKER_NETWORK" >/dev/null
exists() { docker container inspect "$1" >/dev/null 2>&1; }
old_image=''
if exists "$APP_NAME"; then
  owner=$(docker inspect --format '{{index .Config.Labels "com.malibru.managed"}}' "$APP_NAME")
  [[ "$owner" == "$APP_NAME" ]] || die 'O nome do serviço pertence a um contêiner não gerenciado por este script'
  old_image=$(docker inspect --format '{{.Config.Image}}' "$APP_NAME")
  valid_image "$old_image" || die 'A versão em execução não está fixada por digest'
  [[ "$current" == "$old_image" ]] || die 'Estado e contêiner divergem. Reconcile antes de publicar.'
elif [[ -n "$current" ]]; then
  die 'Estado indica uma versão em execução, mas o contêiner não existe. Reconcile antes de publicar.'
fi

check_url() {
  local base=$1 body
  body=$(curl --fail --silent --show-error --max-time 5 "$base/healthz") || return 1
  [[ "$body" == ok ]] || return 1
  body=$(curl --fail --silent --show-error --max-time 5 "$base/chamados") || return 1
  [[ "$body" == *'id="root"'* ]] || return 1
  if [[ -n "$API_HEALTH_PATH" ]]; then
    body=$(curl --fail --silent --show-error --max-time 5 -o /dev/null -w '%{content_type}' "$base$API_HEALTH_PATH") || return 1
    [[ "$body" == application/json* ]] || return 1
  fi
}
await_health() {
  local base=$1
  for ((attempt=1; attempt<=20; attempt++)); do
    if check_url "$base"; then return 0; fi
    sleep 2
  done
  return 1
}
if [[ "$old_image" == "$target" ]]; then
  await_health "http://127.0.0.1:$HTTP_PORT" || die 'Versão já instalada, mas indisponível'
  printf 'Versão já ativa e saudável: %s\n' "$target"
  exit 0
fi
if [[ "$operation" == rollback ]] && docker image inspect "$target" >/dev/null 2>&1; then
  printf 'Rollback usando imagem já presente no servidor\n'
else
  docker pull "$target"
fi
run_id="$(date +%s)-$$"
candidate="$APP_NAME-candidate-$run_id"
backup="$APP_NAME-backup-$run_id"
exists "$candidate" && die 'Nome da candidata já existe'
exists "$backup" && die 'Nome do backup já existe'
candidate_created=false
old_renamed=false
live_attempted=false
committed=false
cleanup() {
  local status=$?
  trap - EXIT INT TERM
  set +e
  if $candidate_created; then docker rm -f "$candidate" >/dev/null 2>&1; fi
  if ! $committed && { $old_renamed || $live_attempted; }; then
    printf 'Falha na troca. Restaurando versão anterior...\n' >&2
    if $live_attempted; then docker rm -f "$APP_NAME" >/dev/null 2>&1; fi
    if $old_renamed; then
      if docker rename "$backup" "$APP_NAME" && docker start "$APP_NAME" >/dev/null && await_health "http://127.0.0.1:$HTTP_PORT"; then
        if printf '%s\n%s\n' "$current" "$previous" > "$directory/state/releases.recovery" && mv "$directory/state/releases.recovery" "$directory/state/releases"; then
          printf 'Versão anterior restaurada: %s\n' "$old_image" >&2
          rm -f "$directory/state/pending"
        else
          printf 'Serviço restaurado, mas estado não foi salvo. Reconcile state/pending manualmente.\n' >&2
        fi
      else
        printf 'RESTAURAÇÃO FALHOU. Estado pending preservado para recuperação manual.\n' >&2
      fi
    else
      printf 'Primeira publicação falhou; não havia versão anterior.\n' >&2
      rm -f "$directory/state/releases"
      rm -f "$directory/state/pending"
    fi
  fi
  exit "$status"
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM
run_container() {
  docker run -d --name "$1" --restart unless-stopped --network "$DOCKER_NETWORK" \
    --label "com.malibru.managed=$APP_NAME" --label "com.malibru.release=$target" \
    --log-opt max-size=10m --log-opt max-file=3 \
    -e "BACKEND_ORIGIN=$BACKEND_ORIGIN" -p "$2:80" "$target" >/dev/null
}
candidate_created=true
run_container "$candidate" '127.0.0.1:0'
candidate_port=$(docker port "$candidate" 80/tcp)
candidate_port=${candidate_port##*:}
[[ "$candidate_port" =~ ^[0-9]+$ ]] || die 'Não foi possível identificar a porta da candidata'
await_health "http://127.0.0.1:$candidate_port" || die 'Candidata reprovada; versão atual preservada'
printf 'operation=%s\ntarget=%s\nbackup=%s\nold_image=%s\n' "$operation" "$target" "$backup" "$old_image" > "$directory/state/pending"
if [[ -n "$old_image" ]]; then
  docker rename "$APP_NAME" "$backup"
  old_renamed=true
  docker stop --time 20 "$backup" >/dev/null
fi
live_attempted=true
run_container "$APP_NAME" "$BIND_ADDRESS:$HTTP_PORT"
await_health "http://127.0.0.1:$HTTP_PORT" || die 'Nova versão indisponível na porta de serviço'
printf '%s\n%s\n' "$target" "$old_image" > "$directory/state/releases.next"
mv "$directory/state/releases.next" "$directory/state/releases"
committed=true
rm -f "$directory/state/pending"
if $old_renamed; then docker rm "$backup" >/dev/null || printf 'Aviso: remova o backup parado %s após conferir o serviço\n' "$backup" >&2; fi
printf '%s\t%s\t%s\t%s\n' "$(date -u +%FT%TZ)" "$operation" "$target" "$old_image" >> "$directory/state/history.tsv" || printf 'Aviso: não foi possível anexar o histórico de publicação\n' >&2
printf 'Versão ativa: %s\nAnterior: %s\n' "$target" "${old_image:-nenhuma}"
