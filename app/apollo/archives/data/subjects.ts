export type Lesson = { id: string; title: string; summary: string; teachable?: boolean };

export type Subject = {
  id: string;
  title: string;
  trackId: string;
  trackTitle: string;
  lessons: Lesson[];
  overview?: string;
  logs?: string[];
  tricks?: string[];
};

export const subjects: Subject[] = [
  {
    id: "html",
    title: "HTML",
    trackId: "html",
    trackTitle: "HTML",
    overview: "Semantic HTML, forms, and media elements. This is the base layer for everything else you build.",
    logs: [
      "Re-learned the core semantic tags instead of relying on generic <div> blocks.",
      "Practiced building small layouts using header, nav, main, section, and footer only.",
      "Connected HTML forms to the real use‑cases I have in GAIA (search, login, small tools)."
    ],
    tricks: [
      "Always pair form controls with <label> and use the for/id attributes for accessibility.",
      "Prefer semantic containers (main, section, article, aside) before adding extra wrappers.",
      "Images: set meaningful alt text or explicit alt=\"\" when the image is purely decorative."
    ],
    lessons: [
      { id: "html-001", title: "Semantic tags", summary: "header, nav, main, section, article, aside, footer" },
      { id: "html-002", title: "Forms basics", summary: "label, input, textarea, select, button, accessibility" },
      { id: "html-003", title: "Media elements", summary: "<img>, <picture>, <video>, <audio>, responsive sources" }
    ]
  },
  {
    id: "css",
    title: "CSS",
    trackId: "css",
    trackTitle: "CSS",
    overview: "Styling, layout, and responsive behavior. The goal is clean, predictable styles instead of chaos.",
    logs: [
      "Revisited how the cascade and specificity really work instead of guessing.",
      "Practiced building layouts with Flexbox first, then re‑building them using Grid.",
      "Experimented with a small design system mindset: spacing, typography, and colors as tokens."
    ],
    tricks: [
      "Start debugging layout issues by temporarily adding outline: 1px solid red; to key containers.",
      "Use minmax() and repeat() with CSS Grid to avoid hard‑coding too many breakpoints.",
      "Keep utility classes grouped logically (spacing, layout, color) so styles stay readable."
    ],
    lessons: [
      { id: "css-001", title: "Cascade & specificity", summary: "origin, importance, specificity, order" },
      { id: "css-002", title: "Layout systems", summary: "flexbox vs grid, when to use which" },
      { id: "css-003", title: "Responsive design", summary: "breakpoints, fluid units, clamp()" }
    ]
  },
  {
    id: "js",
    title: "JavaScript",
    trackId: "js",
    trackTitle: "JavaScript",
    overview: "The language that powers interactions in GAIA: data flows, state, and small utilities.",
    logs: [
      "Brushed up on the differences between const, let, and var in real code.",
      "Practiced array and object methods (map, filter, reduce, Object.entries) on GAIA‑like data.",
      "Linked async/await to real tasks like loading JSON from local storage or APIs."
    ],
    tricks: [
      "Prefer const by default; switch to let only when you truly need reassignment.",
      "Use Array.map and Array.filter instead of manual for loops when transforming collections.",
      "Wrap small async flows in try/catch and log errors with enough context to debug later."
    ],
    lessons: [
      { id: "js-001", title: "Language basics", summary: "values, types, let/const, truthy/falsy" },
      { id: "js-002", title: "Functions & closures", summary: "function scope, closures, arrow functions" },
      { id: "js-003", title: "Async basics", summary: "promises, async/await, basic error handling" }
    ]
  },
  {
    id: "tailwind",
    title: "Tailwind CSS",
    trackId: "tailwind",
    trackTitle: "Tailwind CSS",
    overview: "Utility‑first styling for GAIA. The goal is fast iteration with classes instead of huge CSS files.",
    logs: [
      "Re‑created a simple layout using only Tailwind utilities instead of writing custom CSS.",
      "Practiced extracting repeated class sets into components instead of copy‑pasting everywhere.",
      "Mapped Tailwind spacing and font sizes to how I actually want GAIA to feel and read."
    ],
    tricks: [
      "Group related utilities by category: layout first, then spacing, then colors and typography.",
      "Use responsive prefixes (sm:, md:, lg:) sparingly and with intention, not on every class.",
      "Remember that Tailwind is just CSS: when something feels impossible, you can still drop to raw CSS if needed."
    ],
    lessons: [
      { id: "tw-001", title: "Core utilities", summary: "spacing, colors, typography, borders" },
      { id: "tw-002", title: "Responsive utilities", summary: "breakpoints, stacking vs side‑by‑side layouts" },
      { id: "tw-003", title: "Composition patterns", summary: "extracting components, keeping classes readable" }
    ]
  },
  {
    id: "git-cli",
    title: "Git & CLI",
    trackId: "git-cli",
    trackTitle: "Git & CLI",
    overview: "Version control plus command line basics — the safety net for GAIA changes.",
    logs: [
      "Reviewed the core Git cycle: status → add → commit → log.",
      "Practiced branching and merging on small experiments instead of inside the main GAIA branch.",
      "Got more comfortable with using the shell to navigate, list files, and run scripts."
    ],
    tricks: [
      "Write commit messages that explain *why* the change happened, not just *what* changed.",
      "Use git status and git diff before every commit to catch accidental changes.",
      "When stuck, create a throwaway branch or stash instead of hacking directly on main."
    ],
    lessons: [
      { id: "git-001", title: "Git basics", summary: "init, status, add, commit, log" },
      { id: "git-002", title: "Branching", summary: "branch, checkout, merge, resolving conflicts" },
      { id: "git-003", title: "CLI comfort", summary: "ls, cd, mkdir, rm, running scripts" }
    ]
  },
  {
    id: "react",
    title: "React",
    trackId: "react",
    trackTitle: "React",
    overview: "Component‑based UI for GAIA’s interactive pieces (Dashboard, Health, Wealth, Gallery).",
    logs: [
      "Revised how props and state flow through small components.",
      "Practiced splitting one large component into smaller presentational pieces.",
      "Connected React hooks (useState, useEffect) to real GAIA behaviors like reading local storage."
    ],
    tricks: [
      "Start components as pure functions of props; add state only when needed.",
      "Lift state up only when multiple children truly need to share it.",
      "Use useEffect for effects, not for general logic that could run during render."
    ],
    lessons: [
      { id: "react-001", title: "Components & props", summary: "function components, props, JSX basics" },
      { id: "react-002", title: "State & effects", summary: "useState, useEffect, handling side effects" },
      { id: "react-003", title: "Composition", summary: "children, composition vs inheritance" }
    ]
  },
  {
    id: "next",
    title: "Next.js",
    trackId: "next",
    trackTitle: "Next.js",
    overview: "The framework GAIA is built on: App Router, data fetching, and routing.",
    logs: [
      "Revisited how layouts and nested routes in the App Router map to the GAIA tree.",
      "Practiced moving simple logic from client components to server components where possible.",
      "Mapped Next.js data fetching strategies to GAIA: static, dynamic, and revalidated data."
    ],
    tricks: [
      "Use the App Router layouts to keep shared chrome (like the App Bar) in one place.",
      "Keep server components default; add 'use client' only when you really need client behavior.",
      "Be explicit about revalidate times when fetching remote data to avoid surprises."
    ],
    lessons: [
      { id: "next-001", title: "App Router", summary: "server-first, layouts, nested routes" },
      { id: "next-002", title: "Data fetching", summary: "fetch cache, revalidate, streaming" },
      { id: "next-003", title: "Static assets & images", summary: "public/, next/image basics" }
    ]
  },
  {
    id: "node",
    title: "Node.js",
    trackId: "node",
    trackTitle: "Node.js",
    overview: "Backend runtime for tooling, scripts, and any future GAIA servers or CLIs.",
    logs: [
      "Got comfortable with importing and exporting modules using modern ES module syntax.",
      "Used fs/promises to read and write simple JSON files as if they were tiny databases.",
      "Explored how environment variables can store secrets and configuration outside the code."
    ],
    tricks: [
      "Always handle errors when working with the file system — failed reads and writes happen.",
      "Use process.env for configuration instead of hard‑coding secrets in the source.",
      "Add small CLI flags (like --dry-run) when writing scripts so you can test safely."
    ],
    lessons: [
      { id: "node-001", title: "Modules (ESM)", summary: "import/export, top-level await" },
      { id: "node-002", title: "FS & streams", summary: "fs/promises, readable/writable streams" },
      { id: "node-003", title: "Process & env", summary: "process.env, argv, exit codes" }
    ]
  }
];
