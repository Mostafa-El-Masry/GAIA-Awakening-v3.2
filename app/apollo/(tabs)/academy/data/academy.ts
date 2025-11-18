export type LessonLevel = "beginner" | "intermediate" | "advanced";

export type Lesson = {
  id: string;
  title: string;
  summary: string;
  level: LessonLevel;
  type?: "project" | "lesson";
  body: string;
};

export type Section = {
  id: string;
  title: string;
  level: LessonLevel;
  lessons: Lesson[];
};

export type LearningPath = {
  id: string;
  title: string;
  overview: string;
  description: string;
  sections: Section[];
};

export type MicroConcept = {
  id: string;
  nodeId: string;
  trackId: string;
  trackTitle: string;
  title: string;
  lesson: string;
};

/**
 * HTML & CSS curriculum (compact). Bodies are left empty to keep this file
 * syntactically simple - the Academy UI can populate lesson bodies.
 */
const sections: Section[] = [
  {
    id: "html-css-m1",
    title: "HTML Foundations",
    level: "beginner",
    lessons: [
      {
        id: "html-css-m1-l1",
        title: "HTML, CSS & JavaScript overview",
        summary: "How HTML, CSS, and JavaScript work together to build a page.",
        level: "beginner",
        type: "lesson",
        body: "",
      },
      {
        id: "html-css-m1-l2",
        title: "Elements and tags",
        summary: "Understanding elements, tags, and how they form a DOM tree.",
        level: "beginner",
        type: "lesson",
        body: "",
      },
      {
        id: "html-css-m1-l3",
        title: "HTML boilerplate & document structure",
        summary: "The minimum HTML needed for a valid document, and how it is structured.",
        level: "beginner",
        type: "lesson",
        body: "",
      },
    ],
  },
  {
    id: "html-css-m2",
    title: "Semantic HTML & Accessibility Basics",
    level: "beginner",
    lessons: [
      {
        id: "html-css-m2-l1",
        title: "Introduction to web accessibility",
        summary: "Why accessibility matters and who benefits from it.",
        level: "beginner",
        type: "lesson",
        body: "",
      },
    ],
  },
];

export const htmlCssPath: LearningPath = {
  id: "foundations-html-css",
  title: "Foundations: HTML & CSS",
  overview:
    "A step-by-step path through semantic HTML and modern CSS, from the very basics up to responsive design and animations.",
  description:
    "Use this path as your personal HTML & CSS curriculum inside Apollo. Each lesson card links to a detailed explanation and a live playground. You can edit titles and bodies from the Academy UI and add extra sections for anything you want to track.",
  sections,
};

export const concepts: MicroConcept[] = htmlCssPath.sections.flatMap((section) =>
  section.lessons.map((lesson) => ({
    id: `${section.id}-${lesson.id}`,
    nodeId: `${section.id}-${lesson.id}`,
    trackId: section.id,
    trackTitle: section.title,
    title: lesson.title,
    lesson: lesson.summary,
  }))
);
