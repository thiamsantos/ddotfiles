import { renames, type Tab } from "./label";

const BIN = process.env.HERDR_BIN_PATH || "herdr";

function listTabs(): Tab[] {
  const p = Bun.spawnSync([BIN, "tab", "list"]);
  try {
    return JSON.parse(p.stdout.toString())?.result?.tabs ?? [];
  } catch {
    return [];
  }
}

for (const { tabId, label } of renames(listTabs())) {
  Bun.spawnSync([BIN, "tab", "rename", tabId, label]);
}
