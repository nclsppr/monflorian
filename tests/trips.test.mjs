import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { AppError } from "../app/core.mjs";
import {
  decryptJson,
  encryptJson,
  generatedObjectKey,
  generateTripToken,
  hmacSha256Hex,
  isTripToken,
  sha256Hex,
  sourceObjectKey,
  validateIdempotencyKey,
  validateTripCreationInput,
} from "../app/trips.mjs";
import { pngDataUrl } from "./helpers.mjs";

const secret = Buffer.alloc(32, 7).toString("base64");

function tripRequest(overrides = {}) {
  return {
    brief: "Dix jours au Portugal en octobre, sans voiture, avec quelques étapes près de l’océan.",
    startDate: null,
    endDate: null,
    travelers: 2,
    pace: "balanced",
    email: "voyageur@example.com",
    photos: [],
    photoConsent: false,
    ...overrides,
  };
}

test("la demande unique valide courriel et consentement photo", () => {
  const withoutPhoto = validateTripCreationInput(tripRequest());
  assert.equal(withoutPhoto.email, "voyageur@example.com");
  assert.equal(withoutPhoto.photos.length, 0);
  assert.equal(withoutPhoto.photoConsent, false);

  assert.throws(
    () => validateTripCreationInput(tripRequest({
      photos: [pngDataUrl()],
      photoConsent: false,
    })),
    (error) => error instanceof AppError && error.code === "CONSENT_REQUIRED",
  );

  const withPhoto = validateTripCreationInput(tripRequest({
    photos: [pngDataUrl()],
    photoConsent: true,
  }));
  assert.equal(withPhoto.photos.length, 1);
  assert.equal(withPhoto.photoConsent, true);
  assert.equal(sourceObjectKey("trip-id", 0, withPhoto.photos[0].mimeType), "source/trip-id/0.png");
  assert.equal(generatedObjectKey("trip-id", 0), "generated/trip-id/0.webp");
});

test("le jeton prive et les cles de soumission restent non reversibles dans les index", async () => {
  const token = generateTripToken();
  assert.equal(isTripToken(token), true);
  assert.equal(token.length, 43);
  assert.match(await sha256Hex(token), /^[a-f0-9]{64}$/u);
  assert.match(await hmacSha256Hex(secret, "submission-key-1234"), /^[a-f0-9]{64}$/u);
  assert.equal(validateIdempotencyKey("submission-key-1234"), "submission-key-1234");
  assert.throws(
    () => validateIdempotencyKey("short"),
    (error) => error instanceof AppError && error.code === "INVALID_IDEMPOTENCY_KEY",
  );
});

test("le chiffrement lie chaque champ a son voyage", async () => {
  const value = { email: "voyageur@example.com", brief: "Un voyage prive" };
  const encrypted = await encryptJson(secret, value, "trip-1:request");
  assert.notEqual(Buffer.from(encrypted.ciphertext).includes(Buffer.from("voyageur@example.com")), true);
  assert.deepEqual(
    await decryptJson(secret, encrypted.ciphertext, encrypted.nonce, "trip-1:request"),
    value,
  );
  await assert.rejects(
    decryptJson(secret, encrypted.ciphertext, encrypted.nonce, "trip-2:request"),
    (error) => error instanceof AppError && error.code === "TRIP_DATA_UNREADABLE",
  );
});

test("la configuration R2 reste privee et les routes masquent les jetons", () => {
  const config = JSON.parse(readFileSync(new URL("../wrangler.jsonc", import.meta.url), "utf8"));
  const worker = readFileSync(new URL("../src/worker.ts", import.meta.url), "utf8");
  const page = readFileSync(new URL("../src/trips/page.ts", import.meta.url), "utf8");
  const workflow = readFileSync(new URL("../src/workflows/trip.ts", import.meta.url), "utf8");
  const quotaMigration = readFileSync(new URL("../migrations/0003_atomic_quotas.sql", import.meta.url), "utf8");

  assert.deepEqual(config.r2_buckets, [{
    binding: "MEDIA",
    bucket_name: "monflorian-media-production",
    jurisdiction: "eu",
  }]);
  assert.ok(config.assets.run_worker_first.includes("/voyages/*"));
  assert.equal(config.observability.logs.invocation_logs, false);
  assert.equal(config.vars.MONFLORIAN_TRIP_CREATION_ENABLED, "false");
  assert.equal(config.vars.MONFLORIAN_EMAIL_ENABLED, "false");
  assert.deepEqual(
    [config.vars.MONFLORIAN_DAILY_GLOBAL_LIMIT, config.vars.MONFLORIAN_DAILY_CLIENT_LIMIT],
    ["10", "2"],
  );
  assert.match(worker, /return "\/voyages\/:token"/u);
  assert.match(worker, /return "\/api\/trips\/:token\/media\/:position"/u);
  assert.doesNotMatch(worker, /path:\s*url\.pathname/u);
  assert.match(page, /noindex, nofollow, noarchive/u);
  assert.match(page, /"Cache-Control": "no-store, max-age=0"/u);
  assert.match(page, /aria-busy="true"/u);
  assert.match(page, /Projection personnalisée · image générée/u);
  assert.match(quotaMigration, /RAISE\(ABORT, 'quota_exceeded'\)/u);
  assert.doesNotMatch(workflow, /limit:\s*[1-9]/u);
  assert.match(workflow, /generate-and-encrypt-itinerary/u);
  assert.match(workflow, /generate-store-and-encrypt-image/u);
});
