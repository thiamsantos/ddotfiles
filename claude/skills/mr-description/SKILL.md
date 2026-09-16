---
name: mr-description
description: Write or rewrite a GitLab MR description using my MR template. Use to write, draft, improve, or fill an MR description in any repo.
---
# MR Description

Write descriptions a reviewer reads top-to-bottom in under a minute: outcome first, then technical points that need attention.

Always use `references/template.md` for every repo (sections: Summary, Why, What changed + Screenshots, Related Resources). Follow its per-section word limits. Do not branch on the repo or invent other headings.

This skill produces only the description text and, on explicit confirmation, writes it to an existing MR. Never post comments, never assign reviewers, never run `glab mr update` before the user says yes.

## Limits and style

- Total body ≤200 words. Per-section limits live in the template comments. Exceeding a limit means cut, not compress into run-ons. If over, the diff is too large — say so, don't pad.
- Technical English (ASD-STE100): precise nouns, active voice, one term per meaning, short sentences. No hedging or filler ("basically", "just", "in order to", "various").
- Bullets: verb-first fragments, drop articles/pronouns where meaning survives ("Moves lock earlier", not "This moves the lock earlier"). Prefer identifiers over prose (`cache.go`, `acquireLock()`, `200ms`).
- **Summary**: plain language for a reader outside the code area (PM, support). No module names. If purely technical, say so; don't force a product framing.
- **Why**: why this approach over alternatives — the part the diff cannot show.
- **What changed**: decisions, trade-offs, files needing closest look. Not the whole diff.

## Workflow

1. **Context**:
   ```bash
   git rev-parse --abbrev-ref HEAD    # branch = Linear ticket id
   git diff master...HEAD --stat      # files touched
   glab mr view 2>/dev/null || echo "NO_MR"
   ```
   MR exists → rewrite its description. `NO_MR` → draft fresh; print for the repo's MR skill.
2. **Why from Linear**: extract the ticket id from the branch (`abc-123-...` → `ABC-123`), fetch with `mcp__Linear__get_issue`, write an outcome-focused Why, link it. No id → write from the diff; don't block.
3. **Write** Summary, Why, What changed into the template. Fill the `## What changed` details block.
4. **Related Resources**: Linear ticket (always, if any), Slack threads, related MRs.
5. **Screenshots**: keep the block for UI changes and say which to attach (you can't produce them); delete it otherwise.
6. **Plain language**: run `Skill(plain-language-writing)` over the prose. Required. Apply edits, then deliver.
7. **Deliver**: print the body; batch one question for what you can't infer (flag name, paired MR, screenshots, Slack thread) — never what the diff answers. If an MR exists, ask **"Update MR !<n> now?"** Only on explicit yes:
   ```bash
   glab mr update <n> --description "$(cat <body-file>)"   # body to temp file first
   ```

## Example (flaky-test fix)

```markdown
## Summary

Makes the `checkout` CI test deterministic.

## Why

Test asserted a timing-dependent outcome, so it failed at random and blocked
unrelated merges. [ABC-123](https://linear.app/acme/issue/ABC-123).

## What changed

<details>
  <summary>Toggle details</summary>

- Drops job `conflict?` assertion on time-based bucket.
- Asserts job state only.
- Flake source: wall-clock bucket rollover near boundary.
- See `checkout_worker_test` setup.
</details>

## Related Resources

- [ABC-123](https://linear.app/acme/issue/ABC-123)
```
