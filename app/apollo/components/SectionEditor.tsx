'use client';

import { useEffect, useState } from 'react';
import type { Section } from '../lib/types';

const textareaStyles =
  'gaia-input min-h-[260px] w-full rounded-2xl px-4 py-3 text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-black/10';
const buttonStyles =
  'inline-flex items-center justify-center rounded-2xl border border-transparent bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-500 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-sky-600';

export default function SectionEditor({
  section,
  onSave,
}: {
  section: Section;
  onSave: (text: string) => void;
}) {
  const [text, setText] = useState(section.blocks.join('\n\n'));

  useEffect(() => {
    setText(section.blocks.join('\n\n'));
  }, [section.id, section.blocks]);

  return (
    <div className='space-y-3'>
      <textarea
        className={textareaStyles}
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <div className='flex justify-end'>
        <button className={buttonStyles} onClick={() => onSave(text)}>
          Save (Ctrl/Cmd+S)
        </button>
      </div>
    </div>
  );
}
