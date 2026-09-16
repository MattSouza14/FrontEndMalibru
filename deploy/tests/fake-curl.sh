#!/usr/bin/env bash
set -Eeuo pipefail
url=${!#}
if [[ "$url" == *:18000/* ]]; then
  [[ ${FAKE_FAILURE:-} != candidate ]] || exit 22
else
  [[ -f "$FAKE_DOCKER_ROOT/malibru-frontend/running" ]] || exit 7
  image=$(cat "$FAKE_DOCKER_ROOT/malibru-frontend/image")
  [[ ${FAKE_FAILURE:-} != live || "$image" != *@sha256:c* ]] || exit 22
fi
case "$url" in
  */healthz) printf ok ;;
  */chamados) printf '<html><div id="root"></div></html>' ;;
  */api/empresas) printf application/json ;;
  *) exit 22 ;;
esac
