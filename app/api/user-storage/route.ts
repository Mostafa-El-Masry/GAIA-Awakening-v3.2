import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";

/**
 * Server API to read / write / delete per-user entries from `user_storage`.
 *
 * Security model:
 * - Client must send Authorization: Bearer <access_token> (Supabase access token)
 * - The server uses the Supabase service role key to validate the token and
 *   perform operations scoped to that user.
 */

const TABLE = "user_storage";

function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export async function GET(req: Request) {
  const admin = createSupabaseAdminClient();
  // If Supabase service role is not configured on this machine (dev),
  // return an empty storage object so the client can fall back to the
  // browser-side mechanism without spamming server errors in the log.
  if (!admin) {
    console.warn(
      "/api/user-storage GET: Supabase admin client not configured — returning empty storage fallback"
    );
    return json({ storage: {} });
  }

  const auth = req.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return json({ error: "Missing Authorization token" }, 401);

  try {
    const { data: userData, error: userError } = await admin.auth.getUser(
      token
    );
    if (userError || !userData?.user)
      return json({ error: "Invalid token" }, 401);
    const userId = userData.user.id;

    const { data, error } = await admin
      .from(TABLE)
      .select("key,value")
      .eq("user_id", userId);

    if (error) return json({ error: error.message }, 500);

    const out: Record<string, string> = {};
    for (const row of data ?? []) {
      if (row?.key && typeof row.value === "string") out[row.key] = row.value;
    }
    return json({ storage: out });
  } catch (err) {
    console.error("/api/user-storage GET error:", err);
    return json({ error: "Server error" }, 500);
  }
}

export async function POST(req: Request) {
  const admin = createSupabaseAdminClient();
  if (!admin) {
    console.warn(
      "/api/user-storage POST: Supabase admin client not configured — proxy unavailable"
    );
    return json({ error: "Supabase not configured on server" }, 501);
  }

  const auth = req.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return json({ error: "Missing Authorization token" }, 401);

  try {
    const { data: userData, error: userError } = await admin.auth.getUser(
      token
    );
    if (userError || !userData?.user)
      return json({ error: "Invalid token" }, 401);
    const userId = userData.user.id;

    const body = await req.json();
    const key = typeof body?.key === "string" ? body.key : null;
    const value = typeof body?.value === "string" ? body.value : null;

    if (!key) return json({ error: "Missing key" }, 400);

    if (value === null) {
      // explicit deletion path if value is null
      const { error } = await admin
        .from(TABLE)
        .delete()
        .match({ user_id: userId, key });
      if (error) return json({ error: error.message }, 500);
      return json({ ok: true, deleted: true });
    }

    const { error } = await admin.from(TABLE).upsert(
      [
        {
          user_id: userId,
          key,
          value,
        },
      ],
      { onConflict: "user_id,key" }
    );
    if (error) return json({ error: error.message }, 500);
    return json({ ok: true });
  } catch (err) {
    console.error("/api/user-storage POST error:", err);
    return json({ error: "Server error" }, 500);
  }
}

export async function DELETE(req: Request) {
  const admin = createSupabaseAdminClient();
  if (!admin) {
    console.warn(
      "/api/user-storage DELETE: Supabase admin client not configured — proxy unavailable"
    );
    return json({ error: "Supabase not configured on server" }, 501);
  }

  const auth = req.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return json({ error: "Missing Authorization token" }, 401);

  try {
    const { data: userData, error: userError } = await admin.auth.getUser(
      token
    );
    if (userError || !userData?.user)
      return json({ error: "Invalid token" }, 401);
    const userId = userData.user.id;

    const url = new URL(req.url);
    const key = url.searchParams.get("key");
    if (!key) return json({ error: "Missing key query param" }, 400);

    const { error } = await admin
      .from(TABLE)
      .delete()
      .match({ user_id: userId, key });
    if (error) return json({ error: error.message }, 500);
    return json({ ok: true });
  } catch (err) {
    console.error("/api/user-storage DELETE error:", err);
    return json({ error: "Server error" }, 500);
  }
}
