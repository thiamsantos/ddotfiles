import { appendFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { isInformative } from "./branch";
import { parseWords } from "./taskname";

const MODEL = "claude-haiku-4-5-20251001";
const TIMEOUT_MS = 8000;
const LOG_CAP = 200;

export function buildPrompt(branch: string, title: string): string {
  const signals = [
    isInformative(branch) ? `branch=${branch}` : null,
    title ? `title=${title}` : null,
  ].filter(Boolean).join(" ");

  return [
    "Name this work item in AT MOST three lowercase words for a narrow terminal sidebar.",
    "",
    "Rules:",
    "- Abbreviate to save space. Use ISO country codes (australia->au, netherlands->nl, philippines->ph) and common dev abbreviations (production->prod, description->desc, configuration->config, options->opts, repository->repo).",
    "- NEVER split a compound identifier into two words. Treat identifiers like readreplica, jsfoptions, exjsflow, autorename as ONE word, shortened if needed but never split.",
    "- Keep recognizable project/system names intact rather than clipping them to fragments. Prefer exjsflow over exjs.",
    "- The branch is authoritative for WHAT the work is. The title reflects the CURRENT step.",
    "- Fix typos in the branch (philipines -> ph).",
    "- Keep the single most distinguishing token (country, subsystem, ticket topic).",
    "- Output ONLY the three words. No punctuation, no explanation, no numbering.",
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

export async function threeWords(branch: string, title: string): Promise<string> {
  if (!isInformative(branch) && !title) return "";
  try {
    const p = Bun.spawn(["claude", "-p", "--model", MODEL, buildPrompt(branch, title)], {
      stdout: "pipe",
      stderr: "pipe",
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
