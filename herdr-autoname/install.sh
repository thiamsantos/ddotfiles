#!/usr/bin/env bash
# Link the herdr-autoname plugin into the running herdr server.
# Idempotent: unlink-then-link so a moved repo path is picked up.
set -o errexit -o nounset -o pipefail

PLUGIN_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLUGIN_ID="thiamsantos.autoname"

if ! command -v herdr >/dev/null 2>&1; then
    echo "herdr not installed; skipping autoname plugin" >&2
    exit 0
fi

herdr plugin unlink "$PLUGIN_ID" >/dev/null 2>&1 || true
herdr plugin link "$PLUGIN_DIR" >/dev/null
echo "linked herdr plugin: $PLUGIN_ID"
