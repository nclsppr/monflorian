import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { canonicalPublicRedirect } from "../app/http.mjs";

const config = JSON.parse(
  readFileSync(new URL("../wrangler.jsonc", import.meta.url), "utf8"),
);
const packageJson = JSON.parse(
  readFileSync(new URL("../package.json", import.meta.url), "utf8"),
);
const dockerfile = readFileSync(new URL("../Dockerfile", import.meta.url), "utf8");

test("le Worker porte les deux domaines publics exacts", () => {
  assert.deepEqual(config.routes, [
    { pattern: "monflorian.com", custom_domain: true },
    { pattern: "www.monflorian.com", custom_domain: true },
  ]);
  assert.equal(config.workers_dev, true, "workers.dev reste disponible pour le diagnostic");
  assert.equal(
    config.assets.run_worker_first,
    true,
    "le Worker doit voir les requêtes statiques pour canoniser les hôtes",
  );
  assert.equal(config.assets.html_handling, "drop-trailing-slash");
});

test("les lanceurs locaux gardent un hôte distinct des domaines publics", () => {
  assert.match(packageJson.scripts.dev, /--local-upstream 127\.0\.0\.1/u);
  assert.match(dockerfile, /"--local-upstream", "127\.0\.0\.1"/u);
});

test("les alias de migration restent sur leur environnement local ou de diagnostic", () => {
  for (const origin of ["http://127.0.0.1:8080", "http://localhost:5173", "https://monflorian.nclsppr.workers.dev"]) {
    const response = canonicalPublicRedirect(new Request(`${origin}/v2?voyage=japon-a-deux&avatar=flower`));
    assert.equal(response?.status, 308);
    assert.equal(response.headers.get("Location"), `${origin}/carnets/japon-10-jours?avatar=flower`);
    if (origin.includes(".workers.dev")) {
      assert.match(response.headers.get("X-Robots-Tag"), /noindex/u);
      assert.equal(response.headers.get("Cache-Control"), "no-store");
    }
  }
});
