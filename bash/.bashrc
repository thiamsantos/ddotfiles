# Claude Code runs agent commands in bash (CLAUDE_CODE_SHELL), never fish. Keep
# this to what those commands need; interactive setup lives in fish/config.fish.

eval "$(/opt/homebrew/bin/brew shellenv)"

export PATH="$HOME/bin:$HOME/.local/bin:$HOME/.bun/bin:$HOME/Library/pnpm/bin:/opt/homebrew/opt/libpq/bin:/opt/workbrew/bin:$PATH:$HOME/.safe-chain/bin"

export SSH_AUTH_SOCK="$HOME/Library/Group Containers/2BUA8C4S2C.com.1password/t/agent.sock"
export NODE_OPTIONS="--dns-result-order=ipv4first"

# Shims, not the PATH hook: the hook only runs on a prompt, which agent shells
# never show, so tool versions would not follow the project directory.
eval "$(mise activate bash --shims)"

[ -f "$HOME/.safe-chain/scripts/init-posix.sh" ] && source "$HOME/.safe-chain/scripts/init-posix.sh"
