# 🏠 Dotfiles

Personal dotfiles and development environment configuration for macOS. This repository contains configurations for various tools and applications to create a consistent and productive development experience.

## ✨ Features

- **Shell**: Fish shell with custom aliases and functions
- **Editor**: Neovim with LSP support and modern plugins
- **Package Management**: Homebrew with Brewfile for easy setup
- **Version Management**: Mise for Node.js, Erlang, Elixir, and other tools
- **Git**: Optimized configuration with delta for better diffs
- **SSH**: 1Password SSH agent integration
- **Window Management**: Aerospace for tiling window management
- **Terminal Multiplexer**: Zellij

## 🚀 Quick Start

### Prerequisites

- macOS (tested on macOS 14+)
- Git
- Administrator access (for shell changes)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/thiamsantos/ddotfiles.git ~/.dotfiles
   cd ~/.dotfiles
   ```

2. **Run the setup script:**
   ```bash
   chmod +x setup.sh
   ./setup.sh
   ```

3. **Restart your terminal** to pick up the new shell configuration

The setup script will:
- Install Homebrew and packages from Brewfile
- Set up Fish as your default shell
- Install and configure Mise for version management
- Install Node.js, Yarn, Erlang, and Elixir
- Set up all dotfiles using GNU Stow
- Configure 1Password SSH agent

On first run, `setup.sh` creates local, gitignored config files from the
committed `*.example` templates: `~/.gitconfig-work`, `~/.gitconfig-personal`,
`~/.config/fish/conf.d/r.local.fish`, and `~/.config/mise/config.local.toml`.
Edit those with your own values — they are never committed.

## 📁 Repository Structure

Each top-level directory is a [GNU Stow](https://www.gnu.org/software/stow/) package symlinked into `$HOME` or `$HOME/.config/<tool>`.

```
dotfiles/
├── 1Password/          # 1Password SSH agent configuration
├── aerospace/          # Tiling window manager
├── fish/               # Fish shell configuration and functions
├── ghostty/            # Ghostty terminal configuration
├── git/                # Git configuration (incl. global gitignore)
├── mise/               # Mise version-manager tool versions
├── nvim/               # Neovim (LazyVim) configuration and plugins
├── ssh/                # SSH configuration
├── zellij/             # Zellij multiplexer configuration
├── Brewfile            # Homebrew package definitions
├── setup.sh            # Automated setup script
└── README.md           # This file
```

## 🐟 Fish Shell

### Key Features
- Custom prompt with git status
- Git aliases and functions for common operations
- AWS profile configuration
- Path management for development tools

### Git Abbreviations
Defined in `fish/conf.d/abbrs.fish`:
- `ga` / `gap` - `git add` / `git add -p`
- `gc` / `gca` - Commit with message / amend (no edit)
- `gck` - Checkout
- `gpl` - Pull with rebase
- `gp` / `gpf` - Push HEAD (set upstream) / force-with-lease
- `gb` - Create and checkout new branch

### Git Functions
- `grsync` - Rebase the current branch onto main (`fish/functions/grsync.fish`)

## 🎨 Neovim

Built on [LazyVim](https://www.lazyvim.org) (lazy.nvim) with a small set of local overrides in `nvim/lua/plugins/`. See [CLAUDE.md](CLAUDE.md) for the architecture details.

### Features
- LazyVim defaults with language Extras (Elixir, Rust, TypeScript, JSON, YAML, Docker, Markdown)
- **fzf-lua** as the picker (LazyVim default)
- **Neogit** for the git UI
- Elixir LSP via **dexter** (installed through mise/brew, not Mason)
- Dracula colorscheme, ASCII icons (no Nerd Font)

### Custom Key Mappings
`<Space>` is the leader.

- `<leader><leader>` - Find files (git-aware)
- `<leader>ff` - Files in current buffer dir
- `<leader>s.` - Live grep in current buffer dir
- `<leader>fy` / `<leader>fY` - Yank absolute / project-relative file path
- `<leader>mtt` - Open alternate file (test ↔ source)
- `<leader>mtv` / `<leader>mts` / `<leader>mta` / `<leader>mtr` - vim-test: file / nearest / suite / last
- `<leader>wo` - Maximize window
- `<leader>gg` - Neogit

Everything else uses LazyVim defaults (`:help LazyVim`, or press `<Space>` for which-key).

## 🖥️ Terminal (Ghostty)

Configured in `ghostty/config`.

- Dracula theme, SF Mono 16pt
- `Cmd+a` unbound (select-all) so it's free for hyper-key combos
- `Ctrl+Cmd+Alt+g` forwards `Ctrl+g` to zellij (gateway/Normal mode)

## 🔧 Development Tools

### Version Management (Mise)
Tool versions live in `mise/config.toml` (the source of truth). It manages
Erlang, Elixir, Node, Yarn, Python, Lua, Rust, Go, kubectl, pandoc, and dexter.
Run `mise install` to sync. Machine-local tools go in a gitignored
`~/.config/mise/config.local.toml`.

### Package Management
- **Homebrew**: System package manager
- **Stow**: Symlink management for dotfiles

## 🔐 Security & SSH

### 1Password Integration
- SSH agent integration
- Automatic key management
- Secure credential storage

### SSH Configuration
- Colima integration for Docker
- 1Password SSH agent
- Host-specific configurations

## 🎯 Window Management

### Aerospace
- Tiling window management
- Keyboard-driven workflow
- Custom layouts and rules

## 📦 Package Management

### Homebrew Packages
Essential development tools, fonts, and applications are managed through the Brewfile:

- **Development**: git, docker, colima, mise
- **Shell**: fish, fzf, ripgrep
- **Fonts**: Fira Code, Hack Nerd Font, SF Mono
- **Applications**: 1Password CLI, Cursor, VS Code, Raycast

## 🔄 Maintenance

### Updating Packages
```bash
# Update Homebrew packages
brew update && brew upgrade

# Update Mise tools
mise update

```

## 🐛 Troubleshooting

### Common Issues

1. **Fish shell not working**
   - Ensure Fish is installed: `brew install fish`
   - Check shell path: `echo $SHELL`

2. **Neovim plugins not loading**
   - Run `:Lazy` to check plugin status
   - Check for errors in `:checkhealth`

3. **Mise tools not found**
   - Ensure Mise is in PATH: `which mise`
   - Reinstall Mise: `brew reinstall mise`

4. **SSH agent issues**
   - Check 1Password SSH agent: `ssh-add -l`
   - Restart 1Password application

### Health Checks
```bash
# Check Fish configuration
fish -c "echo 'Fish shell is working'"

# Check Neovim
nvim --headless -c "checkhealth" -c "q"

# Check Mise
mise --version
```

## 🙏 Acknowledgments

- [Fish shell](https://fishshell.com/) for the modern shell experience
- [Neovim](https://neovim.io/) for the powerful editor
- [Homebrew](https://brew.sh/) for package management
- [Mise](https://mise.jdx.dev/) for version management
- [GNU Stow](https://www.gnu.org/software/stow/) for dotfile management

