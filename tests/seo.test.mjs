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

const publicPaths = [
  "/",
  "/carnets/japon-10-jours",
  "/guides",
  "/guides/preparer-itineraire-voyage",
  "/guides/japon-10-jours-preparer-voyage",
];

test("la carte sociale possède le format partageable annoncé", () => {
  const card = readFileSync(new URL("assets/brand/monflorian-social-card.png", rootUrl));

  assert.deepEqual([...card.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
  assert.equal(card.readUInt32BE(16), 1200);
  assert.equal(card.readUInt32BE(20), 630);
  assert.ok(card.length < 300 * 1024, "la carte sociale doit rester sous 300 Kio");
});

test("robots et sitemap publient les cinq pages éditoriales canoniques", () => {
  const robots = source("app/public/robots.txt");
  const sitemap = source("app/public/sitemap.xml");

  assert.match(robots, /^User-agent: \*$/mu);
  assert.match(robots, /^Allow: \/$/mu);
  assert.match(robots, /^Sitemap: https:\/\/monflorian\.com\/sitemap\.xml$/mu);
  assert.doesNotMatch(robots, /Disallow:\s*\/(?:api|voyages)/u);
  const locations = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/gu)].map((match) => match[1]);
  assert.deepEqual(locations, publicPaths.map((path) => `https://monflorian.com${path}`));
  assert.equal(new Set(locations).size, locations.length);
  for (const location of locations) {
    assert.doesNotMatch(location, /(?:\/v2|\/voyages\/|\?|#|\.workers\.dev)/u);
  }
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
    ["https://monflorian.com/v2/?ref=test", "https://monflorian.com/?ref=test"],
    ["https://monflorian.com/v2/index.html", "https://monflorian.com/"],
    ["https://monflorian.com/confidentialite.html", "https://monflorian.com/confidentialite"],
  ];

  for (const [input, expected] of cases) {
    const response = canonicalPublicRedirect(new Request(input));
    assert.equal(response?.status, 308);
    assert.equal(response?.headers.get("Location"), expected);
  }
  assert.equal(canonicalPublicRedirect(new Request("https://monflorian.com/guide?ref=test")), null);
  assert.equal(canonicalPublicRedirect(new Request("https://monflorian.example/unknown")), null);
  assert.equal(
    canonicalPublicRedirect(new Request("https://monflorian.com/index.html", { method: "POST" })),
    null,
  );
});

test("les anciennes entrées V2 et leurs paramètres rejoignent le contenu correspondant", () => {
  const cases = [
    ["/v2", "/"],
    ["/v2.html", "/"],
    ["/v2/index", "/"],
    ["/v2?voyage=japon-a-deux", "/carnets/japon-10-jours"],
    ["/v2?voyage=le-japon-a-deux&avatar=summer", "/carnets/japon-10-jours?avatar=summer"],
    ["/?voyage=japon-a-deux", "/carnets/japon-10-jours"],
    ["/index.html?voyage=japon-a-deux", "/carnets/japon-10-jours"],
    ["/v2?exemple=portugal-en-train&avatar=beanie", "/?avatar=beanie#inspiration-portugal-en-train"],
    ["/v2/?exemple=sicile-a-table", "/#inspiration-sicile-a-table"],
    ["/v2?exemple=rails-et-fjords", "/#inspiration-rails-et-fjords"],
    ["/v2?voyage=inconnu", "/"],
    ["/v2?exemple=inconnu", "/#examples"],
  ];
  for (const [path, destination] of cases) {
    for (const method of ["GET", "HEAD"]) {
      const response = canonicalPublicRedirect(new Request(`https://monflorian.com${path}`, { method }));
      assert.equal(response?.status, 308, `${method} ${path}`);
      assert.equal(response.headers.get("Location"), `https://monflorian.com${destination}`);
    }
  }
});

test("la migration supprime toute ancienne simulation d’accès du lien final", () => {
  const cases = [
    ["/v2?voyage=japon-a-deux&acces=prive&preuve=synthetic&avatar=flower", "/carnets/japon-10-jours?avatar=flower"],
    ["/v2?acces=public&preuve=synthetic", "/"],
    ["/?acces=prive&preuve=first&preuve=second&avatar=wind", "/?avatar=wind"],
    ["/carnets/japon-10-jours?acces=prive&preuve=synthetic", "/carnets/japon-10-jours"],
  ];
  for (const [path, destination] of cases) {
    const response = canonicalPublicRedirect(new Request(`https://monflorian.com${path}`));
    assert.equal(response?.headers.get("Location"), `https://monflorian.com${destination}`);
    assert.equal(response.headers.get("Cache-Control"), "no-store");
    assert.equal(response.headers.get("Referrer-Policy"), "no-referrer");
  }
});

test("chaque page publique possède des alias permanents sans chaîne de redirection", () => {
  for (const path of [...publicPaths.filter((path) => path !== "/"), "/confidentialite"]) {
    assert.equal(canonicalPublicRedirect(new Request(`https://monflorian.com${path}`)), null);
    for (const suffix of ["/", ".html", "/index", "/index.html"]) {
      const response = canonicalPublicRedirect(new Request(`http://www.monflorian.com${path}${suffix}?avatar=summer`));
      assert.equal(response?.status, 308);
      assert.equal(response.headers.get("Location"), `https://monflorian.com${path}?avatar=summer`);
    }
  }
});

test("les chemins inconnus et les écritures ne sont pas transformés en contenu public", () => {
  for (const path of ["/guides/inconnu", "/carnets/inconnu", "/v2/inconnu", "/v2/media/japan-tokyo-couple.webp"]) {
    assert.equal(canonicalPublicRedirect(new Request(`https://monflorian.com${path}`)), null);
  }
  for (const path of ["/v2", "/v2?voyage=japon-a-deux", "/guides/", "/api/trips"]) {
    assert.equal(canonicalPublicRedirect(new Request(`https://monflorian.com${path}`, { method: "POST" })), null);
  }
  assert.equal(JSON.parse(source("wrangler.jsonc")).assets.not_found_handling, "404-page");
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

test("les pages et médias éditoriaux sont indexables sans ouvrir les surfaces privées", () => {
  for (const path of [...publicPaths, "/v2/media/japan-tokyo-couple.webp", "/site-assets/main.js"]) {
    assert.equal(shouldNoIndexStaticAsset(new Request(`https://monflorian.com${path}`)), false);
  }
  for (const path of ["/api", "/api/config", "/voyages", "/voyages/synthetic", "/api/trips/synthetic/media/0"]) {
    assert.equal(shouldNoIndexStaticAsset(new Request(`https://monflorian.com${path}`)), true);
  }
  assert.equal(
    shouldNoIndexStaticAsset(new Request("https://monflorian.nclsppr.workers.dev/")),
    true,
  );
});

test("les en-têtes statiques gardent la sécurité et rendent les médias éditoriaux découvrables", () => {
  const headers = source("app/public/_headers");
  assert.match(headers, /Content-Security-Policy: default-src 'self';/u);
  assert.match(headers, /X-Content-Type-Options: nosniff/u);
  assert.match(headers, /X-Frame-Options: DENY/u);
  assert.match(headers, /\/site-assets\/\*\n  Cache-Control: public, max-age=31536000, immutable/u);
  assert.match(headers, /\/v2\/media\/\*\n  Cache-Control: public, max-age=86400/u);
  assert.doesNotMatch(headers, /X-Robots-Tag:.*noindex/u);
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
