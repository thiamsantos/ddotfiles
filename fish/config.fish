set -gx AWS_PROFILE sts
set -gx EDITOR nvim
set -gx AWS_REGION eu-west-1
set -gx SSH_AUTH_SOCK "$HOME/Library/Group Containers/2BUA8C4S2C.com.1password/t/agent.sock"

fish_add_path "/opt/workbrew/bin"
fish_add_path "$HOMEBREW_PREFIX/opt/libpq/bin"
direnv hook fish | source

fish_config theme choose "dracula"

bind \cb backward-word
bind \cr search_history