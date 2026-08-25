import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
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
    {
      src: "/assets/florian-original-web.webp",
      hasAttribute: () => false,
    },
    {
      src: "/assets/florian-original-intro.webp",
      hasAttribute: (name) => name === "data-florian-intro",
    },
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
    location: { pathname: "/", search: "" },
    Math: { floor: Math.floor, random: () => 0.25 },
    Promise,
  });

  assert.equal(classes.has("is-florian-loading"), true);
  assert.deepEqual(portraits.map(({ src }) => src), [
    "/assets/florian-original-web.webp",
    "/assets/florian-original-intro.webp",
  ]);

  finishDecode();
  await decode;
  await Promise.resolve();
  await Promise.resolve();

  assert.deepEqual(portraits.map(({ src }) => src), [
    "/assets/florian-wind-web.webp",
    "/assets/florian-wind-intro.webp",
  ]);
  assert.equal(classes.has("is-florian-loading"), false);
});

test("les deux routes gardent la meme variante dans leur famille de portraits", async () => {
  const bootSource = source("app/public/avatar.js");

  async function sourcesFor(pathname) {
    const portraits = [
      { src: "fallback-compact", hasAttribute: () => false },
      { src: "fallback-intro", hasAttribute: (name) => name === "data-florian-intro" },
    ];

    class CandidateImage {
      set src(value) {
        this.currentSource = value;
      }

      decode() {
        return Promise.resolve();
      }
    }

    runInNewContext(bootSource, {
      document: {
        documentElement: {
          classList: { add: () => {}, remove: () => {} },
        },
        readyState: "complete",
        querySelectorAll: () => portraits,
      },
      Image: CandidateImage,
      location: { pathname, search: "?avatar=flower" },
      Math,
      Promise,
    });

    await Promise.resolve();
    await Promise.resolve();
    return portraits.map(({ src }) => src);
  }

  assert.deepEqual(await sourcesFor("/"), [
    "/assets/florian-flower-web.webp",
    "/assets/florian-flower-intro.webp",
  ]);
  assert.deepEqual(await sourcesFor("/v2"), [
    "/assets/florian-v2-flower-web.webp",
    "/assets/florian-v2-flower-intro.webp",
  ]);
});

test("les champs mobiles ne dependent pas de la largeur intrinseque de Safari", () => {
  const css = source("app/public/styles.css");
  const mobile = css.slice(css.indexOf("@media (max-width: 620px)"));

  assert.match(
    css,
    /input:not\(\[type="checkbox"\]\):not\(\[type="radio"\]\):not\(\[type="file"\]\),\s*select,\s*textarea\s*\{[^}]*min-width:\s*0;[^}]*max-width:\s*100%;/s,
    "les champs doivent pouvoir retrecir dans leur conteneur",
  );
  assert.match(
    mobile,
    /\.form-grid\s*\{[^}]*grid-template-columns:\s*1fr;/s,
    "les dates doivent etre empilees sur petit ecran",
  );
  assert.match(
    css,
    /@supports selector\(input\[type="date"\]::-webkit-date-and-time-value\)\s*\{[\s\S]*input\[type="date"\]\s*\{[^}]*padding-inline:\s*0;/s,
    "le champ date ne doit pas cumuler width 100% et padding sur WebKit iOS",
  );
});

