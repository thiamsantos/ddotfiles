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

## Neovim Architecture

Distribution: [LazyVim](https://www.lazyvim.org) on top of [lazy.nvim](https://github.com/folke/lazy.nvim). `nvim/init.lua` calls `require("config.lazy")`, which imports LazyVim, a set of language Extras, and the local overrides in `nvim/lua/plugins/`.

- `nvim/lua/config/` — `lazy.lua` (bootstrap + Extras imported), `options.lua`, `keymaps.lua`, `autocmds.lua`.
- `nvim/lua/plugins/*.lua` — one focused override spec per concern: `colorscheme` (dracula), `git` (Neogit), `editor` (fzf-lua keymaps), `elixir` (dexter LSP), `lsp` (fish_lsp, sqlls), `test` (vim-test), `markdown` (disables markdownlint-cli2), `icons` (ASCII, no Nerd Font), `misc` (other.nvim, maximize.nvim, which-key classic preset, nvim-notify).
- LSP/formatting/treesitter come from LazyVim + lang Extras. The picker is **fzf-lua** (LazyVim default). Git UI is **Neogit** on `<leader>gg`. Elixir uses **dexter**, registered manually because it is installed via mise/brew, not Mason.

Key custom mappings (`<Space>` is leader):

| Key | Action |
|---|---|
| `<leader><leader>` | fzf-lua: git-aware find files |
| `<leader>ff` | fzf-lua: files in current buffer dir |
| `<leader>s.` | fzf-lua: live grep in current buffer dir |
| `<leader>fy` / `<leader>fY` | Yank absolute / project-relative file path |
| `<leader>mtt` | Open alternate file (test ↔ source) |
| `<leader>mtv` / `<leader>mts` / `<leader>mta` / `<leader>mtr` | vim-test: file / nearest / suite / last |
| `<leader>wo` | Maximize window |
| `<leader>gg` | Neogit |

Everything else uses LazyVim defaults (see `:help LazyVim` and which-key).

## Git Config

`~/.gitconfig` uses `includeIf` to swap user identity:
- `~/dev/thiamsantos/` and `~/dev/dotfiles/` → `~/.gitconfig-personal`
- `~/dev/remote/` → `~/.gitconfig-work`

These included files (`~/.gitconfig-personal`, `~/.gitconfig-work`) live outside this repo and must exist on the machine.

## Fish Abbreviations

Defined in `fish/conf.d/abbrs.fish`. Key git abbreviations: `ga`, `gap`, `gc`, `gca`, `gck`, `gpl`, `gp`, `gpf`, `gb`. The `grsync` function (rebase current branch onto main) lives in `fish/functions/grsync.fish`.

## Lua Formatting

Neovim Lua files use [stylua](https://github.com/JohnnyMorganz/StyLua). Config is at `nvim/.stylua.toml`. Run manually: `stylua nvim/`.
