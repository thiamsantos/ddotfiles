export type Snapshot = {
  agents: any[];
  tabs: any[];
  workspaces: any[];
  panes: any[];
  focused_pane_id?: string;
  focused_tab_id?: string;
  focused_workspace_id?: string;
};

const BIN = process.env.HERDR_BIN_PATH || "herdr";

export function unwrap(stdout: string): any {
  try {
    const d = JSON.parse(stdout);
    if (d && d.error) return null;
    return d?.result ?? null;
  } catch {
    return null;
  }
}

async function run(args: string[]): Promise<string> {
  try {
    const p = Bun.spawn([BIN, ...args], { stdout: "pipe", stderr: "pipe" });
    const out = await new Response(p.stdout).text();
    await p.exited;
    return out;
  } catch {
    return "";
  }
}

export async function snapshot(): Promise<Snapshot | null> {
  const r = unwrap(await run(["api", "snapshot"]));
  return r?.snapshot ?? null;
}

export async function paneProcName(paneId: string): Promise<string | null> {
  const r = unwrap(await run(["pane", "process-info", "--pane", paneId]));
  const fps = r?.process_info?.foreground_processes;
  return Array.isArray(fps) && fps.length ? (fps[0].name ?? null) : null;
}

export type PaneProcInfo = { argv0: string | null; name: string | null };

export function mapForegroundProcesses(result: any): PaneProcInfo[] {
  const fps = result?.process_info?.foreground_processes;
  if (!Array.isArray(fps)) return [];
  return fps.map((p) => ({ argv0: p?.argv0 ?? null, name: p?.name ?? null }));
}

export async function paneProcs(paneId: string): Promise<PaneProcInfo[]> {
  const r = unwrap(await run(["pane", "process-info", "--pane", paneId]));
  return mapForegroundProcesses(r);
}

export async function renameTab(tabId: string, label: string): Promise<void> {
  await run(["tab", "rename", tabId, label]);
}

export async function renameAgent(paneId: string, name: string): Promise<void> {
  await run(["agent", "rename", paneId, name]);
}

export async function renameWorkspace(wsId: string, label: string): Promise<void> {
  await run(["workspace", "rename", wsId, label]);
}
