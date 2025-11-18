export type DlFile = {
  id: string;
  name: string;
  href: string;
  size?: string;
  tags?: string[];
  note?: string;
};

export const files: DlFile[] = [
  { id: "d1", name: "Week 7 — ELEUTHIA foundation.zip", href: "/downloads/GAIA-v2.0-Phase5-Week7-ELEUTHIA-foundation.zip", size: "~25KB", tags: ["ELEUTHIA","security"] },
  { id: "d2", name: "Week 8 — ELEUTHIA features.zip", href: "/downloads/GAIA-v2.0-Phase5-Week8-ELEUTHIA-features.zip", size: "~30KB", tags: ["ELEUTHIA","backups"] },
  { id: "d3", name: "Week 9 — Gallery polish.zip", href: "/downloads/GAIA-v2.0-Phase5-Week9-Gallery-polish.zip", size: "~15KB", tags: ["gallery"] },
];
