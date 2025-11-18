export function getDisplayName(path: string, fallback: string): string {
  const last = path.split(/[/\\]/).pop() || fallback;
  let decoded = last;
  try {
    decoded = decodeURIComponent(last);
  } catch {
    decoded = last;
  }
  // Remove media directory prefix if present
  decoded = decoded.replace(/^(?:media\/(?:videos|images)\/)?/, "");
  // Remove file extension
  const trimmed = decoded.replace(/\.[^/.]+$/, "");
  return trimmed || fallback;
}
