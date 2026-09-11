set -gx EDITOR nvim
set -gx SSH_AUTH_SOCK "$HOME/Library/Group Containers/2BUA8C4S2C.com.1password/t/agent.sock"

set -gx CLAUDE_CODE_REMOTE_SEND_KEEPALIVES true
set -gx BUN_CONFIG_HTTP_IDLE_TIMEOUT 300
set -gx BUN_CONFIG_HTTP_RETRY_COUNT 3
set -gx NODE_OPTIONS "--dns-result-order=ipv4first"
set -gx ANTHROPIC_DEFAULT_OPUS_MODEL claude-opus-4-8
set -gx ANTHROPIC_MODEL claude-opus-4-8

fish_add_path /opt/workbrew/bin
fish_add_path /opt/homebrew/opt/libpq/bin
fish_add_path /opt/homebrew/opt/icu4c/bin
fish_add_path "$HOME/.bun/bin"
fish_add_path "$HOME/.local/bin"
fish_add_path "$HOME/bin"

direnv hook fish | source
zoxide init --cmd=cd fish | source
mise activate --shims fish | source

fish_config theme choose Dracula

bind \cf forward-word
bind \cb backward-word
bind \cr search_history
bind \cw backward-kill-word
bind \cc cancel-commandline

alias vim="nvim"

# pnpm
set -gx PNPM_HOME "/Users/thiago.santos/Library/pnpm"
if not string match -q -- "$PNPM_HOME/bin" $PATH
  set -gx PATH "$PNPM_HOME/bin" $PATH
end
# pnpm end
