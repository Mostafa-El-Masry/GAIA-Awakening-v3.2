import type { GalleryItem } from "./types";

const KEYWORD_TAGS: Array<{ tag: string; keywords: string[] }> = [
  {
    tag: "personal",
    keywords: [
      "family",
      "friends",
      "selfie",
      "portrait",
      "wedding",
      "birthday",
      "kids",
      "child",
      "dad",
      "mom",
      "home",
    ],
  },
  {
    tag: "exotic",
    keywords: [
      "exotic",
      "tropical",
      "safari",
      "jungle",
      "rainforest",
      "wildlife",
    ],
  },
  {
    tag: "landscape",
    keywords: [
      "mountain",
      "mountains",
      "forest",
      "lake",
      "sunset",
      "sunrise",
      "river",
      "valley",
      "sea",
      "ocean",
      "waterfall",
      "desert",
      "landscape",
      "nature",
    ],
  },
  {
    tag: "city",
    keywords: [
      "city",
      "urban",
      "street",
      "downtown",
      "skyline",
      "metro",
      "nightlife",
    ],
  },
  {
    tag: "travel",
    keywords: ["travel", "trip", "vacation", "journey", "tour"],
  },
  {
    tag: "art",
    keywords: ["art", "painting", "sketch", "design", "illustration"],
  },
  {
    tag: "technology",
    keywords: ["tech", "technology", "robot", "ai", "digital", "device"],
  },
  {
    tag: "food",
    keywords: ["food", "cuisine", "meal", "dish", "drink", "dessert"],
  },
];

const EXTENSION_TAGS: Record<string, string> = {
  gif: "gif",
  webp: "web",
  png: "graphic",
  jpg: "photo",
  jpeg: "photo",
  mp4: "video",
  mov: "video",
  webm: "video",
};

const AUTO_TAG_VERSION = 1;

export type AutoTagResult = {
  id: string;
  tags: string[];
  matchedKeywords: string[];
};

export function deriveAutoTags(item: GalleryItem): AutoTagResult {
  const src = item.src.toLowerCase();
  const base = src.split("/").pop() ?? "";
  const stem = base.replace(/\.[a-z0-9]+$/, "");
  const words = stem.split(/[^a-z0-9]+/).filter(Boolean);
  const haystack = new Set<string>([
    ...words,
    base,
    stem,
    src,
    item.type,
  ]);

  const discovered = new Set<string>();
  const matchedKeywords: string[] = [];

  KEYWORD_TAGS.forEach(({ tag, keywords }) => {
    for (const keyword of keywords) {
      if (haystackHas(haystack, keyword)) {
        discovered.add(tag);
        matchedKeywords.push(keyword);
        break;
      }
    }
  });

  const ext = base.split(".").pop();
  if (ext) {
    const extTag = EXTENSION_TAGS[ext];
    if (extTag) {
      discovered.add(extTag);
    }
  }

  if (item.type === "video") {
    discovered.add("video");
  } else if (item.type === "image") {
    discovered.add("image");
  }

  return {
    id: item.id,
    tags: Array.from(discovered),
    matchedKeywords,
  };
}

function haystackHas(haystack: Set<string>, keyword: string) {
  if (haystack.has(keyword)) return true;
  for (const candidate of haystack) {
    if (candidate.includes(keyword)) return true;
  }
  return false;
}

export type AutoTagMeta = {
  version: number;
  updatedAt: string;
  tags: string[];
};

export { AUTO_TAG_VERSION };
