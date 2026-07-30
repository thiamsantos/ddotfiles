// herdr-autoname/test/haiku.test.ts
import { test, expect } from "bun:test";
import { buildPrompt, claudeArgs, TIMEOUT_MS, nameAndApply } from "../src/haiku";

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

test("claude invocation is isolated from ambient project context", () => {
  const args = claudeArgs("some prompt");
  expect(args).toContain("--system-prompt");
  expect(args).toContain("--setting-sources");
  const settingSourcesIdx = args.indexOf("--setting-sources");
  expect(args[settingSourcesIdx + 1]).toBe("");
  expect(args).toContain("some prompt");
  expect(args[0]).toBe("claude");
  expect(args).toContain("-p");
  expect(args).toContain("--model");
});

test("timeout is raised to accommodate real claude -p latency (median ~23.6s observed)", () => {
  expect(TIMEOUT_MS).toBe(45000);
});

test("nameAndApply is a thin async delegation with the documented signature", () => {
  // nameAndApply resolves via threeWords(branch, title) and is deliberately
  // insensitive to entityId/kind for word generation (Task 9 uses those to
  // apply the result, not to influence naming). Verified without spawning a
  // real LLM call: same-signature check plus the CLI subprocess tests below
  // exercise the actual delegation end-to-end via a stubbed `claude` binary.
  expect(typeof nameAndApply).toBe("function");
  expect(nameAndApply.length).toBe(4);
});

test("CLI entrypoint prints the words and exits 0 on success", async () => {
  const fixtureDir = `${import.meta.dir}/fixtures/claude-ok`;
  const env = { ...process.env, PATH: `${fixtureDir}:${process.env.PATH}` };
  const proc = Bun.spawn(
    ["bun", "run", `${import.meta.dir}/../src/haiku.ts`, "entity1", "agent", "some-branch", "some title"],
    { env, stdout: "pipe", stderr: "pipe" },
  );
  const out = await new Response(proc.stdout).text();
  const code = await proc.exited;
  expect(code).toBe(0);
  expect(out.trim()).toBe("fake three words");
});

test("CLI entrypoint exits 1 when generation yields nothing", async () => {
  const fixtureDir = `${import.meta.dir}/fixtures/claude-empty`;
  const env = { ...process.env, PATH: `${fixtureDir}:${process.env.PATH}` };
  const proc = Bun.spawn(
    ["bun", "run", `${import.meta.dir}/../src/haiku.ts`, "entity1", "agent", "some-branch", "some title"],
    { env, stdout: "pipe", stderr: "pipe" },
  );
  const out = await new Response(proc.stdout).text();
  const code = await proc.exited;
  expect(code).toBe(1);
  expect(out.trim()).toBe("");
});
