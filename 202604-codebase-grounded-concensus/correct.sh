#!/bin/bash
set -euo pipefail
DONE=

while [ -z "$DONE" ]; do
  codex e "$(<prompts/REVIEW.md)"
  if [ -e REVIEW.md ]; then
    codex e "$(<prompts/UPDATE.md)"
  else
    DONE=y
  fi
done
