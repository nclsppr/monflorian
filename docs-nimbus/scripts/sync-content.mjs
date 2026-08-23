import { execFileSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import YAML from "yaml";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const nimbusRoot = path.resolve(scriptDirectory, "..");
const repositoryRoot = path.resolve(nimbusRoot, "..");
const destinationRoot = path.join(nimbusRoot, "src", "content", "docs");
const catalogScript = path.join(
  repositoryRoot,
  "scripts",
  "documentation_catalog.py",
);

function normalizeBasePath(value = "/") {
  const raw = value.trim() || "/";
  if (!raw.startsWith("/")) {
    throw new Error("NIMBUS_BASE_PATH must start with '/'.");
  }
  return raw === "/" ? "" : raw.replace(/\/+$/u, "");
}

function cleanTitle(value) {
  return value
    .replace(/\[([^\]]+)\]\([^)]*\)/gu, "$1")
    .replace(/[`*_~]/gu, "")
    .replace(/\s+#+\s*$/u, "")
    .trim();
}

function splitFrontmatter(source, sourcePath) {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/u);
  if (!match) {
    return { frontmatter: {}, body: source };
  }

  const frontmatter = YAML.parse(match[1]);
  if (!frontmatter || typeof frontmatter !== "object") {
    throw new Error(`Invalid YAML frontmatter in ${sourcePath}`);
  }
  return { frontmatter, body: source.slice(match[0].length) };
}

function extractTitle(body, frontmatter, sourcePath) {
  const heading = body.match(/^\s{0,3}#\s+(.+?)\s*$/mu);
  const configuredTitle =
    typeof frontmatter.title === "string" ? frontmatter.title.trim() : "";

  if (!heading && !configuredTitle) {
    throw new Error(`Missing title and H1 in ${sourcePath}`);
  }

  const title = configuredTitle || cleanTitle(heading[1]);
  const bodyWithoutHeading = heading
    ? `${body.slice(0, heading.index)}${body.slice(heading.index + heading[0].length)}`
    : body;

  return { title, body: bodyWithoutHeading.replace(/^\s*\r?\n/u, "") };
}

function routeForSourcePath(sourcePath, basePath = "") {
  const normalized = path.posix.normalize(sourcePath);
  if (normalized === ".." || normalized.startsWith("../")) {
    throw new Error(`Source path escapes repository: ${sourcePath}`);
  }

  const basename = path.posix.basename(normalized).toLowerCase();
  const sourceDirectory = path.posix.dirname(normalized);
  const route =
    basename === "readme.md" || basename === "index.md"
      ? sourceDirectory === "."
        ? "overview"
        : sourceDirectory
      : normalized.replace(/\.md$/iu, "");
  const slug =
    route === "." || route === ""
      ? ""
      : route
          .split("/")
          .filter(Boolean)
          .map((segment) => segment.toLowerCase())
          .join("/");
  return slug ? `${basePath}/${slug}` : `${basePath || ""}/`;
}

function convertLinks(body, sourcePath, sourcePaths, basePath) {
  const sourceDirectory = path.posix.dirname(sourcePath);
  let activeFence = null;

  return body
    .split(/\r?\n/u)
    .map((line) => {
      const fence = line.match(/^\s*(`{3,}|~{3,})/u);
      if (fence) {
        const marker = fence[1][0];
        activeFence =
          activeFence === null
            ? marker
            : activeFence === marker
              ? null
              : activeFence;
        return line;
      }
      if (activeFence !== null) return line;

      const filesConverted = line.replace(
        /\]\((?![a-z][a-z0-9+.-]*:|#|\/)([^)\s]+?\.md)(#[^)\s]+)?\)/giu,
        (match, rawTarget, fragment = "") => {
          let target = path.posix.normalize(
            path.posix.join(sourceDirectory, decodeURIComponent(rawTarget)),
          );
          if (!sourcePaths.has(target)) {
            const rootTarget = path.posix.basename(target);
            if (sourcePaths.has(rootTarget)) target = rootTarget;
          }
          return sourcePaths.has(target)
            ? `](${routeForSourcePath(target, basePath)}${fragment})`
            : match;
        },
      );

      const directoriesConverted = filesConverted.replace(
        /\]\((?![a-z][a-z0-9+.-]*:|#|\/)([^)\s]*\/)(#[^)\s]+)?\)/giu,
        (match, rawTarget, fragment = "") => {
          const targetDirectory = path.posix
            .normalize(
              path.posix.join(sourceDirectory, decodeURIComponent(rawTarget)),
            )
            .replace(/\/+$/u, "");
          const hasChild = [...sourcePaths].some(
            (candidate) =>
              candidate.startsWith(`${targetDirectory}/`) ||
              candidate === `${targetDirectory}/README.md` ||
              candidate === `${targetDirectory}/index.md`,
          );
          return hasChild
            ? `](${routeForSourcePath(`${targetDirectory}/index.md`, basePath)}${fragment})`
            : match;
        },
      );

      return directoriesConverted.replace(
        /\[([^\]]+)\]\((?![a-z][a-z0-9+.-]*:|#|\/)([^)\s/.]+)\)/giu,
        (_match, label, target) => `\`${label}\` (source : \`${target}\`)`,
      );
    })
    .join("\n");
}

