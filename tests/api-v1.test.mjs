import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { rolldown } from "rolldown";
import { publicJapanExample, projectPublicTravelGuide } from "../app/public-travel-guide.mjs";
import { API_CONTRACT } from "../app/public/api-contract.js";
import viteConfig from "../vite.v2.config.js";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const configuration = JSON.parse(read("../wrangler.jsonc"));
const contract = JSON.parse(read("../docs/api/openapi.json"));

// Le vrai routeur est exécuté ; seule la classe de base du Workflow Cloudflare
// est remplacée pour l'import Node. Aucun Workflow ni fournisseur n'est appelé.
const bundle = await rolldown({
  input: new URL("../src/worker.ts", import.meta.url).pathname,
  platform: "node",
  plugins: [{
    name: "test-workflow-base",
    resolveId(id) { return id === "cloudflare:workers" ? "\0test-workflow-base" : null; },
    load(id) { return id === "\0test-workflow-base" ? "export class WorkflowEntrypoint {}" : null; },
  }],
});
const { output } = await bundle.generate({ format: "esm" });
await bundle.close();
const { default: worker } = await import(`data:text/javascript;base64,${Buffer.from(output[0].code).toString("base64")}`);

function env(overrides = {}) {
  const forbiddenBinding = new Proxy({}, { get() { throw new Error("Unexpected binding access"); } });
  return {
    ...configuration.vars,
    CF_VERSION_METADATA: { id: "synthetic-release" },
    DB: forbiddenBinding,
    MEDIA: forbiddenBinding,
    EMAIL: forbiddenBinding,
    TRIP_WORKFLOW: forbiddenBinding,
    ...overrides,
  };
}

async function request(path, options = {}, environment = env()) {
  const logs = [];
  const originalLog = console.log;
  console.log = (line) => logs.push(JSON.parse(line));
  try {
    const input = new Request(`https://monflorian.com${path}`, options);
    const response = await worker.fetch(input, environment);
    return { response, logs };
  } finally {
    console.log = originalLog;
  }
}

function assertSchema(value, schema, path = "response") {
  if (schema.$ref) {
    const referenced = schema.$ref.slice(2).split("/").reduce((parent, key) => parent[key], contract);
    return assertSchema(value, referenced, path);
  }
  const type = value === null ? "null" : Array.isArray(value) ? "array" : typeof value;
  const types = Array.isArray(schema.type) ? schema.type : [schema.type];
  assert.ok(types.some((expected) => expected === type || (expected === "integer" && Number.isInteger(value))), `${path}: type`);
  if (Object.hasOwn(schema, "const")) assert.equal(value, schema.const, `${path}: const`);
  if (schema.enum) assert.ok(schema.enum.includes(value), `${path}: enum`);
  if (schema.pattern) assert.match(value, new RegExp(schema.pattern, "u"), `${path}: pattern`);
  if (typeof value === "number") {
    if (schema.minimum !== undefined) assert.ok(value >= schema.minimum, `${path}: minimum`);
    if (schema.maximum !== undefined) assert.ok(value <= schema.maximum, `${path}: maximum`);
  }
  if (type === "array") {
    if (schema.minItems !== undefined) assert.ok(value.length >= schema.minItems, `${path}: minItems`);
    if (schema.maxItems !== undefined) assert.ok(value.length <= schema.maxItems, `${path}: maxItems`);
    value.forEach((item, index) => assertSchema(item, schema.items, `${path}[${index}]`));
  }
  if (type === "object") {
    for (const key of schema.required || []) assert.ok(Object.hasOwn(value, key), `${path}.${key}: required`);
    for (const [key, child] of Object.entries(value)) {
      if (schema.additionalProperties === false) assert.ok(Object.hasOwn(schema.properties, key), `${path}.${key}: unexpected`);
      const childSchema = schema.properties?.[key] || schema.additionalProperties;
      if (childSchema && typeof childSchema === "object") assertSchema(child, childSchema, `${path}.${key}`);
    }
  }
}

