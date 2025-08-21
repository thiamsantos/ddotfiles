set -gx AWS_PROFILE sts
set -gx EDITOR vim
set -gx AWS_REGION eu-west-1
set -gx SSH_AUTH_SOCK "$HOME/Library/Group Containers/2BUA8C4S2C.com.1password/t/agent.sock"

fish_add_path "/opt/workbrew/bin"
fish_add_path "$HOMEBREW_PREFIX/opt/libpq/bin"
direnv hook fish | source

# Git aliases
# Add files to staging area
alias ga="git add"
# Add files to staging area interactively (patch mode)
alias gap="git add -p"
# Commit with message
alias gc="git commit -m"
# Amend last commit without changing message
alias gca="git commit --amend --no-edit"
# Merge branches
alias gm="git merge"
# Checkout branch or file
alias gck="git checkout"
# Pull and rebase on top of remote changes
alias gpl="git pull --rebase"
# Push current branch to origin
alias gp="git push origin HEAD"
# Force push with safety check
alias gpf="git push origin HEAD --force-with-lease"
# Create and checkout new branch
alias gb="git checkout -b"
# Get main branch name
alias gmb="git symbolic-ref --short refs/remotes/origin/HEAD | sed 's@^origin/@@'"
# Get current branch name
alias gcb="git rev-parse --abbrev-ref HEAD"

# Git functions
# Set upstream tracking for current branch
function gsup
    set current_branch (gcb)
    git branch --set-upstream-to="origin/$current_branch" "$current_branch"
end

# Sync current branch with main branch using rebase strategy
# Switches to main, pulls latest, returns to original branch, rebases on main
function grsync
    set main_branch (gmb)
    gck "$main_branch" && gpl && gck - && git rebase "$main_branch"
end

# Custom fish shell prompt function
# This function customizes the command prompt appearance with:
# - Full path display (no directory truncation) (prompt_pwd)
# - Git repository status information (fish_vcs_prompt)
function fish_prompt 
    set -g fish_prompt_pwd_dir_length 0
    string join '' -- \
        (set_color blue) (prompt_pwd) \
        (set_color cyan) (fish_vcs_prompt) \
        (set_color normal) \n '> '
end

fish_config theme choose "dracula"