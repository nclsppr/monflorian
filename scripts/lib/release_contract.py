"""Build and verify the immutable Mon Florian release consumed by Atlas."""

from __future__ import annotations

import gzip
import hashlib
import io
import json
import os
import re
import stat
import subprocess
import tarfile
import zlib
from pathlib import Path
from typing import Any, Mapping


APPLICATION = "monflorian"
SOURCE_REPOSITORY = "nclsppr/monflorian"
SOURCE_URL = "https://github.com/nclsppr/monflorian"
IMAGE_REPOSITORY = "ghcr.io/nclsppr/monflorian/backend"
INTEGRATION_REPOSITORY = "ghcr.io/nclsppr/monflorian/vps-integration"
RELEASE_REPOSITORY = "ghcr.io/nclsppr/monflorian/application-release"

ARCHIVE_MEDIA_TYPE = "application/vnd.vps-infra.application-integration.v1+tar+gzip"
INVENTORY_MEDIA_TYPE = "application/vnd.vps-infra.application-integration.inventory.v1+json"
INTEGRATION_ARTIFACT_TYPE = "application/vnd.vps-infra.application-integration.v1"
RELEASE_LAYER_MEDIA_TYPE = "application/vnd.vps-infra.application-release.v1+json"
RELEASE_ARTIFACT_TYPE = "application/vnd.vps-infra.application-release.v1"
OCI_MANIFEST_MEDIA_TYPE = "application/vnd.oci.image.manifest.v1+json"
OCI_EMPTY_CONFIG_MEDIA_TYPE = "application/vnd.oci.empty.v1+json"
OCI_EMPTY_CONFIG_DIGEST = "sha256:44136fa355b3678a1146ad16f7e8649e94fb4fc21fe77e8310c060f61caaff8a"

REVISION_RE = re.compile(r"^[0-9a-f]{40}$")
DIGEST_RE = re.compile(r"^sha256:[0-9a-f]{64}$")
RFC3339_RE = re.compile(
    r"^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}"
    r"(?:\.[0-9]+)?(?:Z|[+-][0-9]{2}:[0-9]{2})$"
)
MAX_JSON_BYTES = 64 * 1024
MAX_ARCHIVE_BYTES = 2 * 1024 * 1024

RUNTIME_PATHS = (
    "caddy/monflorian.caddy",
    "compose.yaml",
    "contract.json",
    "expected-images.json",
    "migrations.json",
    "probes.json",
)
ARCHIVE_DIRECTORIES = ("integration", "integration/caddy")

REVISION_PLACEHOLDER = "__SOURCE_REVISION__"


class ContractError(ValueError):
    """A producer artifact differs from the exact Atlas contract."""


def _unique_object(pairs: list[tuple[str, Any]]) -> dict[str, Any]:
    result: dict[str, Any] = {}
    for key, value in pairs:
        if key in result:
            raise ContractError(f"duplicate JSON key: {key}")
        result[key] = value
    return result


def _reject_constant(value: str) -> None:
    raise ContractError(f"forbidden JSON constant: {value}")


def canonical_json(value: object) -> bytes:
    return (
        json.dumps(value, ensure_ascii=True, separators=(",", ":"), sort_keys=True)
        + "\n"
    ).encode("ascii")


def strict_json(raw: bytes, label: str, maximum: int = MAX_JSON_BYTES) -> object:
    if not 1 <= len(raw) <= maximum:
        raise ContractError(f"{label} size is outside the limit")
    try:
        return json.loads(
            raw.decode("utf-8", errors="strict"),
            object_pairs_hook=_unique_object,
            parse_constant=_reject_constant,
        )
    except (UnicodeDecodeError, json.JSONDecodeError, RecursionError) as exc:
        raise ContractError(f"{label} is not strict UTF-8 JSON: {exc}") from exc


def sha256(raw: bytes) -> str:
    return f"sha256:{hashlib.sha256(raw).hexdigest()}"