test("le rendu public ne pilote aucun mouvement depuis le défilement en JavaScript", () => {
  const html = source("app/public/index.html");
  const css = source("app/public/styles.css");
  const motion = source("app/public/motion.js");
  const publicScripts = readdirSync(new URL("../app/public/", import.meta.url), { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".js"))
    .map((entry) => source(`app/public/${entry.name}`))
    .join("\n");
  const motionScriptIndex = html.indexOf('src="/motion.js');
  const stylesheetIndex = html.indexOf('rel="stylesheet"');

  assert.ok(motionScriptIndex >= 0, "le basculement du logo doit rester local");
  assert.ok(motionScriptIndex < stylesheetIndex, "l’état initial doit précéder la feuille de style");
  assert.doesNotMatch(publicScripts, /\b(?:requestAnimationFrame|cancelAnimationFrame|scrollY|pageYOffset|onscroll)\b/u);
  assert.doesNotMatch(publicScripts, /\.addEventListener\s*\(\s*["']scroll["']/u);
  assert.doesNotMatch(`${motion}\n${css}`, /is-parallax-active/u);
  assert.match(motion, /new IntersectionObserver/u);
  assert.match(css, /@media \(hover: hover\) and \(pointer: fine\) and \(prefers-reduced-motion: no-preference\)/u);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)[\s\S]*\.preview-phone-depth,[\s\S]*animation:\s*none !important;/s);
});

test("le grand logo utilise une surface réelle et un mot-symbole haute définition", () => {
  const html = source("app/public/index.html");
  const css = source("app/public/styles.css");
  const introRule = /\.brand-intro-lockup\s*\{([^}]*)\}/su.exec(css)?.[1] ?? "";
  const headerSwapRules = [...css.matchAll(/html\.has-intro-swap[^\{]*\.brand[^\{]*\{([^}]*)\}/gsu)]
    .map((match) => match[1])
    .join("\n");

  assert.match(html, /id="top" class="page-shell"/u);
  assert.match(html, /class="brand" href="#top"/u);
  assert.match(html, /class="brand-intro" aria-hidden="true"[\s\S]*class="brand-intro-lockup"/u);
  assert.match(
    html,
    /class="brand-intro-lockup"[\s\S]*src="\/assets\/monflorian-wordmark-intro\.webp"[\s\S]*width="1352"[\s\S]*height="724"/u,
  );
  assert.match(html, /data-florian-intro[\s\S]*src="\/assets\/florian-original-intro\.webp"[\s\S]*width="1024"[\s\S]*height="1024"/u);
  assert.match(html, /class="site-header-surface" aria-hidden="true"/u);
  assert.match(html, /class="preview-phone-depth"/u);
  assert.match(introRule, /width:\s*100%;/u);
  assert.doesNotMatch(introRule, /(?:scale\(|will-change)/u);
  assert.doesNotMatch(headerSwapRules, /(?:scale\(|will-change)/u);
  assert.match(css, /\.brand-intro-content\s*\{[^}]*width:\s*100%;/s);
  assert.match(css, /html\.has-intro-swap \.brand-intro\s*\{[^}]*grid-template-columns:\s*minmax\(0, 1fr\);/s);
  assert.match(css, /html\.has-intro-swap \.brand-intro\s*\{[^}]*min-height:\s*calc\(100svh - 92px\);[^}]*padding-block:[^;]*18svh/s);
  assert.match(css, /@media \(max-width: 620px\)[\s\S]*\.brand-intro-lockup\s*\{[^}]*width:\s*100%;/s);
  assert.match(css, /html\.has-intro-swap \.site-header\s*\{[^}]*position:\s*sticky;/s);
  assert.match(css, /@media print[\s\S]*\.site-header-surface,[\s\S]*\.brand-intro,/s);
});

test("l’accroche du logo ressemble à une note fixe de Florian", () => {
  const html = source("app/public/index.html");
  const css = source("app/public/styles.css");

  assert.match(
    html,
    /class="brand-intro-tagline">[\s\S]*class="brand-intro-tagline-paper"[\s\S]*Alors, on part où&nbsp;\?[\s\S]*<\/span>/u,
  );
  assert.equal((html.match(/class="brand-intro-tagline-paper"/gu) || []).length, 1);
  assert.equal((html.match(/<path d="M/gu) || []).length, 3);
  assert.match(css, /\.brand-intro-tagline\s*\{[^}]*color:\s*var\(--blue\);[^}]*font-style:\s*italic;[^}]*transform:\s*rotate\(-1\.1deg\);/s);
  assert.match(css, /\.brand-intro-tagline-paper path\s*\{[^}]*stroke:\s*var\(--paper\);[^}]*stroke-linecap:\s*round;[^}]*opacity:\s*0\.74;/s);
  assert.doesNotMatch(css, /intro-tagline-type/u);
});

test("les contrôles tactiles iOS n’affichent pas de masque rectangulaire", () => {
  const css = source("app/public/styles.css");

  assert.match(
    css,
    /button,\s*a,\s*input,\s*select,\s*textarea,\s*label,\s*summary\s*\{[^}]*-webkit-tap-highlight-color:\s*transparent;/s,
  );
  assert.match(css, /:where\(a, button, input, select, textarea, summary\):focus-visible\s*\{[^}]*outline:\s*3px solid var\(--blue-deep\);/s);
  assert.match(css, /\.segmented-control input:focus-visible \+ span\s*\{[^}]*outline:\s*3px solid var\(--blue-deep\);/s);
});

test("les champs et le bouton principal gardent leur texte centre", () => {
  const css = source("app/public/styles.css");

  assert.match(
    css,
    /input:not\(\[type="checkbox"\]\):not\(\[type="radio"\]\):not\(\[type="file"\]\),\s*select\s*\{[^}]*min-height:\s*52px;[^}]*padding:\s*13px 14px;[^}]*line-height:\s*24px;/s,
    "les champs sur une ligne doivent avoir une hauteur et une ligne de texte explicites",
  );
  assert.match(
    css,
    /input\[type="date"\]\s*\{[^}]*padding-block:\s*0;[^}]*padding-inline:\s*13px;/s,
  );
  assert.match(
    css,
    /input\[type="date"\]::-webkit-date-and-time-value\s*\{[^}]*padding-inline-start:\s*13px;/s,
  );
  assert.match(
    css,
    /\.primary-button\s*\{[^}]*display:\s*inline-flex;[^}]*align-items:\s*center;[^}]*justify-content:\s*center;/s,
  );
  assert.match(css, /#trip-submit\s*\{[^}]*display:\s*inline-grid;[^}]*grid-template-columns:\s*22px minmax\(0, auto\) 22px;/s);
  assert.match(css, /\.button-label\s*\{[^}]*grid-column:\s*2;/s);
  assert.match(css, /\.button-arrow\s*\{[^}]*grid-column:\s*3;/s);
  assert.match(css, /\.segmented-control input\s*\{[^}]*padding:\s*0;[^}]*border:\s*0;/s);
  assert.match(css, /\.consent-row input\s*\{[^}]*width:\s*20px;[^}]*height:\s*20px;[^}]*padding:\s*0;/s);
  const tablet = css.slice(css.indexOf("@media (max-width: 900px)"), css.indexOf("@media (max-width: 620px)"));
  assert.match(tablet, /\.outcome-list,\s*\.process-list\s*\{[^}]*grid-template-columns:\s*1fr;/s);
});

