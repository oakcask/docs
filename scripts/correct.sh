#!/bin/bash
set -euo pipefail
ROOT=$(cd $(dirname $0)/..; pwd)
DONE=

while [ -z "$DONE" ]; do
  codex e "$(<"$ROOT/prompts/REVIEW.md")"
  if test -f COMMENTS.md; then
    codex e "$(<"$ROOT/prompts/UPDATE.md")"
  else
    DONE=y
  fi
done
