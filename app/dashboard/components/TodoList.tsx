"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ButtonHTMLAttributes,
  type ReactNode,
} from "react";
import Button from "@/app/DesignSystem/components/Button";
import {
  DailyStore,
  DailyTask,
  DailyTrioByDate,
  DailyStoreEvent,
  Category,
  ensureDate,
  getNextActionableDay,
  getStore,
  toggleDone,
  upsertTask,
  updateTaskDetails,
} from "@/scripts/store";
import { formatKey, shiftDate, todayKey } from "@/utils/dates";

type CategoryMeta = { id: Category; label: string; accent: string };

const CATEGORY_META: CategoryMeta[] = [
  {
    id: "life",
    label: "Life",
    accent: "from-rose-500/20 via-transparent to-transparent",
  },
  {
    id: "programming",
    label: "Programming",
    accent: "from-sky-500/20 via-transparent to-transparent",
  },
  {
    id: "distraction",
    label: "Distraction",
    accent: "from-amber-400/20 via-transparent to-transparent",
  },
];

type DraftPayload = { title: string };

const createEmptyDrafts = (): Record<Category, DraftPayload> => ({
  life: { title: "" },
  programming: { title: "" },
  distraction: { title: "" },
});

function makeId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `daily-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export default function TodoList() {
  const [store, setStore] = useState<DailyStore>({});
  const [currentDay, setCurrentDay] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<Category, DraftPayload>>(
    createEmptyDrafts()
  );
  const [ready, setReady] = useState(false);

  const syncStore = useCallback(() => {
    setStore(getStore());
  }, []);

  const hydrate = useCallback(() => {
    const today = todayKey();
    const defaultDay = getNextActionableDay(today) ?? today;
    ensureDate(defaultDay);
    syncStore();
    setCurrentDay(defaultDay);
    setReady(true);
  }, [syncStore]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    hydrate();
    const handleStorage = () => syncStore();
    const handleCustom: EventListener = () => syncStore();
    window.addEventListener("storage", handleStorage);
    window.addEventListener(DailyStoreEvent, handleCustom);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(DailyStoreEvent, handleCustom);
    };
  }, [hydrate, syncStore]);

  useEffect(() => {
    if (!currentDay) return;
    ensureDate(currentDay);
    syncStore();
    setDrafts(createEmptyDrafts());
  }, [currentDay, syncStore]);

  const dayData: DailyTrioByDate = useMemo(() => {
    if (!currentDay) return {};
    return store[currentDay] ?? {};
  }, [currentDay, store]);

  const pendingCount = useMemo(() => {
    if (!currentDay) return CATEGORY_META.length;
    return CATEGORY_META.reduce((count, cat) => {
      const task = (dayData && dayData[cat.id]) as DailyTask | undefined;
      if (!task || !task.done) return count + 1;
      return count;
    }, 0);
  }, [currentDay, dayData]);

  const allDone = pendingCount === 0;

  const jumpToDay = (target: string) => {
    ensureDate(target);
    syncStore();
    setCurrentDay(target);
  };

  const handlePrev = () => {
    if (!currentDay) return;
    jumpToDay(shiftDate(currentDay, -1));
  };

  const handleNext = () => {
    if (!currentDay) return;
    const immediate = shiftDate(currentDay, 1);
    const actionable = getNextActionableDay(immediate);
    jumpToDay(actionable ?? immediate);
  };

  const handleToday = () => {
    const today = todayKey();
    const target = getNextActionableDay(today) ?? today;
    jumpToDay(target);
  };

  const handleAdd = (category: Category, payload: DraftPayload) => {
    if (!currentDay) return;
    const title = payload.title.trim();
    if (!title) return;
    const task: DailyTask = {
      id: makeId(),
      category,
      date: currentDay,
      title,
      done: false,
    };
    upsertTask(task);
    syncStore();
    setDrafts((prev) => ({ ...prev, [category]: { title: "" } }));
  };

  const handleToggle = (category: Category, done: boolean) => {
    if (!currentDay) return;
    toggleDone(currentDay, category, done);
    syncStore();
  };

  const handleEditTask = (category: Category, payload: DraftPayload) => {
    if (!currentDay) return;
    const title = payload.title.trim();
    if (!title) return;
    updateTaskDetails(currentDay, category, {
      title,
    });
    syncStore();
  };

  if (!ready || !currentDay) {
    return (
      <section className="space-y-4 rounded-2xl border border-white/5 bg-slate-950/60 p-6 shadow-2xl shadow-black/20">
        <div className="h-5 w-40 animate-pulse rounded bg-slate-800/60" />
        <div className="h-24 animate-pulse rounded-xl border border-white/5 bg-slate-900/40" />
      </section>
    );
  }

  return (
    <section className="space-y-6 rounded-2xl border border-white/5 bg-slate-950/60 p-6 shadow-2xl shadow-black/20">
      <DayNavigator
        date={currentDay}
        onPrev={handlePrev}
        onNext={handleNext}
        onToday={handleToday}
      />

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-slate-900/50 p-4 text-sm text-slate-200">
        <div>
          Pending:{" "}
          <span className="font-semibold text-white">
            {pendingCount} / {CATEGORY_META.length}
          </span>
        </div>
        {allDone ? (
          <span className="text-emerald-300">
            All done for {formatKey(currentDay)}
          </span>
        ) : (
          <span className="text-slate-400">
            Work in progress for {formatKey(currentDay)}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {CATEGORY_META.map((category) => (
          <CategoryCard
            key={`${category.id}-${currentDay}`}
            category={category}
            date={currentDay}
            task={(dayData && dayData[category.id]) as DailyTask | undefined}
            drafts={drafts[category.id]}
            onDraftChange={(draft) =>
              setDrafts((prev) => ({
                ...prev,
                [category.id]: draft,
              }))
            }
            onAdd={handleAdd}
            onToggle={handleToggle}
            onEdit={handleEditTask}
            onJumpToToday={handleToday}
          />
        ))}
      </div>
    </section>
  );
}

function DayNavigator({
  date,
  onPrev,
  onNext,
  onToday,
}: {
  date: string;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-slate-950/40 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-1 items-center justify-between gap-3">
        <button
          type="button"
          className="rounded-xl border border-white/15 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-white/80 transition hover:border-white/40 hover:text-white"
          onClick={onPrev}
        >
          ← Yesterday
        </button>
        <div className="text-center text-lg font-semibold text-white">
          {formatKey(date)}
        </div>
        <button
          type="button"
          className="rounded-xl border border-white/15 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-white/80 transition hover:border-white/40 hover:text-white"
          onClick={onNext}
        >
          Tomorrow →
        </button>
      </div>
      <div className="flex justify-end">
        <button
          type="button"
          onClick={onToday}
          className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-emerald-100 transition hover:border-emerald-400"
        >
          Today
        </button>
      </div>
    </div>
  );
}

function CategoryCard({
  category,
  task,
  date,
  drafts,
  onDraftChange,
  onAdd,
  onToggle,
  onEdit,
  onJumpToToday,
}: {
  category: CategoryMeta;
  task?: DailyTask;
  date: string;
  drafts: DraftPayload;
  onDraftChange: (draft: DraftPayload) => void;
  onAdd: (category: Category, draft: DraftPayload) => void;
  onToggle: (category: Category, done: boolean) => void;
  onEdit: (category: Category, draft: DraftPayload) => void;
  onJumpToToday: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [editDraft, setEditDraft] = useState<DraftPayload>({
    title: task?.title ?? "",
  });

  useEffect(() => {
    setEditDraft({
      title: task?.title ?? "",
    });
    setEditing(false);
    setError(null);
  }, [task?.id, task?.title, date]);

  const handleAdd = (event: React.FormEvent) => {
    event.preventDefault();
    if (!drafts.title.trim()) {
      setError("Title is required.");
      return;
    }
    onAdd(category.id, drafts);
    setError(null);
  };

  const handleEditSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!editDraft.title.trim()) {
      setError("Title is required.");
      return;
    }
    onEdit(category.id, editDraft);
    setError(null);
    setEditing(false);
  };

  const handleEditCancel = () => {
    setEditDraft({
      title: task?.title ?? "",
    });
    setError(null);
    setEditing(false);
  };

  const handleStartEdit = () => {
    setEditDraft({
      title: task?.title ?? "",
    });
    setError(null);
    setEditing(true);
  };

  const badgeColor = category.accent;

  return (
    <article className="group/todo relative flex flex-col gap-4 overflow-hidden rounded-2xl border border-white/10 bg-slate-900/70 p-4 text-white shadow-inner">
      <div
        className={`pointer-events-none absolute inset-0 opacity-60 blur-2xl bg-gradient-to-br ${badgeColor}`}
      />
      <div className="relative z-10 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-200">
            {category.label}
          </p>
          <p className="text-xs text-slate-400">Date: {formatKey(date)}</p>
        </div>
        {task?.done && task.doneAt && (
          <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-100">
            Done on {formatKey(task.doneAt)}
          </span>
        )}
      </div>

      <div className="relative z-10 space-y-3">
        {task ? (
          editing ? (
            <form className="space-y-3" onSubmit={handleEditSubmit}>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-300">
                Title
                <input
                  className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none"
                  value={editDraft.title}
                  onChange={(event) =>
                    setEditDraft((prev) => ({
                      ...prev,
                      title: event.target.value,
                    }))
                  }
                  placeholder={`Update ${category.label} task`}
                />
              </label>
              {error && <p className="text-xs text-rose-300">{error}</p>}
              <div className="flex gap-2">
                <Button type="submit" className="flex-1 text-sm">
                  Save changes
                </Button>
                <Button
                  type="button"
                  className="flex-1 text-sm gaia-hover-soft"
                  onClick={handleEditCancel}
                >
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <>
              <div>
                <p
                  className="text-lg font-semibold text-white truncate group-hover/todo:whitespace-normal group-hover/todo:overflow-visible group-hover/todo:text-clip"
                  title={task.title}
                >
                  {task.title}
                </p>
              </div>

              <div className="mt-2 flex w-full items-center justify-end gap-1.5">
                <IconButton
                  label="Edit task"
                  icon={<EditIcon />}
                  onClick={handleStartEdit}
                />
                <IconButton
                  label={task.done ? "Mark pending" : "Mark done"}
                  icon={task.done ? <UndoIcon /> : <CheckIcon />}
                  onClick={() => onToggle(category.id, !task.done)}
                />
                <IconButton
                  label="Jump to today"
                  icon={<TodayIcon />}
                  onClick={onJumpToToday}
                />
              </div>
            </>
          )
        ) : (
          <form className="space-y-3" onSubmit={handleAdd}>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-300">
              Title
              <input
                className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none"
                value={drafts.title}
                onChange={(event) =>
                  onDraftChange({
                    ...drafts,
                    title: event.target.value,
                  })
                }
                placeholder={`Add ${category.label} task`}
              />
            </label>
            {error && <p className="text-xs text-rose-300">{error}</p>}
            <Button type="submit" className="w-full text-sm">
              Save
            </Button>
          </form>
        )}
      </div>
    </article>
  );
}

type IconButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "children"
> & {
  label: string;
  icon: ReactNode;
};

function IconButton({
  label,
  icon,
  className = "",
  type = "button",
  title,
  ...rest
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={title ?? label}
      className={`flex h-9 w-9 items-center justify-center rounded-full border border-white/30 text-white/70 transition hover:border-white/60 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 disabled:cursor-not-allowed disabled:opacity-40 ${className}`}
      {...rest}
    >
      {icon}
      <span className="sr-only">{label}</span>
    </button>
  );
}

const iconBase = "h-4 w-4";

function EditIcon() {
  return (
    <svg
      className={iconBase}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m16.5 4.5 3 3" />
      <path d="M5 19l4.25-.88L19.5 7.87a2.12 2.12 0 0 0-3-3L6.25 15.13z" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      className={iconBase}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m5 12 4 4 10-10" />
    </svg>
  );
}

function UndoIcon() {
  return (
    <svg
      className={iconBase}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M9 7 4 12l5 5" />
      <path d="M4 12h9a4 4 0 0 1 0 8h-3" />
    </svg>
  );
}

function TodayIcon() {
  return (
    <svg
      className={iconBase}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M16 3v4" />
      <path d="M8 3v4" />
      <path d="M3 11h18" />
      <path d="M12 15h.01" />
    </svg>
  );
}
