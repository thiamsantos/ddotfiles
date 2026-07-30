export function tabLabel(number: number, repo: string, procs: string[]): string {
  const parts = [`[${number}]`];
  if (repo) parts.push(repo);
  if (procs.length) parts.push(procs.join(" / "));
  return parts.join(" ");
}
