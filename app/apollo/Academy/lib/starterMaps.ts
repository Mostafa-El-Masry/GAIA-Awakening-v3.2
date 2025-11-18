import type { SandpackFiles } from "@codesandbox/sandpack-react";

export type StarterKey = "vanilla" | "react" | "react-ts";

const baseCss = `:root {
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  line-height: 1.6;
  color: #0f172a;
  background: radial-gradient(circle at top, #e0f2fe, #f8fafc 50%);
  min-height: 100vh;
  padding: 2rem;
}

h1 {
  font-size: clamp(2rem, 5vw, 3rem);
  margin-bottom: 1rem;
}

button {
  margin-top: 1rem;
  padding: 0.75rem 1.25rem;
  border-radius: 999px;
  border: none;
  background: #0ea5e9;
  color: white;
  font-weight: 600;
  cursor: pointer;
}

button:hover {
  background: #0284c7;
}`;

export const starterMaps: Record<StarterKey, SandpackFiles> = {
  vanilla: {
    "/index.html": {
      code: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Hello GAIA</title>
    <link rel="stylesheet" href="/styles.css" />
  </head>
  <body>
    <main>
      <h1>Hello GAIA</h1>
      <p id="status">Edit <code>index.js</code> to see instant preview updates.</p>
      <button id="cta">Add a fun fact</button>
    </main>
    <script src="/index.js"></script>
  </body>
</html>`,
    },
    "/styles.css": { code: baseCss },
    "/index.js": {
      code: `const facts = [
  "Sandpack mirrors the CodeSandbox runtime.",
  "Use Cmd/Ctrl + S to save snapshots to IndexedDB.",
  "Templates include Vanilla, React, and React + TS."
];

const statusEl = document.getElementById("status");
const button = document.getElementById("cta");

button.addEventListener("click", () => {
  const fact = facts[Math.floor(Math.random() * facts.length)];
  statusEl.textContent = fact;
});`,
    },
  },
  react: {
    "/package.json": {
      code: JSON.stringify(
        {
          name: "gaia-live-playground",
          dependencies: {
            react: "^18.2.0",
            "react-dom": "^18.2.0",
          },
        },
        null,
        2
      ),
    },
    "/index.jsx": {
      code: `import { createRoot } from "react-dom/client";
import "./styles.css";
import App from "./App";

const root = createRoot(document.getElementById("root"));
root.render(<App />);`,
    },
    "/App.jsx": {
      code: `import { useState } from "react";
import "./styles.css";

export default function App() {
  const [count, setCount] = useState(1);
  return (
    <main>
      <p className="eyebrow">Abollo Academy</p>
      <h1>React live playground</h1>
      <p>Hot reloads mirror the production bundler. Build your idea, then export it.</p>
      <button onClick={() => setCount((c) => c + 1)}>
        You've iterated {count} {count === 1 ? "time" : "times"}
      </button>
    </main>
  );
}`,
    },
    "/styles.css": { code: baseCss },
    "/index.html": {
      code: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>React Playground</title>
  </head>
  <body>
    <div id="root"></div>
    <script src="/index.jsx" type="module"></script>
  </body>
</html>`,
    },
  },
  "react-ts": {
    "/package.json": {
      code: JSON.stringify(
        {
          name: "gaia-live-playground-ts",
          dependencies: {
            react: "^18.2.0",
            "react-dom": "^18.2.0",
          },
          devDependencies: {
            typescript: "^5.3.0",
          },
        },
        null,
        2
      ),
    },
    "/tsconfig.json": {
      code: JSON.stringify(
        {
          compilerOptions: {
            target: "ES2020",
            module: "ESNext",
            jsx: "react-jsx",
            strict: true,
            moduleResolution: "Bundler",
            esModuleInterop: true,
            forceConsistentCasingInFileNames: true,
            skipLibCheck: true,
          },
        },
        null,
        2
      ),
    },
    "/index.tsx": {
      code: `import { createRoot } from "react-dom/client";
import "./styles.css";
import App from "./App";

const root = createRoot(document.getElementById("root")!);
root.render(<App />);`,
    },
    "/App.tsx": {
      code: `import { useState } from "react";
import "./styles.css";

type Log = { id: number; value: string };

export default function App() {
  const [logs, setLogs] = useState<Log[]>([]);

  return (
    <main>
      <p className="eyebrow">React + TypeScript</p>
      <h1>Track wins in real time</h1>
      <p>Each click appends a timestamped log to prove the bundle is live.</p>
      <button
        onClick={() =>
          setLogs((prev) => [
            { id: Date.now(), value: new Date().toLocaleTimeString() },
            ...prev,
          ])
        }
      >
        Log iteration
      </button>
      <ul>
        {logs.map((log) => (
          <li key={log.id}>{log.value}</li>
        ))}
      </ul>
    </main>
  );
}`,
    },
    "/styles.css": {
      code: `${baseCss}

ul {
  list-style: square;
  margin-top: 1rem;
  padding-left: 1.5rem;
}`,
    },
    "/index.html": {
      code: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>React TS Playground</title>
  </head>
  <body>
    <div id="root"></div>
    <script src="/index.tsx" type="module"></script>
  </body>
</html>`,
    },
  },
};
