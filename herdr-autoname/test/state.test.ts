import { test, expect } from "bun:test";
import { mkdtempSync, existsSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { stateFile, readEntry, writeEntry, shouldRename } from "../src/state";

function isolate() {
  const dir = mkdtempSync(join(tmpdir(), "autoname-state-"));
  process.env.HERDR_PLUGIN_STATE_DIR = dir;
  return dir;
}

test("state filename sanitizes colons", () => {
  isolate();
  expect(stateFile("w1:p6").endsWith("w1-p6.json")).toBe(true);
  expect(stateFile("w1").endsWith("w1.json")).toBe(true);
});

test("round-trips an entry", () => {
  isolate();
  const e = { branch: "eorob-1604-au", title: "Keep same behavior", applied: "work-1 - au jsfoptions schema", lastGoodWords: "au jsfoptions schema" };
  writeEntry("w1:p6", e);
  expect(readEntry("w1:p6")).toEqual(e);
  expect(existsSync(stateFile("w1:p6"))).toBe(true);
});

test("missing or corrupt state reads as null", () => {
  isolate();
  expect(readEntry("nope")).toBeNull();
  writeFileSync(stateFile("bad"), "{ not json");
  expect(readEntry("bad")).toBeNull();
});

test("first naming acts", () => {
  expect(shouldRename(null, "b", "t", "work-1").act).toBe(true);
});

test("unchanged inputs with our own label is skipped", () => {
  const prev = { branch: "b", title: "t", applied: "work-1 - au jsfoptions schema", lastGoodWords: "au jsfoptions schema" };
  const d = shouldRename(prev, "b", "t", "work-1 - au jsfoptions schema");
  expect(d.act).toBe(false);
  expect(d.reason).toBe("unchanged");
});

test("manual rename is respected while inputs are unchanged", () => {
  const prev = { branch: "b", title: "t", applied: "work-1 - au jsfoptions schema", lastGoodWords: "au jsfoptions schema" };
  const d = shouldRename(prev, "b", "t", "URGENT hotfix");
  expect(d.act).toBe(false);
  expect(d.reason).toBe("manual");
});

test("changed branch resumes autoname even after a manual rename", () => {
  const prev = { branch: "b", title: "t", applied: "work-1 - au jsfoptions schema", lastGoodWords: "au jsfoptions schema" };
  expect(shouldRename(prev, "NEW-branch", "t", "URGENT hotfix").act).toBe(true);
});

test("changed title acts", () => {
  const prev = { branch: "b", title: "t", applied: "x", lastGoodWords: "w" };
  expect(shouldRename(prev, "b", "NEW title", "x").act).toBe(true);
});
