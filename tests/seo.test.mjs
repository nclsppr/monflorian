import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  canonicalPublicRedirect,
  noIndexResponse,
  shouldNoIndexStaticAsset,
} from "../app/http.mjs";

const rootUrl = new URL("../", import.meta.url);

function source(path) {
  return readFileSync(new URL(path, rootUrl), "utf8");
}

test("l’accueil expose une seule URL canonique indexable", () => {
  const html = source("app/public/index.html");

  assert.match(html, /<html lang="fr">/u);
  assert.match(
    html,
    /<title>Préparer un voyage à ton rythme \| Mon Florian<\/title>/u,
  );
  assert.match(
    html,
    /<meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1"/u,
  );
  assert.doesNotMatch(html, /<meta name="robots"[^>]*noindex/iu);
  assert.equal((html.match(/rel="canonical"/gu) || []).length, 1);
  assert.match(html, /<link rel="canonical" href="https:\/\/monflorian\.com\/"/u);
  assert.equal((html.match(/<h1\b/gu) || []).length, 1);
  assert.match(html, /<h2 id="outcome-title">/u);
  assert.match(html, /<h2 id="process-title">/u);
  assert.match(html, /<h2 id="faq-title">/u);
  assert.match(html, /itemtype="https:\/\/schema\.org\/WebSite"/u);
  assert.match(html, /itemprop="name" content="Mon Florian"/u);
  assert.doesNotMatch(html, /FAQPage/u);
});

test("les aperçus sociaux utilisent une image absolue aux dimensions annoncées", () => {
  const html = source("app/public/index.html");
  const card = readFileSync(new URL("assets/brand/monflorian-social-card.png", rootUrl));

  assert.match(html, /property="og:site_name" content="Mon Florian"/u);
  assert.match(
    html,
    /property="og:image"\s+content="https:\/\/monflorian\.com\/assets\/monflorian-social-card\.png"/u,
  );
  assert.match(html, /property="og:image:width" content="1200"/u);
  assert.match(html, /property="og:image:height" content="630"/u);
  assert.match(html, /name="twitter:card" content="summary_large_image"/u);
  assert.deepEqual([...card.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
  assert.equal(card.readUInt32BE(16), 1200);
  assert.equal(card.readUInt32BE(20), 630);
  assert.ok(card.length < 300 * 1024, "la carte sociale doit rester sous 300 Kio");
});

test("robots et sitemap ne publient que l’accueil canonique", () => {
  const robots = source("app/public/robots.txt");
  const sitemap = source("app/public/sitemap.xml");

  assert.match(robots, /^User-agent: \*$/mu);
  assert.match(robots, /^Allow: \/$/mu);
  assert.match(robots, /^Sitemap: https:\/\/monflorian\.com\/sitemap\.xml$/mu);
  assert.doesNotMatch(robots, /Disallow:\s*\/(?:api|voyages)/u);
  const locations = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/gu)].map((match) => match[1]);
  assert.deepEqual(locations, ["https://monflorian.com/"]);
});

