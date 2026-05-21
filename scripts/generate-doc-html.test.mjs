import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { inputFiles, pandocArgs, readMetadata } from "./generate-doc-html.mjs";

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

function runScript(directoryPath) {
  return spawnSync(process.execPath, [scriptPath, directoryPath], {
    encoding: "utf8",
  });
}

test("builds pandoc arguments from report artifacts in document order", (t) => {
  const directoryPath = makeFixture(t);

  writeFile(directoryPath, "metadata.json", JSON.stringify({ title: "Fixture Title" }));
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
    "--standalone",
    "--toc",
    "--metadata",
    "title=Fixture Title",
    "ABSTRACT.md",
    path.join("sections", "2.md"),
    path.join("sections", "10.md"),
    "APPENDIX.md",
    "REFERENCES.md",
  ]);
});

test("generates standalone HTML from report artifacts", { skip: !hasPandoc }, (t) => {
  const directoryPath = makeFixture(t);

  writeFile(directoryPath, "metadata.json", JSON.stringify({ title: "Fixture Title" }));
  writeFile(directoryPath, "ABSTRACT.md", "## Abstract\n\nAbstract body.\n");
  writeSection(directoryPath, "1.md", "## Section 1\n\nSection body.\n");

  const result = runScript(directoryPath);

  assert.equal(result.status, 0, result.stderr);

  const html = fs.readFileSync(path.join(directoryPath, "index.html"), "utf8");
  assert.match(html, /^<!DOCTYPE html>/);
  assert.match(html, /<title>Fixture Title<\/title>/);
  assert.match(html, /Section body\./);
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
