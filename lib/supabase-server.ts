/**
 * lib/supabase-server.ts
 *
 * Supabase server-side client for API routes
 * Handles database queries and authentication
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabase: SupabaseClient | null = null;
if (supabaseUrl && supabaseServiceKey) {
  supabase = createClient(supabaseUrl, supabaseServiceKey);
}

export function getSupabaseClient(): SupabaseClient {
  if (!supabase) {
    throw new Error(
      "Supabase environment variables are missing. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
    );
  }
  return supabase;
}

export { supabase };

/**
 * Get the authenticated user from session
 */
export async function getAuthUser(req: any) {
  const client = getSupabaseClient();
  const authHeader = req.headers.get("authorization");
  if (!authHeader) {
    throw new Error("No authorization header");
  }

  const token = authHeader.replace("Bearer ", "");
  const {
    data: { user },
    error,
  } = await client.auth.getUser(token);

  if (error || !user) {
    throw new Error("Unauthorized");
  }

  return user;
}

/**
 * Helper to query data with user isolation
 */
export async function queryWithUserIsolation(
  table: string,
  userId: string,
  filters?: Record<string, any>
) {
  const client = getSupabaseClient();
  let query = client.from(table).select("*").eq("user_id", userId);

  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      query = query.eq(key, value);
    });
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

/**
 * Helper to insert data
 */
export async function insertData(table: string, data: any) {
  const client = getSupabaseClient();
  const { data: result, error } = await client
    .from(table)
    .insert([data])
    .select();

  if (error) throw error;
  return result?.[0];
}

/**
 * Helper to update data
 */
export async function updateData(table: string, id: string, updates: any) {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from(table)
    .update(updates)
    .eq("id", id)
    .select();

  if (error) throw error;
  return data?.[0];
}

/**
 * Helper to delete data (soft delete)
 */
export async function softDelete(table: string, id: string) {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from(table)
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select();

  if (error) throw error;
  return data?.[0];
}

/**
 * Helper to hard delete data
 */
export async function hardDelete(table: string, id: string) {
  const client = getSupabaseClient();
  const { error } = await client.from(table).delete().eq("id", id);

  if (error) throw error;
  return { success: true };
}
