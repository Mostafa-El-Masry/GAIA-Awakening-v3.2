export type Era = "cosmic" | "human" | "personal";

export interface TLRange {
  startYear: number; // can be negative (BCE), supports billions
  endYear?: number;  // optional for instant events
}

export interface TLEvent {
  id: string;
  title: string;
  era: Era;
  note?: string;
  range: TLRange;
  color?: string;
  link?: string; // optional href (e.g., to Apollo section)
  createdAt: string; // ISO
}

export interface TimelineData {
  events: TLEvent[];
}

export interface TimelinePrefs {
  zoom: "cosmic" | "human" | "personal"; // affects default min/max
  showCosmic: boolean;
  showHuman: boolean;
  showPersonal: boolean;
  sort: "chronological" | "recent";
}
