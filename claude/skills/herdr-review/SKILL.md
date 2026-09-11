---
name: herdr-review
description: Open a tuicr review in a herdr pane to annotate, then read the comments back — a plan/spec, branch diff, or GitLab MR. Not for GitHub PR /review or working-tree /code-review.
---
# herdr-review

Open a tuicr review in a half-width herdr pane, let the human annotate, then read
their comments back and act on them. This skill is a thin driver over the
`references/herdr-tuicr-review.py` launcher, which owns the pane mechanics. Your
job is policy: pick the flow, resolve the target, launch, and read back.

The launcher is a script bundled with this skill, not a command on `PATH`. Run it
with its absolute path:

```bash
launcher="$HOME/.claude/skills/herdr-review/references/herdr-tuicr-review.py"
```

Every `herdr-tuicr-review …` line below means `python3 "$launcher" …`.

## Precondition: must be inside herdr

The launcher opens a pane only when the agent runs inside a herdr session. If
`$HERDR_ENV` is not set, stop and tell the user: *"I need to be running inside a
herdr session to open the review pane. Start the agent inside herdr and ask
again."* Don't work around it.

## The shape (every flow)

1. **Identify the flow** from the request: plan/spec, branch diff, or MR. Ask
   only if genuinely ambiguous.
2. **Resolve and confirm the target** with the user (the exact doc, ref range,
   or MR). A wrong target wastes the human's review time.
3. **Launch**: run the launcher — it blocks while the human reviews. Use the
   Bash tool's max timeout (`timeout: 600000`):

   ```bash
   python3 "$launcher" [--cwd <repo>] -- <tuicr args…>
   ```

   It prints two lines to stdout when the human closes tuicr:

   ```
   TUICR_SESSION=<slug>
   TUICR_SESSION_JSON=<absolute path to the session .json>
   ```

   **If the Bash call times out** (human took longer than 10 min): the pane is
   still live and the review is not lost. Tell the user you'll wait, then re-check
   with the step 4 fallback — do not relaunch.

4. **Read the comments back** using the **JSON path**, not the slug:

   ```bash
   tuicr review comments --session "<TUICR_SESSION_JSON value>"
   ```

   Use the path: file-annotation slugs are keyed to a directory and need `--repo`
   to resolve; the path always resolves.

   **If the launcher did not print `TUICR_SESSION_JSON`** (it printed "could not
   resolve the session slug" and a directory): read the newest session file in
   that directory, then pass it as the `--session` path:

   ```bash
   sess=$(ls -t "$HOME/Library/Application Support/tuicr/reviews/sessions/"*.json | head -1)
   tuicr review comments --session "$sess"
   ```

   Otherwise never run `tuicr review list` to hunt for the session — the launcher
   already handed you the exact one.

5. **Act per flow** (below).

Once the pane is open, tell the user: add inline comments, press `q` to quit, and
dismiss any clipboard prompt (comments are read from the session, not clipboard).

## Flow 1: plan or spec

Superpowers docs live under `~/.claude/docs/superpowers/{plans,specs}/`, named
`YYYY-MM-DD-<topic>.md`.

Resolve the target:
- A path the user gave, or a plan/spec already in the conversation: use it.
- "the latest plan" / "the latest spec" means newest by name:
  `ls -t ~/.claude/docs/superpowers/plans/*.md | head -1` (or `specs/`).
- Ambiguous (didn't say plan vs spec, or several recent candidates): list the
  most recent few of the relevant kind and ask.

Confirm the absolute path, then launch with `--file` (no `--cwd`, no VCS needed):

```bash
python3 "$launcher" -- --file "<absolute doc path>"
```

After read-back: **report** the comments — grouped, classified, actionable — so
the user can decide what to change. Don't edit the doc unless they then ask;
reporting is the deliverable.

## Flow 2: branch changes

Review the current branch's diff against its target branch.

```bash
base=$(git symbolic-ref --short refs/remotes/origin/HEAD 2>/dev/null | sed 's@^origin/@@')
: "${base:=main}"   # origin/HEAD is often unset; fall back to main, or confirm with the user
python3 "$launcher" --cwd "<repo dir>" -- -r "$base..HEAD"
```

If `origin/HEAD` is unset and `main` is not the real target branch (e.g. the
repo uses `master`), confirm the base branch with the user before launching.

Overrides, if the user asks:
- "uncommitted" / "working tree": use `-w` instead of `-r …`
- "all files" / "everything tracked": use `-A`
- an explicit ref or range: pass it through as `-r <range>`

After read-back: report the comments and act on them (your own branch; the user
wants the feedback applied).

## Flow 3: GitLab merge request

Resolve the target:
- An explicit MR number, `owner/repo!N`, or URL the user gave: use it.
- Otherwise, if the repo has a kasa stack, run `git kasa status`, show the
  stack's MRs, and **ask which one**. Kasa uses one branch per commit, so the
  current branch alone doesn't identify the MR.
- Otherwise resolve the current branch's MR:
  `glab mr list --source-branch "$(git branch --show-current)"`.

Confirm the MR, then launch:

```bash
python3 "$launcher" --cwd "<repo dir>" -- mr "<target>"
```

The human reviews and, to post, presses `:submit` inside tuicr; tuicr posts to
GitLab through glab. **You never press `:submit` and never post to the MR
yourself** — the human submits (this respects the standing rule to never comment
on GitLab MRs on the user's behalf).

After read-back: **report** what is in the session (what they commented /
submitted). Don't post anything.
