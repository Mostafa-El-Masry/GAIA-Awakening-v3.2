export const DAILY_HOOK_KEYS = [
  "health",
  "wealth",
  "learning",
  "work",
  "memories",
] as const;

export type DailyHookKey = (typeof DAILY_HOOK_KEYS)[number];

export type DailySlots = {
  [K in DailyHookKey]?: string;
};

export type DailyEntry = {
  id: string; // same as date
  date: string; // YYYY-MM-DD
  createdAt: string;
  updatedAt: string;
  summary: string;
  slots: DailySlots;
  isClosed: boolean;
  weekId: string | null;
};

export type WeeklySignals = {
  health?: string;
  wealth?: string;
  learning?: string;
  work?: string;
};

export type WeeklySummary = {
  id: string;
  index: number;
  label: string;
  startDate: string;
  endDate: string;
  summary: string;
  wentWell: string;
  drained: string;
  improveNextWeek: string;
  signals: WeeklySignals;
};

export type CoreBrainState = {
  entries: DailyEntry[];
  weeks: WeeklySummary[];
  /**
   * Free-form notes about how using the Daily Thread feels in v3.0:
   * what is natural, what is heavy, and what you want future versions
   * to change or add.
   */
  metaNotes?: string;
};

export type V3WeekMeta = {
  id: string;
  index: number;
  label: string;
  startDate: string;
  endDate: string;
};

export type DailyHookDefinition = {
  key: DailyHookKey;
  shortLabel: string;
  description: string;
  futureSource: string;
};

export const DAILY_HOOK_DEFINITIONS: DailyHookDefinition[] = [
  {
    key: "health",
    shortLabel: "Health note",
    description:
      "Movement, sleep, body signals or anything physical that coloured the day.",
    futureSource: "Health tracker (movement, sleep consistency, check-ins).",
  },
  {
    key: "wealth",
    shortLabel: "Wealth / money note",
    description:
      "How money felt today: spending, saving, stress, or small wins.",
    futureSource:
      "Wealth tracker (daily money feeling, savings / overspend flags).",
  },
  {
    key: "learning",
    shortLabel: "Learning / study note",
    description: "What you studied, practiced, or skipped.",
    futureSource: "Citadel / Apollo (courses, lessons, labs).",
  },
  {
    key: "work",
    shortLabel: "Work / automations note",
    description:
      "Heavy days, boring tasks GAIA helped with, or things you postponed.",
    futureSource: "Work automations + simple task logs.",
  },
  {
    key: "memories",
    shortLabel: "Memories / gallery note",
    description: "Moments, images or videos that belong to this day.",
    futureSource: "Galleries (images, videos, favourite captures).",
  },
];
