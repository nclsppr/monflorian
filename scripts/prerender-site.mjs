import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { guides, render } from "../build/prerender/entry-server.js";

const origin = "https://monflorian.com";
const outputDirectory = new URL("../dist/", import.meta.url);
const template = await readFile(new URL("index.html", outputDirectory), "utf8");
const metadataMarker = "<!--page-metadata-->";
const contentMarker = "<!--page-content-->";

for (const marker of [metadataMarker, contentMarker]) {
  if (template.split(marker).length !== 2) {
    throw new Error(`Expected one ${marker} placeholder in the client build.`);
  }
}

const socialImages = {
  japan: {
    path: "/v2/media/japan-tokyo-couple.webp",
    type: "image/webp",
    width: 1440,
    height: 960,
    alt: "Scène éditoriale synthétique à Tokyo avec le couple fictif du carnet Japon.",
  },
  planning: {
    path: "/v2/media/example-portugal-train.webp",
    type: "image/webp",
    width: 1440,
    height: 960,
    alt: "Illustration éditoriale d’un voyage en train au Portugal.",
  },
};

const pages = [
  {
    path: "/",
    title: "Préparer un voyage à ton rythme | Mon Florian",
    description: "Prépare un voyage adapté à tes envies : itinéraire, idées d’hôtels et trajets. Création gratuite pendant la bêta, sans carte bancaire. Découvre aussi le carnet Japon.",
    name: "Mon Florian",
    image: socialImages.japan,
  },
  {
    path: "/carnets/japon-10-jours",
    title: "Japon 10 jours : Tokyo, Hakone, Kyoto | Mon Florian",
    description: "Un exemple de carnet de dix jours entre Tokyo, Hakone et Kyoto : étapes, trajets, rythme, choix d’hébergement et points à vérifier avant de réserver.",
    name: "Japon en dix jours",
    image: socialImages.japan,
  },
  {
    path: "/guides",
    title: "Guides pour préparer ton voyage | Mon Florian",
    description: "Des guides pour construire un itinéraire, répartir tes nuits et vérifier les trajets. Une méthode pratique et un exemple de voyage de dix jours au Japon.",
    name: "Guides de voyage",
    image: socialImages.planning,
  },
  ...guides.map((guide) => ({
    path: guide.path,
    title: `${guide.title} | Mon Florian`,
    description: guide.description,
    name: guide.title,
    image: guide.path.includes("japon-") ? socialImages.japan : socialImages.planning,
    publishedDate: "2026-09-07",
    guide,
  })),
];

const expectedPaths = new Set([
  "/",
  "/carnets/japon-10-jours",
  "/guides",
  "/guides/preparer-itineraire-voyage",
  "/guides/japon-10-jours-preparer-voyage",
]);
if (pages.length !== expectedPaths.size || pages.some((page) => !expectedPaths.delete(page.path)) || expectedPaths.size) {
  throw new Error("The public page inventory must contain exactly the five canonical routes.");
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/gu, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;",
  })[character]);
}

function jsonForHtml(value) {
  return JSON.stringify(value).replace(/</gu, "\\u003c").replace(/\u2028/gu, "\\u2028").replace(/\u2029/gu, "\\u2029");
}

function structuredData(page) {
  const url = `${origin}${page.path}`;
  const organization = {
    "@type": "Organization",
    "@id": `${origin}/#organization`,
    name: "Mon Florian",
    url: `${origin}/`,
    logo: `${origin}/assets/monflorian-wordmark-web.webp`,
  };
  const website = {
    "@type": "WebSite",
    "@id": `${origin}/#website`,
    name: "Mon Florian",
    alternateName: "monflorian.com",
    url: `${origin}/`,
    inLanguage: "fr-FR",
    publisher: { "@id": organization["@id"] },
  };
  const graph = [organization, website, {
    "@type": "WebPage",
    "@id": `${url}#webpage`,
    url,
    name: page.name,
    description: page.description,
    inLanguage: "fr-FR",
    isPartOf: { "@id": website["@id"] },
  }];

  if (page.path !== "/") {
    const breadcrumbs = [{ name: "Accueil", item: `${origin}/` }];
    if (page.guide) breadcrumbs.push({ name: "Guides", item: `${origin}/guides` });
    breadcrumbs.push({ name: page.name, item: url });
    graph.push({
      "@type": "BreadcrumbList",
      "@id": `${url}#breadcrumb`,
      itemListElement: breadcrumbs.map((item, index) => ({ "@type": "ListItem", position: index + 1, ...item })),
    });
  }

  if (page.guide) {
    if (!/^\d{4}-\d{2}-\d{2}$/u.test(page.guide.updatedDate)) {
      throw new Error(`Missing editorial date for ${page.path}.`);
    }
    graph.push({
      "@type": "Article",
      "@id": `${url}#article`,
      headline: page.guide.heading,
      description: page.description,
      image: `${origin}${page.image.path}`,
      datePublished: page.publishedDate,
      dateModified: page.guide.updatedDate,
      author: { "@type": "Organization", "@id": organization["@id"], name: "Mon Florian", url: `${origin}/` },
      publisher: { "@id": organization["@id"] },
      mainEntityOfPage: { "@id": `${url}#webpage` },
      inLanguage: "fr-FR",
    });
  }
  return { "@context": "https://schema.org", "@graph": graph };
}

