# herdr-autoname

Renames herdr tabs and agents to a three-word summary of the work.

| Entity | Format | Example |
|---|---|---|
| Tab | `[N] <three hyphenated words>` | `[2] au-jsfopts-schema` |
| Agent | `<three hyphenated words>` | `au-jsfopts-schema` |

`claude -p` with Haiku 5.5 makes the words from the git branch (what the work
is) and the Claude session title (the current step). The call takes 12 to 28
seconds, so the event hook starts it in a detached process. The rename lands
about 24 seconds after the event.

`claude -p` runs with `--system-prompt`, `--setting-sources ""`, and a neutral
cwd. Without them, the repo's own name leaks into the words.

The `[N]` tag belongs to `herdr-tabnum`. This plugin keeps the tag and changes
only the words after it. A tab with no agent keeps its label.

## Install

    ./install.sh

Run it again after you change `herdr-plugin.toml`. `setup.sh` runs it.

## Behavior

- Manual renames stay until the branch or the session title changes.
- A tab with several agents takes its name from the agent with the lowest pane id.
- Branch detection is read-only. The plugin never changes git branches.
- After a 45-second timeout, the plugin keeps the last good name with a `…`
  marker (`au-jsfopts-schema …`) and tries again on the next event.

## Debugging

    herdr plugin list
    cat ~/.local/state/herdr/plugins/thiamsantos.autoname/haiku-errors.log
    ls ~/.local/state/herdr/plugins/thiamsantos.autoname/
    bun run src/haiku.ts <branch> "<title>"

To force a rename, delete the tab's or agent's state file and trigger an event.

## Tests

    bun test