def immutable_reference(value: object, repository: str, label: str) -> str:
    prefix = f"{repository}@"
    if (
        not isinstance(value, str)
        or not value.startswith(prefix)
        or DIGEST_RE.fullmatch(value.removeprefix(prefix)) is None
    ):
        raise ContractError(f"{label} must be an untagged digest in {repository}")
    return value


def validate_revision(value: str) -> str:
    if REVISION_RE.fullmatch(value) is None:
        raise ContractError("revision must be a full lowercase Git SHA")
    return value


def resolve_revision(root: Path, value: str) -> str:
    try:
        revision = subprocess.run(
            ["git", "-C", str(root), "rev-parse", "--verify", f"{value}^{{commit}}"],
            check=True,
            stdin=subprocess.DEVNULL,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
        ).stdout.strip()
        head = subprocess.run(
            ["git", "-C", str(root), "rev-parse", "HEAD"],
            check=True,
            stdin=subprocess.DEVNULL,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
        ).stdout.strip()
    except (OSError, subprocess.CalledProcessError) as exc:
        raise ContractError("revision cannot be resolved from the checkout") from exc
    validate_revision(revision)
    if revision != head:
        raise ContractError("revision differs from the checked-out commit")
    return revision


def commit_created(root: Path, revision: str) -> str:
    try:
        created = subprocess.run(
            ["git", "-C", str(root), "show", "-s", "--format=%cI", revision],
            check=True,
            stdin=subprocess.DEVNULL,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
        ).stdout.strip()
    except (OSError, subprocess.CalledProcessError) as exc:
        raise ContractError("commit timestamp cannot be resolved") from exc
    if RFC3339_RE.fullmatch(created) is None:
        raise ContractError("commit timestamp is not RFC 3339")
    return created


def read_regular(path: Path, label: str, maximum: int = MAX_JSON_BYTES) -> bytes:
    try:
        metadata = path.lstat()
    except OSError as exc:
        raise ContractError(f"cannot inspect {label}: {exc}") from exc
    if not stat.S_ISREG(metadata.st_mode) or metadata.st_nlink != 1:
        raise ContractError(f"{label} is not one regular file")
    if not 1 <= metadata.st_size <= maximum:
        raise ContractError(f"{label} size is outside the limit")
    try:
        raw = path.read_bytes()
        raw.decode("utf-8", errors="strict")
    except (OSError, UnicodeDecodeError) as exc:
        raise ContractError(f"{label} is not readable UTF-8 text") from exc
    if b"\x00" in raw:
        raise ContractError(f"{label} contains a NUL byte")
    return raw


def load_expected_images(raw: bytes, revision: str) -> dict[str, str]:
    value = strict_json(raw, "expected image inventory")
    if raw != canonical_json(value) or not isinstance(value, dict):
        raise ContractError("expected image inventory is not canonical JSON")
    expected_keys = {"images", "schema", "source_revision"}
    if set(value) != expected_keys or value.get("schema") != 1:
        raise ContractError("expected image inventory fields are invalid")
    if value.get("source_revision") != revision:
        raise ContractError("expected image inventory revision differs")
    images = value.get("images")
    if not isinstance(images, dict) or set(images) != {"backend"}:
        raise ContractError("expected image inventory must contain backend only")
    return {
        "backend": immutable_reference(
            images["backend"], IMAGE_REPOSITORY, "backend image"
        )
    }


def expected_images(revision: str, backend: str) -> dict[str, object]:
    validate_revision(revision)
    backend = immutable_reference(backend, IMAGE_REPOSITORY, "backend image")
    return {
        "images": {"backend": backend},
        "schema": 1,
        "source_revision": revision,
    }


