#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const DOCS_BASE_URL_ENV = "DOCS_BASE_URL";
export const DEFAULT_DOCS_BASE_URL = "https://oakcask.github.io/docs/";

function fail(message) {
  throw new Error(message);
}

export function escapeHtml(value) {
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

export function docsBaseUrl(env = process.env) {
  const baseUrl = env[DOCS_BASE_URL_ENV] || DEFAULT_DOCS_BASE_URL;
  return baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
}

export function readTitle(directoryPath) {
  const metadataPath = path.join(directoryPath, "metadata.json");

  let metadata;
  try {
    metadata = JSON.parse(fs.readFileSync(metadataPath, "utf8"));
  } catch (error) {
    fail(`Failed to read ${metadataPath}: ${error.message}`);
  }

  if (metadata === null || Array.isArray(metadata) || typeof metadata !== "object") {
    fail(`${metadataPath} must contain a JSON object`);
  }

  if (typeof metadata.title !== "string" || metadata.title.trim() === "") {
    fail(`${metadataPath} must contain a non-empty string title`);
  }

  return metadata.title;
}

export function docsIndexHtml(directoryPaths) {
  const links = directoryPaths.map((directoryPath) => {
    const title = readTitle(directoryPath);
    const href =  directoryPath;
    return `      <li><a href="${escapeHtml(href)}">${escapeHtml(title)}</a></li>`;
  });

  return `<!doctype html>
<html lang="ja">
  <head>
    <meta charset="utf-8">
    <title>oakcask/docs</title>
    <meta property="og:url" content="${escapeHtml(docsBaseUrl())}">
    <meta property="og:type" content="website">
  </head>
  <body>
    <h1><a href="https://github.com/oakcask/docs">oakcask/docs</a></h1>
    <ul>
${links.join("\n")}
    </ul>
  </body>
</html>
`;
}

export function main(args) {
  if (args.length === 0 || args[0] === "-h" || args[0] === "--help") {
    console.error("Usage: node scripts/generate-docs-index.mjs <directory>...");
    return args.length === 1 ? 0 : 1;
  }

  process.stdout.write(docsIndexHtml(args));
  return 0;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  try {
    process.exit(main(process.argv.slice(2)));
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}
