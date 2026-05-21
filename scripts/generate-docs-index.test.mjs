import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { docsIndexHtml, escapeHtml, readTitle } from "./generate-docs-index.mjs";

function makeFixture(t) {
  const directoryPath = fs.mkdtempSync(path.join(os.tmpdir(), "generate-docs-index-"));
  t.after(() => fs.rmSync(directoryPath, { recursive: true, force: true }));
  return directoryPath;
}

function writeMetadata(directoryPath, metadata) {
  fs.writeFileSync(path.join(directoryPath, "metadata.json"), JSON.stringify(metadata));
}

test("escapes HTML-sensitive characters", () => {
  assert.equal(escapeHtml(`A&B <C> "D" 'E'`), "A&amp;B &lt;C&gt; &quot;D&quot; &#39;E&#39;");
});

test("reads a non-empty metadata title", (t) => {
  const directoryPath = makeFixture(t);
  writeMetadata(directoryPath, { title: "Fixture Title" });

  assert.equal(readTitle(directoryPath), "Fixture Title");
});

test("generates links to each document index", (t) => {
  const rootPath = makeFixture(t);
  const firstPath = path.join(rootPath, "first-doc");
  const secondPath = path.join(rootPath, "second-doc");
  fs.mkdirSync(firstPath);
  fs.mkdirSync(secondPath);
  writeMetadata(firstPath, { title: "First & Best" });
  writeMetadata(secondPath, { title: "Second <Draft>" });

  const html = docsIndexHtml([firstPath, secondPath]);

  assert.match(html, /<a href="[^\"]*\/first-doc">First &amp; Best<\/a>/);
  assert.match(html, /<a href="[^\"]*\/second-doc">Second &lt;Draft&gt;<\/a>/);
});

test("fails when metadata title is blank", (t) => {
  const directoryPath = makeFixture(t);
  writeMetadata(directoryPath, { title: " " });

  assert.throws(() => readTitle(directoryPath), /non-empty string title/);
});
