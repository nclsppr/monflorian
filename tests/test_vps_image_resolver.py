from __future__ import annotations

import copy
import json
import sys
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts" / "lib"))

import vps_image_resolver as resolver  # noqa: E402


REVISION = "1" * 40
INDEX_DIGEST = "sha256:" + "2" * 64
RUNTIME_DIGEST = "sha256:" + "3" * 64
ATTESTATION_DIGEST = "sha256:" + "4" * 64


def image_index() -> dict[str, object]:
    return {
        "digest": INDEX_DIGEST,
        "manifests": [
            {
                "digest": RUNTIME_DIGEST,
                "mediaType": resolver.IMAGE_MANIFEST_MEDIA_TYPE,
                "platform": {"architecture": "amd64", "os": "linux"},
                "size": 100,
            },
            {
                "annotations": {
                    "vnd.docker.reference.digest": RUNTIME_DIGEST,
                    "vnd.docker.reference.type": "attestation-manifest",
                },
                "digest": ATTESTATION_DIGEST,
                "mediaType": resolver.IMAGE_MANIFEST_MEDIA_TYPE,
                "platform": {"architecture": "unknown", "os": "unknown"},
                "size": 100,
            },
        ],
        "mediaType": resolver.IMAGE_INDEX_MEDIA_TYPE,
        "schemaVersion": 2,
    }


def image_config() -> dict[str, object]:
    return {
        "architecture": "amd64",
        "config": {
            "Labels": {
                "org.opencontainers.image.revision": REVISION,
                "org.opencontainers.image.source": resolver.SOURCE_URL,
                "org.opencontainers.image.version": REVISION,
            },
            "User": "10001:10001",
        },
        "os": "linux",
    }


class ImageResolverTests(unittest.TestCase):
    def test_resolves_one_attested_linux_image(self) -> None:
        calls: list[list[str]] = []
        responses = iter(
            (
                json.dumps(image_index()).encode(),
                json.dumps(image_config()).encode(),
                b'[{"verificationResult":"success"}]',
            )
        )

        def runner(argv: list[str]) -> bytes:
            calls.append(argv)
            return next(responses)

        value = resolver.resolve_image(REVISION, runner=runner)
        self.assertEqual(
            value,
            {"backend": f"{resolver.IMAGE_REPOSITORY}@{INDEX_DIGEST}"},
        )
        self.assertIn("--deny-self-hosted-runners", calls[-1])
        self.assertIn(REVISION, calls[-1])

    def test_rejects_extra_platform_or_wrong_user(self) -> None:
        manifest = image_index()
        manifest["manifests"].append(copy.deepcopy(manifest["manifests"][0]))
        with self.assertRaisesRegex(resolver.ImageResolutionError, "one linux/amd64"):
            resolver.validate_image_metadata(REVISION, manifest, image_config())

        config = image_config()
        config["config"]["User"] = "root"
        with self.assertRaisesRegex(resolver.ImageResolutionError, "runtime user"):
            resolver.validate_image_metadata(REVISION, image_index(), config)

    def test_rejects_missing_source_label(self) -> None:
        config = image_config()
        del config["config"]["Labels"]["org.opencontainers.image.source"]
        with self.assertRaisesRegex(resolver.ImageResolutionError, "labels"):
            resolver.validate_image_metadata(REVISION, image_index(), config)


if __name__ == "__main__":
    unittest.main()
