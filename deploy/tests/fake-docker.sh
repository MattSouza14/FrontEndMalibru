#!/usr/bin/env bash
set -Eeuo pipefail
root=${FAKE_DOCKER_ROOT:?}
command=${1:?}; shift
case "$command" in
  info) exit 0 ;;
  network) exit 0 ;;
  image) exit 0 ;;
  pull) [[ ${FAKE_FAILURE:-} != pull ]]; exit ;;
  container) [[ -d "$root/${2:?}" ]]; exit ;;
  inspect)
    format=$2; name=$3
    [[ -d "$root/$name" ]]
    if [[ "$format" == *Labels* ]]; then cat "$root/$name/owner"; else cat "$root/$name/image"; fi ;;
  run)
    name=''; owner=''; image=${!#}
    while (($#)); do
      case "$1" in
        --name) name=$2; shift 2 ;;
        --label) [[ "$2" != com.malibru.managed=* ]] || owner=${2#*=}; shift 2 ;;
        *) shift ;;
      esac
    done
    [[ -n "$name" && ! -e "$root/$name" ]]
    mkdir "$root/$name"
    printf '%s' "$owner" > "$root/$name/owner"
    printf '%s' "$image" > "$root/$name/image"
    touch "$root/$name/running" ;;
  port) printf '127.0.0.1:18000\n' ;;
  rename) [[ ! -e "$root/$2" ]]; mv "$root/$1" "$root/$2" ;;
  stop) rm -f "$root/${!#}/running" ;;
  start) touch "$root/$1/running" ;;
  rm) rm -rf "${root:?}/${!#}" ;;
  *) printf 'Comando simulado desconhecido: %s\n' "$command" >&2; exit 1 ;;
esac
