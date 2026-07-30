// herdr-autoname/src/hook.ts
import { repoToken } from "./repo";
import { displayProcs, type PaneProc } from "./procs";
import { tabLabel } from "./tabname";
import { agentLabel, workspaceLabel } from "./taskname";
import { readBranch } from "./branch";
import { snapshot, paneProcs, renameTab, renameAgent, renameWorkspace, type Snapshot } from "./herdr";
import { readEntry, writeEntry, shouldRename } from "./state";
import { threeWords } from "./haiku";

function pickFocused<T extends { focused?: boolean; pane_id: string }>(panes: T[], focusedId?: string): T | null {
  if (!panes.length) return null;
  const byId = focusedId ? panes.find((p) => p.pane_id === focusedId) : null;
  if (byId) return byId;
  const flagged = panes.find((p) => p.focused);
  if (flagged) return flagged;
  return [...panes].sort((a, b) => a.pane_id.localeCompare(b.pane_id))[0];
}

async function renameTabFor(snap: Snapshot, tabId: string): Promise<void> {
  const tab = snap.tabs.find((t) => t.tab_id === tabId);
  if (!tab) return;
  const panes = snap.panes.filter((p) => p.tab_id === tabId);
  if (!panes.length) return;

  const focused = pickFocused(panes, snap.focused_pane_id);
  const repo = repoToken(focused?.foreground_cwd || focused?.cwd);

  const procs: PaneProc[] = [];
  for (const p of [...panes].sort((a, b) => a.pane_id.localeCompare(b.pane_id))) {
    const agent: string | null = p.agent ?? null;
    procs.push({
      paneId: p.pane_id,
      agent,
      procs: agent ? [] : await paneProcs(p.pane_id),
      termTitle: p.terminal_title_stripped ?? null,
    });
  }

  const label = tabLabel(tab.number, repo, displayProcs(procs));
  if (label && label !== tab.label) await renameTab(tabId, label);
}

// Runs in the HOOK: decides whether naming is needed and, if so, spawns the slow
// work detached. Never awaits generation — measured at 12-28s.
async function scheduleTaskNaming(snap: Snapshot, paneId: string): Promise<void> {
  const agent = snap.agents.find((a) => a.pane_id === paneId);
  if (!agent) return;

  const cwd = agent.foreground_cwd || agent.cwd || "";
  const branch = await readBranch(cwd);
  const title = agent.terminal_title_stripped || "";
  if (!branch && !title) return;

  // Gate BEFORE spawning, so an unchanged status flip costs nothing.
  const decision = shouldRename(readEntry(paneId), branch, title, agent.label ?? "");
  if (!decision.act) return;

  const proc = Bun.spawn(["bun", "run", "src/hook.ts", "--name", paneId], {
    cwd: process.env.HERDR_PLUGIN_ROOT || ".",
    stdin: "ignore",
    stdout: "ignore",
    stderr: "ignore",
    env: process.env,
  });
  proc.unref(); // do NOT await proc.exited — fire and forget
}

// Runs in the DETACHED CHILD: does the slow generation, then applies renames.
async function renameTaskEntities(snap: Snapshot, paneId: string): Promise<void> {
  const agent = snap.agents.find((a) => a.pane_id === paneId);
  if (!agent) return;

  const cwd = agent.foreground_cwd || agent.cwd || "";
  const branch = await readBranch(cwd);
  const title = agent.terminal_title_stripped || "";
  if (!branch && !title) return;

  const prevAgent = readEntry(paneId);
  const decision = shouldRename(prevAgent, branch, title, agent.label ?? "");
  if (!decision.act) return;

  const words = await threeWords(branch, title);
  const stale = words === "";
  const useWords = words || prevAgent?.lastGoodWords || "";

  const aLabel = agentLabel(useWords, stale);
  if (aLabel) {
    await renameAgent(paneId, aLabel);
    if (!stale) {
      writeEntry(paneId, { branch, title, applied: aLabel, lastGoodWords: useWords });
    }
  }

  // Workspace — only when this agent owns the workspace's active tab.
  const ws = snap.workspaces.find((w) => w.workspace_id === agent.workspace_id);
  if (!ws || ws.active_tab_id !== agent.tab_id) return;

  const prevWs = readEntry(ws.workspace_id);
  const wsDecision = shouldRename(prevWs, branch, title, ws.label ?? "");
  if (!wsDecision.act) return;

  // A workspace label must not accumulate its own prefix across renames.
  const base = (ws.label ?? "").split(" - ")[0].replace(/\s*…$/, "");
  const wLabel = workspaceLabel(base, useWords, stale);
  await renameWorkspace(ws.workspace_id, wLabel);
  if (!stale) {
    writeEntry(ws.workspace_id, { branch, title, applied: wLabel, lastGoodWords: useWords });
  }
}

async function main(): Promise<void> {
  const snap = await snapshot();
  if (!snap) return;

  // Detached-child mode: `bun run src/hook.ts --name <paneId>`. Does the slow
  // LLM naming only; the hook already gated and already renamed the tab.
  const argv = Bun.argv.slice(2);
  const nameIdx = argv.indexOf("--name");
  if (nameIdx !== -1) {
    const target = argv[nameIdx + 1];
    const valid = typeof target === "string" && target.length > 0 && snap.agents.some((a) => a.pane_id === target);
    if (valid) await renameTaskEntities(snap, target as string);
    return;
  }

  // Hook mode: rename the tab synchronously, schedule naming detached.
  const paneId = process.env.HERDR_PANE_ID || "";
  const tabId = process.env.HERDR_TAB_ID || (paneId ? snap.panes.find((p) => p.pane_id === paneId)?.tab_id : "") || "";

  if (tabId) await renameTabFor(snap, tabId);
  if (paneId) await scheduleTaskNaming(snap, paneId);
}

// Always exit 0 so herdr never logs plugin failures on transient errors.
main().then(
  () => process.exit(0),
  () => process.exit(0),
);
