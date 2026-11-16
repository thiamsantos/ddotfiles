const TAG = /\[\d+\]/;

export function numberedLabel(label: string, position: number): string {
  const tag = `[${position}]`;
  const trimmed = label.trim();
  if (TAG.test(trimmed)) return trimmed.replace(TAG, tag);
  // herdr's default label is the bare tab number, which would read "[2] 5".
  if (/^\d*$/.test(trimmed)) return tag;
  return `${tag} ${trimmed}`;
}

export type Tab = { tab_id: string; workspace_id: string; label: string };

// `tab.number` has gaps after closes, so the position comes from list order.
export function renames(tabs: Tab[]): Array<{ tabId: string; label: string }> {
  const seen = new Map<string, number>();
  return tabs.flatMap((tab) => {
    const position = (seen.get(tab.workspace_id) ?? 0) + 1;
    seen.set(tab.workspace_id, position);
    const label = numberedLabel(tab.label, position);
    return label === tab.label ? [] : [{ tabId: tab.tab_id, label }];
  });
}
