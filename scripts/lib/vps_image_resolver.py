"""Resolve and verify the single Mon Florian image published for Atlas."""

from __future__ import annotations

import subprocess
from typing import Any, Callable

from release_contract import (
    IMAGE_REPOSITORY,
    SOURCE_REPOSITORY,
    SOURCE_URL,
    ContractError,
    DIGEST_RE,
    canonical_json,
    strict_json,
    validate_revision,
)


IMAGE_INDEX_MEDIA_TYPE = "application/vnd.oci.image.index.v1+json"
IMAGE_MANIFEST_MEDIA_TYPE = "application/vnd.oci.image.manifest.v1+json"
SIGNER_WORKFLOW = "nclsppr/monflorian/.github/workflows/images.yml"


class ImageResolutionError(ContractError):
    """The published image is outside the producer policy."""


def run(argv: list[str]) -> bytes:
    try:
        result = subprocess.run(
            argv,
            check=False,
            stdin=subprocess.DEVNULL,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
        )
    except OSError as exc:
        raise ImageResolutionError(f"cannot execute {argv[0]}: {exc}") from exc
    if result.returncode != 0:
        detail = result.stderr.decode("utf-8", errors="replace").strip()
        raise ImageResolutionError(
            f"{argv[0]} failed with code {result.returncode}: {detail}"
        )
    if len(result.stdout) > 10 * 1024 * 1024:
        raise ImageResolutionError(f"{argv[0]} output exceeds the safety limit")
    return result.stdout


def validate_image_metadata(revision: str, manifest: object, image: object) -> str:
    validate_revision(revision)
    if not isinstance(manifest, dict):
        raise ImageResolutionError("image index must be an object")
    if (
        manifest.get("schemaVersion") != 2
        or manifest.get("mediaType") != IMAGE_INDEX_MEDIA_TYPE
    ):
        raise ImageResolutionError("image must use one OCI index")
    digest = manifest.get("digest")
    if not isinstance(digest, str) or DIGEST_RE.fullmatch(digest) is None:
        raise ImageResolutionError("image index digest is invalid")
    descriptors = manifest.get("manifests")
    if not isinstance(descriptors, list) or len(descriptors) != 2:
        raise ImageResolutionError(
            "image index must contain one linux/amd64 image and one attestation"
        )
    runtime: list[dict[str, Any]] = []
    attestations: list[dict[str, Any]] = []
    for descriptor in descriptors:
        if not isinstance(descriptor, dict):
            raise ImageResolutionError("image descriptor must be an object")
        if descriptor.get("mediaType") != IMAGE_MANIFEST_MEDIA_TYPE:
            raise ImageResolutionError("image descriptor media type is invalid")
        platform = descriptor.get("platform")
        if platform == {"architecture": "amd64", "os": "linux"}:
            runtime.append(descriptor)
        elif platform == {"architecture": "unknown", "os": "unknown"}:
            attestations.append(descriptor)
        else:
            raise ImageResolutionError("image index contains an unsupported platform")
    if len(runtime) != 1 or len(attestations) != 1:
        raise ImageResolutionError("image platform cardinality is invalid")
    runtime_digest = runtime[0].get("digest")
    if not isinstance(runtime_digest, str) or DIGEST_RE.fullmatch(runtime_digest) is None:
        raise ImageResolutionError("runtime image digest is invalid")
    if attestations[0].get("annotations") != {
        "vnd.docker.reference.digest": runtime_digest,
        "vnd.docker.reference.type": "attestation-manifest",
    }:
        raise ImageResolutionError("image attestation descriptor is invalid")
    if (
        not isinstance(image, dict)
        or image.get("os") != "linux"
        or image.get("architecture") != "amd64"
    ):
        raise ImageResolutionError("resolved runtime image is not linux/amd64")
    config = image.get("config")
    labels = config.get("Labels") if isinstance(config, dict) else None
    required_labels = {
        "org.opencontainers.image.revision": revision,
        "org.opencontainers.image.source": SOURCE_URL,
        "org.opencontainers.image.version": revision,
    }
    if not isinstance(labels, dict) or any(
        labels.get(key) != expected for key, expected in required_labels.items()
    ):
        raise ImageResolutionError("image labels do not bind the exact source revision")
    if not isinstance(config, dict) or config.get("User") != "10001:10001":
        raise ImageResolutionError("image runtime user differs from 10001:10001")
    return f"{IMAGE_REPOSITORY}@{digest}"


def resolve_image(
    revision: str, runner: Callable[[list[str]], bytes] = run
) -> dict[str, str]:
    validate_revision(revision)
    tag = f"{IMAGE_REPOSITORY}:{revision}"
    manifest = strict_json(
        runner(
            [
                "docker",
                "buildx",
                "imagetools",
                "inspect",
                tag,
                "--format",
                "{{json .Manifest}}",
            ]
        ),
        "backend image index",
        10 * 1024 * 1024,
    )
    image = strict_json(
        runner(
            [
                "docker",
                "buildx",
                "imagetools",
                "inspect",
                tag,
                "--format",
                "{{json .Image}}",
            ]
        ),
        "backend image config",
        10 * 1024 * 1024,
    )
    reference = validate_image_metadata(revision, manifest, image)
    attestation = strict_json(
        runner(
            [
                "gh",
                "attestation",
                "verify",
                f"oci://{reference}",
                "--repo",
                SOURCE_REPOSITORY,
                "--source-digest",
                revision,
                "--source-ref",
                "refs/heads/main",
                "--signer-workflow",
                SIGNER_WORKFLOW,
                "--deny-self-hosted-runners",
                "--format",
                "json",
            ]
        ),
        "GitHub image attestation",
        10 * 1024 * 1024,
    )
    if not isinstance(attestation, list) or not attestation:
        raise ImageResolutionError("GitHub returned no verified image attestation")
    return {"backend": reference}


def resolved_image_bytes(images: dict[str, str]) -> bytes:
    if set(images) != {"backend"}:
        raise ImageResolutionError("resolved image map differs from the allowlist")
    immutable = images["backend"]
    if not immutable.startswith(f"{IMAGE_REPOSITORY}@"):
        raise ImageResolutionError("resolved image repository differs")
    return canonical_json(images)
