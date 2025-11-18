"use client";

import type { Section } from "../lib/types";

function renderMarkdown(text: string) {
  const lines = text.split(/\r?\n/);
  let html = "";
  let inList = false;

  for (const line of lines) {
    if (/^\s*-\s+/.test(line)) {
      if (!inList) {
        html += "<ul>";
        inList = true;
      }
      html += `<li>${line.replace(/^\s*-\s+/, "")}</li>`;
    } else {
      if (inList) {
        html += "</ul>";
        inList = false;
      }

      if (/^###\s+/.test(line))
        html += `<h3>${line.replace(/^###\s+/, "")}</h3>`;
      else if (/^##\s+/.test(line))
        html += `<h2>${line.replace(/^##\s+/, "")}</h2>`;
      else if (/^#\s+/.test(line))
        html += `<h1>${line.replace(/^#\s+/, "")}</h1>`;
      else if (line.trim() === "") html += "<br />";
      else html += `<p>${line}</p>`;
    }
  }

  if (inList) html += "</ul>";
  return { __html: html };
}

export default function SectionViewer({ section }: { section: Section }) {
  const joined = section.blocks.join("\n\n");

  return (
    <article
      className="prose max-w-none"
      dangerouslySetInnerHTML={renderMarkdown(joined)}
    />
  );
}
