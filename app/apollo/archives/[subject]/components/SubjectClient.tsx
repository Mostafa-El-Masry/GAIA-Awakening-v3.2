"use client";

import { useEffect, useMemo, useState } from "react";
import Button from "@/app/DesignSystem/components/Button";
import { subjects, type Subject, type Lesson } from "../../data/subjects";
import {
  isTeachable,
  toggleTeachable,
  addLessonToAcademy,
} from "../../lib/teachables";

export default function SubjectClient({ subjectId }: { subjectId: string }) {
  const subj = useMemo<Subject | undefined>(
    () => subjects.find((s) => s.id === subjectId),
    [subjectId]
  );
  const [teach, setTeach] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!subj) return;
    const map: Record<string, boolean> = {};
    subj.lessons.forEach((l) => {
      map[l.id] = isTeachable(l.id);
    });
    setTeach(map);
  }, [subj]);

  if (!subj) {
    return (
      <div className="rounded-xl border border-dashed border-red-300 bg-red-950/20 p-4 text-sm text-red-100">
        Unknown subject:{" "}
        <code className="font-mono text-red-200">{subjectId}</code>. Check the
        Archives index.
      </div>
    );
  }

  function toggle(id: string) {
    toggleTeachable(id, !teach[id]);
    setTeach((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  async function onAddToAcademy(lesson: Lesson) {
    if (!subj) return;
    await addLessonToAcademy(subj, lesson);
  }

  return (
    <div className="space-y-8">
      {/* Subject overview */}
      <section className="space-y-3">
        <header>
          <p className="text-xs gaia-muted uppercase tracking-wide">Subject</p>
          <h1 className="text-2xl font-semibold">{subj.title}</h1>
          {subj.overview && (
            <p className="mt-1 max-w-2xl text-sm gaia-text-default">
              {subj.overview}
            </p>
          )}
        </header>

        {(subj.logs && subj.logs.length > 0) ||
        (subj.tricks && subj.tricks.length > 0) ? (
          <div className="grid gap-4 md:grid-cols-2">
            {subj.logs && subj.logs.length > 0 && (
              <section className="rounded-lg border gaia-border p-4">
                <h2 className="text-sm font-semibold">Logs</h2>
                <p className="mt-1 text-xs gaia-muted">
                  Quick notes about what you&apos;ve actually practiced or
                  understood in this subject.
                </p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm gaia-text-default">
                  {subj.logs.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </section>
            )}

            {subj.tricks && subj.tricks.length > 0 && (
              <section className="rounded-lg border gaia-border p-4">
                <h2 className="text-sm font-semibold">Tricks &amp; gotchas</h2>
                <p className="mt-1 text-xs gaia-muted">
                  Small reminders so Future‑You doesn&apos;t fall into the same
                  traps again.
                </p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm gaia-text-default">
                  {subj.tricks.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        ) : null}
      </section>

      {/* Lessons + teachable toggles */}
      <section>
        <header className="mb-3">
          <h2 className="text-lg font-semibold">Lessons &amp; teachables</h2>
          <p className="text-xs gaia-muted">
            Mark lessons as &quot;Teachable&quot; when you feel they are ready
            to be tested. Adding them to Academy creates Tier‑1 concepts in the
            Citadel loop (learn → quiz → build).
          </p>
        </header>

        <ol className="space-y-3">
          {subj.lessons.map((l) => (
            <li key={l.id} className="rounded-lg border gaia-border p-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <div className="text-sm font-semibold">{l.title}</div>
                  {l.summary && (
                    <p className="text-xs gaia-muted">{l.summary}</p>
                  )}
                  <label className="inline-flex items-center gap-2 text-xs">
                    <input
                      type="checkbox"
                      checked={!!teach[l.id]}
                      onChange={() => toggle(l.id)}
                      className="checkbox checkbox-xs"
                    />
                    <span className="gaia-muted">Teachable</span>
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => onAddToAcademy(l)}
                    className="shrink-0"
                  >
                    Add to Academy
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ol>

        <p className="mt-2 text-xs gaia-muted">
          Marking &quot;Teachable&quot; helps you track what to study. &quot;Add
          to Academy&quot; creates a Tier‑1 concept that shows up in the Academy
          list.
        </p>
      </section>
    </div>
  );
}