def expected_contract(revision: str) -> dict[str, object]:
    validate_revision(revision)
    return {
        "application": APPLICATION,
        "compose_file": "compose.yaml",
        "compose_project": APPLICATION,
        "contract": "monflorian.vps-integration",
        "image_variables": {"backend": "MONFLORIAN_BACKEND_IMAGE"},
        "migration": {"runtime_auto_migrate": False, "strategy": "none"},
        "networks": ["app_monflorian"],
        "public_hosts": ["monflorian.com", "www.monflorian.com"],
        "route_owner": "compose",
        "runtime_services": ["backend"],
        "schema": 1,
        "secrets": ["monflorian-openai-api-key"],
        "source_repository": SOURCE_REPOSITORY,
        "source_revision": revision,
        "transient_services": [],
    }


def expected_migrations(revision: str) -> dict[str, object]:
    validate_revision(revision)
    return {
        "contract": "monflorian.migrations",
        "migrations": [],
        "runtime_auto_migrate": False,
        "schema": 1,
        "source_repository": SOURCE_REPOSITORY,
        "source_revision": revision,
        "strategy": "none",
    }


def expected_probes(revision: str) -> dict[str, object]:
    validate_revision(revision)
    return {
        "contract": "monflorian.probes",
        "internal": [
            {
                "body_contains": '"status":"ok"',
                "service": "backend",
                "status": 200,
                "url": "http://monflorian-backend:8080/api/health",
            }
        ],
        "public": [
            {
                "body_contains": revision,
                "host": "monflorian.com",
                "path": "/.well-known/monflorian-release",
                "status": 200,
            },
            {"host": "monflorian.com", "path": "/", "status": 200},
            {
                "body_contains": '"serviceReady":false',
                "host": "monflorian.com",
                "path": "/api/config",
                "status": 200,
            },
            {"host": "www.monflorian.com", "path": "/", "status": 308},
        ],
        "schema": 1,
    }


def probe_template() -> dict[str, object]:
    value = expected_probes("0" * 40)
    value["public"][0]["body_contains"] = REVISION_PLACEHOLDER
    return value


def _validate_runtime_sources(root: Path, revision: str) -> tuple[bytes, bytes, bytes]:
    source = root / "deployment" / "vps"
    compose = read_regular(source / "compose.yaml", "VPS Compose source")
    caddy = read_regular(
        source / "caddy" / "monflorian.caddy", "VPS Caddy source"
    )
    probes = read_regular(source / "probes.json", "VPS probe source")
    if probes != canonical_json(probe_template()):
        raise ContractError("VPS probe source differs from the no-cost probe policy")
    required_compose = (
        b"image: ${MONFLORIAN_BACKEND_IMAGE:",
        b"OPENAI_API_KEY_FILE: /run/secrets/monflorian_openai_api_key",
        b'MONFLORIAN_GENERATION_ENABLED: "false"',
        b'MONFLORIAN_ILLUSTRATION_ENABLED: "false"',
        b"file: /etc/vps/secrets/monflorian/monflorian-openai-api-key",
        b"external: true",
        b"name: app_monflorian",
        b"read_only: true",
        b"no-new-privileges:true",
    )
    if any(fragment not in compose for fragment in required_compose):
        raise ContractError("VPS Compose source misses a required runtime control")
    forbidden_compose = (b"ports:", b"OPENAI_API_KEY:", b"latest", b"migrator:")
    if any(fragment in compose for fragment in forbidden_compose):
        raise ContractError("VPS Compose source contains a forbidden runtime feature")
    required_caddy = (
        b"handle /.well-known/monflorian-release",
        b"reverse_proxy monflorian-backend:8080",
    )
    if any(fragment not in caddy for fragment in required_caddy):
        raise ContractError("VPS Caddy source misses preview edge or identity routing")
    if b"dns ovh" in caddy or b"OVH_" in caddy or b"basic_auth" in caddy:
        raise ContractError("VPS Caddy source packages DNS or access credentials")
    placeholder = REVISION_PLACEHOLDER.encode("ascii")
    if caddy.count(placeholder) != 1 or probes.count(placeholder) != 1:
        raise ContractError("runtime identity must contain one source revision placeholder")
    return (
        compose,
        caddy.replace(placeholder, revision.encode("ascii")),
        canonical_json(expected_probes(revision)),
    )


