import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

const BORING = new Set(["main", "master", "develop", "trunk"]);

export function isInformative(branch: string): boolean {
  if (!branch) return false;
  if (BORING.has(branch)) return false;
  if (/^work-\d+$/.test(branch)) return false;
  if (branch.startsWith("detached")) return false;
  return true;
}

function findGitDir(cwd: string): string | null {
  let dir = resolve(cwd);
  for (;;) {
    const candidate = join(dir, ".git");
    if (existsSync(candidate)) {
      if (statSync(candidate).isDirectory()) return candidate;
      // Worktrees use a .git FILE containing "gitdir: <path>".
      const m = /^gitdir:\s*(.+)$/m.exec(readFileSync(candidate, "utf8"));
      if (m) return m[1].trim();
      return null;
    }
    const parent = dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

export async function readBranch(cwd: string): Promise<string> {
  try {
    const gitDir = findGitDir(cwd);
    if (!gitDir) return "";
    const head = readFileSync(join(gitDir, "HEAD"), "utf8").trim();
    const m = /^ref:\s*refs\/heads\/(.+)$/.exec(head);
    return m ? m[1].trim() : "";
  } catch {
    return "";
  }
}
