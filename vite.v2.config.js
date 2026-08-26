import { fileURLToPath } from "node:url";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const projectRoot = fileURLToPath(new URL("./", import.meta.url));

export default defineConfig({
  base: "/v2/",
  plugins: [react()],
  publicDir: false,
  root: fileURLToPath(new URL("./app/v2/", import.meta.url)),
  build: {
    emptyOutDir: false,
    outDir: fileURLToPath(new URL("./dist/v2/", import.meta.url)),
    rollupOptions: {
      input: fileURLToPath(new URL("./app/v2/index.html", import.meta.url)),
    },
  },
  resolve: {
    alias: {
      "@v2": `${projectRoot}app/v2/src`,
    },
  },
});
