function grsync --description "Sync current branch with main using rebase"
    # Check if working directory is clean
    if not git diff-index --quiet HEAD --
        echo "Error: Working directory is not clean. Please commit or stash changes first." >&2
        return 1
    end
    
    # Get branch names
    set -l main_branch (git symbolic-ref --short refs/remotes/origin/HEAD 2>/dev/null | sed 's@^origin/@@')
    set -l current_branch (git rev-parse --abbrev-ref HEAD 2>/dev/null)
    
    # Validate we got the branch names
    if test -z "$main_branch"
        echo "Error: Could not determine main branch name" >&2
        return 1
    end
    
    if test -z "$current_branch"
        echo "Error: Could not determine current branch name" >&2
        return 1
    end
    
    # Don't sync if already on main branch
    if test "$current_branch" = "$main_branch"
        echo "Already on main branch ($main_branch). Pulling latest changes..."
        git pull --rebase
        return $status
    end
    
    echo "Syncing $current_branch with $main_branch..."
    
    # Switch to main and pull
    if not git checkout "$main_branch"
        echo "Error: Failed to checkout $main_branch" >&2
        return 1
    end
    
    if not git pull --rebase
        echo "Error: Failed to pull latest changes from $main_branch" >&2
        return 1
    end
    
    # Return to original branch
    if not git checkout "$current_branch"
        echo "Error: Failed to return to $current_branch" >&2
        return 1
    end
    
    # Rebase on main
    if not git rebase "$main_branch"
        echo "Error: Rebase failed. You may need to resolve conflicts manually." >&2
        return 1
    end
    
    echo "Successfully synced $current_branch with $main_branch"
end