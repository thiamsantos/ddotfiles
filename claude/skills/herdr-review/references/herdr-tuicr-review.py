#!/usr/bin/env python3
"""Open tuicr in a half-width herdr split, block until closed, print the session.

Python port of the fish function `herdr-tuicr-review` and its companion helper
`herdr-tuicr-resolve-session.py`. Behaviour is identical to the fish original:

  1. Parse `[--cwd DIR] -- <tuicr args...>`.
  2. Guard: must run inside a herdr session, with `herdr` and `tuicr` on PATH.
  3. Snapshot existing session slugs so a newly-created one can be spotted.
  4. Split a half-width herdr pane to the right and capture its pane id.
  5. Run tuicr in that pane and block on a FIFO until tuicr exits.
  6. Always close the pane and remove the FIFO.
  7. Resolve the session for this launch and print, on stdout:
       TUICR_SESSION=<slug>
       TUICR_SESSION_JSON=<absolute path to the session .json>
     or a "could not resolve" message on stderr.

Usage:
  herdr-tuicr-review.py [--cwd DIR] -- <tuicr args...>
"""

import json
import os
import re
import shlex
import subprocess
import sys
import tempfile


def err(msg: str) -> None:
    print(msg, file=sys.stderr)


def parse_args(argv):
    """Return (cwd, tuicr_args) from `[--cwd DIR] -- <tuicr args...>`."""
    cwd = os.getcwd()
    rest = list(argv)
    if rest and rest[0] == "--cwd":
        if len(rest) < 2:
            err("herdr-tuicr-review: --cwd needs a directory argument")
            sys.exit(1)
        cwd = rest[1]
        rest = rest[2:]
    if rest and rest[0] == "--":
        rest = rest[1:]
    return cwd, rest


def which(name: str) -> bool:
    from shutil import which as _which
    return _which(name) is not None


def list_sessions():
    """Return the parsed `tuicr review list --all` JSON list, or []."""
    try:
        out = subprocess.run(
            ["tuicr", "review", "list", "--all"],
            capture_output=True, text=True,
        ).stdout
        data = json.loads(out)
        return data if isinstance(data, list) else []
    except Exception:
        return []


def snapshot_slugs():
    return {r.get("slug", "") for r in list_sessions() if r.get("slug", "")}


def resolve_session(args_joined: str, before: set):
    """Return (slug, path) for the launch, or None.

    Faithful port of herdr-tuicr-resolve-session.py.
    """
    rows = list_sessions()
    if not rows:
        return None

    def pick(r):
        return r.get("slug", ""), r.get("path", "")

    # Flow 3 (mr/pr): prefer a pr-kind row; match the MR number if present.
    if re.search(r"\bmr\b|\bpr\b", args_joined):
        prs = [r for r in rows if r.get("kind") == "pr"]
        num = re.search(r"(\d+)", args_joined)
        if num:
            prs = [r for r in prs if num.group(1) in r.get("slug", "")] or prs
        if prs:
            prs.sort(key=lambda r: r.get("updated_at", ""), reverse=True)
            return pick(prs[0])

    # Flow 1 (--file): tuicr keys a file review to the file's PARENT DIRECTORY,
    # with a slug of the form "<parentdir-basename>@~file/...". Match that marker
    # and the parent-dir basename — the filename does NOT appear in the slug.
    fm = re.search(r"--file(?:=|\s+)(\S+)", args_joined)
    if fm:
        fpath = fm.group(1).strip("'\"")
        parent_base = os.path.basename(os.path.dirname(os.path.realpath(fpath)))
        cand = [
            r for r in rows
            if r.get("kind") == "local" and "@~file" in r.get("slug", "")
            and r.get("slug", "").split("@~file", 1)[0] == parent_base
        ]
        fresh = [r for r in cand if r.get("slug", "") not in before]
        pool = fresh or cand
        if pool:
            pool.sort(key=lambda r: r.get("updated_at", ""), reverse=True)
            return pick(pool[0])

    # Flow 2 (-r / -w / -A) and fallback: prefer a local slug NEW since snapshot,
    # else most-recent local. Exclude @~file sessions — those are Flow 1 (file
    # annotation) and must never be returned for a branch/diff review.
    locals_ = [
        r for r in rows
        if r.get("kind") == "local" and "@~file" not in r.get("slug", "")
    ]
    fresh = [r for r in locals_ if r.get("slug", "") not in before]
    pool = fresh or locals_
    if pool:
        pool.sort(key=lambda r: r.get("updated_at", ""), reverse=True)
        return pick(pool[0])
    return None


