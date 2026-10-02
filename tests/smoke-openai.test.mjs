import assert from "node:assert/strict";
import test from "node:test";
import { AppError } from "../app/core.mjs";
import { runSmoke, smokeRequest } from "../scripts/smoke_openai.mjs";
import { researchedItinerary, travelFactPack } from "./researched-fixtures.mjs";

const secret = "sk-never-log-this-test-value";
const forbidden = () => assert.fail("A provider must not run during preparation");

test("help and dry-run never call a provider, even with a key configured", async () => {
  for (const args of [[], ["--help"], ["--case", "tokyo", "--dry-run", "--image"], ["--case", "luxembourg", "--dry-run"]]) {
    const proofs = [];
    let help = false;
    assert.equal(await runSmoke(args, { env: { OPENAI_API_KEY: secret }, write: (value) => proofs.push(value),
      help: () => { help = true; }, research: forbidden, generate: forbidden, illustrate: forbidden }), 0);
    assert.ok(help || proofs[0].status === "dry-run");
    assert.ok(!JSON.stringify(proofs).includes(secret));
  }
});

test("invalid options and missing credentials stop before any provider call", async () => {
  for (const args of [["--image"], ["--case"], ["--case", secret], ["--case", "tokyo", "--unknown"],
    ["--case", "tokyo", "--image", "--image"], ["--case", "tokyo", "--case", "luxembourg"], ["--case", "tokyo"]]) {
    const proofs = [];
    assert.equal(await runSmoke(args, { env: {}, write: (value) => proofs.push(value), research: forbidden,
      generate: forbidden, illustrate: forbidden }), 2);
    assert.equal(proofs[0].stage, "configuration");
    assert.ok(!JSON.stringify(proofs).includes(secret));
  }
});

test("both scenarios pass researched facts to synthesis and only emit technical metadata", async () => {
  for (const scenario of ["tokyo", "luxembourg"]) {
    const request = smokeRequest(scenario);
    assert.equal(request.requestedDays, scenario === "tokyo" ? 10 : 2);
    assert.equal(request.transportMode, scenario === "tokyo" ? "flight" : "none");
    assert.equal(request.departureCity, scenario === "tokyo" ? "Paris" : null);
    assert.equal(request.accommodationStyle, scenario === "tokyo" ? "comfort" : "luxury");
    assert.equal(request.startDate, null);
    assert.equal(request.endDate, null);
    if (scenario === "tokyo") assert.match(request.brief, /début novembre/u);
    const facts = travelFactPack();
    facts.notes = "private-research-notes";
    facts.sources[0].url += "?private-query=hidden";
    const calls = [], proofs = [];
    const args = ["--case", scenario, ...(scenario === "tokyo" ? ["--image"] : [])];
    const result = await runSmoke(args, { env: { OPENAI_API_KEY: secret }, write: (value) => proofs.push(value),
      research: async (options) => {
        calls.push("research");
        assert.deepEqual(options.request, request);
        return { factPack: facts, providerRequestId: "req_research", searchCalls: 2,
          usage: { inputTokens: 10, outputTokens: 20, extra: secret } };
      },
      generate: async (options) => {
        calls.push("itinerary");
        assert.equal(options.factPack, facts);
        return { itinerary: researchedItinerary(request), providerRequestId: "req_itinerary" };
      },
      illustrate: async (options) => {
        calls.push("image");
        assert.equal(options.request.photos.length, 1);
        return { imageDataUrl: "data:image/webp;base64,aW1hZ2UtcGl4ZWxz", alt: secret, providerRequestId: "req_image" };
      },
    });
    assert.equal(result, 0);
    assert.deepEqual(calls, scenario === "tokyo" ? ["research", "itinerary", "image"] : ["research", "itinerary"]);
    assert.equal(proofs[1].flightOptions, scenario === "tokyo" ? 1 : 0);
    if (scenario === "luxembourg") assert.equal(proofs[1].nights, 1);
    const output = JSON.stringify(proofs);
    for (const excluded of [secret, request.brief, facts.notes, "private-query", "base64", "aW1hZ2UtcGl4ZWxz", "Hôtel synthétique"]) {
      assert.ok(!output.includes(excluded));
    }
  }
});

test("provider failures preserve earlier proof without retries or raw error output", async () => {
  for (const failure of [new AppError(502, "PROVIDER_INCOMPLETE", secret, { body: secret }), new Error(secret)]) {
    const proofs = [];
    let attempts = 0;
    const result = await runSmoke(["--case", "luxembourg", "--image"], {
      env: { OPENAI_API_KEY: secret }, write: (value) => proofs.push(value),
      research: async () => ({ factPack: travelFactPack(), providerRequestId: "req_ok", searchCalls: 1 }),
      generate: async () => { attempts += 1; throw failure; }, illustrate: forbidden,
    });
    assert.equal(result, 1);
    assert.equal(attempts, 1);
    assert.equal(proofs[0].status, "completed");
    assert.deepEqual(proofs[1], { status: "failed", scenario: "luxembourg", stage: "itinerary",
      code: failure instanceof AppError ? "PROVIDER_INCOMPLETE" : "SMOKE_FAILED" });
    assert.ok(!JSON.stringify(proofs).includes(secret));
  }
});