def _integration_files(
    root: Path, revision: str, images: Mapping[str, str]
) -> dict[str, bytes]:
    compose, caddy, probes = _validate_runtime_sources(root, revision)
    result = {
        "caddy/monflorian.caddy": caddy,
        "compose.yaml": compose,
        "contract.json": canonical_json(expected_contract(revision)),
        "expected-images.json": canonical_json(
            expected_images(revision, images["backend"])
        ),
        "migrations.json": canonical_json(expected_migrations(revision)),
        "probes.json": probes,
    }
    if tuple(sorted(result)) != RUNTIME_PATHS:
        raise ContractError("integration file allowlist differs")
    return result


def inventory_for(files: Mapping[str, bytes], revision: str) -> dict[str, object]:
    return {
        "contract": "vps-infra.application-integration.v1",
        "files": [
            {
                "bytes": len(files[path]),
                "path": path,
                "sha256": hashlib.sha256(files[path]).hexdigest(),
            }
            for path in RUNTIME_PATHS
        ],
        "schema": 1,
        "source": {"repository": SOURCE_REPOSITORY, "revision": revision},
    }


def archive_for(files: Mapping[str, bytes]) -> bytes:
    stream = io.BytesIO()
    with tarfile.open(fileobj=stream, mode="w", format=tarfile.USTAR_FORMAT) as archive:
        for directory in ARCHIVE_DIRECTORIES:
            member = tarfile.TarInfo(directory)
            member.type = tarfile.DIRTYPE
            member.mode = 0o755
            member.uid = member.gid = 0
            member.mtime = 0
            archive.addfile(member)
        for path in RUNTIME_PATHS:
            content = files[path]
            member = tarfile.TarInfo(f"integration/{path}")
            member.mode = 0o644
            member.uid = member.gid = 0
            member.mtime = 0
            member.size = len(content)
            archive.addfile(member, io.BytesIO(content))
    compressed = io.BytesIO()
    with gzip.GzipFile(filename="", mode="wb", fileobj=compressed, mtime=0) as gzip_file:
        gzip_file.write(stream.getvalue())
    return compressed.getvalue()


def _write_new(path: Path, content: bytes, mode: int = 0o644) -> None:
    if path.exists() or path.is_symlink():
        raise ContractError(f"output already exists: {path}")
    flags = os.O_WRONLY | os.O_CREAT | os.O_EXCL
    if hasattr(os, "O_NOFOLLOW"):
        flags |= os.O_NOFOLLOW
    descriptor = os.open(path, flags, mode)
    try:
        remaining = memoryview(content)
        while remaining:
            written = os.write(descriptor, remaining)
            if written <= 0:
                raise ContractError(f"short write for output: {path}")
            remaining = remaining[written:]
        os.fchmod(descriptor, mode)
    finally:
        os.close(descriptor)


def build_integration(
    root: Path, output: Path, revision_value: str, images_path: Path
) -> dict[str, str]:
    revision = resolve_revision(root, revision_value)
    images_raw = read_regular(images_path, "component image input")
    images = load_expected_images(
        canonical_json(
            {
                "images": strict_json(images_raw, "component image input"),
                "schema": 1,
                "source_revision": revision,
            }
        ),
        revision,
    )
    if images_raw != canonical_json(images):
        raise ContractError("component image input must be canonical backend mapping JSON")
    if output.exists() or output.is_symlink():
        raise ContractError("integration output directory must not exist")
    output.mkdir(mode=0o755, parents=True)
    files = _integration_files(root, revision, images)
    inventory = canonical_json(inventory_for(files, revision))
    archive = archive_for(files)
    if not 1 <= len(archive) <= MAX_ARCHIVE_BYTES:
        raise ContractError("integration archive size is outside the limit")
    _write_new(output / "integration.tar.gz", archive)
    _write_new(output / "inventory.json", inventory)
    for name in ("expected-images.json", "migrations.json", "probes.json"):
        _write_new(output / name, files[name])
    created = commit_created(root, revision)
    return {
        "archive": str(output / "integration.tar.gz"),
        "archive_digest": sha256(archive),
        "created": created,
        "expected_images": str(output / "expected-images.json"),
        "inventory": str(output / "inventory.json"),
        "inventory_digest": sha256(inventory),
        "migrations": str(output / "migrations.json"),
        "probes": str(output / "probes.json"),
        "revision": revision,
    }


