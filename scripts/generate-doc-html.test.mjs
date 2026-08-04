import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import {
  AI_AUTHORSHIP_FOOTER,
  DEFAULT_DOCS_BASE_URL,
  docsBaseUrl,
  ghPagesDocumentUrl,
  ghPagesFooterHtml,
  ghPagesHeaderHtml,
  inputFiles,
  pandocArgs,
  readMetadata,
  validateFootnoteIdentifiers,
} from "./generate-doc-html.mjs";

const scriptPath = fileURLToPath(new URL("generate-doc-html.mjs", import.meta.url));
const hasPandoc = spawnSync("pandoc", ["--version"], { encoding: "utf8" }).status === 0;

function makeFixture(t) {
  const directoryPath = fs.mkdtempSync(path.join(os.tmpdir(), "generate-doc-html-"));
  fs.mkdirSync(path.join(directoryPath, "sections"));
  t.after(() => fs.rmSync(directoryPath, { recursive: true, force: true }));
  return directoryPath;
}

function writeFile(directoryPath, fileName, content) {
  fs.writeFileSync(path.join(directoryPath, fileName), content);
}

function writeSection(directoryPath, fileName, content) {
  fs.writeFileSync(path.join(directoryPath, "sections", fileName), content);
}

function writePartFile(directoryPath, partName, fileName, content) {
  const partPath = path.join(directoryPath, "sections", partName);
  fs.mkdirSync(partPath, { recursive: true });
  fs.writeFileSync(path.join(partPath, fileName), content);
}

function runScript(directoryPath, outputPath) {
  const args = outputPath ? [scriptPath, directoryPath, outputPath] : [scriptPath, directoryPath];

  return spawnSync(process.execPath, args, {
    encoding: "utf8",
  });
}

test("builds pandoc arguments from report artifacts in document order", (t) => {
  const directoryPath = makeFixture(t);

  writeFile(directoryPath, "metadata.json", JSON.stringify({ title: "Fixture Title", description: "Fixture summary" }));
  writeFile(directoryPath, "ABSTRACT.md", "## Abstract\n\nAbstract body.\n");
  writeFile(directoryPath, "TOC.md", "## Contents\n\nContents body.\n");
  writeSection(directoryPath, "10.md", "## Section 10\n\nSection 10 body.\n");
  writeSection(directoryPath, "2.md", "## Section 2\n\nSection 2 body.\n");
  writeSection(directoryPath, "draft.md", "## Draft\n\nDraft body.\n");
  writeFile(directoryPath, "APPENDIX.md", "## Appendix\n\nAppendix body.\n");
  writeFile(directoryPath, "REFERENCES.md", "## References\n\nReferences body.\n");

  assert.deepEqual(inputFiles(directoryPath), [
    "ABSTRACT.md",
    path.join("sections", "2.md"),
    path.join("sections", "10.md"),
    "APPENDIX.md",
    "REFERENCES.md",
  ]);
  assert.deepEqual(pandocArgs(directoryPath), [
    "-o",
    "index.html",
    "--from=gfm",
    "--to=html5",
    "--standalone",
    "--toc",
    "--wrap=none",
    "--metadata",
    "title=Fixture Title",
    "--metadata",
    "description=Fixture summary",
    "ABSTRACT.md",
    path.join("sections", "2.md"),
    path.join("sections", "10.md"),
    "APPENDIX.md",
    "REFERENCES.md",
  ]);
  assert.deepEqual(pandocArgs(directoryPath, path.join("dist", "index.html")).slice(0, 2), [
    "-o",
    path.join("dist", "index.html"),
  ]);
  assert.ok(
    pandocArgs(directoryPath, "index.html", { includeAfterBody: path.join("tmp", "footer.html") }).includes(
      "--include-after-body",
    ),
  );
});

test("builds pandoc arguments from parts and chapters in document order", (t) => {
  const directoryPath = makeFixture(t);

  writeFile(directoryPath, "metadata.json", JSON.stringify({ title: "Fixture Title", description: "Fixture summary" }));
  writeFile(directoryPath, "ABSTRACT.md", "## Abstract\n\nAbstract body.\n");
  writePartFile(directoryPath, "02", "PART.md", "# Part 2\n\nPart introduction.\n");
  writePartFile(directoryPath, "02", "10.md", "## Section 10\n\nSection 10 body.\n");
  writePartFile(directoryPath, "01", "2.md", "## Section 2\n\nSection 2 body.\n");
  writePartFile(directoryPath, "01", "PART.md", "# Part 1\n\nPart introduction.\n");
  writePartFile(directoryPath, "01", "draft.md", "## Draft\n\nDraft body.\n");
  writeFile(directoryPath, "REFERENCES.md", "## References\n\nReferences body.\n");

  assert.deepEqual(inputFiles(directoryPath), [
    "ABSTRACT.md",
    path.join("sections", "01", "PART.md"),
    path.join("sections", "01", "2.md"),
    path.join("sections", "02", "PART.md"),
    path.join("sections", "02", "10.md"),
    "REFERENCES.md",
  ]);
});

