#!/bin/sh

if [ -z "$1" ]; then
  echo "Usage: git rebase-ia <ref>"
  exit 1
fi

TS="$(date +%s)"
STASH_MSG="before_rebase_ia_$TS"

git stash push -u -m "$STASH_MSG"

echo "Stashed changes at $STASH_MSG"

if git rebase -i --autosquash "$1"; then
  git stash apply stash^{/$STASH_MSG}
  echo "Rebase complete. Local changes restored."
  exit 0
else
  echo "Rebase failed. If you stashed changes, run 'git stash apply stash^{/$STASH_MSG}' manually after resolving."
  exit 1
fi