export function destinationFor(sourcePath) {
  const normalized = path.posix.normalize(sourcePath);
  const basename = path.posix.basename(normalized).toLowerCase();
  const sourceDirectory = path.posix.dirname(normalized);
  const relativeDestination =
    (basename === "readme.md" || basename === "index.md") &&
    sourceDirectory === "."
      ? "overview.mdx"
      : basename === "readme.md"
      ? path.posix.join(path.posix.dirname(normalized), "index.mdx")
      : normalized.replace(/\.md$/iu, ".mdx");
  const destination = path.resolve(destinationRoot, relativeDestination);
  if (!destination.startsWith(`${destinationRoot}${path.sep}`) && destination !== destinationRoot) {
    throw new Error(`Destination escapes Nimbus content root: ${sourcePath}`);
  }
  return destination;
}

export function convertSourceDocument(
  source,
  sourcePath,
  visibility,
  sourcePaths,
  basePath = "",
) {
  const { frontmatter, body } = splitFrontmatter(source, sourcePath);
  const extracted = extractTitle(body, frontmatter, sourcePath);
  const label =
    typeof frontmatter.label === "string" && frontmatter.label.trim()
      ? frontmatter.label.trim()
      : extracted.title;
  const nimbusFrontmatter = {
    title: extracted.title,
    ...(typeof frontmatter.description === "string"
      ? { description: frontmatter.description }
      : {}),
    sidebar: {
      ...(Number.isInteger(frontmatter.order)
        ? { order: frontmatter.order }
        : {}),
      label,
    },
    searchable: visibility !== "archive",
    sourcePath,
    visibility,
  };
  const convertedBody = convertLinks(
    extracted.body.replace(/<!--[\s\S]*?-->/gu, "").trim(),
    sourcePath,
    sourcePaths,
    basePath,
  );

  return {
    content: `---\n${YAML.stringify(nimbusFrontmatter).trimEnd()}\n---\n\n${convertedBody}\n`,
    metadata: { label, title: extracted.title },
  };
}

function loadInventory() {
  const raw = execFileSync("python3", [catalogScript, "--json"], {
    cwd: repositoryRoot,
    encoding: "utf8",
  });
  const inventory = JSON.parse(raw);
  const entries = inventory.collections.flatMap((collection) =>
    collection.files.map((sourcePath) => ({
      sourcePath,
      visibility: collection.visibility,
    })),
  );
  return { entries, inventory };
}

