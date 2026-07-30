const WORKTREES = /^(.+)-worktrees$/;

export function repoToken(path: string | null | undefined): string {
  if (!path) return "";
  const parts = path.split("/").filter(Boolean);
  for (const seg of parts) {
    const m = WORKTREES.exec(seg);
    if (m) return m[1];
  }
  return parts.length ? parts[parts.length - 1] : "";
}
