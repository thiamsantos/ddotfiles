// herdr-autoname/test/procs.test.ts
import { test, expect } from "bun:test";
import { resolveProc, displayProcs } from "../src/procs";

const pane = (o: Partial<Parameters<typeof resolveProc>[0]>) => ({
  paneId: "p", agent: null, procs: [], termTitle: null, ...o,
} as Parameters<typeof resolveProc>[0]);

test("agent field wins over every reported process name", () => {
  // Real observed: claude panes report 2.1.220 / node / caffeinate / beam.smp.
  expect(resolveProc(pane({ agent: "claude", procs: [{ argv0: "claude", name: "2.1.220" }] }))).toBe("claude");
  expect(resolveProc(pane({ agent: "claude", procs: [{ argv0: "caffeinate", name: "caffeinate" }] }))).toBe("claude");
  expect(resolveProc(pane({ agent: "claude", procs: [{ argv0: "chrome-devtools", name: "node" }] }))).toBe("claude");
});

test("prefers argv0 over the self-reported name", () => {
  // w1:p6 — name is Claude's version string, argv0 is the real command.
  expect(resolveProc(pane({ procs: [{ argv0: "claude", name: "2.1.220" }] }))).toBe("claude");
});

test("skips wrapper processes to find the real command", () => {
  // w1:p8 — foreground_processes[0] is turbo, but the command is pnpm.
  expect(resolveProc(pane({ procs: [
    { argv0: "turbo", name: "turbo" },
    { argv0: "node", name: "node" },
    { argv0: "pnpm", name: "pnpm" },
  ] }))).toBe("pnpm");
  // w3:p3 — caffeinate wraps claude.
  expect(resolveProc(pane({ procs: [
    { argv0: "caffeinate", name: "caffeinate" },
    { argv0: "claude", name: "2.1.220" },
  ] }))).toBe("claude");
});

test("falls back to the terminal title for opaque runtimes", () => {
  // w1:p1 — argv0 is the BEAM VM binary; the title holds the real command.
  expect(resolveProc(pane({
    procs: [{ argv0: "beam.smp", name: "beam.smp" }],
    termTitle: "iex -S mix phx.serve ~/d/r/e/t/w/a/tiger",
  }))).toBe("iex");
});

test("keeps the opaque runtime name when there is no usable title", () => {
  expect(resolveProc(pane({ procs: [{ argv0: "beam.smp", name: "beam.smp" }], termTitle: null }))).toBe("beam.smp");
  // Idle shells set the title to a bare path, which yields no command.
  expect(resolveProc(pane({ procs: [{ argv0: "beam.smp", name: "beam.smp" }], termTitle: "~/d/r/e/d/work-1" }))).toBe("beam.smp");
});

test("never mistakes a Claude session summary for a command", () => {
  // Agent titles are prose: "Keep same behavior…", "Migrate Netherlands…".
  // The agent short-circuit must win even when the process looks opaque.
  expect(resolveProc(pane({
    agent: "claude",
    procs: [{ argv0: "beam.smp", name: "beam.smp" }],
    termTitle: "Keep same behavior without freezing",
  }))).toBe("claude");
  expect(resolveProc(pane({
    agent: "claude",
    procs: [{ argv0: "caffeinate", name: "caffeinate" }],
    termTitle: "Migrate Netherlands JSFOptions to JSON schema",
  }))).toBe("claude");
});

test("aliases nvim to vim", () => {
  expect(resolveProc(pane({ procs: [{ argv0: "nvim", name: "nvim" }] }))).toBe("vim");
});

test("drops bare shells including the login-shell dash form", () => {
  expect(resolveProc(pane({ procs: [{ argv0: "-fish", name: "fish" }] }))).toBeNull();
  expect(resolveProc(pane({ procs: [{ argv0: "fish", name: "fish" }] }))).toBeNull();
  expect(resolveProc(pane({ procs: [{ argv0: "zsh", name: "zsh" }] }))).toBeNull();
  expect(resolveProc(pane({ procs: [] }))).toBeNull();
});

test("strips absolute paths from argv0", () => {
  expect(resolveProc(pane({ procs: [{ argv0: "/opt/homebrew/bin/htop", name: "htop" }] }))).toBe("htop");
});

test("displayProcs preserves order, drops nulls, dedupes", () => {
  expect(displayProcs([
    pane({ paneId: "w1:p3", procs: [{ argv0: "nvim", name: "nvim" }] }),
    pane({ paneId: "w1:p6", agent: "claude", procs: [{ argv0: "claude", name: "2.1.220" }] }),
  ])).toEqual(["vim", "claude"]);

  expect(displayProcs([
    pane({ paneId: "a", procs: [{ argv0: "nvim", name: "nvim" }] }),
    pane({ paneId: "b", procs: [{ argv0: "nvim", name: "nvim" }] }),
    pane({ paneId: "c", procs: [{ argv0: "-fish", name: "fish" }] }),
  ])).toEqual(["vim"]);
});
