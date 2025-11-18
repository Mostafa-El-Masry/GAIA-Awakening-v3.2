export type SiteEntry = { path: string; title: string; group?: string; note?: string };

export const routes: SiteEntry[] = [
  { path: "/", title: "Home" },
  { path: "/dashboard", title: "Dashboard" },
  { path: "/apollo", title: "Apollo" },
  { path: "/apollo/labs", title: "Labs (builds)" },
  { path: "/ELEUTHIA", title: "ELEUTHIA (vault)" },
  { path: "/ELEUTHIA/Backups", title: "Backups" },
  { path: "/Gallery", title: "Gallery" },
  { path: "/Timeline", title: "Timeline (vertical)" },
  { path: "/Health", title: "Health" },
  { path: "/Wealth", title: "Wealth" },
  { path: "/Archives/GAIA/Intro", title: "GAIA Intro", group: "Archives" },
  { path: "/Classic/SiteMap", title: "Site Map", group: "Classic" },
  { path: "/Classic/Directory", title: "Dev Directory", group: "Classic" },
  { path: "/Classic/WhatsNew", title: "What’s New", group: "Classic" },
  { path: "/Classic/Announcements", title: "Announcements", group: "Classic" },
  { path: "/Classic/DownloadCenter", title: "Download Center", group: "Classic" },
  { path: "/Locked", title: "Locked (ELEUTHIA gate demo)" },
];
