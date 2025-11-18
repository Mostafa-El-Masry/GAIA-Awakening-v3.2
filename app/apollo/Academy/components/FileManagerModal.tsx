"use client";

import React, { useEffect, useState } from "react";
import type { SandpackFiles } from "@codesandbox/sandpack-react";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  files: SandpackFiles | undefined;
  sandpack: any;
  setFiles?: (files: SandpackFiles) => void;
  onStatusChange?: (text: string) => void;
};

export default function FileManagerModal({
  isOpen,
  onClose,
  files,
  sandpack,
  setFiles,
  onStatusChange,
}: Props) {
  const [newName, setNewName] = useState("");
  const [renameFrom, setRenameFrom] = useState<string | null>(null);
  const [renameTo, setRenameTo] = useState("");

  useEffect(() => {
    if (!isOpen) {
      setNewName("");
      setRenameFrom(null);
      setRenameTo("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const fileKeys = Object.keys(files ?? {});

  const createFile = () => {
    if (!newName) return;
    const key = newName.startsWith("/") ? newName : `/${newName}`;
    if (files && files[key]) {
      window.alert("A file with that name already exists.");
      return;
    }
    const lower = key.toLowerCase();
    let content = `// ${key}\n`;
    if (lower.endsWith(".html"))
      content = `<!doctype html>\n<html>\n  <head>\n    <meta charset=\"utf-8\"/>\n    <meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"/>\n    <title>New Page</title>\n  </head>\n  <body>\n    <div id=\"app\">Hello</div>\n  </body>\n</html>`;
    else if (lower.endsWith(".css"))
      content = `/* Styles for ${key} */\nbody { font-family: system-ui, sans-serif; }`;
    else if (lower.endsWith(".ts") || lower.endsWith(".tsx"))
      content = `import React from 'react';\n\nexport default function App() {\n  return <div>Hello from ${key}</div>;\n}`;
    else if (lower.endsWith(".js") || lower.endsWith(".jsx"))
      content = `console.log('Hello from ${key}');`;

    try {
      sandpack.updateFile?.(key, content);
      sandpack.openFile?.(key);
    } catch (e) {
      // fallback
    }
    const next = { ...(files ?? {}), [key]: { code: content } };
    setFiles?.(next);
    onStatusChange?.(`Added ${key}`);
    setNewName("");
  };

  const removeFile = (key: string) => {
    const ok = window.confirm(`Delete ${key}? This cannot be undone.`);
    if (!ok) return;
    try {
      sandpack.deleteFile?.(key);
    } catch (e) {}
    const next = { ...(files ?? {}) };
    delete next[key];
    setFiles?.(next);
    const fallback = Object.keys(next)[0] ?? "/index.html";
    sandpack.openFile?.(fallback);
    onStatusChange?.(`Deleted ${key}`);
  };

  const doRename = () => {
    if (!renameFrom) return;
    const from = renameFrom;
    const to = renameTo.startsWith("/") ? renameTo : `/${renameTo}`;
    if (!files || !files[from]) {
      window.alert("Source file not found");
      return;
    }
    if (files[to]) {
      window.alert("A file with the new name already exists.");
      return;
    }
    const existing = files[from];
    const code =
      existing && typeof existing === "object"
        ? existing.code ?? ""
        : String(existing ?? "");
    try {
      sandpack.updateFile?.(to, code);
      sandpack.deleteFile?.(from);
      sandpack.openFile?.(to);
    } catch (e) {}
    const next = { ...(files ?? {}) };
    next[to] = existing as any;
    delete next[from];
    setFiles?.(next);
    onStatusChange?.(`Renamed ${from} → ${to}`);
    setRenameFrom(null);
    setRenameTo("");
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-2xl rounded-xl bg-white dark:bg-base-200 p-5 shadow-lg">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Files</h3>
          <button onClick={onClose} className="text-sm text-slate-600">
            Close
          </button>
        </div>

        <div className="mt-4 grid gap-3">
          <div className="space-y-2">
            <label className="text-xs font-semibold">Create new file</label>
            <div className="flex gap-2">
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="/about.html or src/util.js"
                className="input flex-1"
              />
              <button className="btn" onClick={createFile}>
                Create
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold">Rename file</label>
            <div className="flex gap-2 mt-1">
              <select
                className="select flex-1"
                value={renameFrom ?? ""}
                onChange={(e) => setRenameFrom(e.target.value || null)}
              >
                <option value="">Select file...</option>
                {fileKeys.map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
              <input
                value={renameTo}
                onChange={(e) => setRenameTo(e.target.value)}
                placeholder="/new-name.js"
                className="input flex-1"
              />
              <button className="btn" onClick={doRename}>
                Rename
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold">Existing files</label>
            <div className="mt-2 grid gap-2 max-h-48 overflow-auto">
              {fileKeys.map((k) => (
                <div
                  key={k}
                  className="flex items-center justify-between gap-2"
                >
                  <button
                    className="text-left text-sm text-slate-700 flex-1"
                    onClick={() => sandpack.openFile?.(k)}
                  >
                    {k}
                  </button>
                  <div className="flex gap-2">
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => {
                        setRenameFrom(k);
                        setRenameTo(k);
                      }}
                    >
                      Edit
                    </button>
                    <button
                      className="btn btn-error btn-sm"
                      onClick={() => removeFile(k)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
