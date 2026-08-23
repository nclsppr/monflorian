from __future__ import annotations

import hashlib
import json
import os
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts" / "lib"))

import release_contract as release  # noqa: E402


def git_revision() -> str:
    return subprocess.run(
        ["git", "rev-parse", "HEAD"],
        cwd=ROOT,
        check=True,
        stdout=subprocess.PIPE,
        text=True,
    ).stdout.strip()


class VpsReleaseContractTests(unittest.TestCase):
    def setUp(self) -> None:
        self.revision = git_revision()
        self.backend = f"{release.IMAGE_REPOSITORY}@sha256:{'a' * 64}"
        self.integration = f"{release.INTEGRATION_REPOSITORY}@sha256:{'b' * 64}"

    def write_images(self, directory: Path, value: object | None = None) -> Path:
        path = directory / "images.json"
        path.write_bytes(release.canonical_json(value or {"backend": self.backend}))
        return path

    def test_integration_is_deterministic_exact_and_has_no_migrator(self) -> None:
        with tempfile.TemporaryDirectory(prefix="monflorian-vps-") as temporary:
            root = Path(temporary)
            images = self.write_images(root)
            first = root / "first"
            second = root / "second"
            first_outputs = release.build_integration(
                ROOT, first, self.revision, images
            )
            release.build_integration(ROOT, second, self.revision, images)
            for name in (
                "integration.tar.gz",
                "inventory.json",
                "expected-images.json",
                "migrations.json",
                "probes.json",
            ):
                self.assertEqual((first / name).read_bytes(), (second / name).read_bytes())

            files = release.verify_integration(
                ROOT,
                first / "integration.tar.gz",
                first / "inventory.json",
                self.revision,
                first_outputs["created"],
            )
            self.assertEqual(tuple(sorted(files)), release.RUNTIME_PATHS)
            contract = json.loads(files["contract.json"])
            migrations = json.loads(files["migrations.json"])
            probes = json.loads(files["probes.json"])
            self.assertEqual(contract["runtime_services"], ["backend"])
            self.assertEqual(contract["transient_services"], [])
            self.assertEqual(contract["migration"], {"runtime_auto_migrate": False, "strategy": "none"})
            self.assertEqual(migrations["strategy"], "none")
            self.assertEqual(migrations["migrations"], [])
            self.assertEqual(probes["public"][0]["body_contains"], self.revision)
            self.assertEqual(probes["public"][1], {"host": "monflorian.com", "path": "/", "status": 401})
            self.assertEqual(probes["public"][2], {"host": "www.monflorian.com", "path": "/", "status": 308})
            self.assertIn(self.revision.encode(), files["caddy/monflorian.caddy"])
            self.assertNotIn(release.REVISION_PLACEHOLDER.encode(), files["caddy/monflorian.caddy"])

    def test_release_binds_one_image_integration_and_none_migrations(self) -> None:
        with tempfile.TemporaryDirectory(prefix="monflorian-release-") as temporary:
            root = Path(temporary)
            package = root / "package"
            outputs = release.build_integration(
                ROOT, package, self.revision, self.write_images(root)
            )
            descriptor = root / "application-release.json"
            values = release.build_application_release(
                descriptor,
                self.revision,
                Path(outputs["expected_images"]),
                self.integration,
                Path(outputs["migrations"]),
                Path(outputs["probes"]),
            )
            document = release.verify_application_release(
                descriptor,
                self.revision,
                Path(outputs["expected_images"]),
                self.integration,
                Path(outputs["migrations"]),
                Path(outputs["probes"]),
            )
            self.assertEqual(set(document["components"]), {"backend"})
            self.assertEqual(document["migrations"]["strategy"], "none")
            self.assertEqual(values["release_digest"], release.sha256(descriptor.read_bytes()))

    def test_tagged_or_noncanonical_image_inputs_are_refused(self) -> None:
        with tempfile.TemporaryDirectory(prefix="monflorian-negative-") as temporary:
            root = Path(temporary)
            tagged = self.write_images(
                root, {"backend": f"{release.IMAGE_REPOSITORY}:latest"}
            )
            with self.assertRaisesRegex(release.ContractError, "untagged digest"):
                release.build_integration(ROOT, root / "tagged", self.revision, tagged)

        with tempfile.TemporaryDirectory(prefix="monflorian-negative-") as temporary:
            root = Path(temporary)
            noncanonical = root / "images.json"
            noncanonical.write_text(json.dumps({"backend": self.backend}, indent=2))
            with self.assertRaisesRegex(release.ContractError, "canonical"):
                release.build_integration(
                    ROOT, root / "noncanonical", self.revision, noncanonical
                )

    def test_archive_tampering_is_refused(self) -> None:
        with tempfile.TemporaryDirectory(prefix="monflorian-tamper-") as temporary:
            root = Path(temporary)
            package = root / "package"
            release.build_integration(
                ROOT, package, self.revision, self.write_images(root)
            )
            tampered = bytearray((package / "integration.tar.gz").read_bytes())
            tampered[len(tampered) // 2] ^= 1
            (package / "integration.tar.gz").write_bytes(tampered)
            with self.assertRaises(release.ContractError):
                release.verify_integration(
                    ROOT,
                    package / "integration.tar.gz",
                    package / "inventory.json",
                    self.revision,
                )

    def test_oci_manifests_bind_exact_layers(self) -> None:
        with tempfile.TemporaryDirectory(prefix="monflorian-manifest-") as temporary:
            root = Path(temporary)
            archive = root / "integration.tar.gz"
            inventory = root / "inventory.json"
            archive.write_bytes(b"archive")
            inventory.write_bytes(b"inventory")
            created = "2026-08-23T10:00:00Z"
            manifest = {
                "annotations": {
                    "org.opencontainers.image.created": created,
                    "org.opencontainers.image.revision": self.revision,
                    "org.opencontainers.image.source": release.SOURCE_URL,
                },
                "artifactType": release.INTEGRATION_ARTIFACT_TYPE,
                "config": {
                    "data": "e30=",
                    "digest": release.OCI_EMPTY_CONFIG_DIGEST,
                    "mediaType": release.OCI_EMPTY_CONFIG_MEDIA_TYPE,
                    "size": 2,
                },
                "layers": [
                    {
                        "annotations": {"org.opencontainers.image.title": archive.name},
                        "digest": release.sha256(archive.read_bytes()),
                        "mediaType": release.ARCHIVE_MEDIA_TYPE,
                        "size": archive.stat().st_size,
                    },
                    {
                        "annotations": {"org.opencontainers.image.title": inventory.name},
                        "digest": release.sha256(inventory.read_bytes()),
                        "mediaType": release.INVENTORY_MEDIA_TYPE,
                        "size": inventory.stat().st_size,
                    },
                ],
                "mediaType": release.OCI_MANIFEST_MEDIA_TYPE,
                "schemaVersion": 2,
            }
            raw = json.dumps(
                manifest, ensure_ascii=True, separators=(",", ":"), sort_keys=True
            ).encode("ascii")
            manifest_path = root / "manifest.json"
            manifest_path.write_bytes(raw)
            release.verify_integration_manifest(
                manifest_path,
                release.sha256(raw),
                archive,
                inventory,
                self.revision,
                created,
            )
            manifest["layers"][0]["size"] += 1
            tampered = json.dumps(
                manifest, ensure_ascii=True, separators=(",", ":"), sort_keys=True
            ).encode("ascii")
            manifest_path.write_bytes(tampered)
            with self.assertRaisesRegex(release.ContractError, "layer contract"):
                release.verify_integration_manifest(
                    manifest_path,
                    release.sha256(tampered),
                    archive,
                    inventory,
                    self.revision,
                    created,
                )

    def test_compose_is_one_nonroot_secret_backed_service(self) -> None:
        compose = (ROOT / "deployment/vps/compose.yaml").read_text()
        self.assertEqual(compose.count("  backend:\n"), 1)
        self.assertNotIn("ports:", compose)
        self.assertNotIn("  migrator:\n", compose)
        self.assertIn('user: "10001:10001"', compose)
        self.assertIn("OPENAI_API_KEY_FILE: /run/secrets/monflorian_openai_api_key", compose)
        self.assertIn("MONFLORIAN_ACCESS_MODE: public", compose)
        self.assertNotIn("OPENAI_API_KEY:", compose)
        self.assertNotIn("BOOKING_AFFILIATE", compose)

        if subprocess.run(
            ["docker", "compose", "version"],
            check=False,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        ).returncode == 0:
            environment = os.environ.copy()
            environment["MONFLORIAN_BACKEND_IMAGE"] = self.backend
            rendered = subprocess.run(
                [
                    "docker",
                    "compose",
                    "--file",
                    str(ROOT / "deployment/vps/compose.yaml"),
                    "config",
                    "--format",
                    "json",
                ],
                cwd=ROOT,
                env=environment,
                check=True,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
            )
            model = json.loads(rendered.stdout)
            self.assertEqual(set(model["services"]), {"backend"})
            self.assertNotIn("ports", model["services"]["backend"])
            self.assertEqual(set(model["services"]["backend"]["networks"]), {"app_monflorian"})


if __name__ == "__main__":
    unittest.main()