def _validated_archive_files(
    archive_raw: bytes, inventory_raw: bytes, revision: str
) -> dict[str, bytes]:
    if not 1 <= len(archive_raw) <= MAX_ARCHIVE_BYTES:
        raise ContractError("integration archive size is outside the limit")
    inventory = strict_json(inventory_raw, "integration inventory")
    if inventory_raw != canonical_json(inventory) or not isinstance(inventory, dict):
        raise ContractError("integration inventory is not canonical JSON")
    if set(inventory) != {"contract", "files", "schema", "source"}:
        raise ContractError("integration inventory fields are invalid")
    if (
        inventory.get("contract") != "vps-infra.application-integration.v1"
        or inventory.get("schema") != 1
        or inventory.get("source")
        != {"repository": SOURCE_REPOSITORY, "revision": revision}
    ):
        raise ContractError("integration inventory identity differs")
    records = inventory.get("files")
    if not isinstance(records, list) or len(records) != len(RUNTIME_PATHS):
        raise ContractError("integration inventory file count differs")
    by_path: dict[str, dict[str, object]] = {}
    for record in records:
        if not isinstance(record, dict) or set(record) != {"bytes", "path", "sha256"}:
            raise ContractError("integration inventory record fields are invalid")
        path = record.get("path")
        if not isinstance(path, str) or path in by_path:
            raise ContractError("integration inventory path is invalid or duplicated")
        if type(record.get("bytes")) is not int or not 1 <= record["bytes"] <= MAX_JSON_BYTES:
            raise ContractError("integration inventory byte count is invalid")
        if not isinstance(record.get("sha256"), str) or re.fullmatch(
            r"[0-9a-f]{64}", record["sha256"]
        ) is None:
            raise ContractError("integration inventory digest is invalid")
        by_path[path] = record
    if tuple(sorted(by_path)) != RUNTIME_PATHS:
        raise ContractError("integration inventory path allowlist differs")
    try:
        tar_raw = gzip.decompress(archive_raw)
    except (gzip.BadGzipFile, EOFError, OSError, zlib.error) as exc:
        raise ContractError("integration archive is not valid gzip") from exc
    if len(tar_raw) < 1024 or tar_raw[257:265] != b"ustar\x0000":
        raise ContractError("integration archive is not deterministic USTAR")
    files: dict[str, bytes] = {}
    try:
        with tarfile.open(fileobj=io.BytesIO(tar_raw), mode="r:") as archive:
            members = archive.getmembers()
            if len({member.name for member in members}) != len(members):
                raise ContractError("integration archive contains duplicate members")
            expected_names = {*ARCHIVE_DIRECTORIES}
            expected_names.update(f"integration/{path}" for path in RUNTIME_PATHS)
            if {member.name for member in members} != expected_names:
                raise ContractError("integration archive member allowlist differs")
            for member in members:
                if member.uid != 0 or member.gid != 0 or member.mtime != 0:
                    raise ContractError("integration archive metadata differs")
                if member.name in ARCHIVE_DIRECTORIES:
                    if not member.isdir() or member.mode != 0o755:
                        raise ContractError("integration archive directory mode differs")
                    continue
                if not member.isfile() or member.mode != 0o644 or member.linkname:
                    raise ContractError("integration archive file metadata differs")
                relative = member.name.removeprefix("integration/")
                stream = archive.extractfile(member)
                if stream is None:
                    raise ContractError("integration archive file cannot be read")
                content = stream.read(MAX_JSON_BYTES + 1)
                record = by_path[relative]
                if len(content) != record["bytes"] or hashlib.sha256(content).hexdigest() != record["sha256"]:
                    raise ContractError("integration archive differs from its inventory")
                try:
                    content.decode("utf-8", errors="strict")
                except UnicodeDecodeError as exc:
                    raise ContractError("integration archive contains non-UTF-8 text") from exc
                files[relative] = content
    except (tarfile.TarError, EOFError) as exc:
        raise ContractError("integration archive is invalid") from exc
    return files


