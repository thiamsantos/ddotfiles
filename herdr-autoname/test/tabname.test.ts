import { test, expect } from "bun:test";
import { tabLabel } from "../src/tabname";

test("repo plus processes joined by slash", () => {
  expect(tabLabel(3, "tiger", ["vim", "claude"])).toBe("[3] tiger vim / claude");
  expect(tabLabel(1, "work-6", ["vim", "claude"])).toBe("[1] work-6 vim / claude");
});

test("repo only when nothing interesting runs", () => {
  expect(tabLabel(4, "dragon", [])).toBe("[4] dragon");
  expect(tabLabel(2, "k8s-manifests", [])).toBe("[2] k8s-manifests");
});

test("single process", () => {
  expect(tabLabel(2, "dotfiles", ["claude"])).toBe("[2] dotfiles claude");
  expect(tabLabel(3, "work-3", ["vim"])).toBe("[3] work-3 vim");
});

test("bare number when repo is unresolvable", () => {
  expect(tabLabel(7, "", [])).toBe("[7]");
  expect(tabLabel(7, "", ["claude"])).toBe("[7] claude");
});
