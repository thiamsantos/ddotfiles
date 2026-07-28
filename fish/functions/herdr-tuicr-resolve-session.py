#!/usr/bin/env python3
"""Resolve the tuicr session for a herdr-tuicr-review launch.
Reads `tuicr review list --all` JSON on stdin. Args:
  argv[1] = space-joined tuicr args (to detect flow + mr number)
  argv[2] = newline-joined slugs that existed BEFORE launch (may be empty)
Prints TUICR_SESSION=<slug> and TUICR_SESSION_JSON=<path>, or nothing.
"""
import sys, json, re

def main():
    args = sys.argv[1] if len(sys.argv) > 1 else ""
    before = set(filter(None, (sys.argv[2] if len(sys.argv) > 2 else "").splitlines()))
    try:
        rows = json.load(sys.stdin)
    except Exception:
        return 1
    if not isinstance(rows, list):
        return 1

    def emit(r):
        print("TUICR_SESSION=" + r.get("slug", ""))
        print("TUICR_SESSION_JSON=" + r.get("path", ""))
        return 0

    # Flow 3 (mr/pr): prefer a pr-kind row; match the MR number if present.
    if re.search(r"\bmr\b|\bpr\b", args):
        prs = [r for r in rows if r.get("kind") == "pr"]
        num = re.search(r"(\d+)", args)
        if num:
            prs = [r for r in prs if num.group(1) in r.get("slug", "")] or prs
        if prs:
            prs.sort(key=lambda r: r.get("updated_at", ""), reverse=True)
            return emit(prs[0])

    # Flow 1 (--file): tuicr keys a file review to the file's PARENT DIRECTORY,
    # with a slug of the form "<parentdir-basename>@~file/...". Match that marker
    # and the parent-dir basename — the filename does NOT appear in the slug.
    fm = re.search(r"--file(?:=|\s+)(\S+)", args)
    if fm:
        import os
        fpath = fm.group(1).strip("'\"")
        parent_base = os.path.basename(os.path.dirname(os.path.realpath(fpath)))
        cand = [
            r for r in rows
            if r.get("kind") == "local" and "@~file" in r.get("slug", "")
            and r.get("slug", "").split("@~file", 1)[0] == parent_base
        ]
        # prefer newly-created/updated since snapshot
        fresh = [r for r in cand if r.get("slug", "") not in before]
        pool = fresh or cand
        if pool:
            pool.sort(key=lambda r: r.get("updated_at", ""), reverse=True)
            return emit(pool[0])

    # Flow 2 (-r / -w / -A) and fallback: prefer a local slug NEW since snapshot, else most-recent local.
    locals_ = [r for r in rows if r.get("kind") == "local"]
    fresh = [r for r in locals_ if r.get("slug", "") not in before]
    pool = fresh or locals_
    if pool:
        pool.sort(key=lambda r: r.get("updated_at", ""), reverse=True)
        return emit(pool[0])
    return 1

if __name__ == "__main__":
    sys.exit(main() or 0)
