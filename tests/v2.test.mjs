import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import test from "node:test";

import { parseSync } from "rolldown/utils";
import viteConfig from "../vite.v2.config.js";

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

test("le carnet publié conserve ses dix jours, cinq chapitres et neuf décisions", async () => {
  const fixture = JSON.parse(source("contracts/examples/japan-10-days.v1.json"));
  const moduleId = "virtual:monflorian-japan-guide";
  const plugin = viteConfig.plugins.flat().find((candidate) => (
    typeof candidate?.resolveId === "function" && candidate.resolveId(moduleId)
  ));
  assert.ok(plugin, "le build doit fournir la projection publique du carnet");
  const generatedModule = await plugin.load(plugin.resolveId(moduleId));
  assert.equal(typeof generatedModule, "string");
  const moduleUrl = `data:text/javascript;base64,${Buffer.from(generatedModule).toString("base64")}`;
  const { default: publicGuide } = await import(moduleUrl);

  assert.equal(publicGuide.days.length, 10);
  assert.equal(publicGuide.chapters.length, 5);
  assert.equal(publicGuide.reservationPlan.length, 9);
  assert.equal(publicGuide.accommodations.reduce((total, stay) => total + stay.nights, 0), 9);

  for (const [key, value] of Object.entries(fixture)) {
    if (key !== "imageBriefs") {
      assert.deepEqual(publicGuide[key], value, `${key}: la projection ne doit pas perdre le contenu du carnet`);
    }
  }
  assert.deepEqual(
    publicGuide.imageBriefs.map((image) => image.id),
    fixture.imageBriefs.map((image) => image.id),
    "chaque chapitre conserve sa référence d'image",
  );
  for (const image of publicGuide.imageBriefs) {
    assert.deepEqual(Object.keys(image).sort(), ["altText", "id"], "les consignes d'image fournisseur restent hors du client");
    const original = fixture.imageBriefs.find((candidate) => candidate.id === image.id);
    assert.ok(original, `${image.id}: image canonique attendue`);
    assert.equal(image.altText, original.altText);
  }
});

test("les huit images V2 partagent le format éditorial 1440 par 960", () => {
  const files = [
    "example-norway-fjords.webp",
    "example-portugal-train.webp",
    "example-sicily-table.webp",
    "japan-hakone-couple.webp",
    "japan-kyoto-couple.webp",
    "japan-arashiyama-couple.webp",
    "japan-tokyo-garden-couple.webp",
    "japan-tokyo-couple.webp",
  ];

  for (const file of files) {
    const webp = readFileSync(new URL(`app/public/v2/media/${file}`, rootUrl));
    assert.deepEqual(lossyWebpDimensions(webp, file), { width: 1440, height: 960 });
    assert.ok(webp.length < 220 * 1024, `${file}: le visuel reste sous 220 Kio`);
  }
});

test("les cinq scènes Japon ont un dérivé mobile de 720 par 480 sous 100 Kio", () => {
  const files = [
    "japan-hakone-couple-720.webp",
    "japan-kyoto-couple-720.webp",
    "japan-arashiyama-couple-720.webp",
    "japan-tokyo-garden-couple-720.webp",
    "japan-tokyo-couple-720.webp",
  ];
  for (const file of files) {
    const webp = readFileSync(new URL(`app/public/v2/media/${file}`, rootUrl));
    assert.deepEqual(lossyWebpDimensions(webp, file), { width: 720, height: 480 });
    assert.ok(webp.length < 100 * 1024, `${file}: le dérivé reste sous 100 Kio`);
  }
});

function visitSyntax(node, visitor) {
  if (!node || typeof node !== "object") return;
  if (typeof node.type === "string") visitor(node);
  for (const value of Object.values(node)) {
    if (Array.isArray(value)) value.forEach((child) => visitSyntax(child, visitor));
    else if (value && typeof value === "object") visitSyntax(value, visitor);
  }
}

function expressionName(node) {
  if (node.type === "Identifier") return node.name;
  if (node.type === "MemberExpression") {
    return node.computed ? node.property.value : node.property.name;
  }
  return null;
}

test("le client éditorial ne crée pas de requête réseau ni d'accès privé simulé", () => {
  const directory = new URL("app/v2/src/", rootUrl);
  const files = readdirSync(directory, { recursive: true }).filter((file) => /\.(?:jsx?|mjs)$/u.test(file));
  const networkApis = new Set(["fetch", "XMLHttpRequest", "WebSocket", "EventSource", "sendBeacon"]);
  const privateParameters = new Set(["password", "mot_de_passe", "preuve", "acces"]);

  for (const file of files) {
    const { program, errors } = parseSync(file, readFileSync(new URL(file, directory), "utf8"), { sourceType: "module" });
    assert.deepEqual(errors, [], `${file}: le code doit être analysable`);
    visitSyntax(program, (node) => {
      if (node.type === "CallExpression" || node.type === "NewExpression") {
        const name = expressionName(node.callee);
        assert.ok(!networkApis.has(name), `${file}: ${name} exige une décision d'ouverture du service`);
        if (name === "set" && node.arguments[0]?.type === "Literal") {
          assert.ok(!privateParameters.has(node.arguments[0].value), `${file}: aucun paramètre d'accès privé dans les liens publics`);
        }
      }
      if (node.type === "Literal" && typeof node.value === "string") {
        assert.doesNotMatch(node.value, /^\/api(?:\/|$)/u, `${file}: le client n'appelle pas les API fermées`);
      }
      if (node.type === "JSXAttribute" && node.name.name === "type") {
        const value = node.value?.type === "JSXExpressionContainer" ? node.value.expression : node.value;
        assert.notEqual(value?.value, "password", `${file}: le carnet public ne demande pas de mot de passe`);
      }
    });
  }
});
