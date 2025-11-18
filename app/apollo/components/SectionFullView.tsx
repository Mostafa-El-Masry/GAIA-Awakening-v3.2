"use client";

import React from "react";
import Link from "next/link";
import { loadData, getTopicById, getSectionById } from "../lib/store";
import SectionViewer from "./SectionViewer";

export default function SectionFullView({ sectionId }: { sectionId: string }) {
  const data = loadData();
  // find the section across topics
  let foundSection = undefined;
  let topicTitle = undefined;
  for (const t of data.topics) {
    const s = t.sections.find((s) => s.id === sectionId);
    if (s) {
      foundSection = s;
      topicTitle = t.title;
      break;
    }
  }

  if (!foundSection) {
    return (
      <div className="min-h-screen gaia-surface-soft p-8">
        <div className="mx-auto max-w-4xl">
          <div className="mb-4 flex items-center justify-between">
            <h1 className="gaia-strong text-xl font-semibold">Section not found</h1>
            <Link href="/apollo" className="text-sm gaia-muted underline-offset-4 hover:underline">
              Back
            </Link>
          </div>
          <div className="gaia-surface rounded-2xl border gaia-border p-6 gaia-muted">
            The requested section could not be found in your archives.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gaia-surface-soft">
      <div className="mx-auto max-w-5xl p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold uppercase gaia-muted">
              {topicTitle}
            </div>
            <h1 className="gaia-strong text-2xl font-bold">{foundSection.heading}</h1>
          </div>
          <div className="flex gap-3">
            <Link
              href="/apollo"
              className="inline-flex items-center rounded-2xl border gaia-border gaia-surface px-3 py-2 text-sm shadow-sm transition hover:shadow"
            >
              Back to archives
            </Link>
          </div>
        </div>

        <div className="gaia-surface rounded-2xl border gaia-border p-6 shadow-sm">
          <SectionViewer section={foundSection} />
        </div>
      </div>
    </div>
  );
}
