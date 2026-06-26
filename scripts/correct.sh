#!/bin/bash
set -euo pipefail
ROOT=$(cd $(dirname $0)/..; pwd)
DONE=

while [ -z "$DONE" ]; do
  codex --ask-for-approval=on-request -c 'model_reasoning_effort="high"' e "$(<"$ROOT/prompts/REVIEW.md")"
  if test -f COMMENTS.md; then
    sleep $((RANDOM % 10))
    codex --ask-for-approval=on-request -c 'model_reasoning_effort="medium"' e "$(<"$ROOT/prompts/UPDATE.md")"
    sleep $((RANDOM % 10))
  else
    DONE=y
  fi
done
