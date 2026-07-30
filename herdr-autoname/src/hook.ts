// herdr-autoname/src/hook.ts
import { repoToken } from "./repo";
import { displayProcs, type PaneProc } from "./procs";
import { tabLabel } from "./tabname";
import { agentLabel, workspaceLabel, agentSlug } from "./taskname";
import { readBranch } from "./branch";
import { snapshot, paneProcs, renameTab, renameAgent, renameWorkspace, type Snapshot } from "./herdr";
import { readEntry, writeEntry, shouldRename } from "./state";
import { threeWords } from "./haiku";

// Picks the pane whose cwd determines a tab's repo token. `focusedPaneId` is
// the session's GLOBAL focus — it only counts here when it names a pane that
// actually belongs to this tab's `panes` list (checked via `find`, which is
// tab-scoped by construction). If global focus is elsewhere (or no pane in
// this tab reports `focused: true`), the fallback MUST NOT depend on global
// focus at all: sort this tab's own panes by `pane_id` and take the first.
// That sort/tiebreak must stay order-stable across calls — otherwise the same
// tab's repo token flickers between unrelated repos as focus moves around
// *other* tabs/workspaces, which is exactly the instability this exists to
// avoid (see live finding: w1:t1 flipped tiger/dragon while focus was on
// w2:p4, outside the tab entirely).
export function pickTabPane<T extends { focused?: boolean; pane_id: string }>(
  panes: T[],
  focusedPaneId?: string,
): T | null {
  if (!panes.length) return null;
  const sorted = [...panes].sort((a, b) => a.pane_id.localeCompare(b.pane_id));
  const byId = focusedPaneId ? sorted.find((p) => p.pane_id === focusedPaneId) : null;
  if (byId) return byId;
  const flagged = sorted.find((p) => p.focused);
  if (flagged) return flagged;
  return sorted[0];
}

// `tab.number` is a persistent, gap-riddled id (e.g. a workspace's tabs can be
// numbered 2, 5 after earlier tabs were closed) — NOT the tab's visual
// position. herdr has no numeric tab-jump keybinding (only a fuzzy `goto`
// picker), so the "[N]" the user sees must be the 1-based position within the
// tab's own workspace, not `tab.number` itself. `snap.tabs` is already
// grouped by workspace and returned in ascending display order (confirmed
// against the live snapshot: w1's tabs come back as t1,t3,t4,t6,t7, w2's as
// t2,t5) — so position is derived from that array's own order rather than by
// re-sorting `tab_id` strings, which would corrupt double-digit ids (a
// lexicographic sort puts "t10" before "t3").
export function tabPosition(
  tabs: Array<{ tab_id: string; workspace_id: string; number?: number }>,
  tabId: string,
): number {
  const target = tabs.find((t) => t.tab_id === tabId);
  if (!target) return 0;
  const siblings = tabs.filter((t) => t.workspace_id === target.workspace_id);
  const idx = siblings.findIndex((t) => t.tab_id === tabId);
  return idx === -1 ? 0 : idx + 1;
}

async function renameTabFor(snap: Snapshot, tabId: string): Promise<void> {
  const tab = snap.tabs.find((t) => t.tab_id === tabId);
  if (!tab) return;
  const panes = snap.panes.filter((p) => p.tab_id === tabId);
  if (!panes.length) return;

  const position = tabPosition(snap.tabs, tabId);
  if (!position) return; // tab vanished between lookup and here — skip rather than emit "[0]"

  const focused = pickTabPane(panes, snap.focused_pane_id);
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

  const label = tabLabel(position, repo, displayProcs(procs));
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
  const decision = shouldRename(readEntry(paneId), branch, title, agent.name ?? "");
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
  const decision = shouldRename(prevAgent, branch, title, agent.name ?? "");
  if (!decision.act) return;

  const words = await threeWords(branch, title);
  const stale = words === "";
  const useWords = words || prevAgent?.lastGoodWords || "";

  // herdr agent rename requires a lowercase-start [a-z0-9_-]{1,32} name, unlike
  // the space-separated label used for workspaces — slugify only this path.
  const aLabel = agentLabel(useWords, stale);
  const aSlug = agentSlug(aLabel);
  if (aSlug) {
    await renameAgent(paneId, aSlug);
    if (!stale) {
      writeEntry(paneId, { branch, title, applied: aSlug, lastGoodWords: useWords });
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
// Guarded so importing this module (e.g. from tests) doesn't run the hook.
if (import.meta.main) {
  main().then(
    () => process.exit(0),
    () => process.exit(0),
  );
}
