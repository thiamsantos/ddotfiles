// herdr-autoname/src/taskname.ts
export const STALE = "…";

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
    .slice(0, 3)
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
