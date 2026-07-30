import { appendFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { isInformative } from "./branch";
import { parseWords } from "./taskname";

const MODEL = "claude-haiku-4-5-20251001";
export const TIMEOUT_MS = 45000;
const LOG_CAP = 200;
const SYSTEM_PROMPT = "You are a naming utility. Follow the users rules exactly and output nothing else.";

export function buildPrompt(branch: string, title: string): string {
  const signals = [
    isInformative(branch) ? `branch=${branch}` : null,
    title ? `title=${title}` : null,
  ].filter(Boolean).join(" ");

  return [
    "Name this work item in AT MOST two lowercase words for a narrow terminal sidebar.",
    "",
    "Rules:",
    "- Abbreviate to save space. Use ISO country codes (australia->au, netherlands->nl, philippines->ph) and common dev abbreviations (production->prod, description->desc, configuration->config, options->opts, repository->repo).",
    "- NEVER split a compound identifier into two words. Treat identifiers like readreplica, jsfoptions, exjsflow, autorename as ONE word, shortened if needed but never split.",
    "- Keep recognizable project/system names intact rather than clipping them to fragments. Prefer exjsflow over exjs.",
    "- The branch is authoritative for WHAT the work is. The title reflects the CURRENT step.",
    "- Fix typos in the branch (philipines -> ph).",
    "- With only two words available, the single most distinguishing token (country, subsystem, ticket topic) matters more than ever — always keep it, and drop generic verbs like migrate/update/review before you'd drop it. That distinguishing token is what keeps otherwise-similar work (e.g. au jsfopts vs nl jsfopts vs ph jsfopts) tellable apart.",
    "- Output ONLY the two words. No punctuation, no explanation, no numbering.",
    "",
    signals,
  ].join("\n");
}

export function logFailure(entity: string, code: number | string, stderr: string): void {
  try {
    const d = process.env.HERDR_PLUGIN_STATE_DIR;
    if (!d) return;
    mkdirSync(d, { recursive: true });
    const path = join(d, "haiku-errors.log");
    const line = `${new Date().toISOString()} ${entity} exit=${code} ${stderr.trim().slice(0, 300).replace(/\n/g, " ")}\n`;
    appendFileSync(path, line);
    const lines = readFileSync(path, "utf8").split("\n").filter(Boolean);
    if (lines.length > LOG_CAP) writeFileSync(path, lines.slice(-LOG_CAP).join("\n") + "\n");
  } catch {
    // Logging must never break renaming.
  }
}

export function claudeArgs(prompt: string): string[] {
  return [
    "claude",
    "-p",
    "--model",
    MODEL,
    "--system-prompt",
    SYSTEM_PROMPT,
    "--setting-sources",
    "",
    prompt,
  ];
}

export async function taskWords(branch: string, title: string): Promise<string> {
  if (!isInformative(branch) && !title) return "";
  try {
    const p = Bun.spawn(claudeArgs(buildPrompt(branch, title)), {
      stdout: "pipe",
      stderr: "pipe",
      cwd: tmpdir(),
    });
    const timer = setTimeout(() => p.kill(), TIMEOUT_MS);
    const out = await new Response(p.stdout).text();
    const err = await new Response(p.stderr).text();
    const code = await p.exited;
    clearTimeout(timer);
    if (code !== 0) {
      logFailure(`${branch}|${title}`.slice(0, 80), code, err);
      return "";
    }
    // Ignore Claude Code settings warnings that precede the reply.
    const clean = out.split("\n").filter((l) => !l.includes("Permission deny rule")).join("\n");
    const words = parseWords(clean);
    if (!words) logFailure(`${branch}|${title}`.slice(0, 80), "empty", out);
    return words;
  } catch (e) {
    logFailure(`${branch}|${title}`.slice(0, 80), "spawn", String(e));
    return "";
  }
}

// Detached entrypoint: resolves the two-word name for (entityId, kind) out-of-band.
// Deliberately has no herdr/rename/state dependencies — Task 9 owns applying the
// result. Callers get the words back as a return value (see the note below on why
// this isn't Promise<void>) and, when this module is run directly (`bun run
// src/haiku.ts <entityId> <kind> <branch> <title>`), the words are also printed to
// stdout with exit 0, or nothing is printed and the process exits 1 on failure.
export async function nameAndApply(
  entityId: string,
  kind: "agent" | "workspace",
  branch: string,
  title: string,
): Promise<string> {
  void entityId;
  void kind;
  return taskWords(branch, title);
}

if (import.meta.main) {
  const [entityId, kind, branch, title] = Bun.argv.slice(2);
  const words = await nameAndApply(entityId ?? "", (kind as "agent" | "workspace") ?? "agent", branch ?? "", title ?? "");
  if (words) {
    console.log(words);
    process.exit(0);
  } else {
    process.exit(1);
  }
}
