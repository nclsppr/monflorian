import { cp, mkdir, readdir, rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const projectRoot = fileURLToPath(new URL("../", import.meta.url));
const publicDirectory = fileURLToPath(new URL("../app/public/", import.meta.url));
const brandDirectory = fileURLToPath(new URL("../assets/brand/", import.meta.url));
const outputDirectory = fileURLToPath(new URL("../dist/", import.meta.url));
const outputAssetsDirectory = fileURLToPath(new URL("../dist/assets/", import.meta.url));

await rm(outputDirectory, { force: true, recursive: true });
await cp(publicDirectory, outputDirectory, { recursive: true });
await mkdir(outputAssetsDirectory, { recursive: true });

const brandAssets = (await readdir(brandDirectory, { withFileTypes: true }))
  .filter((entry) => entry.isFile() && entry.name.endsWith(".png"))
  .map((entry) => entry.name)
  .sort();

for (const asset of brandAssets) {
  await cp(`${brandDirectory}/${asset}`, `${outputAssetsDirectory}/${asset}`);
}

console.log(JSON.stringify({
  event: "worker_assets_built",
  output: outputDirectory.slice(projectRoot.length),
  brandAssets: brandAssets.length,
}));
