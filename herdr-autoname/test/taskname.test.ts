// herdr-autoname/test/taskname.test.ts
import { test, expect } from "bun:test";
import { parseWords, agentLabel, workspaceLabel, agentSlug } from "../src/taskname";

test("strips both N: and N. index prefixes", () => {
  expect(parseWords("1: au jsfoptions schema")).toBe("au jsfoptions schema");
  expect(parseWords("1. au jsfoptions schema")).toBe("au jsfoptions schema");
  expect(parseWords("au jsfoptions schema")).toBe("au jsfoptions schema");
});

test("hard-truncates to three words", () => {
  // Real observed 4-word reply.
  expect(parseWords("jsfoptions json schema migration")).toBe("jsfoptions json schema");
});

test("lowercases, strips punctuation, collapses whitespace", () => {
  expect(parseWords("AU  JSFOptions,  Schema!")).toBe("au jsfoptions schema");
  expect(parseWords("exjsflow prod rollout.")).toBe("exjsflow prod rollout");
});

test("keeps internal hyphens", () => {
  expect(parseWords("herdr auto-rename tabs")).toBe("herdr auto-rename tabs");
});

test("uses the first non-empty line and ignores noise", () => {
  expect(parseWords("\n\n1: nl jsfoptions schema\n2: something else")).toBe("nl jsfoptions schema");
});

test("returns empty string for unusable replies", () => {
  expect(parseWords("")).toBe("");
  expect(parseWords("   \n  ")).toBe("");
  expect(parseWords("!!! ???")).toBe("");
});

test("agent label is the bare words", () => {
  expect(agentLabel("au jsfoptions schema", false)).toBe("au jsfoptions schema");
});

test("workspace label prefixes the workspace name", () => {
  expect(workspaceLabel("work-1", "au jsfoptions schema", false)).toBe("work-1 - au jsfoptions schema");
});

test("stale marker appends ellipsis, keeping last good words", () => {
  expect(agentLabel("au jsfoptions schema", true)).toBe("au jsfoptions schema …");
  expect(workspaceLabel("work-1", "au jsfoptions schema", true)).toBe("work-1 - au jsfoptions schema …");
});

test("stale with no prior words yields a bare marker", () => {
  expect(agentLabel("", true)).toBe("…");
  expect(workspaceLabel("work-1", "", true)).toBe("work-1 - …");
});

test("agentSlug turns space-separated words into a valid herdr agent name", () => {
  expect(agentSlug("au jsfoptions migrate")).toBe("au-jsfoptions-migrate");
});

test("agentSlug lowercases and strips punctuation before slugging", () => {
  expect(agentSlug("Au  JSFOptions,  Migrate!")).toBe("au-jsfoptions-migrate");
});

test("agentSlug drops the stale ellipsis marker without leaking it", () => {
  // Real caller: agentSlug(agentLabel(words, stale)).
  expect(agentSlug(agentLabel("au jsfoptions migrate", true))).toBe("au-jsfoptions-migrate");
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
