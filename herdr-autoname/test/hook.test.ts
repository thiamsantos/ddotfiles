// herdr-autoname/test/hook.test.ts
import { test, expect } from "bun:test";
import { pickTabPane } from "../src/hook";

// Real observed shapes from w1:t1 (the user's hand-named "server" tab), which
// spans two repos and exposed the instability this test guards against.
const tigerPane = { pane_id: "w1:p1", focused: false, cwd: "/x/tiger-worktrees/work-1/apps/tiger" };
const dragonPane = { pane_id: "w1:p8", focused: false, cwd: "/x/dragon-worktrees/work-1" };

test("repo token is unaffected by global focus landing on a different tab/workspace", () => {
  const panes = [tigerPane, dragonPane];
  const a = pickTabPane(panes, "w2:p4");
  const b = pickTabPane(panes, "w9:p9");
  expect(a?.pane_id).toBe(b?.pane_id);
  // Stable fallback is the lowest pane_id in this tab, not dependent on which
  // out-of-tab pane happened to be globally focused.
  expect(a?.pane_id).toBe("w1:p1");
});

test("a pane genuinely focused within the tab wins over the lowest-pane_id fallback", () => {
  const panes = [tigerPane, dragonPane];
  expect(pickTabPane(panes, "w1:p8")?.pane_id).toBe("w1:p8");
});

test("the focused: true flag wins over the lowest-pane_id fallback when focusedPaneId misses", () => {
  const panes = [
    { pane_id: "w1:p1", focused: false },
    { pane_id: "w1:p8", focused: true },
  ];
  expect(pickTabPane(panes, "w2:p4")?.pane_id).toBe("w1:p8");
});

test("falls back to the lowest pane_id when nothing is focused at all", () => {
  const panes = [
    { pane_id: "w1:p9", focused: false },
    { pane_id: "w1:p2", focused: false },
  ];
  expect(pickTabPane(panes)?.pane_id).toBe("w1:p2");
});

test("returns null for an empty pane list", () => {
  expect(pickTabPane([])).toBeNull();
});
