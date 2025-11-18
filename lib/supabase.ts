// lib/supabase.ts
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

type StorageAdapter = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
} | null;

function createSessionStorageAdapter(): StorageAdapter {
  if (typeof window === "undefined") return null;
  try {
    const storage = window.sessionStorage;
    if (!storage) return null;
    return {
      getItem: (key: string) => {
        try {
          return storage.getItem(key);
        } catch {
          return null;
        }
      },
      setItem: (key: string, value: string) => {
        try {
          storage.setItem(key, value);
        } catch {
          // ignore quota/security errors
        }
      },
      removeItem: (key: string) => {
        try {
          storage.removeItem(key);
        } catch {
          // ignore removal errors
        }
      },
    };
  } catch {
    return null;
  }
}

const authStorage = createSessionStorageAdapter();
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

let supabase: SupabaseClient | null = null;

function createSupabaseClient(): SupabaseClient {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Supabase environment variables are missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      storage: authStorage ?? undefined,
    },
  });
}

if (isSupabaseConfigured) {
  supabase = createSupabaseClient();
}

export function getSupabaseClient(): SupabaseClient {
  if (!supabase) {
    supabase = createSupabaseClient();
  }
  return supabase;
}

export { supabase };
