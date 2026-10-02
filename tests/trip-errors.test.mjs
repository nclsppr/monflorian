import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { build } from "esbuild";

const { outputFiles } = await build({
  entryPoints: [fileURLToPath(new URL("../app/v2/src/TripCreator.jsx", import.meta.url))],
  bundle: true,
  write: false,
  platform: "node",
  format: "esm",
  loader: { ".css": "empty" },
  logLevel: "silent",
});
const { tripRequestFailure } = await import(`data:text/javascript;base64,${Buffer.from(outputFiles[0].text).toString("base64")}`);

test("seul un quota confirmé termine la clé de la demande refusée", () => {
  assert.deepEqual(tripRequestFailure("QUOTA_EXCEEDED", 429), { kind: "quota", terminal: true });
  for (const [code, status, kind] of [["INTERNAL_ERROR", 500, "request"], ["UNKNOWN_ERROR", 503, "request"], [undefined, 429, "input"], ["TRIP_CREATION_UNAVAILABLE", 503, "unavailable"], ["SERVICE_NOT_CONFIGURED", 503, "unavailable"]]) {
    assert.deepEqual(tripRequestFailure(code, status), { kind });
  }
});

test("les erreurs liées à un champ ou à la vérification gardent une action précise", () => {
  for (const [code, field] of [["ACCESS_REQUIRED", "accessCode"], ["INVALID_EMAIL", "email"], ["PAST_TRIP", "startDate"], ["TRIP_TOO_FAR", "endDate"], ["CONSENT_REQUIRED", "photoConsent"]]) {
    const failure = tripRequestFailure(code, 400);
    assert.equal(failure.field, field);
    assert.ok(failure.message.length > 15);
    assert.equal(failure.kind, undefined);
  }
  assert.equal(tripRequestFailure("TURNSTILE_UNAVAILABLE", 503).verification, true);
  assert.deepEqual(tripRequestFailure("ILLUSTRATION_UNAVAILABLE", 503), { kind: "photos" });
  assert.deepEqual(tripRequestFailure("EMAIL_UNAVAILABLE", 503), { kind: "email" });
});

test("un code inconnu ou malformé ne devient jamais une copie technique affichée", () => {
  for (const code of ["__proto__", "constructor", "toString", "Secret provider message", {}, null, ["ACCESS_REQUIRED"]]) {
    assert.deepEqual(tripRequestFailure(code, 400), { kind: "input" });
  }
});