async function writeSyntheticIndexes(entries, metadata, basePath) {
  const sourcePaths = new Set(entries.map((entry) => entry.sourcePath));
  const directories = new Set([""]);
  for (const { sourcePath } of entries) {
    let directory = path.posix.dirname(sourcePath);
    while (directory && directory !== ".") {
      directories.add(directory);
      directory = path.posix.dirname(directory);
    }
  }

  let count = 0;
  for (const directory of [...directories].sort()) {
    const hasIndex =
      sourcePaths.has(directory ? `${directory}/README.md` : "README.md") ||
      sourcePaths.has(directory ? `${directory}/index.md` : "index.md");
    if (hasIndex) continue;

    const directPages = entries.filter(
      ({ sourcePath }) => path.posix.dirname(sourcePath) === (directory || "."),
    );
    const childDirectories = new Set();
    for (const { sourcePath } of entries) {
      if (!directory && sourcePath.includes("/")) {
        childDirectories.add(sourcePath.split("/")[0]);
      } else if (directory && sourcePath.startsWith(`${directory}/`)) {
        const remainder = sourcePath.slice(directory.length + 1);
        if (remainder.includes("/")) {
          childDirectories.add(`${directory}/${remainder.split("/")[0]}`);
        }
      }
    }

    const links = [
      ...directPages.map(({ sourcePath }) => ({
        label: metadata.get(sourcePath)?.label || path.posix.basename(sourcePath),
        href: routeForSourcePath(sourcePath, basePath),
      })),
      ...[...childDirectories].map((child) => ({
        label: path.posix.basename(child),
        href: routeForSourcePath(`${child}/index.md`, basePath),
      })),
    ]
      .sort((left, right) => left.label.localeCompare(right.label, "fr"))
      .map(({ label, href }) => `- [${label}](${href})`)
      .join("\n");
    const title = directory
      ? path.posix.basename(directory).replace(/[-_]/gu, " ")
      : "Documentation";
    const outputPath = path.join(destinationRoot, directory, "index.mdx");
    const frontmatter = {
      title,
      sidebar: { label: title },
      searchable: true,
      sourcePath: `generated:${directory || "root"}`,
      visibility: "reference",
    };
    await mkdir(path.dirname(outputPath), { recursive: true });
    await writeFile(
      outputPath,
      `---\n${YAML.stringify(frontmatter).trimEnd()}\n---\n\n${links}\n`,
      "utf8",
    );
    count += 1;
  }
  return count;
}

export async function syncContent() {
  const expectedDestination = path.join(
    repositoryRoot,
    "docs-nimbus",
    "src",
    "content",
    "docs",
  );
  if (destinationRoot !== expectedDestination) {
    throw new Error(`Refusing to clear unexpected path: ${destinationRoot}`);
  }

  const basePath = normalizeBasePath(process.env.NIMBUS_BASE_PATH || "/");
  const { entries } = loadInventory();
  const sourcePaths = new Set(entries.map((entry) => entry.sourcePath));
  const destinations = new Set();
  const metadata = new Map();

  await rm(destinationRoot, { recursive: true, force: true });
  await mkdir(destinationRoot, { recursive: true });

  for (const entry of entries) {
    const sourceFile = path.resolve(repositoryRoot, entry.sourcePath);
    if (!sourceFile.startsWith(`${repositoryRoot}${path.sep}`)) {
      throw new Error(`Source escapes repository: ${entry.sourcePath}`);
    }
    const outputPath = destinationFor(entry.sourcePath);
    if (destinations.has(outputPath)) {
      throw new Error(`Duplicate Nimbus destination: ${outputPath}`);
    }
    destinations.add(outputPath);

    const converted = convertSourceDocument(
      await readFile(sourceFile, "utf8"),
      entry.sourcePath,
      entry.visibility,
      sourcePaths,
      basePath,
    );
    await mkdir(path.dirname(outputPath), { recursive: true });
    await writeFile(outputPath, converted.content, "utf8");
    metadata.set(entry.sourcePath, converted.metadata);
  }

  const syntheticCount = await writeSyntheticIndexes(
    entries,
    metadata,
    basePath,
  );
  process.stdout.write(
    `Nimbus content: ${entries.length + syntheticCount} pages generated ` +
      `from ${entries.length} maintained Markdown files.\n`,
  );
  return { sourceCount: entries.length, syntheticCount };
}

const isDirectExecution =
  process.argv[1] &&
  pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;

if (isDirectExecution) {
  await syncContent();
}
