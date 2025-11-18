"use client";

import {
  SandpackCodeEditor,
  SandpackConsole,
  SandpackFiles,
  SandpackLayout,
  SandpackPreview,
  SandpackPreviewRef,
  SandpackProvider,
  useSandpack,
} from "@codesandbox/sandpack-react";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { useEffect, useMemo, useRef, useState } from "react";
import FileManagerModal from "./FileManagerModal";
import { loadPlayground, savePlayground } from "../hooks/usePlaygroundStore";
import { starterMaps, StarterKey } from "../lib/starterMaps";

type TemplateKey = StarterKey;

type LivePlaygroundProps = {
  lessonId?: string;
  template?: TemplateKey;
  starterKey?: StarterKey;
};

const templateOptions: Array<{ key: TemplateKey; label: string }> = [
  { key: "vanilla", label: "Vanilla (HTML/CSS/JS)" },
  { key: "react", label: "React" },
  { key: "react-ts", label: "React + TypeScript" },
];

const defaultFiles = (key: StarterKey): SandpackFiles => {
  const files = starterMaps[key] ?? starterMaps.vanilla;
  return Object.fromEntries(
    Object.entries(files).map(([path, file]) => {
      if (file && typeof file === "object") {
        return [path, { ...file }];
      }
      return [path, { code: String(file ?? "") }];
    })
  );
};

const buildDownloadName = (lessonId?: string) =>
  `${
    lessonId ? lessonId.replace(/\s+/g, "-").toLowerCase() : "playground"
  }.zip`;

