export type TimelineEvent = {
  id: string;
  date: string; // ISO date
  title: string;
  description?: string;
};

export const events: TimelineEvent[] = [
  { id: "e1", date: "2026-03-23", title: "Phase 5 begins", description: "GAIA v2.0 Beta kicks off." },
  { id: "e2", date: "2026-03-27", title: "Citadel foundation", description: "Tower + Academy skeleton." },
  { id: "e3", date: "2026-03-31", title: "ELEUTHIA foundation", description: "Zero‑knowledge vault online." },
  { id: "e4", date: "2026-04-02", title: "Gallery polish", description: "Swipe + arrows + no layout shift." },
];
