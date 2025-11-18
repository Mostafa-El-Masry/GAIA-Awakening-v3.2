"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import LivePlayground from "./components/LivePlayground";
import {
  htmlCssPath,
  type Section,
  type Lesson,
} from "@/app/apollo/(tabs)/academy/data/academy";

type SelectedLesson = {
  sectionId: string;
  lessonId: string;
} | null;

type ViewMode = "list" | "lesson";

const LOCAL_SECTIONS_KEY = "gaia_apollo_academy_sections_v1";

function scrollWithOffset(element: HTMLElement | null, offset: number) {
  if (!element || typeof window === "undefined") return;
  const rect = element.getBoundingClientRect();
  const targetY = window.scrollY + rect.top + offset;
  window.scrollTo({ top: targetY, behavior: "smooth" });
}

function renderWithInlineCode(text: string) {
  const parts = text.split(/(<[^>]+>)/g);
  return parts.map((part, idx) => {
    if (!part) return null;
    if (part.startsWith("<") && part.endsWith(">")) {
      return (
        <code
          key={idx}
          className="gaia-code rounded-md px-1.5 py-0.5 font-mono text-[0.8rem]"
        >
          {part}
        </code>
      );
    }
    return <span key={idx}>{part}</span>;
  });
}

function renderLessonBody(body: string) {
  const chunks = body.split("\n\n");
  return chunks.map((chunk, idx) => {
    if (!chunk.trim()) return null;

    if (chunk.includes("▶ Try in CodeBin:")) {
      const parts = chunk.split("▶ Try in CodeBin:");
      const rest = parts[1] ?? "";
      const lines = rest
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);
      const items = lines
        .filter((line) => line.startsWith("- "))
        .map((line) => line.slice(2));

      return (
        <div
          key={idx}
          className="gaia-ink-soft rounded-2xl p-3 sm:p-4 text-sm sm:text-[0.95rem] space-y-2"
        >
          <div className="text-[0.7rem] font-semibold uppercase tracking-[0.25em] gaia-muted">
            Try in CodeBin
          </div>
          <ul className="list-disc pl-5 space-y-1">
            {items.map((item, i) => (
              <li key={i}>{renderWithInlineCode(item)}</li>
            ))}
          </ul>
        </div>
      );
    }

    return (
      <p
        key={idx}
        className="text-[0.95rem] sm:text-base leading-relaxed tracking-[0.01em]"
      >
        {renderWithInlineCode(chunk)}
      </p>
    );
  });
}

function cloneSections(sections: Section[]): Section[] {
  return sections.map((s) => ({
    ...s,
    lessons: s.lessons.map((l) => ({ ...l })),
  }));
}

