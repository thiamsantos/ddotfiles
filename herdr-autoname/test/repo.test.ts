import { test, expect } from "bun:test";
import { repoToken } from "../src/repo";

test("extracts repo from a -worktrees path", () => {
  expect(repoToken("/Users/t/dev/remote/employ_workspace/tiger-worktrees/work-1")).toBe("tiger");
  expect(repoToken("/Users/t/dev/remote/employ_workspace/dragon-worktrees/work-1")).toBe("dragon");
});

test("falls back to basename for plain repos", () => {
  expect(repoToken("/Users/t/dev/dotfiles")).toBe("dotfiles");
  expect(repoToken("/Users/t/dev/remote/k8s-manifests")).toBe("k8s-manifests");
});

test("handles nested cwd inside a worktree", () => {
  expect(repoToken("/Users/t/dev/remote/employ_workspace/tiger-worktrees/work-2/apps/tiger")).toBe("tiger");
});

test("returns empty string for missing input", () => {
  expect(repoToken(null)).toBe("");
  expect(repoToken(undefined)).toBe("");
  expect(repoToken("")).toBe("");
  expect(repoToken("/")).toBe("");
});
