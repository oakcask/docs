import assert from "node:assert/strict";
import test from "node:test";

import { correct } from "./correct.mjs";

const reviews = [
  "REVIEW-citation.md",
  "REVIEW-quality.md",
  "REVIEW-naturality.md",
  "REVIEW-dedup.md",
  "REVIEW-consistency.md",
];

test("stops after reviews when there are no comments", () => {
  const executed = [];

  correct({
    maxIterations: 10,
    commentsExist: () => false,
    executePrompt: (prompt) => executed.push(prompt),
  });

  assert.deepEqual(executed, reviews);
});

test("stops after closing removes the comments", () => {
  const executed = [];
  const commentStates = [true, false];

  correct({
    maxIterations: 10,
    commentsExist: () => commentStates.shift(),
    executePrompt: (prompt) => executed.push(prompt),
  });

  assert.deepEqual(executed, [...reviews, "UPDATE.md", "CLOSING.md"]);
});

test("fails after the iteration limit while comments remain", () => {
  const executed = [];

  assert.throws(
    () =>
      correct({
        maxIterations: 2,
        commentsExist: () => true,
        executePrompt: (prompt) => executed.push(prompt),
      }),
    /COMMENTS\.md still exists after 2 correction iterations/,
  );

  assert.equal(executed.length, (reviews.length + 2) * 2);
});