export default function ClientView() {
  const [sections, setSections] = useState<Section[]>(() =>
    cloneSections(htmlCssPath.sections)
  );
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selected, setSelected] = useState<SelectedLesson>(null);

  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >({});
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [sectionTitleDraft, setSectionTitleDraft] = useState("");
  const [addingLessonForSection, setAddingLessonForSection] = useState<
    string | null
  >(null);
  const [newLessonTitle, setNewLessonTitle] = useState("");
  const [draggingSectionId, setDraggingSectionId] = useState<string | null>(
    null
  );
  const [draggingLesson, setDraggingLesson] = useState<{
    sectionId: string;
    lessonId: string;
  } | null>(null);

  const [isEditingLesson, setIsEditingLesson] = useState(false);
  const [lessonTitleDraft, setLessonTitleDraft] = useState("");
  const [lessonBodyDraft, setLessonBodyDraft] = useState("");

  const topRef = useRef<HTMLDivElement | null>(null);
  const lessonRef = useRef<HTMLDivElement | null>(null);

  // Load sections from localStorage once
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = window.localStorage.getItem(LOCAL_SECTIONS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Section[];
        if (Array.isArray(parsed) && parsed.length) {
          setSections(cloneSections(parsed));
        } else {
          window.localStorage.setItem(
            LOCAL_SECTIONS_KEY,
            JSON.stringify(htmlCssPath.sections)
          );
        }
      } else {
        window.localStorage.setItem(
          LOCAL_SECTIONS_KEY,
          JSON.stringify(htmlCssPath.sections)
        );
      }
    } catch (error) {
      console.error("Failed to load Apollo Academy sections", error);
    }
  }, []);

  function persistSections(next: Section[]) {
    setSections(next);
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(LOCAL_SECTIONS_KEY, JSON.stringify(next));
    } catch (error) {
      console.error("Failed to save Apollo Academy sections", error);
    }
  }

  const current = useMemo(() => {
    if (!selected) return null;
    const section = sections.find((s) => s.id === selected.sectionId);
    const lesson = section?.lessons.find((l) => l.id === selected.lessonId);
    if (!section || !lesson) return null;
    return { section, lesson };
  }, [sections, selected]);

  const currentSiblings = useMemo(() => {
    if (!current) return [];
    return current.section.lessons;
  }, [current]);

  const currentIndex = useMemo(() => {
    if (!current) return -1;
    return current.section.lessons.findIndex((l) => l.id === current.lesson.id);
  }, [current]);

  const prevLesson =
    current && currentIndex > 0
      ? current.section.lessons[currentIndex - 1]
      : null;
  const nextLesson =
    current &&
    currentIndex >= 0 &&
    currentIndex < current.section.lessons.length - 1
      ? current.section.lessons[currentIndex + 1]
      : null;

  function handleSelect(sectionId: string, lessonId: string) {
    setSelected({ sectionId, lessonId });
    setViewMode("lesson");
    setIsEditingLesson(false);
    setTimeout(() => {
      scrollWithOffset(lessonRef.current, -80);
    }, 0);
  }

  function handleBackToLessons() {
    setViewMode("list");
    setTimeout(() => {
      scrollWithOffset(topRef.current, -80);
    }, 0);
  }

  function toggleSection(sectionId: string) {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  }

  function startEditSection(section: Section) {
    setEditingSectionId(section.id);
    setSectionTitleDraft(section.title);
  }

  function cancelEditSection() {
    setEditingSectionId(null);
    setSectionTitleDraft("");
  }

  function saveEditSection() {
    if (!editingSectionId) return;
    const title = sectionTitleDraft.trim();
    if (!title) return;
    const next = sections.map((s) =>
      s.id === editingSectionId ? { ...s, title } : s
    );
    persistSections(next);
    setEditingSectionId(null);
    setSectionTitleDraft("");
  }

  function startAddLesson(sectionId: string) {
    setAddingLessonForSection(sectionId);
    setNewLessonTitle("");
  }

  function cancelAddLesson() {
    setAddingLessonForSection(null);
    setNewLessonTitle("");
  }

  function saveAddLesson(sectionId: string) {
    const title = newLessonTitle.trim();
    if (!title) return;
    const next = cloneSections(sections);
    const section = next.find((s) => s.id === sectionId);
    if (!section) return;
    const id = `custom-lesson-${Date.now()}`;
    const lesson: Lesson = {
      id,
      title,
      summary: "Custom lesson",
      level: section.level,
      type: "lesson",
      body: "",
    };
    section.lessons.push(lesson);
    persistSections(next);
    setAddingLessonForSection(null);
    setNewLessonTitle("");
    // auto-select new lesson
    handleSelect(sectionId, id);
  }

  function startEditingLesson() {
    if (!current) return;
    setLessonTitleDraft(current.lesson.title);
    setLessonBodyDraft(current.lesson.body ?? "");
    setIsEditingLesson(true);
    setTimeout(() => {
      scrollWithOffset(lessonRef.current, -80);
    }, 0);
  }

  function cancelEditingLesson() {
    setIsEditingLesson(false);
  }

  function saveEditingLesson() {
    if (!current) return;
    const next = cloneSections(sections);
    const section = next.find((s) => s.id === current.section.id);
    if (!section) return;
    const lesson = section.lessons.find((l) => l.id === current.lesson.id);
    if (!lesson) return;
    lesson.title = lessonTitleDraft.trim() || lesson.title;
    lesson.body = lessonBodyDraft;
    persistSections(next);
    setIsEditingLesson(false);
  }

  function resetLessonToSkeleton() {
    if (!current) return;
    const skeletonSection = htmlCssPath.sections.find(
      (s) => s.id === current.section.id
    );
    const skeletonLesson = skeletonSection?.lessons.find(
      (l) => l.id === current.lesson.id
    );
    const next = cloneSections(sections);
    const section = next.find((s) => s.id === current.section.id);
    if (!section) return;
    const lesson = section.lessons.find((l) => l.id === current.lesson.id);
    if (!lesson) return;

    if (skeletonLesson) {
      lesson.title = skeletonLesson.title;
      lesson.body = skeletonLesson.body;
    } else {
      // If custom lesson: just clear body
      lesson.body = "";
    }
    persistSections(next);
    setIsEditingLesson(false);
  }

  // Drag & drop for sections
  function handleSectionDragStart(sectionId: string, ev: React.DragEvent) {
    setDraggingSectionId(sectionId);
    ev.dataTransfer.effectAllowed = "move";
  }

  function handleSectionDragOver(sectionId: string, ev: React.DragEvent) {
    ev.preventDefault();
    ev.dataTransfer.dropEffect = "move";
  }

  function handleSectionDrop(sectionId: string, ev: React.DragEvent) {
    ev.preventDefault();
    if (!draggingSectionId || draggingSectionId === sectionId) return;
    const next = cloneSections(sections);
    const fromIndex = next.findIndex((s) => s.id === draggingSectionId);
    const toIndex = next.findIndex((s) => s.id === sectionId);
    if (fromIndex === -1 || toIndex === -1) return;
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    setDraggingSectionId(null);
    persistSections(next);
  }

  function handleSectionDragEnd() {
    setDraggingSectionId(null);
  }

  // Drag & drop for lessons (within same section)
  function handleLessonDragStart(
    sectionId: string,
    lessonId: string,
    ev: React.DragEvent
  ) {
    setDraggingLesson({ sectionId, lessonId });
    ev.dataTransfer.effectAllowed = "move";
  }

  function handleLessonDragOver(
    sectionId: string,
    lessonId: string,
    ev: React.DragEvent
  ) {
    ev.preventDefault();
    ev.dataTransfer.dropEffect = "move";
  }

  function handleLessonDrop(
    sectionId: string,
    lessonId: string,
    ev: React.DragEvent
  ) {
    ev.preventDefault();
    if (!draggingLesson) return;
    if (draggingLesson.sectionId !== sectionId) {
      setDraggingLesson(null);
      return;
    }
    const next = cloneSections(sections);
    const section = next.find((s) => s.id === sectionId);
    if (!section) return;
    const fromIndex = section.lessons.findIndex(
      (l) => l.id === draggingLesson.lessonId
    );
    const toIndex = section.lessons.findIndex((l) => l.id === lessonId);
    if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) {
      setDraggingLesson(null);
      return;
    }
    const [moved] = section.lessons.splice(fromIndex, 1);
    section.lessons.splice(toIndex, 0, moved);
    setDraggingLesson(null);
    persistSections(next);
  }

  function handleLessonDragEnd() {
    setDraggingLesson(null);
  }

  const panelClasses =
    "space-y-4 rounded-3xl gaia-panel-soft p-4 sm:p-5 shadow-sm";

  return (
    <main className="min-h-screen gaia-surface">
      <div
        ref={topRef}
        className="mx-auto max-w-6xl space-y-10 px-4 py-10 sm:py-12"
      >
        <header className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] gaia-muted">
            Apollo · Academy
          </p>
          <h1 className="text-3xl sm:text-4xl font-semibold gaia-strong">
            {htmlCssPath.title}
          </h1>
          <p className="gaia-muted text-sm sm:text-base max-w-3xl">
            {htmlCssPath.overview}
          </p>
          <p className="gaia-muted text-xs sm:text-sm max-w-3xl">
            {htmlCssPath.description}
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className="inline-flex items-center gap-2 rounded-full border border-base-300 bg-base-100 px-3 py-1 text-xs font-semibold text-base-content/80 hover:border-primary/50 hover:text-primary"
            >
              <span>Browse lessons</span>
            </button>
            {viewMode === "lesson" && (
              <button
                type="button"
                onClick={handleBackToLessons}
                className="inline-flex items-center gap-2 rounded-full border border-base-300 bg-base-100 px-3 py-1 text-xs font-semibold text-base-content/70 hover:border-primary/50 hover:text-primary"
              >
                <span>Back to lessons</span>
                <span className="text-base leading-none">↑</span>
              </button>
            )}
          </div>
        </header>

        {/* Sections list (collapsible). Hidden only visually in lesson mode but kept in DOM for drag/save. */}
        {viewMode === "list" && (
          <section className="space-y-4">
            {sections.map((section) => {
              const expanded = expandedSections[section.id] ?? false;
              const isDragging = draggingSectionId === section.id;
              const levelLabel =
                section.level === "beginner"
                  ? "Beginner"
                  : section.level === "intermediate"
                  ? "Intermediate"
                  : "Advanced";

              return (
                <div
                  key={section.id}
                  className={panelClasses}
                  draggable
                  onDragStart={(ev) => handleSectionDragStart(section.id, ev)}
                  onDragOver={(ev) => handleSectionDragOver(section.id, ev)}
                  onDrop={(ev) => handleSectionDrop(section.id, ev)}
                  onDragEnd={handleSectionDragEnd}
                >
                  <div className="flex w-full items-start gap-3">
                    <button
                      type="button"
                      onClick={() => toggleSection(section.id)}
                      className="mt-1 inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full gaia-ink-soft text-xs font-semibold"
                      title="Expand / collapse"
                    >
                      {expanded ? "−" : "+"}
                    </button>
                    <div className="flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-3">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.3em] gaia-muted">
                            {levelLabel} track
                          </p>
                          {editingSectionId === section.id ? (
                            <div className="mt-1 flex items-center gap-2">
                              <input
                                type="text"
                                className="input input-sm input-bordered w-full max-w-xs rounded-xl text-xs"
                                value={sectionTitleDraft}
                                onChange={(e) =>
                                  setSectionTitleDraft(e.target.value)
                                }
                              />
                              <button
                                type="button"
                                onClick={saveEditSection}
                                className="btn btn-xs btn-primary rounded-full"
                              >
                                Save
                              </button>
                              <button
                                type="button"
                                onClick={cancelEditSection}
                                className="btn btn-xs btn-ghost rounded-full"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <h2 className="text-lg sm:text-xl font-semibold gaia-strong">
                              {section.title}
                            </h2>
                          )}
                          <p className="mt-0.5 text-xs sm:text-[0.8rem] gaia-muted">
                            {section.lessons.length} lesson
                            {section.lessons.length === 1 ? "" : "s"}
                          </p>
                        </div>
                        <div className="ml-auto flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => startEditSection(section)}
                            className="btn btn-xs btn-ghost rounded-full"
                          >
                            Edit section
                          </button>
                          <span className="text-[0.65rem] uppercase tracking-[0.2em] gaia-muted">
                            Drag to reorder
                          </span>
                        </div>
                      </div>

                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        {addingLessonForSection === section.id ? (
                          <>
                            <input
                              type="text"
                              className="input input-sm input-bordered w-full max-w-xs rounded-xl text-xs"
                              placeholder="New lesson title"
                              value={newLessonTitle}
                              onChange={(e) =>
                                setNewLessonTitle(e.target.value)
                              }
                            />
                            <button
                              type="button"
                              onClick={() => saveAddLesson(section.id)}
                              className="btn btn-xs btn-primary rounded-full"
                            >
                              Save lesson
                            </button>
                            <button
                              type="button"
                              onClick={cancelAddLesson}
                              className="btn btn-xs btn-ghost rounded-full"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => startAddLesson(section.id)}
                            className="btn btn-xs btn-outline rounded-full"
                          >
                            + Add lesson
                          </button>
                        )}
                      </div>

                      {expanded && (
                        <div className="mt-4 grid gap-3 md:grid-cols-2">
                          {section.lessons.map((lesson) => {
                            const isActive =
                              selected &&
                              selected.sectionId === section.id &&
                              selected.lessonId === lesson.id;
                            const isDraggingLesson =
                              draggingLesson &&
                              draggingLesson.sectionId === section.id &&
                              draggingLesson.lessonId === lesson.id;

                            return (
                              <article
                                key={lesson.id}
                                className={`cursor-pointer rounded-2xl border border-base-300 bg-base-100 p-4 shadow-sm transition hover:border-primary/60 hover:shadow-md ${
                                  isActive
                                    ? "border-primary/80 ring-1 ring-primary/40"
                                    : ""
                                } ${
                                  isDraggingLesson
                                    ? "opacity-70 ring-1 ring-primary/60"
                                    : ""
                                }`}
                                onClick={() =>
                                  handleSelect(section.id, lesson.id)
                                }
                                draggable
                                onDragStart={(ev) =>
                                  handleLessonDragStart(
                                    section.id,
                                    lesson.id,
                                    ev
                                  )
                                }
                                onDragOver={(ev) =>
                                  handleLessonDragOver(
                                    section.id,
                                    lesson.id,
                                    ev
                                  )
                                }
                                onDrop={(ev) =>
                                  handleLessonDrop(section.id, lesson.id, ev)
                                }
                                onDragEnd={handleLessonDragEnd}
                              >
                                <div className="flex items-center justify-between gap-2 text-xs font-semibold uppercase tracking-[0.3em] gaia-muted">
                                  <span>
                                    {lesson.type === "project"
                                      ? "Project"
                                      : "Lesson"}
                                  </span>
                                  <span className="inline-flex items-center gap-1 rounded-full bg-base-200 px-2 py-0.5 text-[0.65rem] font-semibold text-base-content/80">
                                    {lesson.level}
                                  </span>
                                  {isActive && (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[0.65rem] font-semibold text-primary">
                                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary" />
                                      Active
                                    </span>
                                  )}
                                </div>
                                <h3 className="mt-2 text-base sm:text-lg font-semibold gaia-strong">
                                  {lesson.title}
                                </h3>
                                <p className="mt-1 text-sm gaia-muted">
                                  {lesson.summary}
                                </p>
                              </article>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </section>
        )}

        {/* Lesson content */}
        <section
          ref={lessonRef}
          className="space-y-4 rounded-3xl gaia-panel-soft p-6"
        >
          <div className="flex flex-col gap-3 border-b border-base-300 pb-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-primary">
                Lesson
              </p>
              <h2 className="text-xl sm:text-2xl font-semibold gaia-strong">
                {current ? current.lesson.title : "Pick a lesson"}
              </h2>
              <p className="mt-1 text-sm gaia-muted max-w-3xl">
                {current
                  ? current.lesson.summary
                  : "Choose any lesson card from the list above. The full explanation will appear here, with a live playground below."}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {current && (
                <span className="inline-flex items-center gap-2 rounded-full bg-base-200 px-3 py-1 text-[0.7rem] font-semibold text-base-content/80">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  <span>
                    {current.section.title} · {current.lesson.level}
                  </span>
                </span>
              )}
              {current && (
                <button
                  type="button"
                  onClick={
                    isEditingLesson ? cancelEditingLesson : startEditingLesson
                  }
                  className="inline-flex items-center gap-2 rounded-full border border-base-300 bg-base-100 px-3 py-1 text-xs font-semibold text-base-content/80 hover:border-primary/60 hover:text-primary"
                >
                  <span>
                    {isEditingLesson ? "Close editor" : "Edit title & text"}
                  </span>
                </button>
              )}
              {viewMode === "lesson" && (
                <button
                  type="button"
                  onClick={handleBackToLessons}
                  className="inline-flex items-center gap-2 rounded-full border border-base-300 bg-base-100 px-3 py-1 text-xs font-semibold text-base-content/70 hover:border-primary/60 hover:text-primary"
                >
                  <span>Back to lessons</span>
                  <span className="text-base leading-none">↑</span>
                </button>
              )}
            </div>
          </div>

          {current && (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2 text-xs gaia-muted">
                <span>
                  Lesson {currentIndex + 1} of {currentSiblings.length}
                </span>
                <span className="text-base-content/30">·</span>
                <span>Drag cards in the list to reorder inside a track.</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {prevLesson && (
                  <button
                    type="button"
                    className="btn btn-xs btn-ghost rounded-full"
                    onClick={() =>
                      handleSelect(current.section.id, prevLesson.id)
                    }
                  >
                    ← Previous
                  </button>
                )}
                {nextLesson && (
                  <button
                    type="button"
                    className="btn btn-xs btn-ghost rounded-full"
                    onClick={() =>
                      handleSelect(current.section.id, nextLesson.id)
                    }
                  >
                    Next →
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="mx-auto max-w-4xl space-y-5 rounded-2xl gaia-panel p-4 sm:p-5">
            {current ? (
              <div className="space-y-4">
                {isEditingLesson ? (
                  <div className="space-y-3 rounded-2xl gaia-panel-soft p-3 sm:p-4">
                    <p className="text-xs gaia-muted">
                      You are editing this lesson. Changes are stored locally in
                      your browser.
                    </p>
                    <div className="space-y-1">
                      <label className="text-[0.7rem] font-semibold uppercase tracking-[0.25em] gaia-muted">
                        Title
                      </label>
                      <input
                        type="text"
                        className="input input-sm input-bordered w-full rounded-xl text-xs sm:text-sm"
                        value={lessonTitleDraft}
                        onChange={(e) => setLessonTitleDraft(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[0.7rem] font-semibold uppercase tracking-[0.25em] gaia-muted">
                        Body
                      </label>
                      <textarea
                        className="textarea textarea-bordered mt-1 w-full min-h-[240px] rounded-2xl p-3 text-xs sm:text-sm font-mono leading-relaxed"
                        value={lessonBodyDraft}
                        onChange={(e) => setLessonBodyDraft(e.target.value)}
                      />
                    </div>
                    <div className="mt-2 flex flex-wrap items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={resetLessonToSkeleton}
                        className="btn btn-xs btn-ghost rounded-full"
                      >
                        Reset to skeleton
                      </button>
                      <button
                        type="button"
                        onClick={saveEditingLesson}
                        className="btn btn-xs btn-primary rounded-full"
                      >
                        Save changes
                      </button>
                    </div>
                  </div>
                ) : current.lesson.body ? (
                  <div className="space-y-5 text-[0.95rem] sm:text-base leading-relaxed tracking-[0.01em]">
                    {renderLessonBody(current.lesson.body)}
                  </div>
                ) : (
                  <div className="space-y-3 text-sm gaia-muted">
                    <p>
                      This lesson doesn&apos;t have detailed content yet. Use
                      &quot;Edit title &amp; text&quot; to write your own
                      explanation, or paste notes from your study material.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2 text-sm gaia-muted">
                <p>
                  No lesson selected yet. Expand a section above and choose one
                  of the cards to load a full explanation here. Then scroll down
                  to the playground to practice.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Live playground below lesson, full width (restyled) */}
        <section className="w-full mx-auto max-w-7xl rounded-3xl gaia-panel-soft p-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex-1">
              <span className="inline-block text-xs font-semibold uppercase tracking-wider bg-primary/10 text-primary px-3 py-1 rounded-full">
                Live playground
              </span>
              <h2 className="mt-3 text-2xl sm:text-3xl font-semibold gaia-strong">
                CodeBin — try what you just learned
              </h2>
              <p className="mt-2 text-sm gaia-muted max-w-3xl">
                Use the file tabs to add more pages or create extra files for
                experiments. Type the examples from the lesson above, or follow
                any checklist you add to the body and see the result live.
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-2">
              {/* Reserved for future toolbar / actions (expand preview, presets) */}
            </div>
          </div>

          <div className="mt-6 -mx-4 sm:-mx-6 rounded-2xl gaia-panel p-4 sm:p-6 px-4 sm:px-6">
            <LivePlayground
              lessonId="academy-html-css"
              template="vanilla"
              starterKey="vanilla"
            />
          </div>
        </section>
      </div>
    </main>
  );
}
