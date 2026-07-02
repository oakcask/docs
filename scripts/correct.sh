#!/bin/bash
set -euo pipefail
ROOT=$(cd $(dirname $0)/..; pwd)
DONE=

while [ -z "$DONE" ]; do
  codex --ask-for-approval=on-request -c 'model_reasoning_effort="medium"' e "$(<"$ROOT/prompts/REVIEW-citation.md")"
  codex --ask-for-approval=on-request -c 'model_reasoning_effort="medium"' e "$(<"$ROOT/prompts/REVIEW-quality.md")"
  codex --ask-for-approval=on-request -c 'model_reasoning_effort="medium"' e "$(<"$ROOT/prompts/REVIEW-naturality.md")"
  codex --ask-for-approval=on-request -c 'model_reasoning_effort="medium"' e "$(<"$ROOT/prompts/REVIEW-consistency.md")"
  if test -f COMMENTS.md; then
    codex --ask-for-approval=on-request -c 'model_reasoning_effort="medium"' e "$(<"$ROOT/prompts/UPDATE.md")"
    codex --ask-for-approval=on-request -c 'model_reasoning_effort="medium"' e "$(<"$ROOT/prompts/CLOSING.md")"
  else
    DONE=y
  fi
done
