import { test, expect } from "bun:test";
import { unwrap, mapForegroundProcesses } from "../src/herdr";

test("unwrap returns the result payload", () => {
  const ok = JSON.stringify({ id: "cli:pane:process_info", result: { process_info: { pane_id: "w1:p4" } } });
  expect(unwrap(ok).process_info.pane_id).toBe("w1:p4");
});

test("unwrap returns null on an error body despite exit code 0", () => {
  // Real observed response: herdr exits 0 and reports the error in the body.
  const err = JSON.stringify({ error: { code: "pane_not_found", message: "pane not found" }, id: "cli:pane:process_info" });
  expect(unwrap(err)).toBeNull();
});

test("unwrap returns null on unparseable output", () => {
  expect(unwrap("")).toBeNull();
  expect(unwrap("not json")).toBeNull();
});

test("mapForegroundProcesses preserves the full ordered process list", () => {
  // Realistic w1:p8 payload: turbo wraps node wraps the real command, pnpm.
  const result = {
    process_info: {
      foreground_processes: [
        { argv0: "turbo", name: "turbo" },
        { argv0: "node", name: "node" },
        { argv0: "pnpm", name: "pnpm" },
      ],
      pane_id: "w1:p8",
    },
  };
  expect(mapForegroundProcesses(result)).toEqual([
    { argv0: "turbo", name: "turbo" },
    { argv0: "node", name: "node" },
    { argv0: "pnpm", name: "pnpm" },
  ]);
});

test("mapForegroundProcesses returns [] on an error body", () => {
  expect(mapForegroundProcesses(null)).toEqual([]);
});

test("mapForegroundProcesses returns [] on malformed/missing data", () => {
  expect(mapForegroundProcesses({})).toEqual([]);
  expect(mapForegroundProcesses({ process_info: {} })).toEqual([]);
  expect(mapForegroundProcesses({ process_info: { foreground_processes: "nope" } })).toEqual([]);
});
