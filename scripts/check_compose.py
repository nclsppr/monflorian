#!/usr/bin/env python3
"""Validate the mandatory Docker Compose contract of a Foundation project."""

from __future__ import annotations

import json
import re
import shutil
import subprocess
import sys
from pathlib import Path


MINIMUM_PYTHON = (3, 9)
MINIMUM_COMPOSE = (2, 20, 0)
DURABLE_PACKS = {"standard", "full", "critical"}


if sys.version_info < MINIMUM_PYTHON:
    detected = ".".join(str(part) for part in sys.version_info[:3])
    print(
        f"Python >= 3.9 est requis (version détectée : {detected}).",
        file=sys.stderr,
    )
    raise SystemExit(2)


ROOT = Path(__file__).resolve().parent.parent
COMPOSE_FILE = ROOT / "compose.yaml"
PACK_PATTERN = re.compile(
    r"^\| Pack adopté \| `(minimal|standard|full|critical)` \|$",
    re.MULTILINE,
)


def fail(message: str) -> None:
    print(f"Compose invalide : {message}", file=sys.stderr)
    raise SystemExit(1)


def project_pack() -> str:
    foundation = ROOT / "FOUNDATION.md"
    if foundation.is_file():
        match = PACK_PATTERN.search(foundation.read_text(encoding="utf-8"))
        if not match:
            fail("le pack adopté est absent ou invalide dans FOUNDATION.md")
        return match.group(1)
    if (ROOT / "VERSION").is_file() and (ROOT / "PRINCIPLES.md").is_file():
        return "foundation"
    fail("impossible de déterminer le pack du projet")


def compose_version(docker: str) -> tuple[int, int, int]:
    result = subprocess.run(
        [docker, "compose", "version", "--short"],
        cwd=ROOT,
        check=False,
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        detail = result.stderr.strip() or result.stdout.strip()
        fail(f"Docker Compose v2 est requis ({detail or 'commande indisponible'})")
    numbers = [int(part) for part in re.findall(r"\d+", result.stdout)[:3]]
    if not numbers:
        fail(f"version Docker Compose illisible : {result.stdout.strip()!r}")
    version = tuple((numbers + [0, 0, 0])[:3])
    if version < MINIMUM_COMPOSE:
        detected = ".".join(str(part) for part in version)
        fail(f"Docker Compose >= 2.20.0 est requis, version détectée : {detected}")
    return version


def normalized_config(docker: str) -> dict[str, object]:
    result = subprocess.run(
        [
            docker,
            "compose",
            "--project-directory",
            str(ROOT),
            "-f",
            str(COMPOSE_FILE),
            "config",
            "--format",
            "json",
        ],
        cwd=ROOT,
        check=False,
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        detail = result.stderr.strip() or result.stdout.strip()
        fail(f"docker compose config a échoué : {detail}")
    try:
        config = json.loads(result.stdout)
    except json.JSONDecodeError as error:
        fail(f"sortie JSON de Docker Compose illisible : {error}")
    if not isinstance(config, dict):
        fail("la configuration normalisée n'est pas un objet")
    return config


def service_labels(service: dict[str, object]) -> dict[str, str]:
    labels = service.get("labels", {})
    if isinstance(labels, dict):
        return {str(key): str(value) for key, value in labels.items()}
    return {}


def validate_services(pack: str, config: dict[str, object]) -> int:
    project_name = config.get("name")
    if not isinstance(project_name, str) or not project_name.strip():
        fail("le projet Compose doit posséder un nom explicite")

    services = config.get("services", {})
    if not isinstance(services, dict):
        fail("services doit être une table")
    if pack in DURABLE_PACKS | {"foundation"} and not services:
        fail(f"le pack {pack} exige au moins un service dans compose.yaml")

    for service_name, raw_service in services.items():
        if not isinstance(raw_service, dict):
            fail(f"service {service_name} illisible")
        image = raw_service.get("image")
        build = raw_service.get("build")
        if not image and not build:
            fail(f"service {service_name} sans image ni build")
        if image and not build and "@sha256:" not in str(image):
            fail(
                f"image externe non épinglée par digest pour {service_name} : {image}"
            )

        lifecycle = service_labels(raw_service).get("foundation.lifecycle", "service")
        if lifecycle not in {"service", "job"}:
            fail(
                f"foundation.lifecycle invalide pour {service_name} : {lifecycle}"
            )
        healthcheck = raw_service.get("healthcheck")
        if lifecycle == "service" and (
            not isinstance(healthcheck, dict) or healthcheck.get("disable") is True
        ):
            fail(
                f"service long {service_name} sans healthcheck ; "
                "utiliser foundation.lifecycle=job uniquement pour une commande finie"
            )
    return len(services)


def main() -> None:
    if not COMPOSE_FILE.is_file():
        fail("compose.yaml est obligatoire à la racine")
    docker = shutil.which("docker")
    if docker is None:
        fail("la commande docker est requise")
    version = compose_version(docker)
    pack = project_pack()
    service_count = validate_services(pack, normalized_config(docker))
    rendered_version = ".".join(str(part) for part in version)
    print(
        f"Compose valide : pack={pack}, services={service_count}, "
        f"version={rendered_version}."
    )


if __name__ == "__main__":
    main()
