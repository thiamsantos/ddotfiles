export const STALE = "…";
export const WORD_COUNT = 3;

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

// Also drops the stale "…" marker; the real words live in state.lastGoodWords.
export function hyphenate(words: string): string {
  return (words ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// `herdr agent rename` needs a lowercase first letter, only [a-z0-9_-], and 1-32 chars.
export function agentSlug(words: string): string {
  const trimmed = hyphenate(words).slice(0, 32).replace(/-+$/, "");
  if (!trimmed) return "";
  return /^[a-z]/.test(trimmed) ? trimmed : `a-${trimmed}`.slice(0, 32).replace(/-+$/, "");
}

const TAG = /^\s*\[\d+\]\s*/;

// The label without the [N] tag that herdr-tabnum owns.
export function tabWords(label: string): string {
  return (label ?? "").replace(TAG, "").trim();
}

export function tabLabel(current: string, words: string): string {
  const tag = TAG.exec(current ?? "")?.[0].trim();
  return tag ? `${tag} ${words}` : words;
}
