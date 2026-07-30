---
name: review-queue
description: >-
  Show my GitLab review queue — the open MRs where I'm a requested reviewer —
  split into four sections (not reviewed by anyone, already approved by someone
  else, drafts awaiting my approval, already reviewed by me), oldest activity
  first, then let me choose one to open for review. Use this whenever the user asks what
  they need to review or wants to choose something to review: "what's in my
  review queue", "what do I need to review", "show my review requests", "any MRs
  waiting on me", "what should I review next", "show my GitLab dashboard MRs",
  "anything I haven't reviewed yet", "what have I already reviewed". Reach for it
  on any ask about pending/assigned reviews even if GitLab, MRs, or "queue" go
  unmentioned. After I choose an MR it walks the whole review ramp: MR
  description (why/how), the linked Linear ticket, a code summary, then a
  code-review pass, then opens it in herdr-review. Do NOT use it to review a
  specific MR the user already named (that's herdr-review directly), to review
  the working tree (/code-review), or to create an MR (that's gitlab-access).
allowed-tools: [Bash, Read, Grep, Glob, Agent, Skill, AskUserQuestion]
---

# review-queue

Show the open merge requests where I'm a requested reviewer, grouped into four
sections, let the human pick one, then ramp them into reviewing it: what the MR
is for, what the linked ticket says, what the code does, and what an automated
pass thinks is wrong — before opening it in `herdr-review` to annotate.

This skill orchestrates; the specialists do the work. It never posts anything to
GitLab.

## Why this exists

GitLab's own dashboard mixes everything into one long feed, so it's hard to tell
"nobody has looked at this yet" from "already approved, just needs a second pair
of eyes" from "I already gave my verdict". Those cases deserve different
attention, and the oldest-waiting MR is usually the one to pick up next. This
skill reproduces that split locally, then closes the loop by letting the human
pick one and opening it for review — the queue exists to be acted on, so ending
at a printed list would leave the useful part undone.

The stages after the pick exist in a deliberate order: understand the intent,
then the code, then the criticism. Reading a tool's findings before understanding
the change tends to anchor a reviewer on whatever the tool noticed and crowd out
their own judgement, which is the most valuable thing they bring. So the human
confirms they understand the change before any findings appear.

## GitLab access goes through gitlab-access

All GitLab work in this setup is governed by `Skill(gitlab-access)` — it owns the
`glab` conventions (authenticated host, never using the GitLab MCP tools, never
posting comments on the user's behalf). Invoke it when you need GitLab work
beyond running the fetch script and beyond the review pane — for instance if the
human wants to read an MR's existing threads (`glab mr view <iid> --repo
<project> --comments`) rather than open it for annotation.

Two conventions from it that matter here:

- Use `glab`, never the `mcp__GitLab__*` tools.
- Never post comments, approvals, or review verdicts on an MR. This skill reads;
  the human decides what to say.

## The shape

1. **Fetch and classify** in one call:

   ```bash
   python3 ~/.claude/skills/review-queue/scripts/fetch_review_queue.py
   ```

   It prints JSON: `username`, `total`, `sections` (each with `key`, `title`,
   `items`), and a flat `picks` array. Every item carries a `pick` number that is
   unique across the whole list, so "3" is never ambiguous.

   The script does one GraphQL round-trip and handles pagination. Don't
   reimplement it with `glab api merge_requests` — the REST list endpoint omits
   both approval data and per-reviewer review state, so classifying through it
   would cost two extra requests per MR.

2. **Render the four sections** in the script's order, oldest activity first
   within each (the script already sorts). Show every section even when empty —
   an empty "not reviewed by anyone" is genuinely good news and worth seeing.

   Keep each row to one line so a long queue stays scannable: pick number, MR
   reference, how long since last activity, author, and title. Include the
   `web_url` so it's clickable. Add a per-section count. For section 2, name who
   approved; for section 4, show my own review state (`REVIEWED`, `APPROVED`,
   `REQUESTED_CHANGES`) since "I approved it" and "I requested changes" are very
   different situations.

3. **Offer the pick with `AskUserQuestion`.** After printing the sections, ask
   which MR to review using the `AskUserQuestion` tool rather than inviting a
   typed number — picking from a list beats scrolling back up to match a number
   against a row.

   The tool allows at most **4 options** per question, and a real queue is
   usually longer, so choose the 4 most worth surfacing instead of truncating
   blindly: walk the sections in order (1 → 4) and take the oldest-activity
   items first, since those have been waiting longest. That naturally front-loads
   "nobody has reviewed this yet".

   - **Label**: the MR reference plus enough title to recognise it (e.g.
     `!64992 country-forms: legal entity`). Keep labels short — they render as
     chips.
   - **Description**: author, how long since last activity, and the section it
     came from, so the tradeoff between options is visible.
   - When the queue has more than 4 entries, say so in the message accompanying
     the list (e.g. *"showing the 4 longest-waiting of 9 — full list above"*) so
     it's clear the rest exist and can be requested. Never silently drop them.
   - If the queue is empty, don't ask at all — report the empty queue and stop.

   The human can always pick "Other" and name a different MR from the printed
   list; treat that as a valid selection and resolve it from `picks`.

Once an MR is chosen, the point is to build the human's understanding *before*
they open the review pane. Work through stages 4–8 in order and let them read
each one — the pane is where they write comments, so they should arrive already
knowing what the change does and where the risks are.

4. **Show the MR description, focused on why and how.**

   ```bash
   glab mr view <iid> --repo <project> --comments
   ```

   Don't paste the raw template back — these descriptions carry boilerplate
   headings, checklists, and Loom links. Pull out the two things that matter:
   the **why** (the problem or motivation) and the **how** (the approach taken).
   Note feature flags, migrations, and permissions explicitly; they decide how
   risky a change is. If existing review threads are already on the MR, mention
   what previous reviewers raised so the human doesn't re-litigate settled points.

5. **Fetch the Linear ticket if one is linked.** MRs reference tickets as a bare
   ID (`EOROB-4349`), as a `linear.app/remote/issue/<ID>` URL, or in the branch
   name — scan the description, title, and branch for all three. The ticket
   usually holds the *product* reason the MR doesn't restate.

   Read it with the Linear MCP tools (`mcp__Linear__get_issue` or the
   `mcp__claude_ai_Linear__*` equivalent). If Linear isn't authenticated in this
   session, say so in one line and carry on — a missing ticket makes the summary
   thinner, never wrong. Never stall the flow waiting on it, and don't invent
   context you couldn't read.

6. **Read the code and explain it.** Get the diff without needing a checkout:

   ```bash
   glab mr diff <iid> --repo <project>
   ```

   Then explain what the code actually *does* — not a file-by-file restatement of
   the diff, which the human can already see. Lead with the shape of the change
   (the new module, the migration, the changed control flow), then walk the
   important paths in the order a reader needs them. Call out what is genuinely
   new behaviour versus mechanical churn like CODEOWNERS entries or generated
   files, since a large diff is often mostly the latter. If something in the diff
   only makes sense with surrounding context, read that file from the checkout in
   stage 7 rather than guessing.

   End this stage by pausing for the human to say they understand. They asked to
   understand the change *before* seeing findings, and jumping straight to
   problems robs them of forming their own opinion first.

7. **Pick a worktree, then check the MR out into it.** The reviewer in stage 8
   reads real files and runs `git diff` over a SHA range, so it needs a checkout.
   The pool is `~/dev/remote/employ_workspace/<project>-worktrees/work-n`:

   ```bash
   python3 ~/.claude/skills/review-queue/scripts/list_worktrees.py <tiger|dragon>
   ```

   Offer only the **free** ones via `AskUserQuestion`, and list the busy ones with
   the reason they're excluded so the exclusion is visible rather than silent. A
   worktree counts as free when it's clean *and* sitting on its own `work-n`
   branch — that's the local staging branch, so anything else (a feature branch, a
   dirty tree, a detached HEAD from an earlier review) means state worth
   preserving until the human says otherwise.

   If nothing is free, say so and ask rather than picking anyway — every
   alternative involves disturbing something the human owns.

   Check out detached from the MR's head ref, which never creates or moves a
   local branch and so can't collide with a feature branch:

   ```bash
   git -C <worktree> fetch origin "merge-requests/<iid>/head"
   git -C <worktree> checkout --detach FETCH_HEAD
   ```

   Leave the worktree detached when you're done. Don't switch it back or clean it
   up on your own initiative — the human may still be reading it, and moving a
   checkout under them is worse than leaving one parked.

8. **Get findings via `Skill(superpowers:requesting-code-review)`.** It dispatches
   a reviewer subagent over a SHA range and returns findings to you — it never
   touches the forge, which is what makes it the right fit here.

   Fill its template placeholders from what the earlier stages already produced:

   - **`BASE_SHA` / `HEAD_SHA`** — take these from the MR's own `diff_refs`, not
     from local branch guesses, so the range matches what GitLab shows as the MR:

     ```bash
     glab api "projects/<url-encoded project>/merge_requests/<iid>" \
       | python3 -c "import json,sys; r=json.load(sys.stdin)['diff_refs']; print(r['base_sha'], r['head_sha'])"
     ```

     `base_sha` is GitLab's merge-base, so the range covers the MR's own commits
     without dragging in unrelated target-branch drift.
   - **`DESCRIPTION`** — your stage 6 explanation of what the code does.
   - **`PLAN_OR_REQUIREMENTS`** — the why/how from stage 4 plus the Linear ticket
     from stage 5. This is the part a generic reviewer can't infer: it's what lets
     the reviewer judge the change against its *intent* rather than just its
     internal consistency.

   Dispatch the subagent from the worktree chosen in stage 7 so it can read files
   and run `git diff <base>..<head>`. Its prompt already forbids mutating the
   checkout, which is what keeps a borrowed worktree safe.

   Report what comes back — Strengths, then Critical / Important / Minor with
   file:line, then the verdict. Keep the reviewer's severity labels rather than
   re-grading them, and pass along its "ready to merge?" call as the reviewer's
   opinion, not yours. The human decides.

   Nothing here posts to GitLab. Say so plainly, and say it clearly too when the
   reviewer finds nothing — a clean result is real information, not a failure.

9. **Hand off to `Skill(herdr-review)`.** That skill owns the review pane, so
   don't open tuicr yourself — pass it the chosen MR's `web_url` from `picks` and
   let it drive its GitLab merge request flow.

   Pass the **`web_url`**, not the bare `iid`: a bare number is only meaningful
   relative to a repo, and the URL identifies the MR unambiguously. `tuicr`
   resolves an MR from the URL alone, with no clone needed.

   Two things not to do, both because the human owns the verdict: don't write
   review comments yourself, and don't submit anything to the MR. `herdr-review`
   already enforces this — the human presses `:submit` inside tuicr if they
   choose to post.

## How the sections are defined

The four buckets overlap in reality — a draft can be approved by someone else,
and I may have already reviewed a draft. So each MR lands in **exactly one**
section, first match wins, in this order:

| # | Section | Condition |
|---|---|---|
| 1 | Review requested, not reviewed by anyone | none of the below |
| 2 | Already approved by someone else | someone other than me is in `approvedBy` |
| 3 | Draft MRs awaiting my approval | MR is a draft |
| 4 | Already reviewed by me | my `reviewState` is `REVIEWED`, `APPROVED`, or `REQUESTED_CHANGES` |

Read the table bottom-up to see the precedence: my own verdict is the most
specific fact about an MR, so it wins; then draft status; then whether anyone
else has approved. This keeps section 1 an honest "nobody has touched this"
list instead of quietly including MRs I already handled.

Section 4 mirrors GitLab's dashboard *Reviewed* tab, which keys off the same
per-reviewer `reviewState`. `REVIEW_STARTED` deliberately does **not** count as
reviewed — a review I opened but never submitted still needs me, so it stays in
section 1.

## Notes

- `rtk` rewrites bare `glab` and swallows flags like `--raw-field`, silently
  turning a GraphQL query into a full schema-introspection dump. The script
  already routes through `rtk proxy glab` for this reason; keep that if you edit
  it.
- If the script exits with an auth error, `glab auth status` is the thing to
  check — the skill has no token handling of its own.
- `glab mr view` and `glab mr diff` both work from anywhere with `--repo
  <project>`, and `tuicr` resolves an MR from its URL with no checkout present
  (both verified from a non-git directory). So stages 4–6 and 9 need no clone —
  only the stage 8 reviewer does, because it reads files and diffs a SHA range.
  Don't add clone resolution to the earlier stages.
- Two review tools were tried and rejected for stage 8, both because they post to
  the forge: the official `/code-review` command is GitHub-only (`gh pr diff`,
  `gh pr view`) and comments on a PR, and `mr-review` ends by posting inline
  `DiffNote`s plus a Claude-credited summary to the MR.
  `superpowers:requesting-code-review` reports back to the caller instead, which
  is why it's the one wired in.
- The worktree pool lives under `~/dev/remote/employ_workspace/`, not
  `~/dev/remote/<project>`. The top-level `~/dev/remote/tiger` is a different
  checkout whose `origin` may point elsewhere entirely.
- This skill lives in the dotfiles repo at `claude/skills/review-queue/` and is
  deployed by copy via `claude/install-skills.sh`. Edit it there and re-run that
  script; editing `~/.claude/skills/review-queue/` directly gets overwritten.
