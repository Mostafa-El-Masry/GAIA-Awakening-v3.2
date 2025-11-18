export const lessonBodies: Record<string, string> = {
  "html-css-m1-l1": `### Why HTML, CSS, and JavaScript travel together

Every document you view in a browser is a collaboration between three core technologies:

- **HTML** is the semantic skeleton. It describes what content exists (headlines, quotes, navigation, forms). It does not care how anything looks.
- **CSS** is the stylist. It controls color, layout, typography, motion, and the responsive behavior of that HTML skeleton.
- **JavaScript** is the behavior layer. It reacts to user input, talks to APIs, animates UI, and keeps state in sync with the DOM.

Learning them together matters because each layer influences the others. JavaScript, for example, can only query or update nodes that HTML declares. CSS selectors only work if the HTML includes helpful classes/ids or, better yet, semantic landmarks. A productive front-end engineer moves through the stack like this:

1. Sketch the section hierarchy in HTML.
2. Apply layout + visual treatments in CSS.
3. Sprinkle interactivity and data wiring with JavaScript.

### What you'll accomplish in this module

By the end of the **Introduction to HTML** course you should be able to:

1. Scaffold a standards-compliant document from memory.
2. Choose the right element for each chunk of content (e.g., <section> vs <article>).
3. Navigate DevTools to inspect, debug, and experiment live in the browser.
4. Create small projects—a recipe site, a simple home page—without copying boilerplate.

Keep these goals handy while you read. Each lesson adds one new habit that pushes you toward a confident, offline-ready workflow.
`,
  "html-css-m1-l2": `### Elements, tags, and semantic structure

HTML is a tree of elements. Each element is introduced by a **tag**:

\`\`\`html
<section class="intro">
  <h1>Welcome</h1>
  <p>Thanks for visiting.</p>
</section>
\`\`\`

- The opening tag (<section>) may contain attributes such as class or id.
- The closing tag (</section>) marks the end of the element's content.
- Some elements—like <img>, <meta>, or <br>—are void. They have no closing tag because they wrap no content.

### Semantic HTML

Semantics are your biggest accessibility win. Use descriptive tags so assistive technologies, search engines, and teammates understand intent:

| Use case | Preferred element |
| --- | --- |
| Page banner or hero | <header> |
| Site-wide navigation | <nav> |
| Reusable content block | <section> |
| Blog post or card | <article> |
| Footer or legal links | <footer> |

When you combine meaningful tags with headings (<h1>…<h6>) you create a logical outline. Screen-reader users can jump through that outline the way sighted users scan with their eyes.

### Lists, emphasis, and inline semantics

- Use <ul> for unordered lists, <ol> for ordered steps, and <dl> for term/definition pairs.
- Wrap important phrases in <strong> or <em> when the emphasis changes meaning (not just appearance).
- Use <code>, <kbd>, and <samp> when documenting keystrokes or terminal output.

Practice: take any paragraph of text and rebuild it using headings, lists, and inline semantics. You'll notice the content becomes easier to restyle later.
`,
  "html-css-m1-l3": `### Boilerplate template

Every standalone HTML document needs a small amount of metadata:

\`\`\`html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>My First Page</title>
    <link rel="stylesheet" href="styles.css" />
  </head>
  <body>
    <main>
      <h1>Hello, world!</h1>
      <p>This is the minimal boilerplate.</p>
    </main>
    <script src="app.js" defer></script>
  </body>
</html>
\`\`\`

- <!DOCTYPE html> activates standards mode so modern layout rules apply.
- lang on <html> informs screen readers how to pronounce text.
- The viewport meta tag keeps mobile layouts predictable.
- Use defer on scripts so HTML renders before heavy JavaScript executes.

Wrap the primary content in <main>, navigation in <nav>, and supporting info in <aside>. Save this boilerplate locally so you can start projects offline in seconds.
`,
  "html-css-m1-l4": `### Inspecting markup with DevTools

Press F12 (or Cmd+Opt+I) to open DevTools.

1. **Elements panel** – hover nodes to see the box-model overlay, edit attributes, and reorder DOM fragments.
2. **Styles + Computed** – toggle individual declarations, use the color picker, and inspect specificity.
3. **Layout inspectors** – Chrome highlights flexbox axes and grid lines so you understand sizing bugs instantly.
4. **Device emulation** – throttle network or emulate touch/rotation to preview responsive layouts.

Treat DevTools like a sketchbook: experiment live, then copy the working markup/CSS back into your editor so the change survives refreshes and works offline.
`,
  "html-css-m1-l5": `### Document head & metadata

The <head> element controls how other systems interpret your page.

- **Identity** – <title>, <meta name="description">, and favicon links determine how tabs and search results appear.
- **Responsiveness** – <meta name="viewport" content="width=device-width, initial-scale=1"> keeps mobile layouts predictable.
- **Social cards** – Open Graph and Twitter tags describe how the page looks when shared.
- **Performance** – Preload critical fonts or hero images and declare a manifest/service worker for offline support.

Document which meta tags you include and why, so future contributors know how to extend them.
`,
  "html-css-m1-l6": `### Attributes & global defaults

Attributes add context to elements.

- Global helpers: class, id, style, hidden, tabindex, and data-*.
- Accessibility helpers: role, aria-label, aria-live. Use them only when native semantics are insufficient.
- Common patterns:
  - Links: <a href="/" target="_blank" rel="noreferrer noopener">
  - Images: <img src="cover.jpg" alt="Screenshot of the dashboard" loading="lazy">
  - Inputs: <input type="email" name="userEmail" autocomplete="email" required>

Keep a cheat sheet of the combinations you use often so you can build UI offline without constantly checking docs.
`,
  "html-css-m1-l7": `### Emmet & productivity shorthands

Emmet turns CSS-like abbreviations into full HTML.

- nav>ul>li*3>a ? nested children with multiplication.
- .card*2>h3+p ? classes plus multiple siblings.
- ul>li.item$*5 ? auto-numbering.

Use brackets for attributes:

\`\`\`
input[type=email placeholder="you@example.com" required]
\`\`\`

The same syntax works in CSS (m10-20 ? margin: 10px 20px;). Sketch DOM trees mentally, convert them into Emmet strings, expand, and then fill in the real copy.
`,
  "html-css-m1-l8": `### Project: Odin Recipes (offline edition)

1. Create index.html plus three recipe pages, a shared stylesheet, and optional JSON data.
2. Each page must include semantic sections, ingredient/instruction lists, and at least one descriptive image.
3. Home page links to every recipe and includes teasers.
4. Add navigation so readers can move between recipes without going home.
5. Include proper metadata (title, description, favicon, Open Graph tags).

Stretch goals: add responsive layout with grid/flexbox, define a print stylesheet, or render the recipe list from local JSON. Document your process in README.md so future iterations build on it.
`,
};