def herdr_pane_split(cwd: str):
    """Split a half-width pane to the right; return its pane_id or None."""
    try:
        out = subprocess.run(
            ["herdr", "pane", "split", "--direction", "right",
             "--ratio", "0.5", "--no-focus", "--cwd", cwd],
            capture_output=True, text=True,
        ).stdout
        return json.loads(out)["result"]["pane"]["pane_id"]
    except Exception:
        return None


def main(argv) -> int:
    cwd, tuicr_args = parse_args(argv)
    if not tuicr_args:
        err("herdr-tuicr-review: no tuicr arguments given")
        err("usage: herdr-tuicr-review [--cwd DIR] -- <tuicr args...>")
        return 1

    # Guard: must be inside a herdr session.
    if not os.environ.get("HERDR_ENV"):
        err("herdr-tuicr-review: not inside a herdr session. "
            "Start your agent inside herdr and retry.")
        return 1
    if not which("herdr"):
        err("herdr-tuicr-review: herdr not found on PATH.")
        return 1
    if not which("tuicr"):
        err("herdr-tuicr-review: tuicr not found on PATH.")
        return 1

    # Snapshot existing session slugs so we can spot a newly-created one.
    before_slugs = snapshot_slugs()

    # Split a half-width pane to the right; capture the new pane id.
    pane_id = herdr_pane_split(cwd)
    if not pane_id:
        err("herdr-tuicr-review: failed to create herdr pane")
        return 1

    # FIFO so we block until tuicr exits. Always close the pane + remove the fifo.
    fifo = tempfile.mktemp(prefix="herdr-tuicr-fifo.")
    os.mkfifo(fifo)

    def cleanup():
        subprocess.run(["herdr", "pane", "close", pane_id],
                       stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        try:
            os.remove(fifo)
        except OSError:
            pass

    try:
        # Build a single shell command string: run tuicr, then signal done.
        # `herdr pane run` takes the command as ONE arg submitted to the pane's
        # shell, so it must be one string. Shell-escape each arg so paths with
        # spaces survive the pane shell.
        tuicr_cmd = "tuicr " + " ".join(shlex.quote(a) for a in tuicr_args)
        fifo_esc = shlex.quote(fifo)
        subprocess.run(
            ["herdr", "pane", "run", pane_id,
             f"{tuicr_cmd}; echo __TUICR_DONE__ > {fifo_esc}"],
            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
        )

        err("herdr-tuicr-review: tuicr open in a herdr pane. "
            "Review, then press q to close it.")
        err("herdr-tuicr-review: (if it asks to copy to clipboard on quit, "
            "dismiss it — comments are read from the session).")

        # Block until tuicr exits (writes to the fifo).
        with open(fifo, "r") as f:
            f.read()
    finally:
        cleanup()

    # Resolve the session for this launch.
    args_joined = " ".join(tuicr_args)
    resolved = resolve_session(args_joined, before_slugs)
    if resolved:
        slug, path = resolved
        print(f"TUICR_SESSION={slug}")
        print(f"TUICR_SESSION_JSON={path}")
        return 0

    err("herdr-tuicr-review: review complete, but could not resolve the "
        "session slug.")
    err("herdr-tuicr-review: look under "
        "~/Library/Application Support/tuicr/reviews/sessions/ (newest file).")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
