// herdr-autoname/src/taskname.ts
export const STALE = "…";
export const WORD_COUNT = 2;

export function parseWords(reply: string): string {
  const line = (reply ?? "")
    .split("\n")
    .map((l) => l.trim())
    .find((l) => l.length > 0);
  if (!line) return "";
  return line
    .replace(/^\d+\s*[:.)]\s*/, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((w) => w && w !== "-")
    .slice(0, WORD_COUNT)
    .join(" ");
}

export function agentLabel(words: string, stale: boolean): string {
  if (!stale) return words;
  return words ? `${words} ${STALE}` : STALE;
}

export function workspaceLabel(wsLabel: string, words: string, stale: boolean): string {
  const tail = agentLabel(words, stale);
  return `${wsLabel} - ${tail}`;
}

// `herdr agent rename` requires: starts with a lowercase letter, only
// [a-z0-9_-], 1-32 chars. Agent labels (e.g. from agentLabel) are
// space-separated words that may include the "…" stale marker — that marker
// carries no naming information and isn't ASCII, so it's dropped rather than
// mapped to any placeholder character; a stale agent with no prior words
// slugs to "" and the caller skips the rename.
export function agentSlug(words: string): string {
  const slug = (words ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
  const trimmed = slug.slice(0, 32).replace(/-+$/, "");
  if (!trimmed) return "";
  return /^[a-z]/.test(trimmed) ? trimmed : `a-${trimmed}`.slice(0, 32).replace(/-+$/, "");
}
