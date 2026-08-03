#!/usr/bin/env bash
# Install the third-party herdr-resurrect plugin and seed its config.
#
# Config lives in herdr's own plugin config dir (outside any stow package), so
# it is written here rather than symlinked. Existing files are never overwritten.
set -o errexit -o nounset -o pipefail

PLUGIN_ID="ntindle.herdr-resurrect"
PLUGIN_REPO="ntindle/herdr-resurrect"
CONFIG_DIR="$HOME/.config/herdr/plugins/config/$PLUGIN_ID"

if ! command -v herdr >/dev/null 2>&1; then
    echo "herdr not installed; skipping resurrect plugin" >&2
    exit 0
fi

if ! command -v node >/dev/null 2>&1; then
    echo "node not installed (required by herdr-resurrect); skipping" >&2
    exit 0
fi

if herdr plugin list 2>/dev/null | grep -q "$PLUGIN_ID"; then
    echo "herdr plugin already installed: $PLUGIN_ID"
else
    herdr plugin install "$PLUGIN_REPO" --yes >/dev/null
    echo "installed herdr plugin: $PLUGIN_ID"
fi

mkdir -p "$CONFIG_DIR"

# Rehydrate agents automatically after a crash/reboot.
if [ ! -f "$CONFIG_DIR/settings.json" ]; then
    cat >"$CONFIG_DIR/settings.json" <<'JSON'
{
  "autoRestore": true,
  "autoRestoreSettleMs": 2500,
  "agentResume": true,
  "agentResumeCommands": {}
}
JSON
    echo "seeded $PLUGIN_ID settings.json"
fi

# Empty allowlist => agents come back, dev servers and other programs do not.
# The agent restore path does not consult this file.
if [ ! -f "$CONFIG_DIR/allowlist.txt" ]; then
    cat >"$CONFIG_DIR/allowlist.txt" <<'TXT'
# herdr-resurrect — programs safe to auto-relaunch on restore.
#
# Deliberately EMPTY: agents should come back automatically, servers should NOT.
#
# Agents (claude, codex, gemini, ...) are detected by herdr and restored through
# the agent path, which does NOT consult this file — so an empty list means
# "agents yes, programs no".
#
# With no entries and no `*`, restorable() returns false for every foreground
# program, so `npm run dev` / vite / next / node server.js are captured in
# snapshots but never relaunched. Same for nvim, psql, ssh, htop.
#
# To opt a specific program back in, add its bare name on its own line, e.g.:
# nvim
#
# Do NOT add a lone `*` — that would relaunch dev servers too.
TXT
    echo "seeded $PLUGIN_ID allowlist.txt"
fi
