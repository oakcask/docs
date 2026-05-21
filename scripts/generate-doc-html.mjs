#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const USAGE = "Usage: node scripts/generate-doc-html.mjs <directory>";

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

  return metadata;
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

function sectionNumber(fileName) {
  const match = fileName.match(/^(\d+(?:\.\d+)?)\.md$/);
  return match ? Number(match[1]) : null;
}

export function sectionFiles(directoryPath) {
  const sectionsPath = path.join(directoryPath, "sections");

  if (!existsAsDirectory(sectionsPath)) {
    return [];
  }

  return fs
    .readdirSync(sectionsPath)
    .filter((fileName) => sectionNumber(fileName) !== null)
    .sort((left, right) => {
      const delta = sectionNumber(left) - sectionNumber(right);
      return delta === 0 ? left.localeCompare(right) : delta;
    })
    .map((fileName) => path.join("sections", fileName));
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

export function pandocArgs(directoryPath) {
  const metadata = readMetadata(directoryPath);
  return [
    "-o",
    "index.html",
    "--from=gfm",
    "--standalone",
    "--toc",
    ...toMetadataArgs(metadata),
    ...inputFiles(directoryPath),
  ];
}

export function main(args) {
  if (args.length !== 1 || args[0] === "-h" || args[0] === "--help") {
    console.error(USAGE);
    return args.length === 1 ? 0 : 1;
  }

  const directoryPath = path.resolve(args[0]);

  if (!existsAsDirectory(directoryPath)) {
    fail(`Not a directory: ${args[0]}`);
  }

  const result = spawnSync("pandoc", pandocArgs(directoryPath), {
    cwd: directoryPath,
    stdio: "inherit",
  });

  if (result.error) {
    fail(`Failed to run pandoc: ${result.error.message}`);
  }

  return result.status ?? 1;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  try {
    process.exit(main(process.argv.slice(2)));
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}
