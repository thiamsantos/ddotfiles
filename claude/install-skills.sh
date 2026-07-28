#!/usr/bin/env bash
# Deploy Claude skills from this repo into ~/.claude/skills/ by copy (not symlink).
# Edit a skill under claude/skills/<name>/, then re-run this script to apply.
set -o errexit -o nounset -o pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SRC_DIR="$REPO_DIR/claude/skills"
DEST_DIR="$HOME/.claude/skills"

mkdir -p "$DEST_DIR"

# Remove skills retired by the herdr-review migration.
for retired in tuicr review-plan-tuicr; do
    if [ -e "$DEST_DIR/$retired" ]; then
        rm -rf "${DEST_DIR:?}/$retired"
        echo "removed retired skill: $retired"
    fi
done

# Copy each skill dir (rm-then-cp so deletions in the repo propagate).
shopt -s nullglob
for src in "$SRC_DIR"/*/; do
    name="$(basename "$src")"
    rm -rf "${DEST_DIR:?}/$name"
    cp -R "$src" "$DEST_DIR/$name"
    echo "deployed skill: $name"
done
