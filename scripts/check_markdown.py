#!/usr/bin/env python3
"""Baseline Markdown checks copied into projects adopting the foundation."""

from __future__ import annotations

import html
import re
import sys
import unicodedata
from datetime import date
from pathlib import Path
from urllib.parse import unquote


if sys.version_info < (3, 9):
    detected = ".".join(str(part) for part in sys.version_info[:3])
    print(
        f"Python >= 3.9 est requis (version détectée : {detected}).",
        file=sys.stderr,
    )
    raise SystemExit(2)


ROOT = Path(__file__).resolve().parent.parent
REQUIRED_PATHS = (
    ".github/workflows/verify.yml",
    "README.md",
    "CHANGELOG.md",
    "FOUNDATION.md",
    "DOCUMENTATION.md",
    "DOCUMENTATION-CATALOG.md",
    "documentation.json",
    "compose.yaml",
    "AGENTS.md",
    "docs-nimbus/AGENT.md",
    "docs-nimbus/.env.example",
    "docs-nimbus/astro.config.ts",
    "docs-nimbus/nimbus.json",
    "docs-nimbus/package-lock.json",
    "docs-nimbus/package.json",
    "docs-nimbus/scripts/sync-content.mjs",
    "docs-nimbus/scripts/sync-content.test.mjs",
    "docs-nimbus/src/content.config.ts",
    "docs/foundation/PRINCIPLES.md",
    "docs/foundation/DEFAULTS.md",
    "docs/foundation/DEFINITION-OF-DONE.md",
    "scripts/check_markdown.py",
    "scripts/check_compose.py",
    "scripts/documentation_catalog.py",
    "scripts/verify.sh",
)
PACK_REQUIRED_PATHS = {
    "minimal": ("BRIEF.md",),
    "standard": ("PROJECT.md", "STATUS.md", "ROADMAP.md"),
    "full": ("PROJECT.md", "STATUS.md", "ROADMAP.md"),
    "critical": (
        "PROJECT.md",
        "STATUS.md",
        "ROADMAP.md",
        "RUNBOOK.md",
        "DELIVERY-EVIDENCE.md",
    ),
}
PACK_CLASS_LABELS = {
    "minimal": "Exploration",
    "standard": "Prototype",
    "full": "Produit",
    "critical": "Critique",
}
LINK_PATTERN = re.compile(
    r"!?\[[^\]]*\]\(\s*(?P<target><[^>]+>|[^\s)]+)"
    r"(?:\s+(?:\"[^\"]*\"|'[^']*'|\([^)]*\)))?\s*\)"
)
FENCE_PATTERN = re.compile(r"^\s*(`{3,}|~{3,})")
HEADING_PATTERN = re.compile(r"^\s{0,3}(#{1,6})\s+(.+?)\s*#*\s*$")
EXPLICIT_ANCHOR_PATTERN = re.compile(
    r"<(?:a|span)\b[^>]*(?:id|name)=[\"']([^\"']+)[\"']",
    re.IGNORECASE,
)
EXPLICIT_HEADING_ID_PATTERN = re.compile(r"\s*\{#([^}]+)\}\s*$")
URI_SCHEME_PATTERN = re.compile(r"^[A-Za-z][A-Za-z0-9+.-]*:")
ALLOWED_EXTERNAL_SCHEMES = ("http://", "https://", "mailto:", "tel:")
REQUIRED_COMPOSE_WIRING = (
    (
        "scripts/verify.sh",
        re.compile(
            r'(?m)^\s*python3 "\$\{SCRIPT_DIR\}/check_compose\.py"\s*$'
        ),
    ),
    (
        ".github/workflows/verify.yml",
        re.compile(r"(?m)^\s*python3 scripts/check_compose\.py\s*$"),
    ),
)


def line_number(text: str, offset: int) -> int:
    return text.count("\n", 0, offset) + 1


def mask_fenced_code(text: str) -> str:
    masked: list[str] = []
    active_fence: str | None = None
    for line in text.splitlines(keepends=True):
        match = FENCE_PATTERN.match(line)
        if match:
            marker = match.group(1)[0]
            if active_fence is None:
                active_fence = marker
            elif active_fence == marker:
                active_fence = None
            masked.append("\n" if line.endswith("\n") else "")
        elif active_fence is not None:
            masked.append("\n" if line.endswith("\n") else "")
        else:
            masked.append(line)
    return "".join(masked)


