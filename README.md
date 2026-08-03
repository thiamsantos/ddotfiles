# Dotfiles

Personal macOS development environment, managed with [GNU Stow](https://www.gnu.org/software/stow/). Each top-level directory is a Stow package symlinked into `$HOME` or `$HOME/.config/<tool>`. All packages and apps are declared in `Brewfile`.

## What's included

**Shell & terminal**
- [Fish](https://fishshell.com/) shell — prompt, abbreviations, functions, history search (`fish/`)
- [Ghostty](https://ghostty.org/) terminal — Dracula, SF Mono (`ghostty/`)
- [herdr](https://herdr.dev/) agent multiplexer (`herdr/`)

**Editor**
- [Neovim](https://neovim.io/) on [LazyVim](https://www.lazyvim.org) — fzf-lua, Neogit, Dracula, ASCII icons (`nvim/`)

**Tooling**
- [Homebrew](https://brew.sh/) for packages/apps (`Brewfile`)
- [mise](https://mise.jdx.dev/) for language/tool versions (`mise/`)
- Git with [delta](https://github.com/dandavison/delta), `includeIf` identity switching, SSH commit signing (`git/`)
- [1Password](https://1password.com/) SSH agent (`1Password/`, `ssh/`)
- [Aerospace](https://nikitabobko.github.io/AeroSpace/) tiling window manager (`aerospace/`)
- Claude Code skills (`claude/skills/`) deployed to `~/.claude/skills/` by `claude/install-skills.sh` — includes `herdr-review`, which opens [tuicr](https://github.com/agavra/tuicr) reviews in a herdr pane

**herdr plugins**
- `herdr-autoname/` — renames tabs to `[N] <repo> <procs>` instantly, and agents and workspaces to a two-word Haiku summary of the branch and Claude session title (`herdr-autoname/install.sh`)
- `herdr-resurrect/` — installer only; the plugin is third-party ([ntindle/herdr-resurrect](https://github.com/ntindle/herdr-resurrect)). It snapshots workspaces, tabs, panes, and agents, then restores them after a crash or reboot (`herdr-resurrect/install.sh`)

**Languages via mise**: Elixir, Erlang, Node, Yarn, Python, Lua, Rust, Go, Bun, plus `kubectl`, `pandoc`, and the [dexter](https://github.com/remoteoss/dexter) Elixir LSP.

**Notable CLI tools (Brewfile)**: `fzf`, `ripgrep`, `fd`, `jq`, `yq`, `glab`, `git-delta`, `colima`, `docker`, `direnv`, `zoxide`, `gum`, `awscli`, `gimme-aws-creds`.

**Apps (casks)**: Raycast, Notion, Todoist, Spotify, Loom, Insomnia, Shottr, Stats, BetterDisplay, Keymapp, and fonts (Fira Code, SF Mono, Hack Nerd Font).

## Installation

Prerequisites: macOS 14+, Git, and admin access (for the shell change).

```bash
git clone https://github.com/thiamsantos/ddotfiles.git ~/dev/dotfiles
cd ~/dev/dotfiles
./setup.sh
```

`setup.sh` installs Homebrew and the `Brewfile`, seeds machine-local config (below), symlinks every package with Stow, deploys Claude skills into `~/.claude/skills/`, installs the two herdr plugins, sets Fish as the default shell, and runs `mise install`. Restart the terminal afterward.

To re-link a single package without the full script:

```bash
stow --verbose --target="$HOME/.config/fish" fish
```

## Machine-local config

Some values are machine- or work-specific and must not be committed (git identities, `r` environment topology, AWS profile). These files live inside their Stow package but are **gitignored**, so Stow symlinks them while Git never tracks them. Each has a committed `*.example` template.

| Gitignored file | Template | Holds |
|---|---|---|
| `git/.gitconfig-work` | `git/.gitconfig-work.example` | Work git identity + signing key |
| `git/.gitconfig-personal` | `git/.gitconfig-personal.example` | Personal git identity + signing key |
| `fish/conf.d/r.local.fish` | `fish/conf.d/r.local.fish.example` | `r` environment definitions |
| `fish/conf.d/aws.local.fish` | `fish/conf.d/aws.local.fish.example` | `AWS_PROFILE` / `AWS_REGION` |

On a fresh clone, `setup.sh` copies each `.example` to its real path (never overwriting) before stowing. To set one up by hand, copy the template, fill in your values, then re-run `stow` for that package. Machine-local mise tools go in `~/.config/mise/config.local.toml` (a standalone overlay, not stowed), which `setup.sh` also seeds.

## Manual setup notes

A few things `setup.sh` does not fully automate:

- **Git identity files** — edit `git/.gitconfig-work` and `git/.gitconfig-personal` with your real email and 1Password SSH signing key after the first run.
- **1Password SSH agent** — enable the SSH agent in the 1Password app; key items are referenced in `1Password/ssh/agent.toml`.
- **Aerospace & JankyBorders** — grant Accessibility permission on first launch; the config runs `borders` at startup.
- **Fonts** — installed as casks, but the terminal/editor must be restarted to pick them up.
- **Claude skills** — `setup.sh` copies `claude/skills/*` into `~/.claude/skills/`. After editing a skill in the repo, re-run `claude/install-skills.sh` to apply (it copies, so edits are not live until you do). The `herdr-review` skill needs an active herdr session and `tuicr`.
- **herdr plugins** — both installers skip silently when the `herdr` binary is missing (and `herdr-resurrect` also needs `node`), so re-run `herdr-autoname/install.sh` and `herdr-resurrect/install.sh` after Homebrew has installed herdr. `herdr-resurrect`'s config (`settings.json`, `allowlist.txt`) is seeded once and never overwritten.

## Maintenance

```bash
brew update && brew upgrade   # packages
mise upgrade                  # language/tool versions
```

When adding any CLI tool, font, or app, add it to `Brewfile` rather than installing ad-hoc.
