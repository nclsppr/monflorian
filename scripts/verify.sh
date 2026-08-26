#!/usr/bin/env bash
set -euo pipefail

if (( BASH_VERSINFO[0] < 3 || (BASH_VERSINFO[0] == 3 && BASH_VERSINFO[1] < 2) )); then
  echo "Bash >= 3.2 est requis." >&2
  exit 1
fi

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)"
PROJECT_ROOT="$(cd -- "${SCRIPT_DIR}/.." && pwd -P)"

command -v git >/dev/null 2>&1 || {
  echo "git est requis pour vérifier le projet." >&2
  exit 1
}

command -v python3 >/dev/null 2>&1 || {
  echo "Python >= 3.9 est requis pour vérifier le projet." >&2
  exit 1
}

command -v node >/dev/null 2>&1 || {
  echo "Node >= 24.0.0 est requis pour vérifier l’application et Nimbus." >&2
  exit 1
}

command -v npm >/dev/null 2>&1 || {
  echo "npm est requis pour vérifier Nimbus." >&2
  exit 1
}

node -e 'const [major] = process.versions.node.split(".").map(Number); process.exit(major >= 24 ? 0 : 1)' || {
  echo "Node >= 24.0.0 est requis (version détectée : $(node --version))." >&2
  exit 1
}

python3 -c 'import sys; raise SystemExit(0 if sys.version_info >= (3, 9) else 1)' || {
  detected_version="$(python3 -c 'import platform; print(platform.python_version())')"
  echo "Python >= 3.9 est requis (version détectée : ${detected_version})." >&2
  exit 1
}

git_root="$(git -C "${PROJECT_ROOT}" rev-parse --show-toplevel 2>/dev/null)" || {
  echo "Le projet doit être un dépôt Git avant vérification." >&2
  exit 1
}
git_root="$(cd -- "${git_root}" && pwd -P)"
if [[ "${git_root}" != "${PROJECT_ROOT}" ]]; then
  echo "Le projet doit être la racine de son dépôt Git : ${PROJECT_ROOT}" >&2
  exit 1
fi

python3 "${SCRIPT_DIR}/documentation_catalog.py" --check
python3 "${SCRIPT_DIR}/check_markdown.py"
python3 "${SCRIPT_DIR}/check_compose.py"
python3 "${SCRIPT_DIR}/check_prototype.py"

python3 -m json.tool "${PROJECT_ROOT}/docs/api/openapi.json" >/dev/null
npm ci --prefix "${PROJECT_ROOT}" --ignore-scripts --no-audit --no-fund
npm run check --prefix "${PROJECT_ROOT}"

export MONFLORIAN_PORT="${MONFLORIAN_PORT:-8080}"
compose_down() {
  docker compose --project-directory "${PROJECT_ROOT}" down
}
trap compose_down EXIT INT TERM
docker compose --project-directory "${PROJECT_ROOT}" up --build --wait
python3 - <<'PY'
import os
from urllib.request import urlopen

port = os.environ["MONFLORIAN_PORT"]
base = f"http://127.0.0.1:{port}"
with urlopen(f"{base}/", timeout=5) as response:
    home = response.read()
if b"<title>Pr\xc3\xa9parer un voyage \xc3\xa0 ton rythme | Mon Florian</title>" not in home:
    raise SystemExit("L’application servie ne contient pas le titre attendu.")

with urlopen(f"{base}/v2", timeout=5) as response:
    v2_url = response.geturl()
    v2_headers = response.headers
    v2 = response.read()
if v2_url != f"{base}/v2":
    raise SystemExit(f"URL V2 locale inattendue : {v2_url!r}")
if b"<title>Ton voyage \xc3\xa0 ton rythme \xc2\xb7 Mon Florian</title>" not in v2:
    raise SystemExit("La V2 servie ne contient pas le titre attendu.")
if "noindex" not in v2_headers.get("X-Robots-Tag", ""):
    raise SystemExit("La V2 servie doit rester hors index.")

with urlopen(f"{base}/api/health", timeout=5) as response:
    health = __import__("json").load(response)
if health != {"status": "ok", "release": "local-compose", "generationReady": False}:
    raise SystemExit(f"Santé locale inattendue : {health!r}")

with urlopen(f"{base}/api/config", timeout=5) as response:
    config = __import__("json").load(response)
if config.get("serviceReady") is not False or config.get("bookingMode") != "external":
    raise SystemExit(f"Configuration locale inattendue : {config!r}")
PY
compose_down
trap - EXIT INT TERM

npm ci --prefix "${PROJECT_ROOT}/docs-nimbus" --ignore-scripts --no-audit --no-fund
npm run check --prefix "${PROJECT_ROOT}/docs-nimbus"
if [[ -n "$(git -C "${PROJECT_ROOT}" ls-files -- docs-nimbus/src/content/docs)" ]]; then
  echo "La collection Nimbus générée ne doit pas être suivie par Git." >&2
  exit 1
fi
git -C "${PROJECT_ROOT}" diff --check
git -C "${PROJECT_ROOT}" diff --cached --check

echo "Vérification du projet terminée."
