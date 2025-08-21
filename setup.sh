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
mkdir -p "$HOME/.config/alacritty"
mkdir -p "$HOME/.config/1Password"
mkdir -p "$HOME/.vim/swap"
mkdir -p "$HOME/.config/nvim"
mkdir -p "$HOME/.ssh"

if [[ $(command -v brew) == "" ]]; then
    echo "Installing Hombrew"
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    eval "$(/opt/homebrew/bin/brew shellenv)"
else
    echo "Updating Homebrew"
    brew update
fi

brew bundle
eval "$(/opt/homebrew/bin/brew shellenv)"

stow --verbose --target=$HOME git vim aerospace
stow --verbose --target="$HOME/.config/fish" fish
stow --verbose --target="$HOME/.ssh" ssh
stow --verbose --target="$HOME/.config/1Password" 1Password
stow --verbose --target="$HOME/.config/alacritty" alacritty
stow --verbose --target="$HOME/.config/nvim" nvim
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

/opt/homebrew/bin/fish -c "fisher install PatrickF1/fzf.fish"

# Configuring Mise
if [[ "$(command -v node)" != *"mise"* ]]; then
    echo "Installing nodejs..."
    mise install nodejs@22.14.0
    mise use --global nodejs@22.14.0
fi

if [[ "$(command -v yarn)" != *"mise"* ]]; then
    echo "Installing yarn..."
    mise install yarn@1.22.19
    mise use --global yarn@1.22.19
fi

if [[ "$(command -v erl)" != *"mise"* ]]; then
    echo "Installing erlang..."
    mise plugin install yarn
    mise install erlang@27.3.3
    mise use --global erlang@27.3.3
fi

if [[ "$(command -v elixir)" != *"mise"* ]]; then
    echo "Installing elixir..."
    mise install elixir@1.18.3-otp-27
    mise use --global elixir@1.18.3-otp-27
fi

mise plugin add kubectl
mise use --global kubectl@latest

