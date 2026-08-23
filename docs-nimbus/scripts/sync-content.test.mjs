import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import {
  convertSourceDocument,
  destinationFor,
} from "./sync-content.mjs";

test("converts a plain Markdown source into Nimbus content", () => {
  const sourcePaths = new Set(["README.md", "docs/decision.md"]);
  const result = convertSourceDocument(
    "# Projet\n\nLire [la décision](docs/decision.md).\n",
    "README.md",
    "public",
    sourcePaths,
    "",
  );

  assert.match(result.content, /^---\ntitle: Projet\n/);
  assert.match(result.content, /sourcePath: README.md/);
  assert.match(result.content, /visibility: public/);
  assert.match(result.content, /\[la décision\]\(\/docs\/decision\)/);
  assert.doesNotMatch(result.content, /^# Projet$/m);
});

test("preserves useful source frontmatter and disables archive search", () => {
  const result = convertSourceDocument(
    "---\nlabel: Ancienne décision\norder: 4\n---\n\n# Décision\n\nHistorique.\n",
    "archive/decision.md",
    "archive",
    new Set(["archive/decision.md"]),
    "/docs",
  );

  assert.match(result.content, /sidebar:\n  order: 4\n  label: Ancienne décision/);
  assert.match(result.content, /searchable: false/);
});

test("maps README files to directory indexes", () => {
  assert.equal(path.basename(destinationFor("README.md")), "overview.mdx");
  assert.match(
    destinationFor("guides/README.md"),
    /src\/content\/docs\/guides\/index\.mdx$/u,
  );
});

test("links the root README to Nimbus' overview route", () => {
  const result = convertSourceDocument(
    "# Catalogue\n\nLire [l'accueil](README.md).\n",
    "DOCUMENTATION-CATALOG.md",
    "reference",
    new Set(["DOCUMENTATION-CATALOG.md", "README.md"]),
    "",
  );

  assert.match(result.content, /\[l'accueil\]\(\/overview\)/u);
});
