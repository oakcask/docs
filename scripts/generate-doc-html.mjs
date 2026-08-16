#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const USAGE = "Usage: node scripts/generate-doc-html.mjs <directory> [output-html]";
export const DOCS_BASE_URL_ENV = "DOCS_BASE_URL";
export const DEFAULT_DOCS_BASE_URL = "https://oakcask.github.io/docs/";
export const AI_AUTHORSHIP_FOOTER = "この文章のほとんどの部分は AI エージェントによって記述された。";
export const LAST_UPDATED_LABEL = "最終更新日";

function fail(message) {
  throw new Error(message);
}

function existsAsFile(filePath) {
  try {
    return fs.statSync(filePath).isFile();
  } catch {
    return false;
  }
}

function existsAsDirectory(directoryPath) {
  try {
    return fs.statSync(directoryPath).isDirectory();
  } catch {
    return false;
  }
}

export function readMetadata(directoryPath) {
  const metadataPath = path.join(directoryPath, "metadata.json");

  if (!existsAsFile(metadataPath)) {
    fail(`Missing metadata.json in ${directoryPath}`);
  }

  let metadata;
  try {
    metadata = JSON.parse(fs.readFileSync(metadataPath, "utf8"));
  } catch (error) {
    fail(`Invalid metadata.json: ${error.message}`);
  }

  if (metadata === null || Array.isArray(metadata) || typeof metadata !== "object") {
    fail("metadata.json must contain a JSON object");
  }

  if (typeof metadata.title !== "string" || metadata.title.trim() === "") {
    fail("metadata.json must contain a non-empty string title");
  }

  if (typeof metadata.description !== "string" || metadata.description.trim() === "") {
    fail("metadata.json must contain a non-empty string description");
  }

  if (
    metadata.lastUpdated !== undefined &&
    metadata.lastUpdated !== null &&
    (typeof metadata.lastUpdated !== "string" ||
      (metadata.lastUpdated.trim() !== "" && !isIsoDate(metadata.lastUpdated)))
  ) {
    fail("metadata.json lastUpdated must be empty or a valid date in YYYY-MM-DD format");
  }

  return metadata;
}

export function isIsoDate(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match) {
    return false;
  }

  const [, year, month, day] = match.map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

export function formatJapaneseDate(isoDate) {
  const [year, month, day] = isoDate.split("-").map(Number);
  return `${year}年${month}月${day}日`;
}

export function toMetadataArgs(metadata) {
  const args = [];

  for (const [key, value] of Object.entries(metadata)) {
    if (!/^[A-Za-z0-9_.-]+$/.test(key)) {
      fail(`Unsupported metadata key: ${key}`);
    }

    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      args.push("--metadata", `${key}=${value}`);
      continue;
    }

    if (value === null) {
      args.push("--metadata", key);
      continue;
    }

    fail(`Unsupported metadata value for ${key}: expected string, number, boolean, or null`);
  }

  return args;
}

export function escapeHtmlAttribute(value) {
  return String(value).replace(/[&<>"']/g, (char) => {
    switch (char) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      case "'":
        return "&#39;";
      default:
        return char;
    }
  });
}

export function ghPagesDocumentUrl(directoryPath) {
  return new URL(`${path.basename(path.resolve(directoryPath))}/`, docsBaseUrl()).href;
}

export function docsBaseUrl(env = process.env) {
  const baseUrl = env[DOCS_BASE_URL_ENV] || DEFAULT_DOCS_BASE_URL;
  return baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
}

export function ghPagesHeaderHtml(metadata, pageUrl) {
  const urlMeta = pageUrl ? `<meta property="og:url" content="${escapeHtmlAttribute(pageUrl)}">\n` : "";
  const descriptionMeta = `<meta property="og:description" content="${escapeHtmlAttribute(metadata.description)}">\n`;

  return `<meta property="og:title" content="${escapeHtmlAttribute(metadata.title)}">
${urlMeta}<meta property="og:type" content="article"><meta property="og:site_name" content="oakcask/docs">
${descriptionMeta}<meta property="og:type" content="article">
<style>
  html {
    font-size: 16pt;
  }
  @media print {
    html {
      font-size: 12pt;
    }
  }
</style>
`;
}

export function ghPagesBeforeBodyHtml(metadata) {
  if (typeof metadata.lastUpdated !== "string" || metadata.lastUpdated.trim() === "") {
    return "";
  }

  return `<p class="last-updated">${LAST_UPDATED_LABEL}：<time datetime="${escapeHtmlAttribute(metadata.lastUpdated)}">${formatJapaneseDate(metadata.lastUpdated)}</time></p>
`;
}

export function ghPagesFooterHtml() {
  return `<hr>
<footer><p>${AI_AUTHORSHIP_FOOTER}</p></footer>
`;
}

function sectionNumber(fileName) {
  const match = fileName.match(/^(\d+)\.md$/);
  return match ? Number(match[1]) : null;
}

function numericNames(left, right) {
  return Number(left.match(/^\d+/)[0]) - Number(right.match(/^\d+/)[0]);
}

