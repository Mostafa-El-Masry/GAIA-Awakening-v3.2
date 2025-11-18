export function capitalizeWords(value: string): string {
  if (!value) return value;
  return value
    .split(/\s+/)
    .map((part) =>
      part.length ? part[0].toUpperCase() + part.slice(1).toLowerCase() : part,
    )
    .join(" ");
}

export function normaliseEmail(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const [local, domain] = trimmed.split("@");
  if (!domain) return trimmed.toLowerCase();
  return `${local.toLowerCase()}@${domain.toLowerCase()}`;
}

