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
- **Terminal Multiplexer**: tmux with session persistence, Dracula theme, and vim-style keybindings

## 🚀 Quick Start

### Prerequisites

- macOS (tested on macOS 14+)
- Git
- Administrator access (for shell changes)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/dotfiles.git ~/.dotfiles
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

## 📁 Repository Structure

```
dotfiles/
├── 1Password/          # 1Password SSH agent configuration
├── aerospace/          # Window management configuration
├── fish/              # Fish shell configuration and functions
├── git/               # Git configuration files
├── nvim/              # Neovim configuration and plugins
├── ssh/               # SSH configuration
├── vim/               # Vim configuration
├── Brewfile           # Homebrew package definitions
├── setup.sh           # Automated setup script
└── README.md          # This file
```

## 🐟 Fish Shell

### Key Features
- Custom prompt with git status
- Git aliases and functions for common operations
- AWS profile configuration
- Path management for development tools

### Git Aliases
- `ga` - Add files to staging
- `gc` - Commit with message
- `gpl` - Pull with rebase
- `gp` - Push current branch
- `gb` - Create and checkout new branch
- `grsync` - Sync branch with main

### Git Functions
- `gsup` - Set upstream tracking
- `grsync` - Sync current branch with main using rebase

## 🎨 Neovim

### Features
- LSP support with automatic server installation
- Telescope for fuzzy finding
- Treesitter for syntax highlighting
- Auto-completion with blink.cmp
- Git integration with gitsigns
- Auto-formatting with conform.nvim

### Key Mappings
- `<leader>sf` - Find files
- `<leader>sg` - Live grep
- `<leader>sd` - Search diagnostics
- `<leader>f` - Format buffer
- `<C-h/j/k/l>` - Navigate windows

## 🖥️ Terminal (Alacritty)

### Features
- Dracula color scheme
- SF Mono font
- Vi-mode navigation
- Custom keybindings for scrolling and selection

### Vi-mode Shortcuts
- `Ctrl+A` - Toggle vi mode
- `Ctrl+Y` - Scroll line up
- `Ctrl+E` - Scroll line down
- `Ctrl+B` - Page up
- `Ctrl+F` - Page down

## 🔧 Development Tools

### Version Management (Mise)
- **Node.js**: 22.14.0
- **Yarn**: 1.22.19
- **Erlang**: 27.3.3
- **Elixir**: 1.18.3-otp-27
- **Kubectl**: Latest

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

## 📟 tmux

Prefix key: `C-a` (Cmd+a)

### Session & TPM

| Key | Action |
|---|---|
| `C-a I` | Install plugins (TPM) |
| `C-a U` | Update plugins (TPM) |
| `C-a C-s` | Save session (resurrect) |
| `C-a C-r` | Restore session (resurrect) |
| `C-a F` | Fuzzy find windows/sessions/panes (tmux-fzf) |

### Windows & Panes

| Key | Action |
|---|---|
| `C-a \|` | Split pane horizontally (right) |
| `C-a -` | Split pane vertically (below) |
| `C-a h/j/k/l` | Navigate panes (vim-style) |
| `C-a H/J/K/L` | Resize panes (vim-style, repeatable) |
| `C-a z` | Zoom/unzoom pane |
| `C-a w` | Display pane numbers |
| `C-a b` | Previous window |
| `C-a q` | Kill pane |
| `C-a Q` | Kill window |
| `C-a X` | Kill session (with confirmation) |

### Copy Mode

| Key | Action |
|---|---|
| `C-a Escape` | Enter copy mode |
| `v` | Begin selection |
| `y` | Copy selection to macOS clipboard |
| `C-a p` | Paste buffer |

### Other

| Key | Action |
|---|---|
| `C-a r` | Reload tmux config |
| `C-a C-a` | Send `C-a` to inner app (nested tmux, etc.) |

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

### Backup Configuration
```bash
# Backup current dotfiles
cp -r ~/.config ~/dotfiles-backup-$(date +%Y%m%d)
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

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Fish shell](https://fishshell.com/) for the modern shell experience
- [Neovim](https://neovim.io/) for the powerful editor
- [Homebrew](https://brew.sh/) for package management
- [Mise](https://mise.jdx.dev/) for version management
- [GNU Stow](https://www.gnu.org/software/stow/) for dotfile management

## 📞 Support

If you encounter any issues or have questions:
1. Check the troubleshooting section above
2. Search existing issues
3. Create a new issue with detailed information

---

**Happy coding! 🚀**