test("v1 conserve la configuration legacy et ferme explicitement achats et commandes natives", async () => {
  const legacy = await (await request("/api/config")).response.json();
  const { response } = await request(API_CONTRACT.configurationPath);
  assert.equal(response.status, 200);
  const current = await response.json();
  const { apiVersion, generationReady, capabilities, ...unchanged } = current;
  assert.deepEqual(unchanged, legacy);
  assert.equal(apiVersion, API_CONTRACT.version);
  assert.equal(generationReady, false);
  assert.deepEqual(capabilities, {
    publicExamplesEnabled: true, tripCreationEnabled: false, photoUploadEnabled: false,
    privateSharingEnabled: false, nativeOrdersEnabled: false, storeKitPurchasesEnabled: false,
  });
  assertSchema(current, contract.components.schemas.PublicConfigV1);
  assert.equal(response.headers.get("Cache-Control"), "no-store");
  assert.match(response.headers.get("X-Robots-Tag"), /noindex/u);
  const withUnrelatedFlags = await (await request(API_CONTRACT.configurationPath, {}, env({
    MONFLORIAN_NATIVE_ORDERS_ENABLED: "true", MONFLORIAN_STOREKIT_ENABLED: "true",
  }))).response.json();
  assert.equal(withUnrelatedFlags.capabilities.nativeOrdersEnabled, false);
  assert.equal(withUnrelatedFlags.capabilities.storeKitPurchasesEnabled, false);
});

test("la projection HTTP est identique au build web et au contrat public", async () => {
  const { response, logs } = await request(API_CONTRACT.japanExamplePath);
  assert.equal(response.status, 200);
  const example = await response.json();
  assert.deepEqual(example, publicJapanExample());
  assertSchema(example, contract.components.schemas.PublicExampleV1);
  const moduleId = "virtual:monflorian-japan-guide";
  const plugin = viteConfig.plugins.flat().find((candidate) => typeof candidate?.resolveId === "function" && candidate.resolveId(moduleId));
  const generated = await plugin.load(plugin.resolveId(moduleId));
  const { default: webGuide } = await import(`data:text/javascript;base64,${Buffer.from(generated).toString("base64")}`);
  assert.deepEqual(example.guide, webGuide);
  for (const image of example.guide.imageBriefs) assert.deepEqual(Object.keys(image).sort(), ["altText", "id"]);
  const body = JSON.stringify(example);
  assert.doesNotMatch(body, /"(?:editorialPurpose|sceneType|activity|framing|light|mood|prompt|imagePlan|publicToken)":/u);
  assert.doesNotMatch(body, /fuji-editorial-v1|Classic Chrome/u);
  assert.doesNotMatch(JSON.stringify(logs), /Le Japon|imageBriefs|altText|japan-tokyo-couple/u);
  assert.equal(example.guide.days.length, 10);
});

test("la projection refuse tout champ privé non prévu et ne modifie jamais sa fixture", () => {
  const fixture = JSON.parse(read("../contracts/examples/japan-10-days.v1.json"));
  const context = JSON.parse(read("../contracts/examples/japan-10-days.context.v1.json"));
  const original = structuredClone(fixture);
  const projected = projectPublicTravelGuide(fixture, context);
  projected.trip.title = "Titre local";
  assert.deepEqual(fixture, original);
  assert.throws(() => projectPublicTravelGuide({ ...fixture, imagePlan: "private" }, context));
  const nested = structuredClone(fixture);
  nested.trip.publicToken = "private";
  assert.throws(() => projectPublicTravelGuide(nested, context));
});

test("les deux routes de création ferment avant lecture du corps et avant tout binding", async () => {
  for (const path of ["/api/trips", API_CONTRACT.tripsPath]) {
    const originalLog = console.log;
    console.log = () => {};
    try {
      const input = new Request(`https://monflorian.com${path}`, { method: "POST", body: "not-json" });
      input.json = () => { throw new Error("Body must remain unread"); };
      const response = await worker.fetch(input, env());
      assert.equal(response.status, 503);
      assert.equal((await response.json()).error.code, "TRIP_CREATION_UNAVAILABLE");
      assert.equal(input.bodyUsed, false);
    } finally { console.log = originalLog; }
  }
});

