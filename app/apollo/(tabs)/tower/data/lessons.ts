export type LessonResource = {
  label: string;
  url: string;
};

export type LessonDetail = {
  id: string;
  title: string;
  summary: string;
  type?: "lesson" | "project";
  duration?: string;
  url?: string;
  resources?: LessonResource[];
  body?: string;
};

export type LessonCatalog = Record<string, LessonDetail[]>;

import { lessonBodies } from "./lessonBodies";

const CURRICULUM = "https://github.com/TheOdinProject/curriculum/blob/main";

const resourceLink = (path: string) => `${CURRICULUM}/${path}`;

export const htmlLessons: LessonCatalog = {
  "html-css-m1": [
    {
      id: "html-css-m1-l1",
      title: "HTML, CSS & JavaScript overview",
      summary:
        "Get the big-picture story of how markup, styles, and behavior work together before you dive into the details.",
      duration: "10 min",
      url: resourceLink(
        "foundations/html_css/html-foundations/intro-to-html-css.md"
      ),
      body: lessonBodies["html-css-m1-l1"],
    },
    {
      id: "html-css-m1-l2",
      title: "Elements & tags",
      summary:
        "Learn the anatomy of an element, how nested tags create document structure, and why semantics matter from day one.",
      duration: "15 min",
      url: resourceLink(
        "foundations/html_css/html-foundations/elements-and-tags.md"
      ),
      body: lessonBodies["html-css-m1-l2"],
    },
    {
      id: "html-css-m1-l3",
      title: "HTML boilerplate",
      summary:
        "Build the minimal document with DOCTYPE, <html>, <head>, and <body> plus the metadata every page should ship with.",
      duration: "15 min",
      url: resourceLink(
        "foundations/html_css/html-foundations/html-boilerplate.md"
      ),
      body: lessonBodies["html-css-m1-l3"],
    },
    {
      id: "html-css-m1-l4",
      title: "Inspecting markup with DevTools",
      summary:
        "Use the Elements panel to live-edit nodes, experiment with CSS, and understand how the browser renders your work.",
      duration: "15 min",
      url: resourceLink(
        "foundations/html_css/css-foundations/inspecting-html-and-css.md"
      ),
      body: lessonBodies["html-css-m1-l4"],
    },
    {
      id: "html-css-m1-l5",
      title: "Document head & metadata",
      summary:
        "Wire up meta tags, favicons, and social previews so your documents describe themselves before any body content loads.",
      duration: "12 min",
      url: "https://developer.mozilla.org/docs/Learn/HTML/Introduction_to_HTML/The_head_metadata_in_HTML",
      body: lessonBodies["html-css-m1-l5"],
    },
    {
      id: "html-css-m1-l6",
      title: "Attributes & global defaults",
      summary:
        "Tour the most useful global attributes, learn when to reach for ARIA roles, and avoid smells like empty anchors.",
      duration: "12 min",
      url: "https://developer.mozilla.org/docs/Web/HTML/Global_attributes",
      body: lessonBodies["html-css-m1-l6"],
    },
    {
      id: "html-css-m1-l7",
      title: "Emmet & productivity",
      summary:
        "Adopt shorthand like nav>ul>li*3>a to scaffold documents in seconds and keep repetitive markup out of your way.",
      duration: "10 min",
      url: resourceLink(
        "intermediate_html_css/intermediate_html_concepts/emmet.md"
      ),
      body: lessonBodies["html-css-m1-l7"],
    },
    {
      id: "html-css-m1-l8",
      title: "Project: Recipes",
      summary:
        "Recreate the classic Odin Project recipe site to cement boilerplate, semantic grouping, and relative linking.",
      duration: "1.5 hrs",
      type: "project",
      url: resourceLink(
        "foundations/html_css/html-foundations/project-recipes.md"
      ),
      body: lessonBodies["html-css-m1-l8"],
    },
  ],
  "html-css-m2": [
    {
      id: "html-css-m2-l1",
      title: "Introduction to web accessibility",
      summary:
        "Understand why accessibility is non-negotiable, the assistive tech ecosystem, and the mindset for inclusive UI.",
      duration: "12 min",
      url: resourceLink(
        "advanced_html_css/accessibility/introduction_to_web_accessibility.md"
      ),
    },
    {
      id: "html-css-m2-l2",
      title: "Semantic HTML",
      summary:
        "Map content to the right landmark elements so screen readers, search engines, and teammates get structure for free.",
      duration: "18 min",
      url: resourceLink("advanced_html_css/accessibility/semantic_html.md"),
    },
    {
      id: "html-css-m2-l3",
      title: "Meaningful text & landmarks",
      summary:
        "Author headings, buttons, and link text that make sense out of context and reinforce the document outline.",
      duration: "14 min",
      url: resourceLink("advanced_html_css/accessibility/meaningful_text.md"),
    },
    {
      id: "html-css-m2-l4",
      title: "WAI-ARIA fundamentals",
      summary:
        "Augment semantics with ARIA roles, states, and properties—only when native HTML cannot express intent.",
      duration: "15 min",
      url: resourceLink("advanced_html_css/accessibility/wai_aria.md"),
    },
    {
      id: "html-css-m2-l5",
      title: "Keyboard navigation",
      summary:
        "Keep experiences operable with tabindex, focus management, and skip links that mirror Odin Project behavior.",
      duration: "10 min",
      url: resourceLink(
        "advanced_html_css/accessibility/keyboard_navigation.md"
      ),
    },
    {
      id: "html-css-m2-l6",
      title: "Accessibility auditing",
      summary:
        "Practice using Lighthouse, manual screen reader passes, and color contrast tooling to catch regressions early.",
      duration: "16 min",
      url: resourceLink(
        "advanced_html_css/accessibility/accessibility_auditing.md"
      ),
    },
    {
      id: "html-css-m2-l7",
      title: "WCAG in practice",
      summary:
        "Translate WCAG AA checkpoints into actionable checklists you can run per feature, not just per release.",
      duration: "15 min",
      url: resourceLink(
        "advanced_html_css/accessibility/the_web_content_accessibility_guidelines_wcag.md"
      ),
    },
    {
      id: "html-css-m2-l8",
      title: "Project: Ship an accessibility audit",
      summary:
        "Pick an existing project, document blocking issues, and propose fixes—mirroring the Odin accessibility assignment.",
      duration: "2 hrs",
      type: "project",
      url: resourceLink(
        "advanced_html_css/accessibility/accessibility_auditing.md"
      ),
    },
  ],
  "html-css-m3": [
    {
      id: "html-css-m3-l1",
      title: "Working with text",
      summary:
        "Craft headings, paragraphs, emphasis, and inline elements that read well and remain accessible.",
      duration: "12 min",
      url: resourceLink(
        "foundations/html_css/html-foundations/working-with-text.md"
      ),
    },
    {
      id: "html-css-m3-l2",
      title: "Lists & navigation patterns",
      summary:
        "Structure ordered, unordered, and description lists plus navigation menus that anchor your document outline.",
      duration: "12 min",
      url: resourceLink("foundations/html_css/html-foundations/lists.md"),
    },
    {
      id: "html-css-m3-l3",
      title: "Typography & rhythm",
      summary:
        "Dial in font stacks, line length, spacing, and responsive scale so long-form content feels intentional.",
      duration: "18 min",
      url: resourceLink(
        "intermediate_html_css/intermediate_css_concepts/more_text_styles.md"
      ),
    },
    {
      id: "html-css-m3-l4",
      title: "Default browser styles",
      summary:
        "Inspect UA style sheets, normalize what you need, and avoid wasting time fighting the cascade.",
      duration: "10 min",
      url: resourceLink(
        "intermediate_html_css/intermediate_css_concepts/default_styles.md"
      ),
    },
    {
      id: "html-css-m3-l5",
      title: "CSS units & scale",
      summary:
        "Mix rem, ch, and viewport units to keep typography fluid without sacrificing control.",
      duration: "14 min",
      url: resourceLink(
        "intermediate_html_css/intermediate_css_concepts/css_units.md"
      ),
    },
    {
      id: "html-css-m3-l6",
      title: "Project: Editorial style guide",
      summary:
        "Document the heading scale, text utilities, and list styles you expect to reuse across future Odin challenges.",
      duration: "90 min",
      type: "project",
      url: resourceLink(
        "intermediate_html_css/intermediate_css_concepts/more_text_styles.md"
      ),
    },
  ],
  "html-css-m4": [
    {
      id: "html-css-m4-l1",
      title: "Links & media attributes",
      summary:
        "Master anchor attributes, download links, image alt text, and figure captions for richer documents.",
      duration: "15 min",
      url: resourceLink(
        "foundations/html_css/html-foundations/links-and-images.md"
      ),
    },
    {
      id: "html-css-m4-l2",
      title: "Responsive images",
      summary:
        "Use srcset, sizes, and <picture> to ship the right asset per breakpoint without manual swaps.",
      duration: "15 min",
      url: resourceLink(
        "advanced_html_css/responsive_design/responsive_images.md"
      ),
    },
    {
      id: "html-css-m4-l3",
      title: "Embedding audio & video",
      summary:
        "Choose between <audio>, <video>, iframes, and third-party players while keeping controls accessible.",
      duration: "12 min",
      url: "https://developer.mozilla.org/docs/Learn/HTML/Multimedia_and_embedding",
    },
    {
      id: "html-css-m4-l4",
      title: "Navigation states & focus",
      summary:
        "Style hover, focus-visible, and aria-current states so navigation stays obvious for mouse and keyboard users.",
      duration: "10 min",
      url: "https://developer.mozilla.org/docs/Web/CSS/:focus-visible",
    },
    {
      id: "html-css-m4-l5",
      title: "Project: Media-rich home page",
      summary:
        "Compose a hero, gallery, and resource list that mixes links, video embeds, and download CTAs.",
      duration: "2 hrs",
      type: "project",
      url: resourceLink(
        "advanced_html_css/responsive_design/project_homepage.md"
      ),
    },
  ],
  "html-css-m5": [
    {
      id: "html-css-m5-l1",
      title: "Intro to CSS",
      summary:
        "Connect selectors to declarations, understand how the cascade resolves conflicts, and scope your first styles.",
      duration: "15 min",
      url: resourceLink("foundations/html_css/css-foundations/intro-to-css.md"),
    },
    {
      id: "html-css-m5-l2",
      title: "The cascade & inheritance",
      summary:
        "Trace how specificity, source order, and !important interact so you fix bugs without hacks.",
      duration: "15 min",
      url: resourceLink("foundations/html_css/css-foundations/the-cascade.md"),
    },
    {
      id: "html-css-m5-l3",
      title: "CSS units",
      summary:
        "Balance absolute, relative, and viewport units to keep spacing predictable across devices.",
      duration: "12 min",
      url: resourceLink(
        "intermediate_html_css/intermediate_css_concepts/css_units.md"
      ),
    },
    {
      id: "html-css-m5-l4",
      title: "Default styles & resets",
      summary:
        "Decide when to use a reset, a normalize, or custom layer order to tame user-agent styles.",
      duration: "12 min",
      url: resourceLink(
        "intermediate_html_css/intermediate_css_concepts/default_styles.md"
      ),
    },
    {
      id: "html-css-m5-l5",
      title: "CSS functions",
      summary:
        "Leverage calc(), clamp(), and color-mix() to encode intent instead of magic numbers.",
      duration: "15 min",
      url: resourceLink(
        "intermediate_html_css/intermediate_css_concepts/css_functions.md"
      ),
    },
    {
      id: "html-css-m5-l6",
      title: "Project: Utility reference",
      summary:
        "Create a quick-reference page of spacing, color, and typography utilities you can paste into future Odin work.",
      duration: "90 min",
      type: "project",
      url: resourceLink(
        "intermediate_html_css/intermediate_css_concepts/more_css_properties.md"
      ),
    },
  ],
  "html-css-m6": [
    {
      id: "html-css-m6-l1",
      title: "Block, inline, and inline-block",
      summary:
        "Control how elements participate in normal flow so you know when to reach for layout primitives.",
      duration: "12 min",
      url: resourceLink(
        "foundations/html_css/css-foundations/block-and-inline.md"
      ),
    },
    {
      id: "html-css-m6-l2",
      title: "The box model",
      summary:
        "Master content, padding, border, and margin plus box-sizing strategies for predictable measurements.",
      duration: "15 min",
      url: resourceLink(
        "foundations/html_css/css-foundations/the-box-model.md"
      ),
    },
    {
      id: "html-css-m6-l3",
      title: "Positioning systems",
      summary:
        "Compare static, relative, absolute, fixed, and sticky positioning to solve real UI constraints.",
      duration: "15 min",
      url: resourceLink(
        "intermediate_html_css/intermediate_css_concepts/positioning.md"
      ),
    },
    {
      id: "html-css-m6-l4",
      title: "Browser compatibility",
      summary:
        "Use @supports, feature queries, and progressive enhancement to keep layouts resilient.",
      duration: "12 min",
      url: resourceLink(
        "intermediate_html_css/intermediate_css_concepts/browser_compatibility.md"
      ),
    },
    {
      id: "html-css-m6-l5",
      title: "Project: Layout debugger",
      summary:
        "Instrument a sandbox page that surfaces outlines, spacing overlays, and z-index stacking to diagnose bugs fast.",
      duration: "75 min",
      type: "project",
      url: resourceLink(
        "foundations/html_css/css-foundations/the-box-model.md"
      ),
    },
  ],
  "html-css-m7": [
    {
      id: "html-css-m7-l1",
      title: "Flexbox introduction",
      summary:
        "Learn the parent/child terminology, axes, and mental model that make Flexbox feel intuitive.",
      duration: "12 min",
      url: resourceLink("foundations/html_css/flexbox/flexbox-intro.md"),
    },
    {
      id: "html-css-m7-l2",
      title: "Flexbox axes",
      summary:
        "Control main-axis and cross-axis alignment to build responsive rows and columns.",
      duration: "12 min",
      url: resourceLink("foundations/html_css/flexbox/flexbox-axes.md"),
    },
    {
      id: "html-css-m7-l3",
      title: "Grow, shrink, basis",
      summary:
        "Use flex-grow, flex-shrink, and flex-basis to keep cards adaptive without media queries.",
      duration: "15 min",
      url: resourceLink(
        "foundations/html_css/flexbox/flexbox-growing-and-shrinking.md"
      ),
    },
    {
      id: "html-css-m7-l4",
      title: "Flex alignment patterns",
      summary:
        "Compose gaps, wrapping, and alignment utilities for navbars, dashboards, and hero layouts.",
      duration: "14 min",
      url: resourceLink("foundations/html_css/flexbox/flexbox-alignment.md"),
    },
    {
      id: "html-css-m7-l5",
      title: "Project: Landing page",
      summary:
        "Ship the Odin landing page clone to prove you can mix flex utilities, typography, and buttons at scale.",
      duration: "2 hrs",
      type: "project",
      url: resourceLink("foundations/html_css/flexbox/project-landing-page.md"),
    },
  ],
  "html-css-m8": [
    {
      id: "html-css-m8-l1",
      title: "Introduction to CSS Grid",
      summary:
        "Meet grid containers, tracks, and the mental model for two-dimensional layout.",
      duration: "12 min",
      url: resourceLink("intermediate_html_css/grid/introduction_to_grid.md"),
    },
    {
      id: "html-css-m8-l2",
      title: "Creating a grid",
      summary:
        "Define repeat() patterns, fractions, and minmax() so templates stay flexible.",
      duration: "14 min",
      url: resourceLink("intermediate_html_css/grid/creating_a_grid.md"),
    },
    {
      id: "html-css-m8-l3",
      title: "Positioning grid elements",
      summary:
        "Place items by line number, name, or area to build dashboards and marketing layouts quickly.",
      duration: "15 min",
      url: resourceLink(
        "intermediate_html_css/grid/positioning_grid_elements.md"
      ),
    },
    {
      id: "html-css-m8-l4",
      title: "Flexbox + grid handoff",
      summary:
        "Blend both layout systems to solve awkward edge cases and keep markup minimal.",
      duration: "12 min",
      url: resourceLink("intermediate_html_css/grid/using_flexbox_and_grid.md"),
    },
    {
      id: "html-css-m8-l5",
      title: "Project: Admin dashboard",
      summary:
        "Recreate the Odin admin dashboard brief with cards, activity feeds, and sidebar navigation.",
      duration: "2.5 hrs",
      type: "project",
      url: resourceLink(
        "intermediate_html_css/grid/project_admin_dashboard.md"
      ),
    },
  ],
  "html-css-m9": [
    {
      id: "html-css-m9-l1",
      title: "Form basics",
      summary:
        "Structure labels, inputs, and groups with the right attributes so data flows cleanly.",
      duration: "15 min",
      url: resourceLink("intermediate_html_css/forms/form_basics.md"),
    },
    {
      id: "html-css-m9-l2",
      title: "Validation UX",
      summary:
        "Use HTML validation attributes, Constraint API, and inline hints to keep forms friendly.",
      duration: "15 min",
      url: resourceLink("intermediate_html_css/forms/form_validations.md"),
    },
    {
      id: "html-css-m9-l3",
      title: "Accessible colors",
      summary:
        "Check contrast ratios, states, and error messaging so forms remain legible for everyone.",
      duration: "12 min",
      url: resourceLink("advanced_html_css/accessibility/accessible_colors.md"),
    },
    {
      id: "html-css-m9-l4",
      title: "Project: Sign-up form",
      summary:
        "Design and build the Odin sign-up brief with validation, helper text, and a responsive layout.",
      duration: "2 hrs",
      type: "project",
      url: resourceLink("intermediate_html_css/forms/project_sign_up_form.md"),
    },
  ],
  "html-css-m10": [
    {
      id: "html-css-m10-l1",
      title: "Intro to responsive design",
      summary:
        "Adopt a mobile-first mindset, fluid grids, and content choreography strategies.",
      duration: "12 min",
      url: resourceLink(
        "advanced_html_css/responsive_design/introduction_to_responsive_design.md"
      ),
    },
    {
      id: "html-css-m10-l2",
      title: "Natural responsiveness",
      summary:
        "Lean on intrinsic sizing, max-width, and modern units before writing a single media query.",
      duration: "12 min",
      url: resourceLink(
        "advanced_html_css/responsive_design/natural_responsiveness.md"
      ),
    },
    {
      id: "html-css-m10-l3",
      title: "Media queries",
      summary:
        "Target breakpoints with clamp(), prefers-reduced-motion, and container-aware thinking.",
      duration: "15 min",
      url: resourceLink("advanced_html_css/responsive_design/media_queries.md"),
    },
    {
      id: "html-css-m10-l4",
      title: "Project: Personal portfolio",
      summary:
        "Ship a multi-breakpoint portfolio drawing from Odin's responsive design brief.",
      duration: "3 hrs",
      type: "project",
      url: resourceLink(
        "advanced_html_css/responsive_design/project_personal_portfolio.md"
      ),
    },
  ],
  "html-css-m11": [
    {
      id: "html-css-m11-l1",
      title: "Custom properties",
      summary:
        "Create design tokens for color, spacing, and typography that unlock dynamic themes.",
      duration: "15 min",
      url: resourceLink(
        "intermediate_html_css/intermediate_css_concepts/custom_properties.md"
      ),
    },
    {
      id: "html-css-m11-l2",
      title: "Frameworks & preprocessors",
      summary:
        "Compare Sass, PostCSS, and utility-first workflows so you pick the right tool for each project.",
      duration: "15 min",
      url: resourceLink(
        "intermediate_html_css/intermediate_css_concepts/frameworks_and_preprocessors.md"
      ),
    },
    {
      id: "html-css-m11-l3",
      title: "CSS functions & helpers",
      summary:
        "Go deeper on calc(), clamp(), min(), max(), and color helpers for reusable architectures.",
      duration: "12 min",
      url: resourceLink(
        "intermediate_html_css/intermediate_css_concepts/css_functions.md"
      ),
    },
    {
      id: "html-css-m11-l4",
      title: "Project: Design system audit",
      summary:
        "Document tokens, utilities, and component primitives to keep future Odin work consistent.",
      duration: "2 hrs",
      type: "project",
      url: resourceLink(
        "intermediate_html_css/intermediate_css_concepts/frameworks_and_preprocessors.md"
      ),
    },
  ],
  "html-css-m12": [
    {
      id: "html-css-m12-l1",
      title: "CSS transitions",
      summary:
        "Add motion with easing, delays, and shorthand that set expectations without overwhelming users.",
      duration: "12 min",
      url: resourceLink("advanced_html_css/animation/transitions.md"),
    },
    {
      id: "html-css-m12-l2",
      title: "Transforms",
      summary:
        "Rotate, scale, skew, and translate elements while keeping them GPU-friendly.",
      duration: "12 min",
      url: resourceLink("advanced_html_css/animation/transforms.md"),
    },
    {
      id: "html-css-m12-l3",
      title: "Keyframes & choreography",
      summary:
        "Sequence multi-step animations and respect prefers-reduced-motion for accessibility.",
      duration: "15 min",
      url: resourceLink("advanced_html_css/animation/keyframes.md"),
    },
    {
      id: "html-css-m12-l4",
      title: "Project: Animated hero",
      summary:
        "Prototype an Odin-style hero with subtle entrance animations, button micro-interactions, and focus-safe motion.",
      duration: "90 min",
      type: "project",
      url: resourceLink("advanced_html_css/animation/transitions.md"),
    },
  ],
};

export const lessonsByModuleId: LessonCatalog = {
  ...htmlLessons,
};
