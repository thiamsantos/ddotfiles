#!/usr/bin/env python3
"""List the work-n worktrees for a project and say which are free.

Reviewing an MR needs a real checkout, and these worktrees are the pool. A
worktree is only safe to borrow when it holds no work of its own: per the
workspace convention, `work-n` is a local staging branch and all real work
happens on a feature branch, so sitting on its own `work-n` branch means idle.
A dirty tree means uncommitted work regardless of branch, so it's never free.

Usage: list_worktrees.py <tiger|dragon> [--workspace DIR]
Prints JSON: {"project": ..., "worktrees": [{name, path, branch, dirty, free, reason}]}
"""

import argparse
import json
import os
import re
import subprocess
import sys

DEFAULT_WORKSPACE = "~/dev/remote/employ_workspace"


def git(path, *args):
    proc = subprocess.run(
        ["git", "-C", path, *args], capture_output=True, text=True,
    )
    return proc.stdout.strip() if proc.returncode == 0 else None


def describe(path):
    name = os.path.basename(path)
    branch = git(path, "branch", "--show-current")
    status = git(path, "status", "--porcelain")
    dirty = len([ln for ln in (status or "").splitlines() if ln.strip()])

    # `work-3` checked out in the worktree named `work-3` = its idle staging
    # branch. Anything else is a feature branch someone is working on.
    on_own_branch = branch == name

    if dirty:
        free, reason = False, f"{dirty} uncommitted change(s)"
    elif not branch:
        free, reason = False, "detached HEAD"
    elif not on_own_branch:
        free, reason = False, f"on feature branch {branch}"
    else:
        free, reason = True, "idle on its staging branch"

    return {
        "name": name, "path": path, "branch": branch,
        "dirty": dirty, "free": free, "reason": reason,
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("project", help="tiger or dragon")
    ap.add_argument("--workspace", default=DEFAULT_WORKSPACE)
    args = ap.parse_args()

    root = os.path.join(
        os.path.expanduser(args.workspace), f"{args.project}-worktrees"
    )
    if not os.path.isdir(root):
        sys.exit(f"No worktree pool at {root}")

    def order(name):
        m = re.search(r"(\d+)$", name)
        return (int(m.group(1)) if m else 0, name)

    entries = [
        describe(os.path.join(root, n))
        for n in sorted(os.listdir(root), key=order)
        if os.path.isdir(os.path.join(root, n, ".git")) or os.path.exists(os.path.join(root, n, ".git"))
    ]

    print(json.dumps({"project": args.project, "worktrees": entries}, indent=2))


if __name__ == "__main__":
    main()
