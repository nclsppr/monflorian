import { fileURLToPath } from "node:url";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

import { publicJapanExample } from "./app/public-travel-guide.mjs";

const projectRoot = fileURLToPath(new URL("./", import.meta.url));
const publicGuideModuleId = "virtual:monflorian-japan-guide";
const resolvedPublicGuideModuleId = `\0${publicGuideModuleId}`;
const publicJapanGuide = publicJapanExample().guide;

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
  base: "/",
  plugins: [publicTravelGuidePlugin(), react()],
  publicDir: false,
  root: fileURLToPath(new URL("./app/v2/", import.meta.url)),
  ssr: { noExternal: [/@astryxdesign/, /@stylexjs/] },
  build: {
    assetsDir: "site-assets",
    emptyOutDir: false,
    outDir: fileURLToPath(new URL("./dist/", import.meta.url)),
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
