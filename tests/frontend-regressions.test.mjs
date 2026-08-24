import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { test } from "node:test";

const rootUrl = new URL("../", import.meta.url);

function source(path) {
  return readFileSync(new URL(path, rootUrl), "utf8");
}

test("le portrait choisi est charge avant de remplacer le repli visible", async () => {
  const html = source("app/public/index.html");
  const bootSource = source("app/public/avatar.js");
  const avatarScriptIndex = html.indexOf('src="/avatar.js');
  const stylesheetIndex = html.indexOf('rel="stylesheet"');

  assert.ok(avatarScriptIndex >= 0, "le script du portrait doit etre charge dans le head");
  assert.ok(avatarScriptIndex < stylesheetIndex, "le masquage doit etre initialise avant la feuille de style");

  let finishDecode;
  const decode = new Promise((resolve) => { finishDecode = resolve; });
  const classes = new Set();
  const portraits = [
    { src: "/assets/florian-original.png?v=2" },
    { src: "/assets/florian-original.png?v=2" },
  ];

  class CandidateImage {
    set src(value) {
      this.currentSource = value;
    }

    decode() {
      return decode;
    }
  }

  runInNewContext(bootSource, {
    document: {
      documentElement: {
        classList: {
          add: (name) => classes.add(name),
          remove: (name) => classes.delete(name),
        },
      },
      readyState: "complete",
      querySelectorAll: () => portraits,
    },
    Image: CandidateImage,
    Math: { floor: Math.floor, random: () => 0.25 },
    Promise,
  });

  assert.equal(classes.has("is-florian-loading"), true);
  assert.deepEqual(portraits.map(({ src }) => src), [
    "/assets/florian-original.png?v=2",
    "/assets/florian-original.png?v=2",
  ]);

  finishDecode();
  await decode;
  await Promise.resolve();
  await Promise.resolve();

  assert.deepEqual(portraits.map(({ src }) => src), [
    "/assets/florian-wind.png?v=2",
    "/assets/florian-wind.png?v=2",
  ]);
  assert.equal(classes.has("is-florian-loading"), false);
});

test("les champs mobiles ne dependent pas de la largeur intrinseque de Safari", () => {
  const css = source("app/public/styles.css");
  const mobile = css.slice(css.indexOf("@media (max-width: 620px)"));

  assert.match(
    css,
    /input,\s*select,\s*textarea\s*\{[^}]*min-width:\s*0;[^}]*max-width:\s*100%;/s,
    "les champs doivent pouvoir retrecir dans leur conteneur",
  );
  assert.match(
    mobile,
    /\.form-grid\s*\{[^}]*grid-template-columns:\s*1fr;/s,
    "les dates doivent etre empilees sur petit ecran",
  );
  assert.match(
    css,
    /input\[type="date"\]\s*\{[^}]*padding-inline:\s*0;/s,
    "le champ date ne doit pas cumuler width 100% et padding sur WebKit iOS",
  );
});

test("le formulaire public suit un seul parcours asynchrone", () => {
  const html = source("app/public/index.html");
  const app = source("app/public/app.js");

  assert.match(html, /id="email"[^>]*type="email"/u);
  assert.match(html, /id="trip-photo-input"[^>]*type="file"/u);
  assert.match(html, /id="trip-photo-consent"[^>]*type="checkbox"/u);
  assert.match(html, /id="turnstile-widget"/u);
  assert.doesNotMatch(html, /id="illustration-form"/u);
  assert.doesNotMatch(html, /id="trip-result"/u);
  assert.match(app, /requestJson\("\/api\/trips"/u);
  assert.match(app, /"Idempotency-Key": state\.idempotencyKey/u);
  assert.doesNotMatch(app, /\/api\/itineraries/u);
  assert.doesNotMatch(app, /\/api\/illustrations/u);
});
