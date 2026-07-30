#!/usr/bin/env python3
"""Fetch and classify the GitLab MRs where I'm a requested reviewer.

One GraphQL round-trip gets every field the four sections need, including
`mergeRequestInteraction.reviewState` — the same per-reviewer state GitLab's own
dashboard keys its Reviewed tab off. The REST list endpoint can't do this: it
omits review state and approvals, so classifying would need an extra request per
MR.

Prints JSON on stdout: {"username": ..., "sections": [...], "picks": [...]}.
"""

import argparse
import json
import subprocess
import sys

# Reviewer states meaning "I have given a verdict on this MR". REVIEW_STARTED is
# deliberately excluded: opening a review without submitting it still needs my
# attention, so those stay in the unreviewed bucket.
REVIEWED_STATES = {"REVIEWED", "APPROVED", "REQUESTED_CHANGES"}

QUERY = """
query($after: String) {
  currentUser {
    username
    reviewRequestedMergeRequests(state: opened, first: 100, after: $after) {
      pageInfo { hasNextPage endCursor }
      nodes {
        iid
        title
        draft
        updatedAt
        webUrl
        project { fullPath }
        author { username }
        approvedBy { nodes { username } }
        reviewers {
          nodes {
            username
            mergeRequestInteraction { reviewState reviewed approved }
          }
        }
      }
    }
  }
}
"""

SECTIONS = [
    ("no_review", "Review requested, not reviewed by anyone"),
    ("approved_by_other", "Already approved by someone else"),
    ("draft", "Draft MRs awaiting my approval"),
    ("reviewed_by_me", "Already reviewed by me"),
]


def run_graphql(after=None):
    """Call the GraphQL API through glab so it reuses glab's stored token.

    Routed via `rtk proxy` because the rtk hook rewrites bare `glab` and eats
    flags like --raw-field, which silently turns the query into a full schema
    introspection dump.
    """
    cmd = [
        "rtk", "proxy", "glab", "api", "graphql",
        "--raw-field", f"query={QUERY}",
    ]
    if after:
        cmd += ["--raw-field", f"after={after}"]
    proc = subprocess.run(cmd, capture_output=True, text=True)
    if proc.returncode != 0:
        sys.exit(f"glab GraphQL call failed:\n{proc.stderr.strip()}")
    try:
        payload = json.loads(proc.stdout)
    except json.JSONDecodeError:
        sys.exit(f"Could not parse GraphQL response:\n{proc.stdout[:500]}")
    if payload.get("errors"):
        sys.exit("GraphQL errors: " + json.dumps(payload["errors"]))
    return payload["data"]["currentUser"]


def fetch_all():
    username, nodes, after = None, [], None
    while True:
        user = run_graphql(after)
        username = user["username"]
        conn = user["reviewRequestedMergeRequests"]
        nodes.extend(conn["nodes"])
        page = conn["pageInfo"]
        if not page["hasNextPage"]:
            return username, nodes
        after = page["endCursor"]


def my_state(mr, username):
    for reviewer in mr["reviewers"]["nodes"]:
        if reviewer["username"] == username:
            return reviewer.get("mergeRequestInteraction") or {}
    return {}


def classify(mr, username):
    """Assign one section per MR, first match wins.

    Sections overlap in reality (a draft can be approved by someone else), so
    order encodes priority: my own verdict is the most specific fact, then
    draft status, then whether anyone else has approved. Checking
    reviewed-by-me first keeps section 1 an honest "needs my attention" list.
    """
    state = my_state(mr, username)
    if state.get("reviewState") in REVIEWED_STATES:
        return "reviewed_by_me"
    if mr["draft"]:
        return "draft"
    others = [u["username"] for u in mr["approvedBy"]["nodes"] if u["username"] != username]
    if others:
        return "approved_by_other"
    return "no_review"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--json", action="store_true", help="print raw JSON only")
    args = ap.parse_args()

    username, nodes = fetch_all()

    buckets = {key: [] for key, _ in SECTIONS}
    for mr in nodes:
        state = my_state(mr, username)
        others = [u["username"] for u in mr["approvedBy"]["nodes"] if u["username"] != username]
        buckets[classify(mr, username)].append({
            "iid": mr["iid"],
            "title": mr["title"],
            "project": mr["project"]["fullPath"],
            "author": mr["author"]["username"],
            "updated_at": mr["updatedAt"],
            "web_url": mr["webUrl"],
            "draft": mr["draft"],
            "my_review_state": state.get("reviewState"),
            "approved_by_others": others,
        })

    # Oldest activity first: the MR that has been waiting longest is the one
    # most worth picking up, and stable ordering keeps pick numbers meaningful.
    picks, sections = [], []
    for key, title in SECTIONS:
        items = sorted(buckets[key], key=lambda m: m["updated_at"])
        for item in items:
            picks.append(item)
            item["pick"] = len(picks)
        sections.append({"key": key, "title": title, "items": items})

    print(json.dumps(
        {"username": username, "total": len(nodes), "sections": sections, "picks": picks},
        indent=2,
    ))


if __name__ == "__main__":
    main()
