import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const rootUrl = new URL("../", import.meta.url);

function source(path) {
  return readFileSync(new URL(path, rootUrl), "utf8");
}

function lossyWebpDimensions(webp, file) {
  assert.equal(webp.toString("ascii", 0, 4), "RIFF", `${file}: conteneur RIFF attendu`);
  assert.equal(webp.toString("ascii", 8, 12), "WEBP", `${file}: signature WebP attendue`);
  assert.equal(webp.toString("ascii", 12, 16), "VP8 ", `${file}: image WebP lossy attendue`);
  assert.deepEqual([...webp.subarray(23, 26)], [0x9d, 0x01, 0x2a], `${file}: trame VP8 attendue`);
  return {
    width: webp.readUInt16LE(26) & 0x3fff,
    height: webp.readUInt16LE(28) & 0x3fff,
  };
}

test("la V2 livre le parcours Japon sans vocabulaire de chantier", () => {
  const html = source("app/v2/index.html");
  const application = source("app/v2/src/main.jsx");
  const data = source("app/v2/src/data.js");
  const visibleSource = `${html}\n${application}\n${data}`;

  assert.match(html, /<html lang="fr"/u);
  assert.match(html, /name="robots" content="noindex,nofollow,nosnippet,noimageindex"/u);
  assert.match(html, /name="referrer" content="no-referrer"/u);
  assert.match(application, /@astryxdesign\/core\/Stepper/u);
  assert.match(application, /@astryxdesign\/core\/Dialog/u);
  assert.match(application, /Générer mon voyage/u);
  assert.match(application, /Le Japon à deux/u);
  assert.match(visibleSource, /Tokyo → Hakone → Kyoto/u);
  assert.equal((data.match(/day:\s*\d+/gu) || []).length, 10);
  assert.equal((data.match(/https:\/\/www\.booking\.com\/city\/jp\//gu) || []).length, 3);
  assert.doesNotMatch(
    visibleSource,
    /(?:en construction|mockup|maquette|image générée|projection personnalisée)/iu,
  );
});

test("le partage privé vérifie un condensat sans placer le mot de passe dans le lien", () => {
  const application = source("app/v2/src/main.jsx");

  assert.match(application, /crypto\.subtle\.digest\("SHA-256"/u);
  assert.match(application, /url\.searchParams\.set\("preuve", await hashPassword\(password\)\)/u);
  assert.doesNotMatch(application, /searchParams\.set\("(?:password|mot_de_passe)"/u);
  assert.match(application, /navigator\.share/u);
  assert.match(application, /navigator\.clipboard/u);
});

test("les six images V2 partagent le format éditorial 1440 par 960", () => {
  const files = [
    "example-norway-fjords.webp",
    "example-portugal-train.webp",
    "example-sicily-table.webp",
    "japan-hakone-couple.webp",
    "japan-kyoto-couple.webp",
    "japan-tokyo-couple.webp",
  ];

  for (const file of files) {
    const webp = readFileSync(new URL(`app/public/v2/media/${file}`, rootUrl));
    assert.deepEqual(lossyWebpDimensions(webp, file), { width: 1440, height: 960 });
    assert.ok(webp.length < 220 * 1024, `${file}: le visuel reste sous 220 Kio`);
  }
});