test("les surfaces privées et techniques restent explicitement hors index", () => {
  const worker = source("src/worker.ts");
  const privatePage = source("src/trips/page.ts");
  const config = JSON.parse(source("wrangler.jsonc"));

  assert.equal(config.assets.run_worker_first, true);
  assert.match(worker, /canonicalPublicRedirect\(request\)/u);
  assert.match(worker, /shouldNoIndexStaticAsset\(request\) \? noIndexResponse/u);
  assert.match(worker, /"X-Robots-Tag": "noindex, nofollow, nosnippet, noimageindex"/u);
  assert.match(privatePage, /"X-Robots-Tag": "noindex, nofollow, noarchive, nosnippet, noimageindex"/u);
  assert.match(privatePage, /<meta name="robots" content="noindex,nofollow,noarchive,nosnippet,noimageindex">/u);
  assert.match(privatePage, /<title>Voyage privé · Mon Florian<\/title>/u);
  assert.doesNotMatch(privatePage, /<title>\$\{/u);
});

test("les redirections canoniques produisent de vraies réponses HTTP", () => {
  const cases = [
    ["http://monflorian.com/guide?ref=test", "https://monflorian.com/guide?ref=test"],
    ["http://www.monflorian.com/guide?ref=test", "https://monflorian.com/guide?ref=test"],
    ["https://www.monflorian.com/guide?ref=test", "https://monflorian.com/guide?ref=test"],
    ["https://www.monflorian.com:8443/guide", "https://monflorian.com/guide"],
    ["https://monflorian.com/index.html?ref=test", "https://monflorian.com/?ref=test"],
    ["https://www.monflorian.com/index.html?ref=test", "https://monflorian.com/?ref=test"],
    ["https://monflorian.com/v2/?ref=test", "https://monflorian.com/v2?ref=test"],
    ["https://monflorian.com/v2/index.html", "https://monflorian.com/v2"],
    ["https://monflorian.com/confidentialite.html", "https://monflorian.com/confidentialite"],
  ];

  for (const [input, expected] of cases) {
    const response = canonicalPublicRedirect(new Request(input));
    assert.equal(response?.status, 308);
    assert.equal(response?.headers.get("Location"), expected);
  }
  assert.equal(canonicalPublicRedirect(new Request("https://monflorian.com/guide?ref=test")), null);
  assert.equal(canonicalPublicRedirect(new Request("https://monflorian.com/v2?ref=test")), null);
  assert.equal(canonicalPublicRedirect(new Request("https://monflorian.example/index.html")), null);
  assert.equal(
    canonicalPublicRedirect(new Request("https://monflorian.com/index.html", { method: "POST" })),
    null,
  );
});

test("les redirections privées et techniques ne sont jamais mises en cache", () => {
  const privatePaths = [
    "/voyages/jeton-prive",
    "/api/config",
    "/.well-known/monflorian-release",
  ];

  for (const path of privatePaths) {
    const response = canonicalPublicRedirect(new Request(`http://monflorian.com${path}`));
    assert.equal(response?.status, 308);
    assert.equal(response?.headers.get("Cache-Control"), "no-store");
    assert.equal(response?.headers.get("Referrer-Policy"), "no-referrer");
    assert.equal(
      response?.headers.get("X-Robots-Tag"),
      "noindex, nofollow, nosnippet, noimageindex",
    );
  }

  const publicResponse = canonicalPublicRedirect(new Request("http://monflorian.com/"));
  assert.equal(publicResponse?.headers.get("Cache-Control"), "public, max-age=3600");
  assert.equal(publicResponse?.headers.get("X-Robots-Tag"), null);
});

test("Cloudflare sert les routes HTML canoniques sans réécriture interne", () => {
  const config = JSON.parse(source("wrangler.jsonc"));
  const worker = source("src/worker.ts");

  assert.equal(config.assets.html_handling, "drop-trailing-slash");
  assert.match(worker, /env\.ASSETS\.fetch\(request\)/u);
  assert.doesNotMatch(worker, /staticAssetRequest/u);
});

test("la V2 et la surface workers.dev restent hors index", () => {
  assert.equal(shouldNoIndexStaticAsset(new Request("https://monflorian.com/v2")), true);
  assert.equal(
    shouldNoIndexStaticAsset(new Request("https://monflorian.com/v2/assets/index.js")),
    true,
  );
  assert.equal(shouldNoIndexStaticAsset(new Request("https://monflorian.com/")), false);
  assert.equal(
    shouldNoIndexStaticAsset(new Request("https://monflorian.nclsppr.workers.dev/")),
    true,
  );
});

test("l’exclusion de workers.dev conserve la réponse et pose son en-tête", async () => {
  const original = new Response("diagnostic", {
    status: 200,
    headers: { "Cache-Control": "public, max-age=300" },
  });
  const response = noIndexResponse(original);

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("Cache-Control"), "public, max-age=300");
  assert.equal(
    response.headers.get("X-Robots-Tag"),
    "noindex, nofollow, nosnippet, noimageindex",
  );
  assert.equal(await response.text(), "diagnostic");
});
