# herdr-autoname

Auto-renames herdr tabs, agents, and workspaces.

| Entity | Format | Example |
|---|---|---|
| Tab | `[N] <repo> <proc> / <proc>` | `[1] tiger iex / pnpm` |
| Tab (single proc) | `[N] <repo> <proc>` | `[2] dotfiles claude` |
| Tab (idle) | `[N] <repo>` | `[4] dragon` |
| Tab (no repo) | `[N] <proc>` | `[7] claude` |
| Agent | `<two hyphenated words>` | `au-jsfopts` |
| Workspace | `<label> - <two hyphenated words>` | `work-1 - au-jsfopts` |

Tabs are named from the worktree repo (`.../tiger-worktrees/work-1` →
`tiger`) plus the non-shell processes running in their panes. This involves
**no LLM at all**, so tab renames are instant.

Agents and workspaces are named by `claude -p` (Haiku) from the git branch
(authoritative for *what* the work is) and Claude's session title (the
current step), abbreviated to two hyphenated words. Measured latency for
that call is 12-28s (median ~24s), so it can't run synchronously in the
event hook: the hook renames the tab immediately and spawns the
agent/workspace naming as a detached background process, which applies the
rename to herdr about 24s later once Haiku responds. `claude -p` is invoked
with `--system-prompt`, `--setting-sources ""`, and a neutral cwd so it
doesn't inherit ambient project context — without that it was leaking the
repo's own name into generated labels.

## Install

    ./install.sh

Re-run after changing `herdr-plugin.toml`. `setup.sh` runs it automatically.

## Behavior

- **Manual renames are respected** until the branch or session title changes.
- **Never touches git branches** — branch detection is read-only.
- Naming calls that don't return within 45s time out; the last good name is
  kept with a `…` marker (`work-1 - au-jsfopts …`) and retried on the next
  event.

## Debugging

    herdr plugin list
    cat ~/.local/state/herdr/plugins/thiamsantos.autoname/haiku-errors.log
    ls ~/.local/state/herdr/plugins/thiamsantos.autoname/

To force a rename, delete that entity's state file and trigger an event.

## Tests

    bun test