test("v1 n'accorde aucune exception d'origine ou de Turnstile aux clients natifs", async () => {
  const enabled = env({
    MONFLORIAN_TRIP_CREATION_ENABLED: "true", MONFLORIAN_GENERATION_ENABLED: "true",
    MONFLORIAN_ILLUSTRATION_ENABLED: "true", MONFLORIAN_EMAIL_ENABLED: "true",
    MONFLORIAN_ACCESS_MODE: "public", OPENAI_API_KEY: "synthetic-only", TURNSTILE_SECRET_KEY: "synthetic-only",
    TRIP_QUOTA_HASH_KEY: Buffer.alloc(32, 7).toString("base64"),
    DB: { prepare() { return { bind() { return { first: async () => null }; } }; } },
  });
  for (const path of ["/api/trips", API_CONTRACT.tripsPath]) {
    const untrusted = await request(path, { method: "POST", body: "{}", headers: { "User-Agent": "MonFlorian-iOS/1.0" } }, enabled);
    assert.equal(untrusted.response.status, 403);
    assert.equal((await untrusted.response.json()).error.code, "ORIGIN_REJECTED");
    const noTurnstile = await request(path, {
      method: "POST", body: "{}",
      headers: { Origin: "https://monflorian.com", "Content-Type": "application/json", "Idempotency-Key": "synthetic-native-test-0001" },
    }, enabled);
    assert.equal(noTurnstile.response.status, 400);
    assert.equal((await noTurnstile.response.json()).error.code, "TURNSTILE_REQUIRED");
  }
});

test("lectures privées v1 conservent les réponses et masquent les jetons dans les logs", async () => {
  const token = "s".repeat(43);
  const environment = env({ DB: { prepare() { return { bind() { return { first: async () => null }; } }; } } });
  for (const prefix of ["/api", "/api/v1"]) {
    for (const suffix of [token, `${token}/media/0`, `${token}/unknown`, `${token}%40bad`]) {
      const { response, logs } = await request(`${prefix}/trips/${suffix}?token=${token}`, {}, environment);
      assert.equal(response.status, 404);
      assert.equal(response.headers.get("Cache-Control"), "no-store");
      assert.equal(response.headers.get("Referrer-Policy"), "no-referrer");
      assert.doesNotMatch(JSON.stringify(logs), new RegExp(token, "u"));
    }
    const { response } = await request(`${prefix}/trips/${token}`, { method: "DELETE" }, environment);
    assert.equal(response.status, 403);
    assert.equal((await response.json()).error.code, "ORIGIN_REJECTED");
  }
  for (const path of [`/api/v2/trips/${token}`, `/api/v1/trips%2F${token}`]) {
    const { response, logs } = await request(path, {}, environment);
    assert.equal(response.status, 404);
    assert.doesNotMatch(JSON.stringify(logs), new RegExp(token, "u"));
  }
});

test("versions inconnues et méthodes non déclarées ne tombent pas sur les assets", async () => {
  for (const [path, method] of [["/api/v2/config", "GET"], [API_CONTRACT.japanExamplePath, "POST"], [API_CONTRACT.configurationPath, "POST"]]) {
    const { response } = await request(path, { method });
    assert.equal(response.status, 404);
    assert.equal((await response.json()).error.code, "NOT_FOUND");
  }
});

test("les clients Swift et web sont générés depuis le même OpenAPI", () => {
  execFileSync(process.execPath, ["scripts/generate-api-clients.mjs", "--check"], { cwd: new URL("../", import.meta.url) });
  assert.match(read("../app/public/app.js"), /requestJson\(API_CONTRACT\.configurationPath/u);
  assert.match(read("../app/public/app.js"), /requestJson\(API_CONTRACT\.tripsPath/u);
  assert.match(read("../ios/MonFlorian/Generated/APIContract.swift"), /struct APIConfiguration: Codable, Equatable, Sendable/u);
});

test("le schéma public reste dérivé du contrat guide en retirant les commandes d'image", () => {
  const canonical = JSON.parse(read("../contracts/travel-guide-v1.schema.json"));
  const publicSchema = structuredClone(contract.components.schemas.PublicTravelGuideV1);
  function localize(value) {
    if (!value || typeof value !== "object") return;
    if (value.$ref) value.$ref = value.$ref.replace("#/components/schemas/PublicTravelGuideV1/$defs/", "#/$defs/");
    Object.values(value).forEach(localize);
  }
  localize(publicSchema);
  canonical.$defs.imageBrief = {
    type: "object", additionalProperties: false, required: ["id", "altText"],
    properties: { id: { type: "string" }, altText: { type: "string" } },
  };
  assert.deepEqual(publicSchema, canonical);
});