def github_slug(value: str) -> str:
    value = html.unescape(value)
    value = re.sub(r"!\[([^\]]*)\]\([^)]*\)", r"\1", value)
    value = re.sub(r"\[([^\]]+)\]\([^)]*\)", r"\1", value)
    value = re.sub(r"<[^>]+>", "", value)
    value = re.sub(r"[`*_~]", "", value).strip().lower()
    characters: list[str] = []
    for character in value:
        category = unicodedata.category(character)
        if character in ("-", "_") or character.isspace():
            characters.append(character)
        elif category[0] in ("L", "N", "M"):
            characters.append(character)
    return re.sub(r"\s+", "-", "".join(characters))


def markdown_anchors(path: Path, cache: dict[Path, set[str]]) -> set[str]:
    path = path.resolve()
    if path in cache:
        return cache[path]
    anchors: set[str] = set()
    counts: dict[str, int] = {}
    active_fence: str | None = None
    for line in path.read_text(encoding="utf-8").splitlines():
        fence = FENCE_PATTERN.match(line)
        if fence:
            marker = fence.group(1)[0]
            if active_fence is None:
                active_fence = marker
            elif active_fence == marker:
                active_fence = None
            continue
        if active_fence is not None:
            continue
        for explicit in EXPLICIT_ANCHOR_PATTERN.findall(line):
            anchors.add(unquote(explicit).lower())
        heading = HEADING_PATTERN.match(line)
        if not heading:
            continue
        title = heading.group(2)
        explicit_heading = EXPLICIT_HEADING_ID_PATTERN.search(title)
        if explicit_heading:
            anchors.add(unquote(explicit_heading.group(1)).lower())
            title = EXPLICIT_HEADING_ID_PATTERN.sub("", title)
        base = github_slug(title)
        if not base:
            continue
        occurrence = counts.get(base, 0)
        counts[base] = occurrence + 1
        anchors.add(base if occurrence == 0 else f"{base}-{occurrence}")
    cache[path] = anchors
    return anchors


def split_target(raw_target: str) -> tuple[str, str]:
    target = raw_target.strip()
    if target.startswith("<") and target.endswith(">"):
        target = target[1:-1]
    target = unquote(target)
    path_part, separator, anchor = target.partition("#")
    return path_part.partition("?")[0], anchor if separator else ""


def check_structure(errors: list[str]) -> None:
    for relative in REQUIRED_PATHS:
        if not (ROOT / relative).is_file():
            errors.append(f"fichier requis absent : {relative}")

    for relative, pattern in REQUIRED_COMPOSE_WIRING:
        path = ROOT / relative
        if path.is_file() and not pattern.search(path.read_text(encoding="utf-8")):
            errors.append(f"gate Compose non câblée : {relative}")

    foundation = ROOT / "FOUNDATION.md"
    if not foundation.is_file():
        return

    text = foundation.read_text(encoding="utf-8")
    metadata_patterns = {
        "Source": r"(?m)^\| Source \| `[^`|\r\n]+` \|$",
        "Version lisible": (
            r"(?m)^\| Version lisible \| `(?:v[0-9]+\.[0-9]+\.[0-9]+|unreleased)` \|$"
        ),
        "Commit immuable": (
            r"(?m)^\| Commit immuable \| `(?:[0-9a-f]{40}|[0-9a-f]{64})` \|$"
        ),
        "Adoptée par": r"(?m)^\| Adoptée par \| [^|\r\n]+ \|$",
    }
    for field, pattern in metadata_patterns.items():
        if not re.search(pattern, text):
            errors.append(f"FOUNDATION.md : métadonnée absente ou invalide : {field}")

    adopted_date = re.search(
        r"(?m)^\| Adoptée le \| ([0-9]{4}-[0-9]{2}-[0-9]{2}) \|$",
        text,
    )
    if not adopted_date:
        errors.append("FOUNDATION.md : métadonnée absente ou invalide : Adoptée le")
    else:
        try:
            date.fromisoformat(adopted_date.group(1))
        except ValueError:
            errors.append("FOUNDATION.md : date d'adoption invalide")

    pack_match = re.search(
        r"(?m)^\| Pack adopté \| `([a-z-]+)` \|$",
        text,
    )
    adopted_pack: str | None = None
    if pack_match:
        adopted_pack = pack_match.group(1)
        if adopted_pack not in PACK_REQUIRED_PATHS:
            errors.append(
                f"FOUNDATION.md : pack adopté inconnu : {adopted_pack}"
            )
        else:
            for relative in PACK_REQUIRED_PATHS[adopted_pack]:
                if not (ROOT / relative).is_file():
                    errors.append(
                        f"fichier requis pour le pack {adopted_pack} absent : {relative}"
                    )
            class_document = (
                ROOT / "BRIEF.md"
                if adopted_pack == "minimal"
                else ROOT / "PROJECT.md"
            )
            if class_document.is_file():
                expected_class = (
                    f"| Classe | {PACK_CLASS_LABELS[adopted_pack]} |"
                )
                if expected_class not in class_document.read_text(encoding="utf-8"):
                    errors.append(
                        f"{class_document.name} : classe différente du pack {adopted_pack}"
                    )
    elif "TODO minimal, standard, full ou critical" not in text:
        errors.append("FOUNDATION.md : pack adopté absent")

    section = re.search(
        r"(?ms)^## Profils activés\s*$\n(?P<body>.*?)(?=^##\s|\Z)",
        text,
    )
    if not section:
        errors.append("FOUNDATION.md : section Profils activés absente")
        return

    body = section.group("body")
    declared = set(re.findall(r"(?m)^- `([a-z0-9-]+)`\s*$", body))
    declares_none = bool(re.search(r"(?m)^- aucun\s*$", body))
    if declared and declares_none:
        errors.append("FOUNDATION.md : profils déclarés avec la valeur aucun")
    if not declared and not declares_none and "TODO" not in body:
        errors.append("FOUNDATION.md : déclarer les profils activés ou aucun")

    profile_directory = ROOT / "docs/foundation/profiles"
    present = (
        {path.stem for path in profile_directory.glob("*.md")}
        if profile_directory.is_dir()
        else set()
    )
    for profile in sorted(declared - present):
        errors.append(
            f"profil déclaré sans snapshot : docs/foundation/profiles/{profile}.md"
        )
    for profile in sorted(present - declared):
        errors.append(
            f"snapshot de profil non déclaré dans FOUNDATION.md : {profile}"
        )

    if "documentation-nimbus" not in declared:
        errors.append("le profil obligatoire documentation-nimbus n'est pas déclaré")

    if (
        adopted_pack == "critical"
        and not {"backend-data", "infrastructure-production"} & declared
    ):
        errors.append(
            "le pack critical exige backend-data ou infrastructure-production"
        )

    if (
        "web" in declared
        and adopted_pack in {"full", "critical"}
        and not (ROOT / "DESIGN.md").is_file()
    ):
        errors.append("fichier requis avec le profil web absent : DESIGN.md")


