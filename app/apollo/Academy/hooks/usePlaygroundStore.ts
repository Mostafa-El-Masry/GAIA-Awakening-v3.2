'use client';

import type { SandpackFiles } from "@codesandbox/sandpack-react";
import { del, get, set } from "idb-keyval";

const PREFIX = "gaia.playground.";

function makeKey(lessonId: string) {
  return `${PREFIX}${lessonId}`;
}

export async function loadPlayground(lessonId: string): Promise<SandpackFiles | null> {
  try {
    const payload = await get<SandpackFiles | undefined>(makeKey(lessonId));
    return payload ?? null;
  } catch {
    return null;
  }
}

export async function savePlayground(lessonId: string, files: SandpackFiles): Promise<void> {
  await set(makeKey(lessonId), files);
}

export async function clearPlayground(lessonId: string): Promise<void> {
  await del(makeKey(lessonId));
}

