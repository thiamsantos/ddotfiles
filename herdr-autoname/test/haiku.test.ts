// herdr-autoname/test/haiku.test.ts
import { test, expect } from "bun:test";
import { buildPrompt } from "../src/haiku";

test("prompt includes both signals when the branch is informative", () => {
  const p = buildPrompt("eorob-1604-australia-aus-migrate-jsfoptions-to-json-schema", "Keep same behavior");
  expect(p).toContain("eorob-1604-australia");
  expect(p).toContain("Keep same behavior");
});

test("prompt omits uninformative branches", () => {
  const p = buildPrompt("work-3", "Migrate Netherlands JSFOptions to JSON schema");
  expect(p).not.toContain("work-3");
  expect(p).toContain("Netherlands");
});

test("prompt carries the two load-bearing rules", () => {
  const p = buildPrompt("b-1-x", "t");
  // Without these, readreplica -> "read replica" and exjsflow -> "exjs".
  expect(p).toContain("NEVER split a compound identifier");
  expect(p).toContain("intact");
});

test("prompt asks for at most three lowercase words", () => {
  const p = buildPrompt("b-1-x", "t");
  expect(p).toContain("three");
});
