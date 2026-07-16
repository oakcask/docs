#!/bin/bash
set -euo pipefail
ROOT=$(cd $(dirname $0)/..; pwd)
DONE=

run_codex() {
  codex --ask-for-approval=on-request --sandbox workspace-write -c 'model_reasoning_effort="medium"' e "$(<"$ROOT/prompts/$1")"
}

while [ -z "$DONE" ]; do
  run_codex REVIEW-citation.md
  run_codex REVIEW-quality.md
  run_codex REVIEW-naturality.md
  run_codex REVIEW-dedup.md
  run_codex REVIEW-consistency.md
  if test -f COMMENTS.md; then
    run_codex UPDATE.md
    run_codex CLOSING.md
    if test -f COMMENTS.md; then
      DONE=y
    fi
  else
    DONE=y
  fi
done