def verify_integration(
    root: Path,
    archive_path: Path,
    inventory_path: Path,
    revision: str,
    expected_created: str | None = None,
) -> dict[str, bytes]:
    validate_revision(revision)
    if expected_created is not None and RFC3339_RE.fullmatch(expected_created) is None:
        raise ContractError("expected creation time is not RFC 3339")
    archive_raw = archive_path.read_bytes()
    inventory_raw = inventory_path.read_bytes()
    files = _validated_archive_files(archive_raw, inventory_raw, revision)
    images = load_expected_images(files["expected-images.json"], revision)
    expected = _integration_files(root, revision, images)
    if files != expected:
        raise ContractError("integration archive differs from the checked-out contract")
    if expected_created is not None and commit_created(root, revision) != expected_created:
        raise ContractError("integration creation time differs from the source commit")
    return files


def expected_release(
    revision: str,
    backend: str,
    integration: str,
    migrations_digest: str,
    probes_digest: str,
) -> dict[str, object]:
    validate_revision(revision)
    backend = immutable_reference(backend, IMAGE_REPOSITORY, "backend image")
    integration = immutable_reference(
        integration, INTEGRATION_REPOSITORY, "integration artifact"
    )
    if DIGEST_RE.fullmatch(migrations_digest) is None:
        raise ContractError("migration inventory digest is invalid")
    if DIGEST_RE.fullmatch(probes_digest) is None:
        raise ContractError("probe inventory digest is invalid")
    return {
        "application": APPLICATION,
        "components": {
            "backend": {"image": backend, "source_revision": revision}
        },
        "contract": "vps-infra.application-release.v1",
        "integration": {"artifact": integration, "source_revision": revision},
        "migrations": {
            "inventory_artifact": integration,
            "inventory_sha256": migrations_digest,
            "runtime_auto_migrate": False,
            "strategy": "none",
        },
        "probes": {
            "inventory_artifact": integration,
            "inventory_sha256": probes_digest,
        },
        "schema": 1,
        "source": {
            "branch": "main",
            "repository": SOURCE_REPOSITORY,
            "revision": revision,
        },
    }


def _release_inputs(
    revision: str,
    expected_images_path: Path,
    integration: str,
    migrations_path: Path,
    probes_path: Path,
) -> dict[str, object]:
    images_raw = expected_images_path.read_bytes()
    images = load_expected_images(images_raw, revision)
    migrations_raw = migrations_path.read_bytes()
    migrations = strict_json(migrations_raw, "migration inventory")
    if migrations_raw != canonical_json(migrations) or migrations != expected_migrations(revision):
        raise ContractError("migration inventory differs from the none strategy")
    probes_raw = probes_path.read_bytes()
    probes = strict_json(probes_raw, "probe inventory")
    if probes_raw != canonical_json(probes) or probes != expected_probes(revision):
        raise ContractError("probe inventory differs from the no-cost policy")
    return expected_release(
        revision,
        images["backend"],
        integration,
        sha256(migrations_raw),
        sha256(probes_raw),
    )


def build_application_release(
    output: Path,
    revision: str,
    expected_images_path: Path,
    integration: str,
    migrations_path: Path,
    probes_path: Path,
) -> dict[str, str]:
    document = _release_inputs(
        revision, expected_images_path, integration, migrations_path, probes_path
    )
    raw = canonical_json(document)
    _write_new(output, raw)
    return {"release": str(output), "release_digest": sha256(raw)}


