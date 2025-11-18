export function uid(prefix = "id"): string {
  const r = Math.random().toString(36).slice(2, 8);
  const t = Date.now().toString(36);
  return `${prefix}_${t}${r}`;
}
