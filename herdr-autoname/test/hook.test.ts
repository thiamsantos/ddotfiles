// herdr-autoname/test/hook.test.ts
import { test, expect } from "bun:test";
import { pickTabPane, tabPosition } from "../src/hook";

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

// Real observed snap.tabs shapes: tab.number is a persistent id with gaps
// (tabs closed earlier leave holes), NOT the visual position. snap.tabs
// arrives grouped by workspace and already in ascending display order.
const dotfilesTabs = [
  { tab_id: "w2:t2", workspace_id: "w2", number: 2 },
  { tab_id: "w2:t5", workspace_id: "w2", number: 5 },
];
const work1Tabs = [
  { tab_id: "w1:t1", workspace_id: "w1", number: 1 },
  { tab_id: "w1:t3", workspace_id: "w1", number: 3 },
  { tab_id: "w1:t4", workspace_id: "w1", number: 4 },
  { tab_id: "w1:t6", workspace_id: "w1", number: 6 },
  { tab_id: "w1:t7", workspace_id: "w1", number: 7 },
];
const work3Tabs = [
  { tab_id: "w3:t2", workspace_id: "w3", number: 2 },
  { tab_id: "w3:t3", workspace_id: "w3", number: 3 },
];

test("dotfiles workspace: first tab is position 1, not tab.number 2", () => {
  expect(tabPosition(dotfilesTabs, "w2:t2")).toBe(1);
});

test("dotfiles workspace: second tab is position 2, not tab.number 5", () => {
  expect(tabPosition(dotfilesTabs, "w2:t5")).toBe(2);
});

test("work-1 workspace: five gapped tab.numbers (1,3,4,6,7) yield positions 1..5", () => {
  expect(tabPosition(work1Tabs, "w1:t1")).toBe(1);
  expect(tabPosition(work1Tabs, "w1:t3")).toBe(2);
  expect(tabPosition(work1Tabs, "w1:t4")).toBe(3);
  expect(tabPosition(work1Tabs, "w1:t6")).toBe(4);
  expect(tabPosition(work1Tabs, "w1:t7")).toBe(5);
});

test("tabs from other workspaces present in the same array do not affect the count", () => {
  const all = [...dotfilesTabs, ...work1Tabs, ...work3Tabs];
  expect(tabPosition(all, "w2:t2")).toBe(1);
  expect(tabPosition(all, "w2:t5")).toBe(2);
  expect(tabPosition(all, "w3:t2")).toBe(1);
  expect(tabPosition(all, "w3:t3")).toBe(2);
  expect(tabPosition(all, "w1:t7")).toBe(5);
});

test("two-digit tab ids are ordered by array position, not lexicographically (t10 before t3 regression)", () => {
  // A naive string sort on tab_id would put "w1:t10" before "w1:t3" (lexicographic:
  // "1" < "3"), which is wrong — herdr's own snapshot order (t3 opened before t10)
  // is what must be preserved.
  const tabs = [
    { tab_id: "w1:t3", workspace_id: "w1", number: 3 },
    { tab_id: "w1:t10", workspace_id: "w1", number: 10 },
  ];
  expect(tabPosition(tabs, "w1:t3")).toBe(1);
  expect(tabPosition(tabs, "w1:t10")).toBe(2);
});

test("returns 0 (skip, don't emit '[0]') when the tab is not found", () => {
  expect(tabPosition(work1Tabs, "w1:t99")).toBe(0);
  expect(tabPosition([], "w1:t1")).toBe(0);
});
