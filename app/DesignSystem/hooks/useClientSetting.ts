'use client';

import { useCallback, useEffect, useState } from "react";
import {
  getItem,
  setItem,
  subscribe,
  waitForUserStorage,
} from "@/lib/user-storage";

/**
 * Simple hook to read a stored key (client-only) and update when it changes.
 */
export function useClientSetting<T = string>(key: string, fallback: T) {
  const [value, setValue] = useState<T>(fallback);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      await waitForUserStorage();
      if (cancelled) return;
      const raw = getItem(key);
      if (raw !== null) {
        try {
          setValue(JSON.parse(raw));
        } catch {
          setValue((raw as unknown as T) ?? fallback);
        }
      } else {
        setValue(fallback);
      }
    })();

    const unsubscribe = subscribe(({ key: changedKey, value: newValue }) => {
      if (changedKey !== key || cancelled) return;
      try {
        setValue(newValue ? (JSON.parse(newValue) as T) : fallback);
      } catch {
        setValue((newValue as unknown as T) ?? fallback);
      }
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [key, fallback]);

  const update = useCallback(
    (next: T) => {
      try {
        setItem(key, JSON.stringify(next));
      } catch {
        setItem(key, String(next));
      }
      setValue(next);
    },
    [key]
  );

  return [value, update] as const;
}
