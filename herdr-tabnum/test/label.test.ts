import { test, expect } from "bun:test";
import { numberedLabel, renames } from "../src/label";

test("prefixes a plain label", () => {
  expect(numberedLabel("tiger iex", 2)).toBe("[2] tiger iex");
});

test("replaces a stale number in place", () => {
  expect(numberedLabel("[7] tiger", 3)).toBe("[3] tiger");
  expect(numberedLabel("⏳ [7] tiger", 3)).toBe("⏳ [3] tiger");
});

test("replaces herdr's default numeric label", () => {
  expect(numberedLabel("5", 2)).toBe("[2]");
  expect(numberedLabel("", 1)).toBe("[1]");
});

test("numbers tabs per workspace and skips correct labels", () => {
  const tabs = [
    { tab_id: "a:t1", workspace_id: "a", label: "[1] one" },
    { tab_id: "a:t3", workspace_id: "a", label: "[3] two" },
    { tab_id: "b:t2", workspace_id: "b", label: "4" },
  ];
  expect(renames(tabs)).toEqual([
    { tabId: "a:t3", label: "[2] two" },
    { tabId: "b:t2", label: "[1]" },
  ]);
});
