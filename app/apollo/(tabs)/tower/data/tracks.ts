export type Module = {
  id: string;
  title: string;
  summary: string;
  lessons: number;
  projects: number;
};

export type Track = {
  id: string;
  title: string;
  description: string;
  modules: Module[];
};

function modules(prefix: string, data: Array<Omit<Module, "id">>): Module[] {
  return data.map((module, index) => ({
    id: `${prefix}-m${index + 1}`,
    ...module,
  }));
}

export const tracks: Track[] = [
  {
    id: "html-css",
    title: "HTML & CSS",
    description:
      "Master web fundamentals with semantic HTML and modern CSS. Build accessible, responsive, and beautifully styled web pages.",
    modules: modules("html-css", [
      // HTML Fundamentals
      {
        title: "Introduction to HTML",
        summary: "Document structure, elements, and basic syntax",
        lessons: 8,
        projects: 1,
      },
      {
        title: "Semantic Structure",
        summary: "Semantic tags, landmarks, and accessibility",
        lessons: 12,
        projects: 1,
      },
      {
        title: "Text & Lists",
        summary: "Text content, headings, lists, and navigation",
        lessons: 10,
        projects: 1,
      },
      {
        title: "Links & Media",
        summary: "Hyperlinks, images, media elements with proper attributes",
        lessons: 8,
        projects: 1,
      },
      // CSS Fundamentals
      {
        title: "CSS Basics",
        summary: "Selectors, properties, cascade, and specificity",
        lessons: 15,
        projects: 2,
      },
      {
        title: "Box Model & Layout",
        summary: "Box model, display types, positioning",
        lessons: 12,
        projects: 1,
      },
      {
        title: "Flexbox Layout",
        summary: "Flexible box layout for modern web design",
        lessons: 10,
        projects: 2,
      },
      {
        title: "CSS Grid",
        summary: "Grid layout system for complex interfaces",
        lessons: 12,
        projects: 2,
      },
      // Advanced Topics
      {
        title: "Forms & Validation",
        summary: "Form controls, styling, and validation",
        lessons: 15,
        projects: 2,
      },
      {
        title: "Responsive Design",
        summary: "Media queries, flexible layouts, mobile-first approach",
        lessons: 12,
        projects: 2,
      },
      {
        title: "CSS Architecture",
        summary: "Organization, methodology, and best practices",
        lessons: 10,
        projects: 1,
      },
      {
        title: "Animations & Effects",
        summary: "Transforms, transitions, and animations",
        lessons: 8,
        projects: 1,
      },
    ]),
  },
  {
    id: "js",
    title: "JavaScript",
    description:
      "Fluency with the language, the DOM, async flow, and modular patterns across the stack.",
    modules: modules("js", [
      {
        title: "Language foundations",
        summary: "Syntax, data structures, and functions.",
        lessons: 22,
        projects: 2,
      },
      {
        title: "DOM & events",
        summary: "Manipulate the browser, handle input, and render state.",
        lessons: 18,
        projects: 2,
      },
      {
        title: "Async & APIs",
        summary: "Promises, fetch, and data-driven UI.",
        lessons: 14,
        projects: 2,
      },
      {
        title: "Architecture",
        summary: "Modules, bundlers, and testing fundamentals.",
        lessons: 10,
        projects: 1,
      },
    ]),
  },
  {
    id: "tailwind",
    title: "Tailwind",
    description:
      "Move fast with utility-first styling, design tokens, and component systems.",
    modules: modules("tailwind", [
      {
        title: "Utility mindset",
        summary: "Compose interfaces with small classes.",
        lessons: 12,
        projects: 2,
      },
      {
        title: "Design systems",
        summary: "Tokens, theming, and multi-brand styling.",
        lessons: 8,
        projects: 1,
      },
      {
        title: "Components",
        summary: "Reusable UI primitives, responsive patterns, and dark mode.",
        lessons: 9,
        projects: 1,
      },
    ]),
  },
  {
    id: "git",
    title: "Git & CLI",
    description:
      "Version control discipline and automation on the command line.",
    modules: modules("git", [
      {
        title: "Everyday Git",
        summary: "Commits, branches, and pull requests.",
        lessons: 10,
        projects: 1,
      },
      {
        title: "Collaboration",
        summary: "Rebase, bisect, and clean history.",
        lessons: 8,
        projects: 1,
      },
      {
        title: "CLI automation",
        summary: "Shell, scripts, and dotfiles that speed you up.",
        lessons: 9,
        projects: 1,
      },
    ]),
  },
  {
    id: "react",
    title: "React",
    description: "Component-driven thinking, hooks, and modern state patterns.",
    modules: modules("react", [
      {
        title: "Components",
        summary: "JSX, props, and composability.",
        lessons: 14,
        projects: 2,
      },
      {
        title: "Hooks",
        summary: "State, effects, memoization.",
        lessons: 12,
        projects: 2,
      },
      {
        title: "Architecture",
        summary: "Routing, data fetching, and testing.",
        lessons: 9,
        projects: 1,
      },
    ]),
  },
  {
    id: "next",
    title: "Next.js",
    description:
      "App Router layouts, server components, streaming data, and deployment-ready flows.",
    modules: modules("next", [
      {
        title: "Routing & layouts",
        summary: "App Router, nested UI, and shared state.",
        lessons: 11,
        projects: 1,
      },
      {
        title: "Server components",
        summary: "Data fetching, streaming, and caching.",
        lessons: 10,
        projects: 1,
      },
      {
        title: "Deploy & monitor",
        summary: "Vercel, envs, and observability.",
        lessons: 8,
        projects: 1,
      },
    ]),
  },
  {
    id: "node",
    title: "Node.js",
    description:
      "From scripts to services: build APIs, workers, and backend tooling on the V8 runtime.",
    modules: modules("node", [
      {
        title: "Runtime basics",
        summary: "Modules, npm, and tooling.",
        lessons: 12,
        projects: 1,
      },
      {
        title: "APIs",
        summary: "Express, routing, and persistence.",
        lessons: 15,
        projects: 2,
      },
      {
        title: "Workers",
        summary: "Queues, schedulers, and automation scripts.",
        lessons: 9,
        projects: 1,
      },
    ]),
  },
];
