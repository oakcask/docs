#!/usr/bin/env node

import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(scriptDirectory, "..");

const reviewPrompts = [
  "REVIEW-citation.md",
  "REVIEW-quality.md",
  "REVIEW-naturality.md",
  "REVIEW-dedup.md",
  "REVIEW-consistency.md",
];

function parseMaxIterations(arguments_) {
  if (arguments_.length === 0) {
    return 100;
  }

  if (arguments_.length !== 2 || arguments_[0] !== "--max-iterations") {
    throw new Error("Usage: correct.mjs [--max-iterations <positive integer>]");
  }

  const maxIterations = Number(arguments_[1]);
  if (!Number.isSafeInteger(maxIterations) || maxIterations < 1) {
    throw new Error("--max-iterations must be a positive integer");
  }

  return maxIterations;
}

function runCodex(promptName) {
  const prompt = readFileSync(
    resolve(repositoryRoot, "prompts", promptName),
    "utf8",
  );
  const result = spawnSync(
    "codex",
    [
      "--ask-for-approval=on-request",
      "--sandbox",
      "workspace-write",
      "-c",
      'model_reasoning_effort="medium"',
      "e",
      prompt,
    ],
    { stdio: "inherit" },
  );

  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    throw new Error(
      `codex failed while running ${promptName} (exit code ${result.status})`,
    );
  }
}

export function correct({
  maxIterations,
  commentsExist = () => existsSync(resolve(process.cwd(), "COMMENTS.md")),
  executePrompt = runCodex,
}) {
  for (let iteration = 1; iteration <= maxIterations; iteration += 1) {
    for (const promptName of reviewPrompts) {
      executePrompt(promptName);
    }

    if (!commentsExist()) {
      return;
    }

    executePrompt("UPDATE.md");
    executePrompt("CLOSING.md");

    if (!commentsExist()) {
      return;
    }
  }

  throw new Error(
    `COMMENTS.md still exists after ${maxIterations} correction iterations`,
  );
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    correct({ maxIterations: parseMaxIterations(process.argv.slice(2)) });
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
