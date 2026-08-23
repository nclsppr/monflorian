from __future__ import annotations

import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


class VpsWorkflowTests(unittest.TestCase):
    def test_image_workflow_publishes_one_attested_digest_on_every_main_push(self) -> None:
        workflow = (ROOT / ".github/workflows/images.yml").read_text()
        push_block = workflow.split("  pull_request:", maxsplit=1)[0]
        self.assertIn("  push:\n    branches:\n      - main", push_block)
        self.assertNotIn("paths:", push_block)
        self.assertEqual(workflow.count("file: Dockerfile"), 2)
        self.assertNotIn("matrix:", workflow)
        self.assertIn(
            "tags: ${{ env.IMAGE_REPOSITORY }}:${{ github.sha }}", workflow
        )
        self.assertIn("sbom: true", workflow)
        self.assertIn("provenance: mode=max", workflow)
        self.assertIn("actions/attest-build-provenance@", workflow)
        self.assertIn("--source-digest \"${GITHUB_SHA}\"", workflow)
        self.assertNotIn("OPENAI_API_KEY", workflow)

    def test_release_workflow_publishes_both_exact_oci_contracts(self) -> None:
        workflow = (ROOT / ".github/workflows/vps-integration.yml").read_text()
        self.assertIn("name: Validate application release", workflow)
        self.assertIn("name: Publish immutable application release", workflow)
        self.assertIn("  push:\n    branches:\n      - main", workflow)
        self.assertIn("  pull_request:\n    branches:\n      - main", workflow)
        self.assertNotIn("workflow_run", workflow)
        self.assertIn(
            "application/vnd.vps-infra.application-integration.v1", workflow
        )
        self.assertIn("application/vnd.vps-infra.application-release.v1", workflow)
        self.assertIn("./scripts/resolve-vps-images", workflow)
        self.assertIn(
            '"${APPLICATION_RELEASE_REPOSITORY}:sha-${GITHUB_SHA}"', workflow
        )
        self.assertIn("--deny-self-hosted-runners", workflow)
        self.assertGreaterEqual(workflow.count("Refuse a stale"), 2)
        self.assertIn("Publication does not activate a VPS deployment.", workflow)
        self.assertNotIn("OPENAI_API_KEY", workflow)
        self.assertNotIn("BOOKING_AFFILIATE", workflow)

    def test_public_preview_disables_paid_functions(self) -> None:
        caddy = (ROOT / "deployment/vps/caddy/monflorian.caddy").read_text()
        compose = (ROOT / "deployment/vps/compose.yaml").read_text()
        self.assertNotIn("monflorian-private-access.caddy", caddy)
        self.assertNotIn("basic_auth", caddy)
        self.assertNotIn("MONFLORIAN_ACCESS_CODE", compose)
        self.assertIn("MONFLORIAN_ACCESS_MODE: public", compose)
        self.assertIn('MONFLORIAN_GENERATION_ENABLED: "false"', compose)
        self.assertIn('MONFLORIAN_ILLUSTRATION_ENABLED: "false"', compose)
        self.assertIn("__SOURCE_REVISION__", caddy)


if __name__ == "__main__":
    unittest.main()
