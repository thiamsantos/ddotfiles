#!/usr/bin/env bash
# Install the third-party herdr-caffeinate plugin.
#
# The plugin needs no config: every settings.conf value is optional and the
# defaults are fine. So this only installs the plugin, it seeds nothing.
set -o errexit -o nounset -o pipefail

PLUGIN_ID="herdr-caffeinate"
PLUGIN_REPO="nwarwick/herdr-caffeinate"

if ! command -v herdr >/dev/null 2>&1; then
    echo "herdr not installed; skipping caffeinate plugin" >&2
    exit 0
fi

if herdr plugin list 2>/dev/null | grep -q "$PLUGIN_ID"; then
    echo "herdr plugin already installed: $PLUGIN_ID"
else
    herdr plugin install "$PLUGIN_REPO" --yes >/dev/null
    echo "installed herdr plugin: $PLUGIN_ID"
fi
