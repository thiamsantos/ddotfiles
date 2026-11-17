import { agentLabel, agentSlug, hyphenate, tabLabel, tabWords } from "./taskname";
import { readBranch } from "./branch";
import { snapshot, renameTab, renameAgent, type Snapshot } from "./herdr";
import { readEntry, writeEntry, shouldRename } from "./state";
import { taskWords } from "./haiku";

// A tab with several agents is named after one of them only. Otherwise each
// agent's event would rename the tab to its own words and trigger a new Haiku call.
export function tabAgent<T extends { pane_id: string; tab_id: string }>(agents: T[], tabId: string): T | null {
  const own = agents.filter((a) => a.tab_id === tabId).sort((a, b) => a.pane_id.localeCompare(b.pane_id));
  return own[0] ?? null;
}

async function signals(agent: any): Promise<{ branch: string; title: string }> {
  const branch = await readBranch(agent.foreground_cwd || agent.cwd || "");
  return { branch, title: agent.terminal_title_stripped || "" };
}

function needsNaming(snap: Snapshot, agent: any, branch: string, title: string): boolean {
  const tab = snap.tabs.find((t) => t.tab_id === agent.tab_id);
  const tabLive = tabWords(tab?.label ?? "");
  const owner = tabAgent(snap.agents, agent.tab_id)?.pane_id === agent.pane_id;
  return (
    shouldRename(readEntry(agent.pane_id), branch, title, agent.name ?? "").act ||
    (owner && shouldRename(readEntry(agent.tab_id), branch, title, tabLive).act)
  );
}

// Runs in the hook. The Haiku call takes 12-28s, so it runs in a detached child.
async function scheduleNaming(snap: Snapshot, paneId: string): Promise<void> {
  const agent = snap.agents.find((a) => a.pane_id === paneId);
  if (!agent) return;
  const { branch, title } = await signals(agent);
  if (!branch && !title) return;
  if (!needsNaming(snap, agent, branch, title)) return;

  const proc = Bun.spawn(["bun", "run", "src/hook.ts", "--name", paneId], {
    cwd: process.env.HERDR_PLUGIN_ROOT || ".",
    stdin: "ignore",
    stdout: "ignore",
    stderr: "ignore",
    env: process.env,
  });
  proc.unref();
}

async function nameEntities(snap: Snapshot, paneId: string): Promise<void> {
  const agent = snap.agents.find((a) => a.pane_id === paneId);
  if (!agent) return;
  const { branch, title } = await signals(agent);
  if (!branch && !title) return;

  const prevAgent = readEntry(paneId);
  const agentDecision = shouldRename(prevAgent, branch, title, agent.name ?? "");
  const tab = snap.tabs.find((t) => t.tab_id === agent.tab_id);
  const owner = tab && tabAgent(snap.agents, tab.tab_id)?.pane_id === paneId;
  const prevTab = owner ? readEntry(tab.tab_id) : null;
  const tabDecision = owner ? shouldRename(prevTab, branch, title, tabWords(tab.label ?? "")) : { act: false };
  if (!agentDecision.act && !tabDecision.act) return;

  const words = await taskWords(branch, title);
  const stale = words === "";

  if (agentDecision.act) {
    const useWords = words || prevAgent?.lastGoodWords || "";
    const slug = agentSlug(agentLabel(hyphenate(useWords), stale));
    if (slug) {
      await renameAgent(paneId, slug);
      if (!stale) writeEntry(paneId, { branch, title, applied: slug, lastGoodWords: useWords });
    }
  }

  if (owner && tabDecision.act) {
    const useWords = words || prevTab?.lastGoodWords || "";
    const hyphenated = hyphenate(useWords);
    if (!hyphenated) return;
    const applied = agentLabel(hyphenated, stale);
    // Re-read the label: tabnum may have renumbered the tab during the Haiku call.
    const fresh = (await snapshot())?.tabs.find((t) => t.tab_id === tab.tab_id);
    await renameTab(tab.tab_id, tabLabel(fresh?.label ?? tab.label ?? "", applied));
    if (!stale) writeEntry(tab.tab_id, { branch, title, applied, lastGoodWords: useWords });
  }
}

async function main(): Promise<void> {
  const snap = await snapshot();
  if (!snap) return;

  const argv = Bun.argv.slice(2);
  const nameIdx = argv.indexOf("--name");
  if (nameIdx !== -1) {
    const target = argv[nameIdx + 1];
    if (target && snap.agents.some((a) => a.pane_id === target)) await nameEntities(snap, target);
    return;
  }

  const paneId = process.env.HERDR_PANE_ID || "";
  if (paneId) await scheduleNaming(snap, paneId);
}

// Exit 0 even on errors, so herdr does not log transient failures.
if (import.meta.main) {
  main().then(
    () => process.exit(0),
    () => process.exit(0),
  );
}
