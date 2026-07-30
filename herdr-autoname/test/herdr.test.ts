import { test, expect } from "bun:test";
import { unwrap } from "../src/herdr";

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
