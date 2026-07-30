# CLAUDE.md

Guidance for Claude Code when working in this repository. For what's installed and how a human sets it up, see `README.md` — this file covers how the setup works and how to change it.

## How it works

Personal macOS dotfiles managed with [GNU Stow](https://www.gnu.org/software/stow/). Each top-level directory is a Stow package symlinked into `$HOME` or `$HOME/.config/<tool>`. `setup.sh` is the source of truth for the bootstrap order: Homebrew + `Brewfile`, seed machine-local config, `stow` each package, set the Fish shell, `mise install`.

Editing a config means editing the file in its package here; the symlink means the change is live immediately (no copy step). After changing which files a package exposes, re-run `stow` for that package.

### Stow package → target

| Package | Target |
|---|---|
| `git/` | `$HOME` (`~/.gitconfig`, `~/.globalgitignore`) |
| `aerospace/` | `$HOME` |
| `fish/` | `$HOME/.config/fish` |
| `ghostty/` | `$HOME/.config/ghostty` |
| `ssh/` | `$HOME/.ssh` |
| `1Password/` | `$HOME/.config/1Password` |
| `nvim/` | `$HOME/.config/nvim` |
| `mise/` | `$HOME/.config/mise` |
| `herdr/` | `$HOME/.config/herdr` |

## Rules for changes

- **Packages/apps go through Homebrew.** Add any new CLI tool, font, or app to `Brewfile` before/instead of installing ad-hoc (`brew bundle` installs everything).
- **Language/tool versions go in `mise/config.toml`.** Machine-local tools go in the gitignored `~/.config/mise/config.local.toml` overlay, never in the tracked config.
- **Never run `mise use --global`** while `~/.config/mise/config.toml` is a Stow symlink — mise rewrites the target, leaking the tool into the tracked `mise/config.toml`. Pin the version in `config.local.toml` instead.
- **Nvim Lua is formatted with [stylua](https://github.com/JohnnyMorganz/StyLua)** (`nvim/.stylua.toml`): `stylua nvim/`.

## Machine-local config (gitignored but stowed)

Files holding machine- or work-specific values (git identities, `r` environment topology, AWS profile) live inside their Stow package but are gitignored (see `.gitignore`), so Stow symlinks them while Git never tracks them. Each has a committed `*.example` template:

| Gitignored file | Template |
|---|---|
| `git/.gitconfig-work` | `git/.gitconfig-work.example` |
| `git/.gitconfig-personal` | `git/.gitconfig-personal.example` |
| `fish/conf.d/r.local.fish` | `fish/conf.d/r.local.fish.example` |
| `fish/conf.d/aws.local.fish` | `fish/conf.d/aws.local.fish.example` |

`setup.sh` seeds each from its `.example` (never overwriting) **before** the `stow` calls, so a fresh clone gets working symlinks. When editing these, edit the real (gitignored) file; keep the `.example` in sync when the shape changes.

## Claude skills

Skills live in `claude/skills/<name>/` and deploy to `~/.claude/skills/` by
**copy** (not stow/symlink) via `claude/install-skills.sh`, which `setup.sh`
runs after stowing. Edit a skill in the repo, then re-run the script to apply.
The script also removes retired skills (`tuicr`, `review-plan-tuicr`).

- `herdr-review` — opens a tuicr review in a half-width herdr pane for three
  flows (superpowers plan/spec, current-branch diff, GitLab MR), waits for the
  human, then reads their comments back via the session JSON path. Thin wrapper
  over the `herdr-tuicr-review` fish function; requires an active herdr session.
- `review-queue` — lists the open GitLab MRs where I'm a requested reviewer,
  split into four sections (nobody reviewed / approved by someone else / draft /
  already reviewed by me), oldest activity first, then asks which one to review
  via `AskUserQuestion`. After the pick it ramps into the review: MR description
  (why/how), linked Linear ticket, a code summary, a
  `superpowers:requesting-code-review` pass over the MR's `diff_refs` SHA range,
  then `herdr-review` for annotation. Two scripts —
  `fetch_review_queue.py` (one GraphQL call) and `list_worktrees.py` (finds free
  `work-n` worktrees under `employ_workspace`). Never posts to an MR itself.

## herdr plugins

`herdr-autoname/` is a herdr plugin (TypeScript on Bun, no build step) linked
via `herdr-autoname/install.sh`, which `setup.sh` runs after the skills
install. It renames tabs to `[N] <repo> <procs>` instantly (no LLM — just the
worktree repo name and running processes), and renames agents to a
three-word Haiku summary and workspaces to `<label> - <three words>`. Haiku
calls (`claude -p`, 12-28s typical) run as a detached background process so
the hook itself stays fast; the rename lands ~24s later, and a 45s timeout
falls back to the last good name with a `…` marker. Branch detection is
read-only — it never rewrites git branches. State and the Haiku error log
live in `~/.local/state/herdr/plugins/thiamsantos.autoname/`. Run `bun test`
in the plugin dir after editing.

## Git config

`~/.gitconfig` uses `includeIf` to swap identity by directory:
- `~/dev/thiamsantos/` and `~/dev/dotfiles/` → `~/.gitconfig-personal`
- `~/dev/remote/` → `~/.gitconfig-work`

Both included files are Stow symlinks to the gitignored `git/.gitconfig-personal` / `git/.gitconfig-work` (see Machine-local config). Commits are SSH-signed via the 1Password agent.

## Fish

- **Abbreviations** (`fish/conf.d/abbrs.fish`): `ga` (add), `gap` (add -p), `gc` (commit -m), `gca` (amend --no-edit), `gck` (checkout), `gpl` (pull --rebase), `gp` (push HEAD -u), `gpf` (push --force-with-lease), `gb` (checkout -b).
- **Functions** (`fish/functions/`):
  - `grsync` — rebase the current branch onto the default branch.
  - `r` — connect to remote environments (`psql`/`iex`/`login`/`get-param`/`set-param` against `stg`/`sand`/`prod`, plus `iex review APP`). Env topology comes from the gitignored `fish/conf.d/r.local.fish`; the function itself is generic. Fails with a pointer to the `.example` when that file is absent.
  - `herdr-pick-agent` / `herdr-pick-workspace` — fzf pickers bound to herdr popups.
  - `search_history` — fzf history search, bound to `Ctrl+r`.
  - `herdr-tuicr-review` — open a tuicr review in a half-width herdr split, block until the human closes it, print the resolved session (slug + JSON path). Backs the `herdr-review` skill; session resolution lives in the sibling `herdr-tuicr-resolve-session.py`.
- **Keybinds** (`fish/config.fish`): `Ctrl+f`/`Ctrl+b` word motion, `Ctrl+w` backward-kill-word, `Ctrl+c` cancel line, `Ctrl+r` history search. `vim` aliases to `nvim`.

## Neovim

[LazyVim](https://www.lazyvim.org) on [lazy.nvim](https://github.com/folke/lazy.nvim). `nvim/init.lua` → `require("config.lazy")` imports LazyVim, language Extras, and the local overrides in `nvim/lua/plugins/`.

- `nvim/lua/config/` — `lazy.lua` (bootstrap + Extras), `options.lua`, `keymaps.lua`, `autocmds.lua`.
- `nvim/lua/plugins/*.lua` — one override spec per concern: `colorscheme` (dracula), `git` (Neogit), `editor` (fzf-lua keymaps), `elixir` (dexter LSP), `lsp` (fish_lsp, sqlls), `test` (vim-test), `markdown` (disables markdownlint-cli2), `icons` (ASCII, no Nerd Font), `misc` (other.nvim, maximize.nvim, which-key classic preset, nvim-notify).
- LSP/formatting/treesitter come from LazyVim + lang Extras. Picker is **fzf-lua**; Git UI is **Neogit**. Elixir uses **dexter**, registered manually (installed via mise/brew, not Mason).

Custom mappings (`<Space>` leader):

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

Everything else uses LazyVim defaults (`:help LazyVim`, or `<Space>` for which-key).

## Terminal & multiplexers

- **Ghostty** (`ghostty/config`): Dracula, SF Mono 16pt. `Cmd+a` is unbound (freed for hyper-key combos). `Ctrl+Cmd+Alt+a` forwards `Ctrl+a` (`\x01`), used as the herdr prefix.
- **herdr** (`herdr/config.toml`): prefix `Ctrl+a`. `prefix+a`/`prefix+shift+a` next/prev agent, `prefix+t`/`prefix+shift+t` new/rename tab, `prefix+s`/`prefix+shift+s` new/rename workspace, `j`/`k` navigate workspaces, `prefix+f` fzf agent picker, `prefix+o` fzf workspace picker.

## Window management (Aerospace)

`aerospace/.aerospace.toml`, prefix `Ctrl+Alt+Cmd`: `Enter` new Ghostty, `h`/`j`/`k`/`l` focus (add `Shift` to move), `1`–`0` workspaces (add `Shift` to move node), `f` fullscreen, `r` resize mode, `Shift+R` reload config, `q` close. Runs JankyBorders at startup.
