#!/usr/bin/env python3
"""Validate the static Mon Florian prototype contract."""

from __future__ import annotations

from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlparse


ROOT = Path(__file__).resolve().parent.parent
PROTOTYPE = ROOT / "prototype" / "index.html"


class PrototypeParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.ids: set[str] = set()
        self.links: list[str] = []
        self.external_resources: list[str] = []
        self.html_language = ""
        self.has_viewport = False
        self.has_noindex = False
        self.has_main = False
        self.has_heading = False
        self.has_trip_prompt = False
        self.has_photo_input = False
        self.has_create_action = False
        self.has_live_status = False

    def handle_starttag(
        self, tag: str, attrs: list[tuple[str, str | None]]
    ) -> None:
        values = {key: value or "" for key, value in attrs}
        element_id = values.get("id")
        if element_id:
            self.ids.add(element_id)

        if tag == "html":
            self.html_language = values.get("lang", "")
        elif tag == "meta" and values.get("name") == "viewport":
            self.has_viewport = "width=device-width" in values.get("content", "")
        elif tag == "meta" and values.get("name") == "robots":
            self.has_noindex = "noindex" in values.get("content", "").lower()
        elif tag == "main":
            self.has_main = True
        elif tag == "h1":
            self.has_heading = True
        elif tag == "textarea" and element_id == "tripPrompt":
            self.has_trip_prompt = bool(values.get("aria-label"))
        elif tag == "input" and element_id == "photoInput":
            self.has_photo_input = (
                values.get("type") == "file" and values.get("accept") == "image/*"
            )
        elif tag == "button" and element_id == "createTrip":
            self.has_create_action = True

        if (
            element_id == "toast"
            and values.get("role") == "status"
            and values.get("aria-live") == "polite"
        ):
            self.has_live_status = True

        for attribute in ("href", "src"):
            target = values.get(attribute, "")
            if not target:
                continue
            parsed = urlparse(target)
            if parsed.scheme in {"http", "https"}:
                self.external_resources.append(target)
            elif attribute == "href" and target.startswith("#"):
                self.links.append(target[1:])


def main() -> None:
    if not PROTOTYPE.is_file():
        raise SystemExit("Prototype invalide : prototype/index.html est absent.")

    source = PROTOTYPE.read_text(encoding="utf-8")
    parser = PrototypeParser()
    parser.feed(source)

    checks = {
        "la langue du document doit être le français": parser.html_language == "fr",
        "la meta viewport est absente": parser.has_viewport,
        "le prototype doit rester noindex": parser.has_noindex,
        "le document doit contenir main et h1": parser.has_main and parser.has_heading,
        "le brief doit posséder un nom accessible": parser.has_trip_prompt,
        "l'ajout de photo local est absent ou invalide": parser.has_photo_input,
        "l'ajout de photo doit posséder un libellé visible": (
            '<label class="upload-button">' in source
        ),
        "l'action principale est absente": parser.has_create_action,
        "le retour dynamique doit être annoncé": parser.has_live_status,
        "les contrôles doivent posséder un focus visible": ":focus-visible" in source,
        "le mouvement réduit doit être pris en charge": (
            "prefers-reduced-motion: reduce" in source
            and "reduceMotion ? 'auto' : 'smooth'" in source
        ),
        "le prototype doit annoncer l'absence de paiement": "aucun paiement" in source,
        "le prototype doit annoncer que les photos restent locales": (
            "aucun envoi de photos" in source
        ),
        "les ressources réseau externes sont interdites": not parser.external_resources,
        "une ancre locale pointe vers une cible absente": all(
            target in parser.ids for target in parser.links
        ),
    }
    errors = [message for message, valid in checks.items() if not valid]
    if errors:
        for error in errors:
            print(f"Prototype invalide : {error}")
        raise SystemExit(1)

    print(
        "Prototype valide : document français, expérience locale, "
        "contrôles principaux et copie de limite présents."
    )


if __name__ == "__main__":
    main()
