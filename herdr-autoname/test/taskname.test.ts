// herdr-autoname/test/taskname.test.ts
import { test, expect } from "bun:test";
import { parseWords, agentLabel, agentSlug, hyphenate } from "../src/taskname";

test("strips both N: and N. index prefixes", () => {
  expect(parseWords("1: au jsfopts")).toBe("au jsfopts");
  expect(parseWords("1. au jsfopts")).toBe("au jsfopts");
  expect(parseWords("au jsfopts")).toBe("au jsfopts");
});

test("hard-truncates to three words", () => {
  // Never trust the model's arity.
  expect(parseWords("au jsfopts migrate")).toBe("au jsfopts migrate");
  expect(parseWords("jsfoptions json schema migration")).toBe("jsfoptions json schema");
});

test("lowercases, strips punctuation, collapses whitespace", () => {
  expect(parseWords("AU  JSFOpts!")).toBe("au jsfopts");
  expect(parseWords("exjsflow prod.")).toBe("exjsflow prod");
});

test("keeps internal hyphens", () => {
  expect(parseWords("herdr auto-rename")).toBe("herdr auto-rename");
});

test("uses the first non-empty line and ignores noise", () => {
  expect(parseWords("\n\n1: nl jsfopts\n2: something else")).toBe("nl jsfopts");
});

test("returns empty string for unusable replies", () => {
  expect(parseWords("")).toBe("");
  expect(parseWords("   \n  ")).toBe("");
  expect(parseWords("!!! ???")).toBe("");
});

test("agent label is the bare words", () => {
  expect(agentLabel("au jsfopts", false)).toBe("au jsfopts");
});

test("stale marker appends ellipsis, keeping last good words", () => {
  expect(agentLabel("au jsfopts", true)).toBe("au jsfopts …");
});

test("stale with no prior words yields a bare marker", () => {
  expect(agentLabel("", true)).toBe("…");
});

test("agentSlug turns space-separated words into a valid herdr agent name", () => {
  expect(agentSlug("au jsfopts")).toBe("au-jsfopts");
});

test("agentSlug lowercases and strips punctuation before slugging", () => {
  expect(agentSlug("Au  JSFOpts!")).toBe("au-jsfopts");
});

test("agentSlug drops the stale ellipsis marker without leaking it", () => {
  // Real caller: agentSlug(agentLabel(words, stale)).
  expect(agentSlug(agentLabel("au jsfopts", true))).toBe("au-jsfopts");
});

test("agentSlug on a bare stale marker (no prior words) yields empty — caller must skip the rename", () => {
  expect(agentSlug(agentLabel("", true))).toBe("");
});

test("agentSlug prefixes a leading non-letter so the name starts with a lowercase letter", () => {
  expect(agentSlug("123 numeric start")).toBe("a-123-numeric-start");
});

test("agentSlug truncates to 32 characters without a trailing hyphen", () => {
  const slug = agentSlug("a".repeat(40) + " b");
  expect(slug.length).toBeLessThanOrEqual(32);
  expect(slug.endsWith("-")).toBe(false);
  expect(slug.startsWith("a")).toBe(true);

  const boundary = agentSlug("ab".repeat(15) + " x"); // slice(0,32) lands on a hyphen
  expect(boundary.length).toBeLessThanOrEqual(32);
  expect(boundary.endsWith("-")).toBe(false);
});

test("agentSlug returns empty string for unusable input", () => {
  expect(agentSlug("")).toBe("");
  expect(agentSlug("   ")).toBe("");
  expect(agentSlug("!!! ???")).toBe("");
});

test("agentSlug on a leading-digit multi-word input prefixes a lowercase letter", () => {
  expect(agentSlug("9lead words here")).toBe("a-9lead-words-here");
});

test("hyphenate turns space-separated words into hyphen-joined words", () => {
  expect(hyphenate("au jsfopts")).toBe("au-jsfopts");
  expect(hyphenate("nl jsfopts")).toBe("nl-jsfopts");
});

test("hyphenate lowercases, strips punctuation, and collapses whitespace/hyphen runs", () => {
  expect(hyphenate("Au  JSFOpts!")).toBe("au-jsfopts");
  expect(hyphenate("a   --  b")).toBe("a-b");
});

test("hyphenate drops the stale ellipsis marker without leaking it", () => {
  expect(hyphenate(agentLabel("au jsfopts", true))).toBe("au-jsfopts");
});

test("hyphenate has no length cap and no leading-letter rule (unlike agentSlug)", () => {
  // Workspace labels have no herdr-imposed format constraint, unlike agent names.
  expect(hyphenate("123 numeric start")).toBe("123-numeric-start");
  expect(hyphenate("a".repeat(40) + " b")).toBe(`${"a".repeat(40)}-b`);
});

test("hyphenate returns empty string for unusable input", () => {
  expect(hyphenate("")).toBe("");
  expect(hyphenate("   ")).toBe("");
  expect(hyphenate("!!! ???")).toBe("");
});

test("agentSlug is hyphenate plus the agent-only length/leading-letter rules", () => {
  // Same inputs, same outputs as before the shared-helper refactor.
  expect(agentSlug("au jsfopts")).toBe(hyphenate("au jsfopts"));
  expect(agentSlug("123 numeric start")).not.toBe(hyphenate("123 numeric start"));
});

test("stale marker is hyphenated words + space + bare ellipsis", () => {
  expect(agentLabel(hyphenate("au jsfopts"), true)).toBe("au-jsfopts …");
});
