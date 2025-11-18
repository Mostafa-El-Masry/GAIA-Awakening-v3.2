// lib/supabaseAdmin.ts
import { createClient } from "@supabase/supabase-js";

// Server-only Supabase client (service role).
// DO NOT import this in client components.
export function supabaseAdmin() {
  const url = process.env.SUPABASE_URL as string;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
  if (!url || !key) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }
  return createClient(url, key, { auth: { persistSession: false } });
}
