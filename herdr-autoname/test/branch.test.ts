import { test, expect } from "bun:test";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { isInformative, readBranch } from "../src/branch";

test("uninformative branches are rejected as naming input", () => {
  expect(isInformative("main")).toBe(false);
  expect(isInformative("master")).toBe(false);
  expect(isInformative("develop")).toBe(false);
  expect(isInformative("work-3")).toBe(false);
  expect(isInformative("work-12")).toBe(false);
  expect(isInformative("")).toBe(false);
});

test("ticket branches are informative", () => {
  expect(isInformative("eorob-1604-australia-aus-migrate-jsfoptions-to-json-schema")).toBe(true);
  expect(isInformative("iam-512-pow-followup-cleanup")).toBe(true);
});

test("reads branch from a plain .git directory", async () => {
  const root = mkdtempSync(join(tmpdir(), "autoname-"));
  mkdirSync(join(root, ".git"));
  writeFileSync(join(root, ".git", "HEAD"), "ref: refs/heads/eorob-1604-australia\n");
  expect(await readBranch(root)).toBe("eorob-1604-australia");
});

test("reads branch from a nested subdirectory", async () => {
  const root = mkdtempSync(join(tmpdir(), "autoname-"));
  mkdirSync(join(root, ".git"));
  writeFileSync(join(root, ".git", "HEAD"), "ref: refs/heads/feature-x\n");
  const nested = join(root, "apps", "tiger");
  mkdirSync(nested, { recursive: true });
  expect(await readBranch(nested)).toBe("feature-x");
});

test("follows a worktree .git file pointer", async () => {
  const base = mkdtempSync(join(tmpdir(), "autoname-"));
  const gitdir = join(base, "realgit");
  mkdirSync(gitdir, { recursive: true });
  writeFileSync(join(gitdir, "HEAD"), "ref: refs/heads/work-7\n");
  const wt = join(base, "wt");
  mkdirSync(wt);
  writeFileSync(join(wt, ".git"), `gitdir: ${gitdir}\n`);
  expect(await readBranch(wt)).toBe("work-7");
});

test("returns empty string when detached or not a repo", async () => {
  const root = mkdtempSync(join(tmpdir(), "autoname-"));
  expect(await readBranch(root)).toBe("");
  mkdirSync(join(root, ".git"));
  writeFileSync(join(root, ".git", "HEAD"), "9fceb02f1a2b3c4d5e6f\n");
  expect(await readBranch(root)).toBe("");
});