test("rejects mixed flat chapters and part directories", (t) => {
  const directoryPath = makeFixture(t);

  writeFile(directoryPath, "metadata.json", JSON.stringify({ title: "Fixture Title", description: "Fixture summary" }));
  writeSection(directoryPath, "1.md", "## Section 1\n\nSection body.\n");
  writePartFile(directoryPath, "01", "PART.md", "# Part 1\n\nPart introduction.\n");

  assert.throws(() => inputFiles(directoryPath), /Cannot mix flat chapters and part directories under sections/);
});

test("requires a part artifact in each part directory", (t) => {
  const directoryPath = makeFixture(t);

  writeFile(directoryPath, "metadata.json", JSON.stringify({ title: "Fixture Title", description: "Fixture summary" }));
  writePartFile(directoryPath, "01", "1.md", "## Section 1\n\nSection body.\n");

  assert.throws(() => inputFiles(directoryPath), /Missing PART\.md in sections\/01/);
});

test("generates standalone HTML from report artifacts", { skip: !hasPandoc }, (t) => {
  const directoryPath = makeFixture(t);

  writeFile(directoryPath, "metadata.json", JSON.stringify({ title: "Fixture Title", description: "Fixture summary" }));
  writeFile(directoryPath, "ABSTRACT.md", "## Abstract\n\nAbstract body.\n");
  writeSection(directoryPath, "1.md", "## Section 1\n\nSection body.\n");

  const result = runScript(directoryPath);

  assert.equal(result.status, 0, result.stderr);

  const html = fs.readFileSync(path.join(directoryPath, "index.html"), "utf8");
  assert.match(html, /^<!DOCTYPE html>/);
  assert.match(html, /<title>Fixture Title<\/title>/);
  assert.match(html, /<meta property="og:title" content="Fixture Title">/);
  assert.match(html, /<meta name="description" content="Fixture summary" \/>/);
  assert.match(html, /<meta property="og:description" content="Fixture summary">/);
  assert.ok(html.includes(`<meta property="og:url" content="${ghPagesDocumentUrl(directoryPath)}">`));
  assert.match(html, /<meta property="og:type" content="article">/);
  assert.match(html, /html \{\n\s+font-size: 16pt;\n\s+\}/);
  assert.match(html, /@media print \{\n\s+html \{\n\s+font-size: 12pt;\n\s+\}/);
  assert.match(html, /Section body\./);
  assert.match(html, new RegExp(AI_AUTHORSHIP_FOOTER));
});

test("generates standalone HTML to an explicit output path", { skip: !hasPandoc }, (t) => {
  const directoryPath = makeFixture(t);
  const outputPath = path.join(directoryPath, "dist", "doc", "index.html");
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });

  writeFile(directoryPath, "metadata.json", JSON.stringify({ title: "Fixture Title", description: "Fixture summary" }));
  writeFile(directoryPath, "ABSTRACT.md", "## Abstract\n\nAbstract body.\n");
  writeSection(directoryPath, "1.md", "## Section 1\n\nSection body.\n");

  const result = runScript(directoryPath, outputPath);

  assert.equal(result.status, 0, result.stderr);
  assert.match(fs.readFileSync(outputPath, "utf8"), /Section body\./);
});

test("allows repeated footnote identifiers within one artifact", (t) => {
  const directoryPath = makeFixture(t);

  writeFile(directoryPath, "metadata.json", JSON.stringify({ title: "Fixture Title", description: "Fixture summary" }));
  writeSection(directoryPath, "1.md", "## Section 1\n\nTerm[^s1-term].\n\n[^s1-term]: Definition.\n");

  assert.doesNotThrow(() => validateFootnoteIdentifiers(directoryPath));
});

test("rejects duplicate footnote identifiers across artifacts", (t) => {
  const directoryPath = makeFixture(t);

  writeFile(directoryPath, "metadata.json", JSON.stringify({ title: "Fixture Title", description: "Fixture summary" }));
  writeSection(directoryPath, "1.md", "## Section 1\n\nFirst[^shared].\n\n[^shared]: First definition.\n");
  writeSection(directoryPath, "2.md", "## Section 2\n\nSecond[^shared].\n\n[^shared]: Second definition.\n");

  assert.throws(
    () => validateFootnoteIdentifiers(directoryPath),
    /Footnote identifiers must be unique across the document:\n\[\^shared\] is used in both sections\/1\.md and sections\/2\.md/,
  );
});

