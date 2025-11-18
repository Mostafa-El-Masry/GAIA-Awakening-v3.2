export type NewsItem = { id: string; date: string; title: string; tags?: string[]; body: string };

export const items: NewsItem[] = [
  {
    id: "w13",
    date: "2026-08-09",
    title: "Level 1 · Static GAIA baseline complete",
    tags: ["roadmap", "level1"],
    body:
      "Level 1 (static GAIA) is considered feature-complete: Dashboard, Gallery, Health, Wealth, Archives, Labs, Classic add-ons, and Settings all have a solid first pass. Future work now moves into Level 2, where GAIA behaves more like an assistant.",
  },
  {
    id: "w12",
    date: "2026-04-05",
    title: "Classic add-ons land",
    tags: ["classic", "phase5"],
    body:
      "Site Map, Dev Directory, What’s New, Announcements, Download Center, and ELEUTHIA-gated locks are now available.",
  },
  {
    id: "w11",
    date: "2026-04-03",
    title: "Timelines update",
    tags: ["timeline", "health", "wealth"],
    body:
      "Timeline goes vertical; Health/Wealth bars get exponential heights.",
  },
  {
    id: "w10",
    date: "2026-04-02",
    title: "Dashboard polish",
    tags: ["dashboard"],
    body:
      "Active + Entry sections restyled and wired to live data.",
  },
];