test("le formulaire annonce ses groupes, aides et erreurs aux technologies d’assistance", () => {
  const html = source("app/public/index.html");
  const app = source("app/public/app.js");
  const submitState = app.slice(
    app.indexOf("function updateSubmitState()"),
    app.indexOf("function updateBriefCount()"),
  );

  assert.match(html, /<form[\s\S]*aria-labelledby="trip-form-title"/u);
  assert.match(html, /id="access-field" class="field-group access-field">/u);
  assert.match(html, /id="access-code"[\s\S]*required[\s\S]*aria-describedby="access-hint access-error"/u);
  assert.match(html, /class="launch-state"[^>]*data-nosnippet/u);
  assert.match(html, /<span class="sr-only">Statut du service :<\/span>/u);
  assert.match(html, /id="launch-state-label">Vérification de l’accès<\/span>/u);
  assert.match(html, /id="config-status"[^>]*data-nosnippet/u);
  assert.match(html, /<h2 id="trip-form-title" class="sr-only">/u);
  assert.match(html, /id="start-date"[\s\S]*aria-describedby="dates-hint dates-error"/u);
  assert.match(html, /<fieldset class="photo-field">/u);
  assert.match(html, /<legend class="sr-only">Portraits pour les projections<\/legend>/u);
  assert.match(html, /id="trip-photo-input"[\s\S]*aria-describedby="trip-photo-help trip-photo-status trip-photo-error"/u);
  assert.match(html, /id="trip-photo-status"[^>]*role="status"/u);
  assert.match(html, /id="trip-photo-error"[^>]*role="alert"/u);
  assert.match(html, /id="turnstile-field"[\s\S]*aria-describedby="turnstile-error"[\s\S]*tabindex="-1"/u);
  assert.doesNotMatch(submitState, /turnstileToken/u);
  assert.match(
    app.slice(
      app.indexOf("function renderOpenConfiguration()"),
      app.indexOf("async function loadConfig()"),
    ),
    /updateSubmitState\(\)/u,
  );
  assert.match(app, /Choisis un voyage de \$\{state\.config\.limits\.maxTripDays\} jours au plus/u);
  assert.match(app, /const shouldRestoreFocus = document\.activeElement === elements\.photoInput/u);
  assert.match(app, /if \(shouldRestoreFocus\) elements\.photoInput\.focus\(\)/u);
  assert.match(app, /la limite est de \$\{state\.config\.limits\.maxPhotos\}/u);
  assert.match(app, /for \(const file of files\)[\s\S]*state\.photos\.length >= state\.config\.limits\.maxPhotos[\s\S]*ignoredCount \+= 1/u);
  assert.match(app, /elements\.photoError\.textContent = "";[\s\S]*renderPhotos\(\)/u);
  assert.match(app, /if \(!event\.persisted\) clearPhotos\(\)/u);
  assert.doesNotMatch(app, /Demandes (?:temporairement )?fermées/u);
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

test("la notice publique explique les destinataires, la rétention et la suppression", () => {
  const html = source("app/public/index.html");
  const privacy = source("app/public/confidentialite.html");
  const privatePage = source("src/trips/page.ts");

  assert.match(html, /href="\/confidentialite"/u);
  assert.match(privacy, /Cloudflare/u);
  assert.match(privacy, /OpenAI/u);
  assert.match(privacy, /au plus tard sous 24 heures/u);
  assert.match(privacy, /store:false/u);
  assert.match(privacy, /aucune durée\s+plus courte n’est promise/u);
  assert.match(privacy, /Après 30 jours au plus tard/u);
  assert.match(privacy, /Supprimer cette proposition/u);
  assert.match(privacy, /Aucun canal complémentaire n’est publié aujourd’hui/u);
  assert.match(privatePage, /href="\/confidentialite"/u);
});
