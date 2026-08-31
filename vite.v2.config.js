import { fileURLToPath } from "node:url";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

import { validateTravelGuideDraft } from "./app/travel-guide.mjs";
import japanGuideContext from "./contracts/examples/japan-10-days.context.v1.json" with { type: "json" };
import japanGuideFixture from "./contracts/examples/japan-10-days.v1.json" with { type: "json" };

const projectRoot = fileURLToPath(new URL("./", import.meta.url));
const publicGuideModuleId = "virtual:monflorian-japan-guide";
const resolvedPublicGuideModuleId = `\0${publicGuideModuleId}`;
const validatedJapanGuide = validateTravelGuideDraft(japanGuideFixture, japanGuideContext);
const publicJapanGuide = Object.freeze({
  ...validatedJapanGuide,
  imageBriefs: validatedJapanGuide.imageBriefs.map(({ altText, id }) => ({ altText, id })),
});

function publicTravelGuidePlugin() {
  return {
    name: "monflorian-public-travel-guide",
    resolveId(id) {
      return id === publicGuideModuleId ? resolvedPublicGuideModuleId : null;
    },
    load(id) {
      if (id !== resolvedPublicGuideModuleId) return null;
      return `export default ${JSON.stringify(publicJapanGuide)};`;
    },
  };
}

export default defineConfig({
  base: "/v2/",
  plugins: [publicTravelGuidePlugin(), react()],
  publicDir: false,
  root: fileURLToPath(new URL("./app/v2/", import.meta.url)),
  build: {
    emptyOutDir: false,
    outDir: fileURLToPath(new URL("./dist/v2/", import.meta.url)),
    rollupOptions: {
      input: fileURLToPath(new URL("./app/v2/index.html", import.meta.url)),
      output: {
        manualChunks(id) {
          if (id.includes("/node_modules/@astryxdesign/") || id.includes("/node_modules/@stylexjs/")) {
            return "astryx";
          }
          if (id.includes("/node_modules/react/") || id.includes("/node_modules/react-dom/")) {
            return "react";
          }
          return undefined;
        },
      },
    },
  },
  resolve: {
    alias: {
      "@v2": `${projectRoot}app/v2/src`,
    },
  },
});
