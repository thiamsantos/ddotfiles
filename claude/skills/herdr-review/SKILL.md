---
name: herdr-review
description: >-
  Open a tuicr review in a herdr pane so the human can annotate, then read their
  comments back. Use this whenever the user wants to review something in tuicr
  inside herdr — a superpowers plan or spec ("review the latest plan in tuicr",
  "annotate this spec", "let me comment on the plan"), the current branch's diff
  ("review my branch changes", "review the branch in tuicr", "open the diff for
  review"), or a GitLab merge request ("review MR !123 in tuicr", "open this
  merge request for review", "review the current branch's MR"). Reach for it any
  time review + tuicr + herdr are in play, even if the user doesn't name all
  three. Do NOT use it for GitHub PR reviews via the `/review` command or for the
  working-tree `/code-review` command — those are separate flows.
---

# herdr-review

Open a tuicr review in a half-width herdr pane, let the human annotate, then read
their comments back and act on them. This skill is a thin driver over the
`herdr-tuicr-review` fish function, which owns all the pane mechanics. Your job
is policy: pick the flow, resolve the target, launch, and read back.

## Why this exists

tuicr is where a human reviews code and writes inline comments; the persisted
session is how an agent reads those comments afterward. herdr hosts the
interactive pane. Keeping the mechanism in one fish function means this skill
stays small and never touches herdr directly — it launches, waits, and reads.

## Precondition: must be inside herdr

The launcher can only open a pane when the agent runs inside a herdr session. If
`$HERDR_ENV` is not set, stop and tell the user: *"I need to be running inside a
herdr session to open the review pane — start the agent inside herdr and ask
again."* Don't try to work around it.

## The shape (every flow)

1. **Identify the flow** from the request — plan/spec, branch diff, or MR. Ask
   only if it is genuinely ambiguous.
2. **Resolve and confirm the target** with the user (the exact doc, ref range,
   or MR). Confirming a wrong target wastes the human's review time.
3. **Launch**: run the fish function, giving it a long timeout — it blocks while
   the human reviews, so allow 10+ minutes:

   ```bash
   herdr-tuicr-review [--cwd <repo>] -- <tuicr args…>
   ```

   It prints two lines to stdout when the human closes tuicr:

   ```
   TUICR_SESSION=<slug>
   TUICR_SESSION_JSON=<absolute path to the session .json>
   ```

4. **Read the comments back** using the **JSON path**, not the slug:

   ```bash
   tuicr review comments --session "<TUICR_SESSION_JSON value>"
   ```

   Use the path because file-annotation session slugs are keyed to a directory
   and fail to resolve with `--session <slug>` unless you also pass `--repo`. The
   path always resolves. Never run `tuicr review list` to hunt for the session —
   the launcher already handed you the exact one.

5. **Act per flow** (below).

Tell the user, once the pane is open: *"tuicr is open in a herdr pane — add your
inline comments, then quit tuicr (press `q`) when you're done. If it asks about
copying to the clipboard, just dismiss it; I read the comments from the session."*

## Flow 1 — plan or spec

Superpowers docs live under `~/.claude/docs/superpowers/{plans,specs}/`, named
`YYYY-MM-DD-<topic>.md`.

Resolve the target:
- A path the user gave, or a plan/spec already in the conversation → use it.
- "the latest plan" / "the latest spec" → newest by name:
  `ls -t ~/.claude/docs/superpowers/plans/*.md | head -1` (or `specs/`).
- Ambiguous (didn't say plan vs spec, or several recent candidates) → list the
  few most recent of the relevant kind and ask.

Confirm the absolute path, then launch with `--file` (no `--cwd`, no VCS needed):

```bash
herdr-tuicr-review -- --file "<absolute doc path>"
```

After read-back: **report** the comments — grouped, classified, actionable — so
the user can decide what to change. Do not edit the doc unless they then ask you
to; reporting is the deliverable.

## Flow 2 — branch changes

Review the current branch's diff against its target branch.

```bash
base=$(git symbolic-ref --short refs/remotes/origin/HEAD 2>/dev/null | sed 's@^origin/@@')
: "${base:=main}"   # origin/HEAD is often unset; fall back to main, or confirm with the user
herdr-tuicr-review --cwd "<repo dir>" -- -r "$base..HEAD"
```

If `origin/HEAD` is unset and `main` is not the real target branch (e.g. the
repo uses `master`), confirm the base branch with the user before launching.

Overrides, if the user asks:
- "uncommitted" / "working tree" → `-w` instead of `-r …`
- "all files" / "everything tracked" → `-A`
- an explicit ref or range → pass it through as `-r <range>`

After read-back: report the comments and act on them (this is your own branch;
the user wants the feedback applied).

## Flow 3 — GitLab merge request

Resolve the target:
- An explicit MR number, `owner/repo!N`, or URL the user gave → use it.
- Otherwise, if the repo has a kasa stack, run `git kasa status`, show the
  stack's MRs, and **ask which one** — kasa uses one branch per commit, so the
  current branch alone doesn't identify the MR.
- Otherwise resolve the current branch's MR:
  `glab mr list --source-branch "$(git branch --show-current)"`.

Confirm the MR, then launch:

```bash
herdr-tuicr-review --cwd "<repo dir>" -- mr "<target>"
```

The human reviews and, if they choose to post, presses `:submit` inside tuicr —
tuicr posts to GitLab through glab. **You never press `:submit` and never post to
the MR yourself** (this respects the standing rule to never comment on GitLab MRs
on the user's behalf — the human is the one who submits).

After read-back: **report** to the user what is in the session (what they
commented / submitted). Don't post anything.

## What this skill deliberately does not do

- No "is this a user-led or agent review?" branching — the human always writes
  the comments; you read them.
- No session discovery or slug matching — the launcher returns the session.
- No agent-authored review comments and no agent posting to any forge.
