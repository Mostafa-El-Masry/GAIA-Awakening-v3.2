import { DailyEntry, WeeklySummary } from "./types";

export function buildDailyVoice(entry: DailyEntry | null): string {
  if (!entry) {
    return "When you write even a single honest line about today, I will mirror it back to you here.";
  }

  const parts: string[] = [];

  if (entry.summary && entry.summary.trim().length > 0) {
    parts.push(`Today you described your day as: "${entry.summary.trim()}".`);
  } else {
    parts.push(
      "Today is still a blank page. One small sentence is enough to give it a shape."
    );
  }

  const filledSlots = Object.entries(entry.slots ?? {}).filter(
    ([, value]) => typeof value === "string" && value.trim().length > 0
  );

  if (filledSlots.length > 0) {
    const labels = filledSlots.map(([key]) => key).join(", ");
    parts.push(`You also left notes for: ${labels}.`);
  }

  if (entry.isClosed) {
    parts.push(
      "You marked this day as closed. You can rest; anything unfinished can live in tomorrow."
    );
  } else {
    parts.push(
      "This day is still open. If something is still circling in your head, you can park it here before you sleep."
    );
  }

  return parts.join(" ");
}

export function buildWeeklyVoice(week: WeeklySummary | null): string {
  if (!week) {
    return "Once you choose a week and write a few reflections, I will echo the shape of that week here.";
  }

  const parts: string[] = [];

  if (week.summary && week.summary.trim().length > 0) {
    parts.push(`This week felt like: "${week.summary.trim()}".`);
  }

  if (week.wentWell && week.wentWell.trim().length > 0) {
    parts.push(
      "You noticed what went well — that&apos;s how small wins start to add up."
    );
  }

  if (week.drained && week.drained.trim().length > 0) {
    parts.push(
      "You also named what drained you, which is a quiet kind of courage."
    );
  }

  if (week.improveNextWeek && week.improveNextWeek.trim().length > 0) {
    parts.push(
      "You gave your future self at least one clear improvement to carry into the next week."
    );
  }

  if (parts.length === 0) {
    return "This week is still an open question. A few honest lines about what felt good and what felt heavy will give it a shape.";
  }

  return parts.join(" ");
}
