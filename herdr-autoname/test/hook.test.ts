import { test, expect } from "bun:test";
import { tabAgent } from "../src/hook";

const agents = [
  { pane_id: "w1:pC", tab_id: "w1:t2" },
  { pane_id: "w1:p5", tab_id: "w1:t2" },
  { pane_id: "w1:p9", tab_id: "w1:t3" },
];

test("a tab with two agents is always named after the same one", () => {
  expect(tabAgent(agents, "w1:t2")?.pane_id).toBe("w1:p5");
  expect(tabAgent([...agents].reverse(), "w1:t2")?.pane_id).toBe("w1:p5");
});

test("agents in other tabs are ignored", () => {
  expect(tabAgent(agents, "w1:t3")?.pane_id).toBe("w1:p9");
});

test("a tab with no agent has no owner", () => {
  expect(tabAgent(agents, "w1:t9")).toBeNull();
});
