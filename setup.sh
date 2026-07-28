#!/usr/bin/env bash

set -o errexit
set -o nounset
set -o pipefail

mkdir -p "$HOME/bin"
mkdir -p "$HOME/src"
mkdir -p "$HOME/dev/thiamsantos"
mkdir -p "$HOME/dev/remote"
mkdir -p "$HOME/.docker/cli-plugins"
mkdir -p "$HOME/.config/fish"
mkdir -p "$HOME/.config/ghostty"
mkdir -p "$HOME/.config/1Password"
mkdir -p "$HOME/.vim/swap"
mkdir -p "$HOME/.config/nvim"
mkdir -p "$HOME/.ssh"
mkdir -p "$HOME/.config/mise"
mkdir -p "$HOME/.config/herdr"

if [[ $(command -v brew) == "" ]]; then
    echo "Installing Hombrew"
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    eval "$(/opt/homebrew/bin/brew shellenv)"
else
    echo "Updating Homebrew"
    brew update
fi

brew upgrade
brew bundle

# Seed gitignored local config from committed .example templates, IN their stow
# package, so the stow calls below symlink them like everything else. Never
# overwrite an existing real file.
[ -f git/.gitconfig-work ] || cp git/.gitconfig-work.example git/.gitconfig-work
[ -f git/.gitconfig-personal ] || cp git/.gitconfig-personal.example git/.gitconfig-personal
[ -f fish/conf.d/r.local.fish ] || cp fish/conf.d/r.local.fish.example fish/conf.d/r.local.fish
[ -f fish/conf.d/aws.local.fish ] || cp fish/conf.d/aws.local.fish.example fish/conf.d/aws.local.fish

stow --verbose --target=$HOME git aerospace
stow --verbose --target="$HOME/.config/fish" fish
stow --verbose --target="$HOME/.config/ghostty" ghostty
stow --verbose --target="$HOME/.ssh" ssh
stow --verbose --target="$HOME/.config/1Password" 1Password
stow --verbose --target="$HOME/.config/nvim" nvim
stow --verbose --target="$HOME/.config/mise" mise
stow --verbose --target="$HOME/.config/herdr" herdr
ln -sfn /opt/homebrew/opt/docker-compose/bin/docker-compose "$HOME/.docker/cli-plugins/docker-compose"
ln -sfn /opt/homebrew/opt/docker-buildx/bin/docker-buildx "$HOME/.docker/cli-plugins/docker-buildx"

git lfs install

if [ "${SHELL}" == "/opt/homebrew/bin/fish" ]; then
    echo "Homebrew fish 🐠 is your default shell!"
else
    echo "Setting your default shell to (homebrew) fish..."
    if ! cat /etc/shells | grep -q "homebrew"; then
        echo "/usr/homebrew/bin/fish" | sudo tee -a /etc/shells
    fi
    sudo chsh -s /opt/homebrew/bin/fish "$USER"
    echo "Shell setted to (homebrew) fish successefully!"
fi

# Seed the standalone mise overlay (not stowed — mise reads it directly).
[ -f "$HOME/.config/mise/config.local.toml" ] || printf '[tools]\nremotectl = "latest"\n' > "$HOME/.config/mise/config.local.toml"

mise install

gh release download nightly --pattern 'expert_darwin_arm64' --repo elixir-lang/expert --skip-existing --output $HOME/bin/expert

# https://github.com/remoteoss/dexter
