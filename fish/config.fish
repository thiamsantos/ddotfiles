set -gx AWS_PROFILE sts
set -gx EDITOR nvim
set -gx AWS_REGION eu-west-1
set -gx SSH_AUTH_SOCK "$HOME/Library/Group Containers/2BUA8C4S2C.com.1password/t/agent.sock"

fish_add_path "/opt/workbrew/bin"
fish_add_path "/opt/homebrew/opt/libpq/bin"
fish_add_path "/opt/homebrew/opt/icu4c/bin"
fish_add_path "$HOME/.local/bin"
fish_add_path "$HOME/bin"

direnv hook fish | source
zoxide init --cmd=cd fish | source
mise activate --shims fish | source

fish_config theme choose "dracula"

bind \cf forward-word
bind \cb backward-word
bind \cr search_history
bind \cw backward-kill-word 
bind \cc cancel-commandline

alias vim="nvim"
