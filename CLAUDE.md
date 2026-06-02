# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Personal macOS dotfiles managed with [GNU Stow](https://www.gnu.org/software/stow/). Each top-level directory is a stow package that gets symlinked into `$HOME` or `$HOME/.config/<tool>`.

## Package Management

All system packages and apps are managed via Homebrew. **When installing any new CLI tool, font, or app, add it to `Brewfile` first** — don't install ad-hoc without updating the file.

```bash
brew bundle          # Install everything in Brewfile
```

## Setup

```bash
./setup.sh   # Full bootstrap: Homebrew + packages + stow + mise install
```

To re-apply stow symlinks for a single package without running the full script:

```bash
stow --verbose --target=$HOME git aerospace
stow --verbose --target="$HOME/.config/fish" fish
stow --verbose --target="$HOME/.config/nvim" nvim
# etc. — see setup.sh for all targets
```

## Stow Package → Target Mapping

| Package | Stow target |
|---|---|
| `git/` | `$HOME` (produces `~/.gitconfig`, `~/.globalgitignore`) |
| `aerospace/` | `$HOME` |
| `fish/` | `$HOME/.config/fish` |
| `ghostty/` | `$HOME/.config/ghostty` |
| `ssh/` | `$HOME/.ssh` |
| `1Password/` | `$HOME/.config/1Password` |
| `nvim/` | `$HOME/.config/nvim` |
| `mise/` | `$HOME/.config/mise` |
| `zellij/` | `$HOME/.config/zellij` |
| `cmux/` | `$HOME/.config/cmux` |

## Neovim Architecture

Plugin manager: [lazy.nvim](https://github.com/folke/lazy.nvim). Each plugin lives in `nvim/lua/plugins/<name>.lua` and is `require`d directly in `nvim/init.lua`.

LSP servers are managed by Mason (`:Mason` to inspect), except **dexter** (Elixir LSP) which is installed via mise/brew and registered manually in `nvim/lua/plugins/lsp.lua`.

Formatting runs on save via conform.nvim: `stylua` for Lua, `mix format` for Elixir.

Key leader mappings (`<Space>` is leader):

| Key | Action |
|---|---|
| `<leader>sf` | Telescope: find files |
| `<leader>sg` | Telescope: live grep |
| `<leader>mf` | Format buffer |
| `<leader>mtt` | Open alternate file (test ↔ source) |
| `<leader>mtv` | Run tests for current file |
| `<leader>mts` | Run nearest test |
| `gd` | Go to definition (LSP via Telescope) |

## Git Config

`~/.gitconfig` uses `includeIf` to swap user identity:
- `~/dev/thiamsantos/` and `~/dev/dotfiles/` → `~/.gitconfig-personal`
- `~/dev/remote/` → `~/.gitconfig-work`

These included files (`~/.gitconfig-personal`, `~/.gitconfig-work`) live outside this repo and must exist on the machine.

## Fish Abbreviations

Defined in `fish/conf.d/abbrs.fish`. Key git abbreviations: `ga`, `gap`, `gc`, `gca`, `gck`, `gpl`, `gp`, `gpf`, `gb`. The `grsync` function (rebase current branch onto main) lives in `fish/functions/grsync.fish`.

## Lua Formatting

Neovim Lua files use [stylua](https://github.com/JohnnyMorganz/StyLua). Config is at `nvim/.stylua.toml`. Run manually: `stylua nvim/`.