function metadata(page) {
  const url = `${origin}${page.path}`;
  const image = page.image;
  return [
    `<title>${escapeHtml(page.title)}</title>`,
    '<meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1" />',
    `<meta name="description" content="${escapeHtml(page.description)}" />`,
    `<link rel="canonical" href="${escapeHtml(url)}" />`,
    `<meta property="og:type" content="${page.guide ? "article" : "website"}" />`,
    '<meta property="og:locale" content="fr_FR" />',
    '<meta property="og:site_name" content="Mon Florian" />',
    `<meta property="og:title" content="${escapeHtml(page.title)}" />`,
    `<meta property="og:description" content="${escapeHtml(page.description)}" />`,
    `<meta property="og:url" content="${escapeHtml(url)}" />`,
    `<meta property="og:image" content="${origin}${image.path}" />`,
    `<meta property="og:image:type" content="${image.type}" />`,
    `<meta property="og:image:width" content="${image.width}" />`,
    `<meta property="og:image:height" content="${image.height}" />`,
    `<meta property="og:image:alt" content="${escapeHtml(image.alt)}" />`,
    '<meta name="twitter:card" content="summary_large_image" />',
    `<meta name="twitter:title" content="${escapeHtml(page.title)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(page.description)}" />`,
    `<meta name="twitter:image" content="${origin}${image.path}" />`,
    `<meta name="twitter:image:alt" content="${escapeHtml(image.alt)}" />`,
    `<script type="application/ld+json">${jsonForHtml(structuredData(page))}</script>`,
  ].join("\n    ");
}

for (const page of pages) {
  const content = render(page.path);
  if ((content.match(/<h1\b/gu) || []).length !== 1) {
    throw new Error(`Expected one primary heading in ${page.path}.`);
  }
  const html = template.replace(metadataMarker, () => metadata(page)).replace(contentMarker, () => content);
  const output = new URL(page.path === "/" ? "index.html" : `${page.path.slice(1)}.html`, outputDirectory);
  await mkdir(dirname(fileURLToPath(output)), { recursive: true });
  await writeFile(output, html);
}

const notFoundContent = `<div class="error-page">
  <header class="error-page-brand"><a href="/" aria-label="Mon Florian, accueil"><img alt="Mon Florian" src="/assets/monflorian-wordmark-web.webp" width="338" height="181" /></a></header>
  <main class="error-page-shell" id="main-content" tabindex="-1"><section class="error-state error-state--lost">
    <img class="error-state-art" src="/assets/errors/florian-lost.webp" alt="" width="360" height="360" />
    <div class="error-state-copy"><h1>Cette page est introuvable.</h1><p>Même avec sa carte, Florian ne la trouve pas. Le lien peut être incomplet ou la page a changé d’adresse.</p><p class="error-state-guidance">Vérifie l’adresse, ou retrouve les carnets et les guides depuis l’accueil.</p>
      <div class="error-state-actions"><a class="primary-button" href="/">Revenir à l’accueil</a><a class="error-state-secondary" href="/guides">Consulter les guides</a></div>
      <p class="error-state-support">Besoin d’un coup de main ? Écris à <a href="mailto:support@monflorian.com">support@monflorian.com</a> en précisant ce que tu essayais de faire. Pour un carnet privé, ne joins ni son lien ni tes photos.</p>
    </div></section></main>
</div>`;
const notFoundHtml = template
  .replace("<body>", '<body class="error-page">')
  .replace(metadataMarker, '<title>Page introuvable | Mon Florian</title>\n    <meta name="robots" content="noindex,follow" />\n    <link rel="stylesheet" href="/error.css" />')
  .replace(contentMarker, () => notFoundContent)
  .replace(/\s*<script\b[^>]*\btype="module"[^>]*>[\s\S]*?<\/script>/gu, "")
  .replace(/\s*<link\b[^>]*\brel="modulepreload"[^>]*>/gu, "")
  .replace(/\s*<noscript>[\s\S]*?<\/noscript>/gu, "");
await writeFile(new URL("404.html", outputDirectory), notFoundHtml);

console.log(JSON.stringify({ event: "public_pages_prerendered", pages: pages.map((page) => page.path), notFound: true }));
