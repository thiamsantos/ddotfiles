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

// Shared word-hyphenating core, used by both entities' names. Lowercases,
// strips anything outside [a-z0-9\s-] (this is also what drops the "…" stale
// marker cleanly — it isn't ASCII and carries no naming information; the
// real "last good words" are tracked separately in state.lastGoodWords),
// collapses whitespace/repeated hyphens to a single "-", and trims any
// leading/trailing hyphen. No length cap and no leading-letter requirement —
// those are agent-only constraints layered on top by agentSlug, because
// `herdr workspace rename` has neither restriction.
export function hyphenate(words: string): string {
  return (words ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// `herdr agent rename` requires: starts with a lowercase letter, only
// [a-z0-9_-], 1-32 chars — a stricter format than workspace labels need, so
// those two extra rules (length cap, leading-letter prefixing) are applied
// on top of the shared `hyphenate` core rather than duplicating it. A stale
// agent with no prior words hyphenates to "" and the caller skips the rename.
export function agentSlug(words: string): string {
  const trimmed = hyphenate(words).slice(0, 32).replace(/-+$/, "");
  if (!trimmed) return "";
  return /^[a-z]/.test(trimmed) ? trimmed : `a-${trimmed}`.slice(0, 32).replace(/-+$/, "");
}
