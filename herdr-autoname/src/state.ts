import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { join } from "node:path";

export type Entry = { branch: string; title: string; applied: string; lastGoodWords: string };

function dir(): string {
  const d = process.env.HERDR_PLUGIN_STATE_DIR || join(process.env.HOME || "/tmp", ".local/state/herdr/plugins/thiamsantos.autoname");
  mkdirSync(d, { recursive: true });
  return d;
}

export function stateFile(entityId: string): string {
  return join(dir(), `${entityId.replace(/:/g, "-")}.json`);
}

export function readEntry(entityId: string): Entry | null {
  try {
    return JSON.parse(readFileSync(stateFile(entityId), "utf8")) as Entry;
  } catch {
    return null;
  }
}

export function writeEntry(entityId: string, e: Entry): void {
  const target = stateFile(entityId);
  const tmp = `${target}.tmp`;
  writeFileSync(tmp, JSON.stringify(e));
  renameSync(tmp, target);
}

export function shouldRename(
  prev: Entry | null,
  branch: string,
  title: string,
  liveLabel: string,
): { act: boolean; reason: string } {
  if (!prev) return { act: true, reason: "first" };
  const changed = prev.branch !== branch || prev.title !== title;
  if (changed) return { act: true, reason: "changed" };
  if (liveLabel !== prev.applied) return { act: false, reason: "manual" };
  return { act: false, reason: "unchanged" };
}