def check_file(path: Path, errors: list[str]) -> None:
    relative = path.relative_to(ROOT)
    text = path.read_text(encoding="utf-8")
    prose = mask_fenced_code(text)
    anchors: dict[Path, set[str]] = {}

    for match in re.finditer(r"\bTODO\b", text):
        errors.append(
            f"{relative}:{line_number(text, match.start())} : marqueur TODO non résolu"
        )

    if relative.parts[:2] == ("docs", "decisions"):
        for pattern, label in (
            (r"\bADR-NNNN\b", "identifiant ADR non résolu"),
            (r"(?m)^- Date\s*:\s*YYYY-MM-DD\s*$", "date ADR non résolue"),
        ):
            for match in re.finditer(pattern, text):
                errors.append(
                    f"{relative}:{line_number(text, match.start())} : {label}"
                )

    for match in LINK_PATTERN.finditer(prose):
        raw = match.group("target")
        lower = raw.lower()
        location = f"{relative}:{line_number(prose, match.start())}"
        if lower.startswith(ALLOWED_EXTERNAL_SCHEMES):
            continue
        if URI_SCHEME_PATTERN.match(raw):
            errors.append(f"{location} : schéma de lien non autorisé : {raw}")
            continue
        target, anchor = split_target(raw)
        target_path = Path(target) if target else Path(".")
        if target_path.is_absolute() or raw.startswith("//"):
            errors.append(f"{location} : lien local absolu interdit : {raw}")
            continue
        resolved = (path.parent / target_path).resolve()
        if not resolved.is_relative_to(ROOT):
            errors.append(f"{location} : lien hors du dépôt interdit : {raw}")
            continue
        if not resolved.exists():
            errors.append(f"{location} : lien local absent : {raw}")
            continue
        if anchor:
            if not resolved.is_file() or resolved.suffix.lower() not in (".md", ".markdown"):
                errors.append(f"{location} : ancre sur une cible non Markdown : {raw}")
            elif unquote(anchor).lower() not in markdown_anchors(resolved, anchors):
                errors.append(f"{location} : ancre locale absente : {raw}")


def main() -> int:
    errors: list[str] = []
    check_structure(errors)
    for path in sorted(ROOT.rglob("*.md")):
        relative = path.relative_to(ROOT)
        if (
            ".git" not in path.parts
            and "node_modules" not in path.parts
            and "dist" not in path.parts
            and ".astro" not in path.parts
            and relative.parts[:4]
            != ("docs-nimbus", "src", "content", "docs")
        ):
            check_file(path, errors)
    if errors:
        print("\n".join(errors), file=sys.stderr)
        return 1
    print("Markdown du projet valide.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
