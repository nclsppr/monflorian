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
npm run ios:check --prefix "${PROJECT_ROOT}"
npm run check --prefix "${PROJECT_ROOT}"

export MONFLORIAN_PORT="${MONFLORIAN_PORT:-8080}"
compose_down() {
  docker compose --project-directory "${PROJECT_ROOT}" down
}
trap compose_down EXIT INT TERM
docker compose --project-directory "${PROJECT_ROOT}" up --build --wait
python3 - <<'PY'
import json
import os
from html.parser import HTMLParser
from urllib.error import HTTPError
from urllib.request import HTTPRedirectHandler, Request, build_opener, urlopen


class Page(HTMLParser):
    def __init__(self):
        super().__init__()
        self.h1_count = 0
        self.canonicals = []
        self.meta = {}
        self.links = set()
        self.title = ""
        self.in_title = False
        self.skip_text = 0
        self.text = []

    def handle_starttag(self, tag, attributes):
        attrs = dict(attributes)
        if tag == "h1":
            self.h1_count += 1
        if tag == "link" and attrs.get("rel") == "canonical":
            self.canonicals.append(attrs.get("href"))
        if tag == "meta":
            self.meta[attrs.get("name") or attrs.get("property")] = attrs.get("content", "")
        if tag == "a" and attrs.get("href"):
            self.links.add(attrs["href"])
        if tag == "title":
            self.in_title = True
        if tag in ("script", "style"):
            self.skip_text += 1

    def handle_endtag(self, tag):
        if tag == "title":
            self.in_title = False
        if tag in ("script", "style"):
            self.skip_text -= 1

    def handle_data(self, data):
        if self.in_title:
            self.title += data
        if not self.skip_text:
            self.text.append(data)


class NoRedirect(HTTPRedirectHandler):
    def redirect_request(self, request, response, code, message, headers, new_url):
        return None

port = os.environ["MONFLORIAN_PORT"]
base = f"http://127.0.0.1:{port}"
paths = [
    "/",
    "/carnets/japon-10-jours",
    "/guides",
    "/guides/preparer-itineraire-voyage",
    "/guides/japon-10-jours-preparer-voyage",
]
pages = {}
for path in paths:
    with urlopen(f"{base}{path}", timeout=5) as response:
        if response.status != 200 or response.geturl() != f"{base}{path}":
            raise SystemExit(f"Route publique non canonique : {path}")
        if "noindex" in response.headers.get("X-Robots-Tag", ""):
            raise SystemExit(f"Route publique exclue de l’index : {path}")
        page = Page()
        page.feed(response.read().decode("utf-8"))
    canonical = f"https://monflorian.com{path}"
    if page.canonicals != [canonical] or page.h1_count != 1:
        raise SystemExit(f"Canonical ou titre principal invalide : {path}")
    if "noindex" in page.meta.get("robots", ""):
        raise SystemExit(f"Meta robots bloquante : {path}")
    if len(" ".join(page.text).strip()) < 500:
        raise SystemExit(f"Contenu HTML initial insuffisant : {path}")
    if "Mon Florian" not in page.title or not page.meta.get("description"):
        raise SystemExit(f"Titre ou description absent : {path}")
    if page.meta.get("og:url") != canonical or not page.meta.get("og:image", "").startswith("https://monflorian.com/"):
        raise SystemExit(f"Aperçu social invalide : {path}")
    pages[path] = page
if len({page.title for page in pages.values()}) != len(paths):
    raise SystemExit("Les titres des pages publiques doivent être distincts.")
if not {"/carnets/japon-10-jours", "/guides"}.issubset(pages["/"].links):
    raise SystemExit("L’accueil doit relier le carnet et les guides avec de vrais liens.")
if not set(paths[3:]).issubset(pages["/guides"].links):
    raise SystemExit("Le sommaire des guides doit relier chaque guide.")

opener = build_opener(NoRedirect)
redirects = [
    ("/v2", "/"),
    ("/v2/", "/"),
    ("/v2/index.html", "/"),
    ("/v2?voyage=japon-a-deux&acces=prive&preuve=synthetic", "/carnets/japon-10-jours"),
    ("/v2?exemple=portugal-en-train&avatar=summer", "/?avatar=summer#inspiration-portugal-en-train"),
    ("/carnets/japon-10-jours/", "/carnets/japon-10-jours"),
    ("/guides/preparer-itineraire-voyage.html", "/guides/preparer-itineraire-voyage"),
]
for path, destination in redirects:
    try:
        opener.open(f"{base}{path}", timeout=5)
    except HTTPError as response:
        if response.code != 308 or response.headers.get("Location") != f"{base}{destination}":
            raise SystemExit(f"Redirection incorrecte : {path}")
    else:
        raise SystemExit(f"Redirection absente : {path}")

for path in ("/guides/inconnu", "/carnets/inconnu", "/v2/inconnu"):
    try:
        urlopen(f"{base}{path}", timeout=5)
    except HTTPError as response:
        if response.code != 404:
            raise SystemExit(f"Statut inattendu pour {path} : {response.code}")
    else:
        raise SystemExit(f"La route inconnue {path} doit répondre 404.")

with urlopen(f"{base}/v2/media/japan-tokyo-couple-720.webp", timeout=5) as response:
    if response.headers.get_content_type() != "image/webp" or "noindex" in response.headers.get("X-Robots-Tag", ""):
        raise SystemExit("Les images du carnet public doivent être servies et indexables.")

with urlopen(f"{base}/api/health", timeout=5) as response:
    health = json.load(response)
if health != {"status": "ok", "release": "local-compose", "generationReady": False}:
    raise SystemExit(f"Santé locale inattendue : {health!r}")

with urlopen(f"{base}/api/config", timeout=5) as response:
    config = json.load(response)
if config.get("serviceReady") is not False or config.get("bookingMode") != "external":
    raise SystemExit(f"Configuration locale inattendue : {config!r}")

try:
    urlopen(Request(f"{base}/api/trips", data=b"{}", headers={"Content-Type": "application/json"}), timeout=5)
except HTTPError as response:
    if response.code != 503 or json.load(response).get("error", {}).get("code") != "TRIP_CREATION_UNAVAILABLE":
        raise SystemExit("La création de voyage doit rester explicitement fermée.")
else:
    raise SystemExit("La création de voyage ne doit pas être ouverte.")
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