export function sectionFiles(directoryPath) {
  const sectionsPath = path.join(directoryPath, "sections");

  if (!existsAsDirectory(sectionsPath)) {
    return [];
  }

  const flatSections = fs
    .readdirSync(sectionsPath)
    .filter((fileName) => sectionNumber(fileName) !== null)
    .sort(numericNames)
    .map((fileName) => path.join("sections", fileName));

  const partDirectories = fs
    .readdirSync(sectionsPath, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && /^\d+$/.test(entry.name))
    .map((entry) => entry.name)
    .sort(numericNames);

  if (partDirectories.length === 0) {
    return flatSections;
  }

  if (flatSections.length > 0) {
    fail("Cannot mix flat chapters and part directories under sections");
  }

  return partDirectories.flatMap((partName) => {
    const partPath = path.join(sectionsPath, partName);
    const partArtifactPath = path.join(partPath, "PART.md");

    if (!existsAsFile(partArtifactPath)) {
      fail(`Missing PART.md in sections/${partName}`);
    }

    const chapters = fs
      .readdirSync(partPath)
      .filter((fileName) => sectionNumber(fileName) !== null)
      .sort(numericNames)
      .map((fileName) => path.join("sections", partName, fileName));

    if (chapters.length === 0) {
      fail(`No chapters in sections/${partName}`);
    }

    return [path.join("sections", partName, "PART.md"), ...chapters];
  });
}

export function inputFiles(directoryPath) {
  const files = [];

  for (const fileName of ["ABSTRACT.md"]) {
    if (existsAsFile(path.join(directoryPath, fileName))) {
      files.push(fileName);
    }
  }

  files.push(...sectionFiles(directoryPath));

  for (const fileName of ["APPENDIX.md", "REFERENCES.md"]) {
    if (existsAsFile(path.join(directoryPath, fileName))) {
      files.push(fileName);
    }
  }

  if (files.length === 0) {
    fail(`No input Markdown artifacts found in ${directoryPath}`);
  }

  return files;
}

export function footnoteIdentifiers(markdown) {
  const identifiers = [];
  const pattern = /\[\^([^\]\s]+)\]/g;
  let match;

  while ((match = pattern.exec(markdown)) !== null) {
    identifiers.push(match[1]);
  }

  return identifiers;
}

export function validateFootnoteIdentifiers(directoryPath, files = inputFiles(directoryPath)) {
  const firstSeenByIdentifier = new Map();
  const errors = [];

  for (const fileName of files) {
    const markdown = fs.readFileSync(path.join(directoryPath, fileName), "utf8");
    const identifiers = new Set(footnoteIdentifiers(markdown));

    for (const identifier of identifiers) {
      if (/^\d+$/.test(identifier)) {
        errors.push(`[^${identifier}] in ${fileName} uses a local numeric identifier`);
      }

      const firstSeen = firstSeenByIdentifier.get(identifier);

      if (firstSeen && firstSeen !== fileName) {
        errors.push(`[^${identifier}] is used in both ${firstSeen} and ${fileName}`);
        continue;
      }

      firstSeenByIdentifier.set(identifier, fileName);
    }
  }

  if (errors.length > 0) {
    fail(`Footnote identifiers must be unique across the document:\n${errors.join("\n")}`);
  }
}

export function pandocArgs(directoryPath, outputPath = "index.html", options = {}) {
  const metadata = readMetadata(directoryPath);
  const args = [
    "-o",
    outputPath,
    "--from=gfm+tex_math_dollars",
    "--to=html5",
    "--mathml",
    "--standalone",
    "--toc",
    "--wrap=none",
  ];

  if (options.includeInHeader) {
    args.push("--include-in-header", options.includeInHeader);
  }

  if (options.includeBeforeBody) {
    args.push("--include-before-body", options.includeBeforeBody);
  }

  if (options.includeAfterBody) {
    args.push("--include-after-body", options.includeAfterBody);
  }

  args.push(...toMetadataArgs(metadata), ...inputFiles(directoryPath));
  return args;
}

export function main(args) {
  if (args.length < 1 || args.length > 2 || args[0] === "-h" || args[0] === "--help") {
    console.error(USAGE);
    return args.length === 1 ? 0 : 1;
  }

  const directoryPath = path.resolve(args[0]);
  const outputPath = args[1] ? path.resolve(args[1]) : "index.html";

  if (!existsAsDirectory(directoryPath)) {
    fail(`Not a directory: ${args[0]}`);
  }

  const metadata = readMetadata(directoryPath);
  const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "generate-doc-html-"));
  const headerPath = path.join(temporaryDirectory, "header.html");
  const beforeBodyPath = path.join(temporaryDirectory, "before-body.html");
  const footerPath = path.join(temporaryDirectory, "footer.html");

  try {
    fs.writeFileSync(headerPath, ghPagesHeaderHtml(metadata, ghPagesDocumentUrl(directoryPath)));
    fs.writeFileSync(beforeBodyPath, ghPagesBeforeBodyHtml(metadata));
    fs.writeFileSync(footerPath, ghPagesFooterHtml());
    validateFootnoteIdentifiers(directoryPath);

    const result = spawnSync(
      "pandoc",
      pandocArgs(directoryPath, outputPath, {
        includeInHeader: headerPath,
        includeBeforeBody: beforeBodyPath,
        includeAfterBody: footerPath,
      }),
      {
        cwd: directoryPath,
        stdio: "inherit",
      },
    );

    if (result.error) {
      fail(`Failed to run pandoc: ${result.error.message}`);
    }

    return result.status ?? 1;
  } finally {
    fs.rmSync(temporaryDirectory, { recursive: true, force: true });
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  try {
    process.exit(main(process.argv.slice(2)));
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}
