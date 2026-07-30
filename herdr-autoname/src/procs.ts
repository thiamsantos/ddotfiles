// herdr-autoname/src/procs.ts
import { basename } from "node:path";

export type Proc = { argv0: string | null; name: string | null };
export type PaneProc = {
  paneId: string;
  agent: string | null;
  procs: Proc[];
  termTitle: string | null;
};

const SHELLS = new Set(["fish", "bash", "zsh", "sh", "dash", "ksh"]);
// Processes that wrap the command the user actually ran.
const WRAPPERS = new Set(["caffeinate", "env", "nohup", "time", "sudo", "mise", "node", "turbo", "npx"]);
// Runtimes whose argv0 tells you nothing useful about the command.
const OPAQUE = new Set(["beam.smp", "java", "ruby", "python", "python3", "erl"]);
const ALIAS: Record<string, string> = { nvim: "vim" };

function clean(argv0: string | null, name: string | null): string {
  // Login shells report argv0 with a leading dash (e.g. "-fish").
  const raw = (argv0 || name || "").replace(/^-/, "");
  return raw ? basename(raw) : "";
}

// The first word of a shell-set title is the command (e.g. "iex -S mix phx.serve ~/d").
// Idle shells set the title to a bare path ("~/d/r/e/d/work-1"), which yields no command.
// NEVER call this for an agent pane: Claude overwrites the title with its session
// summary, whose first word is prose ("Keep", "Review", "Migrate"), not a command.
function titleCommand(termTitle: string | null): string | null {
  const first = (termTitle ?? "").trim().split(/\s+/)[0];
  if (!first || first.startsWith("~") || first.startsWith("/")) return null;
  return basename(first);
}

export function resolveProc(p: PaneProc): string | null {
  // Agent panes short-circuit here, which is also what keeps the title fallback
  // below from mistaking a Claude session summary for a command name.
  if (p.agent) return p.agent;

  const candidates = p.procs.map((x) => clean(x.argv0, x.name)).filter((x) => x && !SHELLS.has(x));
  if (!candidates.length) return null;

  const real = candidates.find((c) => !WRAPPERS.has(c)) ?? candidates[0];

  if (OPAQUE.has(real)) {
    const fromTitle = titleCommand(p.termTitle);
    if (fromTitle) return ALIAS[fromTitle] ?? fromTitle;
  }
  return ALIAS[real] ?? real;
}

export function displayProcs(panes: PaneProc[]): string[] {
  const out: string[] = [];
  for (const p of panes) {
    const name = resolveProc(p);
    if (name && !out.includes(name)) out.push(name);
  }
  return out;
}
