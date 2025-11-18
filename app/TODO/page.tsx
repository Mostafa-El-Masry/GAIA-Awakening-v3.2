// app/TODO/page.tsx
"use client";

import { useMemo } from "react";
import { useTodoDaily } from "../dashboard/hooks/useTodoDaily";
import type { Task } from "../dashboard/hooks/useTodoDaily";

type StatusTone = "pending" | "done" | "skipped";
type StatusResolution = { label: string; tone: StatusTone; dateLabel: string };

const LABELS: Record<string, string> = {
  life: "Life",
  work: "Work",
  distraction: "Distraction",
};

const HINTS: Record<string, string> = {
  life: "Use this for home, errands, relationships, errands, and anything that keeps your life moving.",
  work: "Tasks related to your job, GAIA building, study sessions, and deep work blocks.",
  distraction: "Things you want to deliberately enjoy or limit: games, scrolling, and time sinks.",
};

export default function TODOPage() {
  const { tasks, deleteTask } = useTodoDaily();

  const byCat = useMemo(() => {
    const map: Record<string, Task[]> = { life: [], work: [], distraction: [] };
    for (const t of tasks) map[t.category].push(t);
    return map;
  }, [tasks]);

  const resolveStatus = (task: Task): StatusResolution => {
    const entries = Object.entries(task.status_by_date ?? {});
    if (entries.length === 0) {
      return {
        label: "Pending",
        tone: "pending",
        dateLabel: task.due_date ?? "Unscheduled",
      };
    }
    entries.sort((a, b) => b[0].localeCompare(a[0]));
    const [date, status] = entries[0];
    return {
      label: status === "done" ? "Done" : "Skipped",
      tone: status === "done" ? "done" : "skipped",
      dateLabel: date,
    };
  };

  const toneStyles: Record<StatusTone, string> = {
    pending:
      "bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-400/20 dark:text-amber-200 dark:border-amber-400/30",
    done: "bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-400/20 dark:text-emerald-100 dark:border-emerald-400/30",
    skipped:
      "bg-slate-200 text-slate-700 border border-slate-300 dark:bg-slate-600/30 dark:text-slate-200 dark:border-slate-500",
  };

  return (
    <main className="mx-auto max-w-4xl p-4">
      <header className="mb-6 space-y-1">
        <h1 className="text-2xl font-bold">TODO · All Tasks</h1>
        <p className="max-w-2xl text-sm text-base-content/70">
          This is the full list backing the dashboard&apos;s &quot;Today&apos;s Focus&quot; panel.
          Tasks are grouped by Life, Work, and Distraction so you can see everything in one place.
        </p>
      </header>

      {(["life", "work", "distraction"] as const).map((cat) => (
        <section key={cat} className="mb-8">
          <header className="mb-2 flex items-baseline justify-between">
            <h2 className="text-lg font-semibold">{LABELS[cat]}</h2>
            <p className="text-xs text-base-content/60">{HINTS[cat]}</p>
          </header>
          <div className="rounded-xl border border-base-300 bg-base-100/60">
            {byCat[cat].length === 0 ? (
              <div className="space-y-1 p-4 text-sm text-base-content/60">
                <p>No tasks in this category yet.</p>
                <p>
                  Add one from the dashboard&apos;s &quot;Today&apos;s Focus&quot; cards using Quick Add,
                  or schedule tasks there and they will appear here automatically.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-base-300">
                {byCat[cat].map((t) => (
                  <li key={t.id} className="p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1">
                        <div className="font-medium">{t.title}</div>
                        {t.note && (
                          <p className="text-sm text-base-content/70">{t.note}</p>
                        )}
                        {t.repeat && t.repeat !== "none" && (
                          <p className="mt-1 text-xs uppercase tracking-wide text-base-content/60">
                            Repeats: {String(t.repeat)}
                          </p>
                        )}
                        <StatusRow task={t} toneStyles={toneStyles} resolveStatus={resolveStatus} />
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          className="rounded-lg border border-base-300 px-2 py-1 text-xs text-base-content/70 hover:bg-base-200"
                          onClick={() => deleteTask(t.id)}
                          title="Delete task"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      ))}
    </main>
  );
}

type StatusRowProps = {
  task: Task;
  toneStyles: Record<StatusTone, string>;
  resolveStatus: (task: Task) => StatusResolution;
};

function StatusRow({ task, toneStyles, resolveStatus }: StatusRowProps) {
  const status = resolveStatus(task);
  return (
    <div className="mt-2 flex flex-wrap gap-2 text-xs">
      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-semibold ${toneStyles[status.tone]}`}>
        Status: {status.label}
      </span>
      <span className="inline-flex items-center gap-1 rounded-full border border-base-300/60 px-2 py-0.5 text-base-content/70">
        Date: {status.dateLabel}
      </span>
      {task.due_date && task.due_date !== status.dateLabel && (
        <span className="inline-flex items-center gap-1 rounded-full border border-base-300/60 px-2 py-0.5 text-base-content/70">
          Due: {task.due_date}
        </span>
      )}
    </div>
  );
}