test("rejects local numeric footnote identifiers", (t) => {
  const directoryPath = makeFixture(t);

  writeFile(directoryPath, "metadata.json", JSON.stringify({ title: "Fixture Title", description: "Fixture summary" }));
  writeSection(directoryPath, "1.md", "## Section 1\n\nTerm[^1].\n\n[^1]: Definition.\n");

  assert.throws(
    () => validateFootnoteIdentifiers(directoryPath),
    /Footnote identifiers must be unique across the document:\n\[\^1\] in sections\/1\.md uses a local numeric identifier/,
  );
});

test("fails when metadata.json is missing", (t) => {
  const directoryPath = makeFixture(t);
  writeFile(directoryPath, "ABSTRACT.md", "## Abstract\n\nAbstract body.\n");

  assert.throws(() => readMetadata(directoryPath), /Missing metadata\.json/);
});

test("fails when metadata title is blank", (t) => {
  const directoryPath = makeFixture(t);
  writeFile(directoryPath, "metadata.json", JSON.stringify({ title: " " }));
  writeFile(directoryPath, "ABSTRACT.md", "## Abstract\n\nAbstract body.\n");

  assert.throws(() => readMetadata(directoryPath), /non-empty string title/);
});

test("fails when metadata description is blank", (t) => {
  const directoryPath = makeFixture(t);
  writeFile(directoryPath, "metadata.json", JSON.stringify({ title: "Fixture Title", description: " " }));
  writeFile(directoryPath, "ABSTRACT.md", "## Abstract\n\nAbstract body.\n");

  assert.throws(() => readMetadata(directoryPath), /non-empty string description/);
});

test("escapes OGP title for HTML attributes", () => {
  assert.equal(
    ghPagesHeaderHtml({ title: `A&B <"quoted">'`, description: "Fixture summary" }).split("\n")[0],
    `<meta property="og:title" content="A&amp;B &lt;&quot;quoted&quot;&gt;&#39;">`,
  );
});

test("escapes description for HTML attributes", () => {
  assert.match(
    ghPagesHeaderHtml({ title: "Fixture Title", description: `A&B <"quoted">'` }),
    /<meta property="og:description" content="A&amp;B &lt;&quot;quoted&quot;&gt;&#39;">/,
  );
});

test("generates OGP URL for article pages", (t) => {
  const previousBaseUrl = process.env.DOCS_BASE_URL;
  t.after(() => {
    if (previousBaseUrl === undefined) {
      delete process.env.DOCS_BASE_URL;
    } else {
      process.env.DOCS_BASE_URL = previousBaseUrl;
    }
  });

  assert.equal(docsBaseUrl({ DOCS_BASE_URL: "https://example.com/docs" }), "https://example.com/docs/");
  assert.equal(ghPagesDocumentUrl("fixture-doc"), `${DEFAULT_DOCS_BASE_URL}fixture-doc/`);
  process.env.DOCS_BASE_URL = "https://example.com/docs";
  assert.equal(ghPagesDocumentUrl("fixture-doc"), "https://example.com/docs/fixture-doc/");
  assert.match(
    ghPagesHeaderHtml(
      { title: "Fixture Title", description: "Fixture summary" },
      `${DEFAULT_DOCS_BASE_URL}fixture-doc/?a=1&b=2`,
    ),
    /<meta property="og:url" content="https:\/\/oakcask\.github\.io\/docs\/fixture-doc\/\?a=1&amp;b=2">/,
  );
});

test("generates OGP type for article pages", () => {
  assert.match(
    ghPagesHeaderHtml({ title: "Fixture Title", description: "Fixture summary" }),
    /<meta property="og:type" content="article">/,
  );
});

test("generates gh-pages header CSS", () => {
  assert.match(ghPagesHeaderHtml({ title: "Fixture Title", description: "Fixture summary" }), /font-size: 16pt;/);
  assert.match(ghPagesHeaderHtml({ title: "Fixture Title", description: "Fixture summary" }), /font-size: 12pt;/);
});

test("generates gh-pages footer HTML", () => {
  assert.equal(ghPagesFooterHtml(), `<hr>\n<footer><p>${AI_AUTHORSHIP_FOOTER}</p></footer>\n`);
});