export default function LivePlayground({
  lessonId = "default",
  template = "vanilla",
  starterKey,
}: LivePlaygroundProps) {
  const initialTemplate = template;
  const initialStarter = starterKey ?? template;
  const [currentTemplate, setCurrentTemplate] =
    useState<TemplateKey>(initialTemplate);
  const [files, setFiles] = useState<SandpackFiles>(() =>
    defaultFiles(initialStarter)
  );
  const [providerKey, setProviderKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<string>("");
  const [isBundling, setIsBundling] = useState(true);
  const previewRef = useRef<SandpackPreviewRef | null>(null);

  useEffect(() => {
    let active = true;
    loadPlayground(lessonId)
      .then((stored) => {
        if (!active) return;
        if (stored) {
          setFiles(defaultFilesForStored(stored));
          setProviderKey((val) => val + 1);
        }
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [lessonId]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setIsBundling(true);
    const timer = window.setTimeout(() => setIsBundling(false), 400);
    return () => window.clearTimeout(timer);
  }, [providerKey, files]);

  const customSetup = useMemo(() => {
    if (currentTemplate === "react") {
      return {
        entry: "/index.jsx",
        dependencies: {
          react: "^18.2.0",
          "react-dom": "^18.2.0",
        },
        files,
      };
    }
    if (currentTemplate === "react-ts") {
      return {
        entry: "/index.tsx",
        dependencies: {
          react: "^18.2.0",
          "react-dom": "^18.2.0",
        },
        devDependencies: {
          typescript: "^5.3.0",
        },
        files,
      };
    }
    return {
      entry: "/index.html",
      files,
    };
  }, [currentTemplate, files]);

  const handleSwitchTemplate = (next: TemplateKey) => {
    if (next === currentTemplate) return;
    const confirmSwitch = window.confirm(
      "Switch templates and load the new starter files? Unsaved changes will be lost."
    );
    if (!confirmSwitch) return;
    setCurrentTemplate(next);
    setFiles(defaultFiles(next));
    setProviderKey((val) => val + 1);
    setStatus(`Switched to ${next} template`);
  };

  const handleReset = () => {
    const ok = window.confirm(
      "Reset the editor back to the lesson starter? Unsaved changes will be lost."
    );
    if (!ok) return;
    setFiles(defaultFiles(currentTemplate));
    setProviderKey((val) => val + 1);
    setStatus("Restored lesson starter");
  };

  const handleImport = (nextFiles: SandpackFiles) => {
    setFiles(defaultFilesForStored(nextFiles));
    setProviderKey((val) => val + 1);
    setStatus("Imported project from ZIP");
  };

  const getDefaultContentForPath = (path: string) => {
    const lower = path.toLowerCase();
    if (lower.endsWith(".html"))
      return `<!doctype html>\n<html>\n  <head>\n    <meta charset="utf-8"/>\n    <meta name="viewport" content="width=device-width,initial-scale=1"/>\n    <title>New Page</title>\n  </head>\n  <body>\n    <div id="app">Hello</div>\n  </body>\n</html>`;
    if (lower.endsWith(".css"))
      return `/* Styles for ${path} */\nbody { font-family: system-ui, sans-serif; }`;
    if (lower.endsWith(".ts") || lower.endsWith(".tsx"))
      return `import React from 'react';\n\nexport default function App() {\n  return <div>Hello from ${path}</div>;\n}`;
    if (lower.endsWith(".js") || lower.endsWith(".jsx"))
      return `console.log('Hello from ${path}');`;
    return `// ${path}\n`;
  };

  const handleAddFile = () => {
    const name = window.prompt(
      "New filename (e.g. /about.html or /src/app.js)"
    );
    if (!name) return;
    const key = name.startsWith("/") ? name : `/${name}`;
    if (files[key]) {
      window.alert("A file with that name already exists.");
      return;
    }
    const content = getDefaultContentForPath(key);
    setFiles((prev) => ({ ...prev, [key]: { code: content } }));
    setProviderKey((v) => v + 1);
    setStatus(`Added ${key}`);
  };

  if (loading) {
    return (
      <div className="rounded-2xl gaia-panel-soft p-6 text-sm gaia-muted">
        Loading playground...
      </div>
    );
  }

  return (
    <SandpackProvider
      key={`${currentTemplate}-${providerKey}`}
      template={currentTemplate}
      customSetup={customSetup}
      options={{
        recompileMode: "delayed",
        recompileDelay: 300,
        externalResources: [],
      }}
    >
      <div className="space-y-4">
        <PlaygroundToolbar
          lessonId={lessonId}
          template={currentTemplate}
          onSwitchTemplate={handleSwitchTemplate}
          onReset={handleReset}
          onImport={handleImport}
          files={files}
          setFiles={setFiles}
          setProviderKey={setProviderKey}
          status={status}
          onStatusChange={setStatus}
          previewRef={previewRef}
        />
        <SandpackLayout className="grid grid-cols-1 gap-4 rounded-2xl gaia-panel-soft p-4 lg:[grid-template-columns:1fr_2fr]">
          <div className="flex flex-col rounded-2xl gaia-panel p-0.5 sm:p-1">
            <SandpackCodeEditor
              style={{ minHeight: 360 }}
              showLineNumbers
              showTabs
              wrapContent
              closableTabs
            />
            <div className="max-h-80 overflow-auto border-t border-white/10 text-base-content">
              <SandpackConsole standalone />
            </div>
          </div>
          <div className="relative rounded-2xl gaia-panel p-0.5 sm:p-1">
            {isBundling && (
              <div className="absolute inset-0 z-10 grid place-items-center gaia-glass text-sm">
                Bundling preview...
              </div>
            )}
            <SandpackPreview
              ref={previewRef}
              showOpenInCodeSandbox={false}
              showNavigator
              className="min-h-[720px]"
            />
          </div>
        </SandpackLayout>
      </div>
    </SandpackProvider>
  );
}

type ToolbarProps = {
  lessonId: string;
  template: TemplateKey;
  onSwitchTemplate: (template: TemplateKey) => void;
  onReset: () => void;
  onImport: (files: SandpackFiles) => void;
  files?: SandpackFiles;
  setFiles?: (files: SandpackFiles) => void;
  setProviderKey?: (updater: number | ((v: number) => number)) => void;
  status: string;
  onStatusChange?: (text: string) => void;
  previewRef: React.RefObject<SandpackPreviewRef | null>;
};

function PlaygroundToolbar({
  lessonId,
  template,
  onSwitchTemplate,
  onReset,
  onImport,
  // onAddFile removed: toolbar will manage files directly via props
  files,
  setFiles,
  setProviderKey,
  status,
  onStatusChange,
  previewRef,
}: ToolbarProps) {
  const { sandpack } = useSandpack();
  const [filesOpen, setFilesOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = async () => {
    setIsSaving(true);
    onStatusChange?.("Saving snapshot...");
    const snapshot = cloneFiles(sandpack.files);
    await savePlayground(lessonId, snapshot);
    setIsSaving(false);
    onStatusChange?.("Saved locally");
  };

  const handleRun = () => {
    sandpack.runSandpack();
    onStatusChange?.("Recompiling bundle...");
  };

  const handleExport = async () => {
    setIsExporting(true);
    onStatusChange?.("Preparing ZIP...");
    const zip = new JSZip();
    await Promise.all(
      Object.entries(sandpack.files).map(async ([path, file]) => {
        const cleanPath = path.startsWith("/") ? path.slice(1) : path;
        zip.file(cleanPath, file.code ?? "");
      })
    );
    const blob = await zip.generateAsync({ type: "blob" });
    saveAs(blob, buildDownloadName(lessonId));
    setIsExporting(false);
    onStatusChange?.("ZIP exported");
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportFiles = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const confirmImport = window.confirm(
      "Importing will replace the current files. Continue?"
    );
    if (!confirmImport) return;
    const zip = await JSZip.loadAsync(file);
    const entries = Object.values(zip.files);
    const nextFiles: SandpackFiles = {};
    for (const entry of entries) {
      if (entry.dir) continue;
      const code = await entry.async("string");
      const key = entry.name.startsWith("/") ? entry.name : `/${entry.name}`;
      nextFiles[key] = { code };
    }
    onImport(nextFiles);
    onStatusChange?.("Imported ZIP");
  };

  const handleOpenPreview = () => {
    const client = previewRef.current?.getClient();
    if (client?.iframe?.src) {
      window.open(client.iframe.src, "_blank", "noopener,noreferrer");
      onStatusChange?.("Preview opened in new tab");
      return;
    }
    const html =
      sandpack.files["/index.html"]?.code ?? "<h1>Preview unavailable</h1>";
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank", "noopener,noreferrer");
    setTimeout(() => URL.revokeObjectURL(url), 15_000);
    onStatusChange?.("Opened fallback preview");
  };

  return (
    <div className="rounded-2xl gaia-panel-soft p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-600 dark:text-white/80">
            Template
          </label>
          <select
            value={template}
            onChange={(event) =>
              onSwitchTemplate(event.target.value as TemplateKey)
            }
            className="gaia-input rounded-xl border px-3 py-2 text-sm focus:outline-none"
          >
            {templateOptions.map((option) => (
              <option key={option.key} value={option.key}>
                {option.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={onReset}
            className="rounded-xl border border-white/10 px-3 py-2 text-sm text-slate-700 dark:text-white/80 transition hover:border-white/50"
          >
            Reset starter
          </button>
          <button
            type="button"
            onClick={() => setFilesOpen(true)}
            className="rounded-xl border border-white/10 px-3 py-2 text-sm text-slate-700 dark:text-white/80 hover:border-white/40"
          >
            Files
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleRun}
            className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-100 hover:border-emerald-400"
          >
            Run
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-slate-700 dark:text-white hover:border-white/40"
          >
            {isSaving ? "Saving..." : "Save"}
          </button>
          <button
            type="button"
            onClick={handleExport}
            className="rounded-xl border border-white/10 px-3 py-2 text-sm text-slate-700 dark:text-white/80 hover:border-white/40"
          >
            {isExporting ? "Exporting..." : "Export ZIP"}
          </button>
          <button
            type="button"
            onClick={handleImportClick}
            className="rounded-xl border border-white/10 px-3 py-2 text-sm text-slate-700 dark:text-white/80 hover:border-white/40"
          >
            Import ZIP
          </button>
          <button
            type="button"
            onClick={handleOpenPreview}
            className="rounded-xl border border-white/10 px-3 py-2 text-sm text-slate-700 dark:text-white/80 hover:border-white/40"
          >
            Open preview
          </button>
        </div>
      </div>

      {status && (
        <p className="mt-3 text-xs text-slate-600 dark:text-white/70">
          {status}
        </p>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept=".zip"
        className="hidden"
        onChange={handleImportFiles}
      />

      <FileManagerModal
        isOpen={filesOpen}
        onClose={() => setFilesOpen(false)}
        files={files}
        sandpack={sandpack}
        setFiles={setFiles}
        onStatusChange={onStatusChange}
      />
    </div>
  );
}

function cloneFiles(source: SandpackFiles): SandpackFiles {
  return Object.fromEntries(
    Object.entries(source).map(([path, file]) => {
      if (file && typeof file === "object") {
        return [path, { ...file }];
      }
      return [path, { code: String(file ?? "") }];
    })
  );
}

function defaultFilesForStored(source: SandpackFiles): SandpackFiles {
  const sanitized = cloneFiles(source);
  return Object.keys(sanitized).length > 0
    ? sanitized
    : defaultFiles("vanilla");
}
