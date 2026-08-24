import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const config = JSON.parse(
  readFileSync(new URL("../wrangler.jsonc", import.meta.url), "utf8"),
);

test("le Worker porte les deux domaines publics exacts", () => {
  assert.deepEqual(config.routes, [
    { pattern: "monflorian.com", custom_domain: true },
    { pattern: "www.monflorian.com", custom_domain: true },
  ]);
  assert.equal(config.workers_dev, true, "workers.dev reste disponible pour le diagnostic");
});
