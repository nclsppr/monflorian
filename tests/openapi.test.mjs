import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const contract = JSON.parse(await readFile(new URL("../docs/api/openapi.json", import.meta.url), "utf8"));

function resolvePointer(pointer) {
  assert.match(pointer, /^#\//u, `référence externe interdite : ${pointer}`);
  return pointer.slice(2).split("/").reduce((value, segment) => {
    const key = segment.replaceAll("~1", "/").replaceAll("~0", "~");
    assert.ok(value && Object.hasOwn(value, key), `référence absente : ${pointer}`);
    return value[key];
  }, contract);
}

function inspectReferences(value) {
  if (Array.isArray(value)) {
    value.forEach(inspectReferences);
    return;
  }
  if (!value || typeof value !== "object") return;
  if (typeof value.$ref === "string") resolvePointer(value.$ref);
  Object.values(value).forEach(inspectReferences);
}

test("le contrat OpenAPI est autonome et ne décrit que les quatre routes servies", () => {
  assert.equal(contract.openapi, "3.1.0");
  assert.deepEqual(Object.keys(contract.paths).sort(), [
    "/api/config",
    "/api/health",
    "/api/illustrations",
    "/api/itineraries",
  ]);
  assert.deepEqual(Object.keys(contract.paths["/api/health"]), ["get"]);
  assert.deepEqual(Object.keys(contract.paths["/api/config"]), ["get"]);
  assert.deepEqual(Object.keys(contract.paths["/api/itineraries"]), ["post"]);
  assert.deepEqual(Object.keys(contract.paths["/api/illustrations"]), ["post"]);
  inspectReferences(contract);
});

test("les limites publiques et les corps correspondent aux validateurs du serveur", () => {
  const itinerary = contract.components.schemas.ItineraryRequest.properties;
  assert.deepEqual([itinerary.brief.minLength, itinerary.brief.maxLength], [20, 2_000]);
  assert.deepEqual([itinerary.travelers.minimum, itinerary.travelers.maximum], [1, 8]);
  assert.deepEqual(itinerary.pace.enum, ["calm", "balanced", "intense"]);

  const illustration = contract.components.schemas.IllustrationRequest;
  assert.equal(illustration.properties.consent.const, true);
  assert.deepEqual([illustration.properties.photos.minItems, illustration.properties.photos.maxItems], [1, 4]);
  assert.equal(illustration.properties.scene.minLength, 10);

  const publicConfig = contract.components.schemas.PublicConfig;
  assert.ok(publicConfig.required.includes("bookingAllowedHosts"));
  assert.equal(publicConfig.properties.bookingAllowedHosts.type, "array");
});

test("chaque opération possède un identifiant unique et documente ses réponses", () => {
  const identifiers = [];
  for (const pathItem of Object.values(contract.paths)) {
    for (const operation of Object.values(pathItem)) {
      assert.equal(typeof operation.operationId, "string");
      assert.ok(operation.responses?.["200"]);
      identifiers.push(operation.operationId);
    }
  }
  assert.equal(new Set(identifiers).size, identifiers.length);
});
