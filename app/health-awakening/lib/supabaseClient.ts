import { createClient, SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let supabase: SupabaseClient | null = null;

/**
 * Health Awakening Supabase client.
 * If env vars are missing, GAIA will stay in local-cache-only mode.
 */
if (url && anonKey) {
  supabase = createClient(url, anonKey);
}

export { supabase };
