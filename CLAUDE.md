# CLAUDE.md

This file tells Claude Code how the setup works and how to change it. For the list of installed tools and the human setup steps, read `README.md`.

## How it works

These are personal macOS dotfiles. [GNU Stow](https://www.gnu.org/software/stow/) manages them. Each top-level directory is a Stow package. Stow symlinks each package into `$HOME` or `$HOME/.config/<tool>`. `setup.sh` defines the bootstrap order: install Homebrew and the `Brewfile`, seed the machine-local config, stow each package, set the Fish shell, run `mise install`.

To change a config, edit the file in its package in this repo. The symlink makes the change live immediately. You must not copy the file to the target.

After you change which files a package exposes, run `stow` again for that package.

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

- **Install packages and apps with Homebrew.** You must add each new CLI tool, font, or app to `Brewfile`. Do not install it manually. `brew bundle` installs everything in the file.
- **Put language and tool versions in `mise/config.toml`.** Put machine-local tools in the gitignored `~/.config/mise/config.local.toml` overlay. You must not put them in the tracked config.
- **You must not run `mise use --global`** while `~/.config/mise/config.toml` is a Stow symlink. mise writes to the target file and adds the tool to the tracked `mise/config.toml`. Pin the version in `config.local.toml` instead.
- **Format Nvim Lua with [stylua](https://github.com/JohnnyMorganz/StyLua)** (`nvim/.stylua.toml`). Run `stylua nvim/`.

## Machine-local config (gitignored but stowed)

Some files hold machine-specific or work-specific values: git identities, the `r` environment topology, and the AWS profile. These files are in their Stow package, but `.gitignore` excludes them. Stow symlinks them, and Git does not track them. Each file has a committed `*.example` template:

| Gitignored file | Template |
|---|---|
| `git/.gitconfig-work` | `git/.gitconfig-work.example` |
| `git/.gitconfig-personal` | `git/.gitconfig-personal.example` |
| `fish/conf.d/r.local.fish` | `fish/conf.d/r.local.fish.example` |
| `fish/conf.d/aws.local.fish` | `fish/conf.d/aws.local.fish.example` |

`setup.sh` copies each file from its `.example` **before** the `stow` calls, and never overwrites an existing file. A new clone thus gets working symlinks.

To change one of these files, edit the real gitignored file. When you change its structure, you must also update the `.example` file.

## Claude skills

Skills are in `claude/skills/<name>/`. `claude/install-skills.sh` **copies** them to `~/.claude/skills/`. It does not stow or symlink them. `setup.sh` runs the script after the stow step. To apply a change, edit the skill in the repo and run the script again. The script also deletes the retired skills `tuicr` and `review-plan-tuicr`.

- `herdr-review` — opens a tuicr review in a half-width herdr pane for three
  flows: a superpowers plan or spec, the current-branch diff, and a GitLab MR.
  It waits for the human, then reads their comments from the session JSON path.
  It is a thin wrapper over the `herdr-tuicr-review` fish function. It requires
  an active herdr session.
- `review-queue` — lists the open GitLab MRs where I am a requested reviewer. It
  splits them into four sections: nobody reviewed, approved by someone else,
  draft, and already reviewed by me. The oldest activity comes first. It then
  asks which MR to review with `AskUserQuestion`. After the choice it starts the
  review: the MR description (why and how), the linked Linear ticket, a code
  summary, a `superpowers:requesting-code-review` pass over the MR `diff_refs`
  SHA range, then `herdr-review` for annotation. It has two scripts:
  `fetch_review_queue.py` (one GraphQL call) and `list_worktrees.py` (finds free
  `work-n` worktrees under `employ_workspace`). It never posts to an MR.

## herdr plugins

`herdr-autoname/` is a herdr plugin. It is TypeScript on Bun and has no build step. `herdr-autoname/install.sh` links it, and `setup.sh` runs that script after the skills install.

The plugin renames tabs to `[N] <repo> <procs>` immediately. This rename uses no LLM — only the worktree repo name and the running processes. It also renames agents to a two-word Haiku summary and workspaces to `<label> - <two words>`.

Haiku calls use `claude -p` and take 12 to 28 seconds. They run as a detached background process, so the hook stays fast. The rename lands about 24 seconds later. After a 45-second timeout, the plugin keeps the last good name and adds a `…` marker.

Branch detection is read-only. The plugin never rewrites git branches. The state and the Haiku error log are in `~/.local/state/herdr/plugins/thiamsantos.autoname/`. After you edit the plugin, you must run `bun test` in the plugin directory.

`herdr-resurrect/` holds only an `install.sh`. The plugin is third-party ([ntindle/herdr-resurrect](https://github.com/ntindle/herdr-resurrect)). `setup.sh` installs it from the marketplace, and herdr pins it to the resolved commit. The plugin is tmux-resurrect for herdr: it snapshots workspaces, tabs, panes, working directories, running programs, and agents, then restores them after a crash or a reboot.

The script is deliberately **not** in the `herdr/` stow package. Stow would symlink it into `~/.config/herdr/`, and it is not config.

The config is in `~/.config/herdr/plugins/config/ntindle.herdr-resurrect/`. It is not stowed and not tracked. `install.sh` creates both files and never overwrites them:

- `settings.json` — sets `autoRestore: true`. Agents come back on the first
  event after a server restart. `agentResume` runs `claude --resume <id>`.
- `allowlist.txt` — deliberately **empty**. The allowlist controls only
  non-agent programs, and the agent restore path never reads it. An empty file
  therefore restores agents but not dev servers. A single `*` entry would also
  restore the servers.

The snapshots and `last.json` are in `~/.local/state/herdr/plugins/ntindle.herdr-resurrect/`. Event-driven autosave is on by default and writes at most once every 20 seconds. The bundled `resurrect autosave` timer pane is optional, and this setup does not use it. The plugin has no keybindings. Use the command palette or run `herdr plugin action invoke ntindle.herdr-resurrect.<save|restore|restore-preview|snapshots>`. Run `restore-preview` first: it is a dry run.

Gotcha: if you run the plugin scripts manually, for example `node bin/restore.js`, the plugin reads the config from `~/.config/herdr-resurrect/` and **not** from the real directory. herdr normally sets `HERDR_PLUGIN_CONFIG_DIR`. You must set that variable yourself when you run a script directly. If you do not set it, the empty allowlist and the `autoRestore` setting have no effect.

## Git config

`~/.gitconfig` uses `includeIf` to select the identity by directory:
- `~/dev/thiamsantos/` and `~/dev/dotfiles/` → `~/.gitconfig-personal`
- `~/dev/remote/` → `~/.gitconfig-work`

Both included files are Stow symlinks to the gitignored `git/.gitconfig-personal` and `git/.gitconfig-work`. See Machine-local config. The 1Password agent signs commits with SSH.

## Fish

- **Abbreviations** (`fish/conf.d/abbrs.fish`): `ga` (add), `gap` (add -p), `gc` (commit -m), `gca` (amend --no-edit), `gck` (checkout), `gpl` (pull --rebase), `gp` (push HEAD -u), `gpf` (push --force-with-lease), `gb` (checkout -b).
- **Functions** (`fish/functions/`):
  - `grsync` — rebases the current branch onto the default branch.
  - `r` — connects to remote environments. It runs `psql`, `iex`, `login`,
    `get-param`, or `set-param` against `stg`, `sand`, or `prod`. It also runs
    `iex review APP`. The environment topology comes from the gitignored
    `fish/conf.d/r.local.fish`; the function itself is generic. If that file is
    absent, the function fails and points to the `.example` file.
  - `herdr-pick-agent` and `herdr-pick-workspace` — fzf pickers bound to herdr
    popups.
  - `search_history` — fzf history search, bound to `Ctrl+r`.
  - `herdr-tuicr-review` — opens a tuicr review in a half-width herdr split,
    blocks until the human closes it, then prints the resolved session as a slug
    and a JSON path. It backs the `herdr-review` skill. Session resolution is in
    the sibling script `herdr-tuicr-resolve-session.py`.
- **Keybinds** (`fish/config.fish`): `Ctrl+f` and `Ctrl+b` move by word, `Ctrl+w` kills the word before the cursor, `Ctrl+c` cancels the line, `Ctrl+r` searches the history. `vim` is an alias for `nvim`.

## Neovim

This setup runs [LazyVim](https://www.lazyvim.org) on [lazy.nvim](https://github.com/folke/lazy.nvim). `nvim/init.lua` calls `require("config.lazy")`, which imports LazyVim, the language Extras, and the local overrides in `nvim/lua/plugins/`.

- `nvim/lua/config/` — `lazy.lua` (bootstrap and Extras), `options.lua`, `keymaps.lua`, `autocmds.lua`.
- `nvim/lua/plugins/*.lua` — one override spec per concern: `colorscheme` (dracula), `git` (Neogit), `editor` (fzf-lua keymaps), `elixir` (dexter LSP), `lsp` (fish_lsp, sqlls), `test` (vim-test), `markdown` (disables markdownlint-cli2), `icons` (ASCII, no Nerd Font), `misc` (other.nvim, maximize.nvim, which-key classic preset, nvim-notify).
- LazyVim and the language Extras provide LSP, formatting, and treesitter. The picker is **fzf-lua**. The Git UI is **Neogit**. Elixir uses **dexter**, registered manually. mise or brew installs dexter, not Mason.

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

All other mappings are LazyVim defaults. Run `:help LazyVim`, or press `<Space>` for which-key.

## Terminal and multiplexers

- **Ghostty** (`ghostty/config`): Dracula theme, SF Mono 16pt. `Cmd+a` is unbound, which frees it for hyper-key combinations. `Ctrl+Cmd+Alt+a` sends `Ctrl+a` (`\x01`), which is the herdr prefix.
- **herdr** (`herdr/config.toml`): the prefix is `Ctrl+a`. `prefix+a` and `prefix+shift+a` select the next and previous agent. `prefix+t` and `prefix+shift+t` create and rename a tab. `prefix+s` and `prefix+shift+s` create and rename a workspace. `j` and `k` move between workspaces. `prefix+f` opens the fzf agent picker. `prefix+o` opens the fzf workspace picker.

## Window management (Aerospace)

`aerospace/.aerospace.toml`, prefix `Ctrl+Alt+Cmd`: `Enter` opens a new Ghostty window. `h`, `j`, `k`, and `l` move the focus; add `Shift` to move the window. `1` to `0` select a workspace; add `Shift` to move the node. `f` sets fullscreen. `r` starts resize mode. `Shift+R` reloads the config. `q` closes the window. Aerospace starts JankyBorders at launch.