def verify_application_release(
    release_path: Path,
    revision: str,
    expected_images_path: Path,
    integration: str,
    migrations_path: Path,
    probes_path: Path,
) -> dict[str, object]:
    expected = _release_inputs(
        revision, expected_images_path, integration, migrations_path, probes_path
    )
    raw = release_path.read_bytes()
    value = strict_json(raw, "application release")
    if raw != canonical_json(value) or value != expected:
        raise ContractError("application release differs from the exact Atlas descriptor")
    return expected


def _verify_manifest_common(
    manifest_path: Path,
    expected_digest: str,
    revision: str,
    created: str,
    artifact_type: str,
    layers: list[dict[str, object]],
) -> None:
    validate_revision(revision)
    if DIGEST_RE.fullmatch(expected_digest) is None:
        raise ContractError("manifest digest is invalid")
    if RFC3339_RE.fullmatch(created) is None:
        raise ContractError("manifest creation time is not RFC 3339")
    raw = manifest_path.read_bytes()
    value = strict_json(raw, "OCI manifest")
    if sha256(raw) != expected_digest:
        raise ContractError("OCI manifest bytes differ from the published digest")
    expected = {
        "annotations": {
            "org.opencontainers.image.created": created,
            "org.opencontainers.image.revision": revision,
            "org.opencontainers.image.source": SOURCE_URL,
        },
        "artifactType": artifact_type,
        "config": {
            "data": "e30=",
            "digest": OCI_EMPTY_CONFIG_DIGEST,
            "mediaType": OCI_EMPTY_CONFIG_MEDIA_TYPE,
            "size": 2,
        },
        "layers": layers,
        "mediaType": OCI_MANIFEST_MEDIA_TYPE,
        "schemaVersion": 2,
    }
    if value != expected:
        raise ContractError("OCI manifest differs from the exact Atlas layer contract")


def verify_integration_manifest(
    manifest_path: Path,
    expected_digest: str,
    archive_path: Path,
    inventory_path: Path,
    revision: str,
    created: str,
) -> None:
    archive = archive_path.read_bytes()
    inventory = inventory_path.read_bytes()
    _verify_manifest_common(
        manifest_path,
        expected_digest,
        revision,
        created,
        INTEGRATION_ARTIFACT_TYPE,
        [
            {
                "annotations": {"org.opencontainers.image.title": "integration.tar.gz"},
                "digest": sha256(archive),
                "mediaType": ARCHIVE_MEDIA_TYPE,
                "size": len(archive),
            },
            {
                "annotations": {"org.opencontainers.image.title": "inventory.json"},
                "digest": sha256(inventory),
                "mediaType": INVENTORY_MEDIA_TYPE,
                "size": len(inventory),
            },
        ],
    )


def verify_release_manifest(
    manifest_path: Path,
    expected_digest: str,
    release_path: Path,
    revision: str,
    created: str,
) -> None:
    release = release_path.read_bytes()
    _verify_manifest_common(
        manifest_path,
        expected_digest,
        revision,
        created,
        RELEASE_ARTIFACT_TYPE,
        [
            {
                "annotations": {
                    "org.opencontainers.image.title": "application-release.json"
                },
                "digest": sha256(release),
                "mediaType": RELEASE_LAYER_MEDIA_TYPE,
                "size": len(release),
            }
        ],
    )


def append_github_outputs(path: Path, values: Mapping[str, str]) -> None:
    metadata = path.lstat()
    if not stat.S_ISREG(metadata.st_mode):
        raise ContractError("GitHub output is not a regular file")
    with path.open("a", encoding="utf-8") as output:
        for key in sorted(values):
            value = values[key]
            if "\n" in value or "\r" in value:
                raise ContractError("GitHub output contains a newline")
            output.write(f"{key}={value}\n")
