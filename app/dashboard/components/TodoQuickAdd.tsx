// app/Dashboard/components/TodoQuickAdd.tsx
"use client";

import { useState } from "react";
import { X } from "lucide-react";
import type { Category } from "../hooks/useTodoDaily";

type Props = {
  category: Category;
  onAdd: (
    category: Category,
    title: string,
    note?: string,
    priority?: 1 | 2 | 3,
    pinned?: boolean
  ) => void;
  onClose?: () => void;
};

export default function TodoQuickAdd({ category, onAdd, onClose }: Props) {
  const [title, setTitle] = useState("");

  return (
    <div className="mt-3 rounded-lg border border-[var(--gaia-border)] bg-[var(--gaia-surface-soft)] p-4">
      <div className="mb-3 text-sm font-semibold text-[var(--gaia-text-muted)]">
        Quick Add — {labelOf(category)}
      </div>
      <div className="flex flex-col gap-3">
        <input
          className="w-full rounded-lg border border-[var(--gaia-border)] bg-[var(--gaia-surface)] px-3 py-2 text-[var(--gaia-text-default)] placeholder-[var(--gaia-text-muted)] focus:border-[var(--gaia-contrast-bg)] focus:outline-none focus:ring-2 focus:ring-[var(--gaia-contrast-bg)]/20"
          placeholder="Task title…"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          autoFocus
        />
        <div className="flex gap-2">
          <button
            className="flex-1 rounded-lg bg-[var(--gaia-contrast-bg)] px-4 py-2 font-semibold text-[var(--gaia-contrast-text)] transition-opacity hover:opacity-90 disabled:opacity-50"
            disabled={!title.trim()}
            onClick={() => {
              if (!title.trim()) return;
              onAdd(category, title, undefined, 2, false);
              setTitle("");
              onClose?.();
            }}
          >
            Add
          </button>
          <button
            className="rounded-lg border border-[var(--gaia-border)] px-4 py-2 font-semibold text-[var(--gaia-text-default)] transition-colors hover:bg-[var(--gaia-border)]"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

function labelOf(c: Category) {
  if (c === "life") return "Life";
  if (c === "work") return "Work";
  return "Distraction";
}
