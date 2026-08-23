import { defineConfig } from "astro/config";
import icon from "astro-icon";
import tailwindcss from "@tailwindcss/vite";
import nimbus, { defineConfig as defineNimbusConfig } from "@cloudflare/nimbus-docs";
import { tableScroll } from "@cloudflare/nimbus-docs/markdown";

const siteOrigin = process.env.NIMBUS_SITE_ORIGIN?.trim() || "http://localhost:4321";
const rawBasePath = process.env.NIMBUS_BASE_PATH?.trim() || "/";

if (!rawBasePath.startsWith("/")) {
  throw new Error("NIMBUS_BASE_PATH must start with '/'.");
}

const basePath = rawBasePath === "/" ? "" : rawBasePath.replace(/\/+$/, "");

const nimbusConfig = defineNimbusConfig({
  site: siteOrigin,
  title: process.env.NIMBUS_TITLE?.trim() || "Project Documentation",
  description:
    process.env.NIMBUS_DESCRIPTION?.trim() ||
    "Documentation produit, technique et opérationnelle du projet.",
  locale: process.env.NIMBUS_LOCALE?.trim() || "fr",
  homeLabel: "Accueil",
  github: process.env.NIMBUS_GITHUB?.trim() || null,
  editPattern: null,
  socialImageAlt: "Aperçu de la documentation Nimbus",
  sidebar: {
    defaultCollapsed: true,
  },
});

export default defineConfig({
  base: `${basePath}/`,
  output: "static",
  // Tailwind v4 via its Vite plugin (the integration Astro recommends for
  // Tailwind v4 — replaces the PostCSS plugin, which doesn't build under
  // Astro 7's Vite 8 bundler).
  vite: {
    plugins: [tailwindcss()],
  },
  // Hover-prefetch link targets so full-page navigations feel instant without
  // a client-side router.
  prefetch: {
    prefetchAll: true,
    defaultStrategy: "hover",
  },
  integrations: [
    icon(),
    nimbus(nimbusConfig, {
      // Authoring rules are explicit. The
      // two below are the load-bearing pair: frontmatter has to validate
      // against the content schema for the page to render properly, and
      // broken internal links are 404s for your readers. Add the others
      // (heading hierarchy, code-block language, style, etc.) when you're
      // ready to enforce them — see `nimbus-docs lint --help`.
      rules: {
        "nimbus/frontmatter-shape": "error",
        "nimbus/internal-link": "error",
      },
      // Wrap wide tables so they scroll instead of overflowing the page
      // (styled by `.nb-table-scroll` in src/styles/prose.css).
      markdown: {
        hastPlugins: [tableScroll()],
      },
    }),
  ],
});
