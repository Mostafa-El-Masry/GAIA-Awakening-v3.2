const KUWAIT_TZ = "Asia/Kuwait";

const formatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: KUWAIT_TZ,
});

function keyToUTCDate(key: string): Date {
  const [year, month, day] = key.split("-").map((part) => parseInt(part, 10));
  return new Date(Date.UTC(year, (month ?? 1) - 1, day ?? 1));
}

export function todayKey(): string {
  return formatter.format(new Date());
}

export function shiftDate(key: string, days: number): string {
  const date = keyToUTCDate(key);
  date.setUTCDate(date.getUTCDate() + days);
  return formatter.format(date);
}

export function formatKey(key: string): string {
  return key;
}

