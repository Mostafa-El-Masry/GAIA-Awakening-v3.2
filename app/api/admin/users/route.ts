import { NextResponse } from "next/server";

import {
  PERMISSION_STORAGE_KEY,
  ensurePermissionShape,
  type PermissionSet,
} from "@/config/permissions";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";

const MAX_BATCHES = 50;
const USERS_PER_PAGE = 100;

type UserSummary = {
  id: string;
  email: string | null;
  name: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  lastSignInAt: string | null;
  permissions: PermissionSet;
};

type CreateUserPayload = {
  email?: string;
  password?: string;
  name?: string | null;
};

export async function GET() {
  const adminClient = createSupabaseAdminClient();
  if (!adminClient) {
    // In local/dev environments we may not have the Supabase service role key.
    // Return an empty users list instead of a 5xx so the UI can render and
    // fall back gracefully. Log a warning so developers know the admin proxy
    // is not available.
    console.warn(
      "/api/admin/users GET: Supabase admin client not configured — returning empty users list"
    );
    return NextResponse.json({ users: [] });
  }

  try {
    const permissionMap = new Map<string, PermissionSet>();

    const { data: permissionRows, error: permissionError } = await adminClient
      .from("user_storage")
      .select("user_id,value")
      .eq("key", PERMISSION_STORAGE_KEY);

    if (permissionError) {
      throw permissionError;
    }

    for (const row of permissionRows ?? []) {
      if (!row?.user_id) continue;
      let parsed = ensurePermissionShape(null);
      if (typeof row.value === "string") {
        try {
          parsed = ensurePermissionShape(JSON.parse(row.value));
        } catch {
          parsed = ensurePermissionShape(null);
        }
      }
      permissionMap.set(row.user_id, parsed);
    }

    const allUsers: UserSummary[] = [];
    let page = 1;
    let batches = 0;

    while (batches < MAX_BATCHES) {
      const { data, error } = await adminClient.auth.admin.listUsers({
        page,
        perPage: USERS_PER_PAGE,
      });

      if (error) {
        throw error;
      }

      const batch = data?.users ?? [];
      allUsers.push(
        ...batch.map((user) => ({
          id: user.id,
          email: user.email ?? null,
          name:
            (user.user_metadata?.full_name as string | undefined) ??
            (user.user_metadata?.name as string | undefined) ??
            null,
          createdAt: user.created_at ?? null,
          updatedAt: user.updated_at ?? null,
          lastSignInAt: user.last_sign_in_at ?? null,
          permissions:
            permissionMap.get(user.id) ?? ensurePermissionShape(null),
        }))
      );

      batches += 1;
      if (batch.length < USERS_PER_PAGE) {
        break;
      }

      page += 1;
    }

    return NextResponse.json({ users: allUsers });
  } catch (error) {
    console.error("Failed to list Supabase users:", error);
    const message =
      error instanceof Error ? error.message : "Unexpected Supabase error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const adminClient = createSupabaseAdminClient();
  if (!adminClient) {
    console.warn(
      "/api/admin/users POST: Supabase admin client not configured — proxy unavailable"
    );
    return NextResponse.json(
      { error: "Supabase admin proxy unavailable." },
      { status: 501 }
    );
  }

  let payload: CreateUserPayload;
  try {
    payload = (await request.json()) as CreateUserPayload;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON payload." },
      { status: 400 }
    );
  }

  const email = payload.email?.trim().toLowerCase() ?? "";
  const password = payload.password ?? "";
  const name = payload.name?.trim() ?? "";

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required." },
      { status: 400 }
    );
  }

  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json(
      { error: "Enter a valid email address." },
      { status: 400 }
    );
  }

  if (password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters long." },
      { status: 400 }
    );
  }

  try {
    const { data, error } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: name ? { full_name: name } : undefined,
    });

    if (error) {
      throw error;
    }

    const user = data.user;
    if (!user) {
      return NextResponse.json(
        { error: "Supabase did not return a user record." },
        { status: 500 }
      );
    }

    const responsePayload: UserSummary = {
      id: user.id,
      email: user.email ?? null,
      name:
        (user.user_metadata?.full_name as string | undefined) ??
        (user.user_metadata?.name as string | undefined) ??
        null,
      createdAt: user.created_at ?? null,
      updatedAt: user.updated_at ?? null,
      lastSignInAt: user.last_sign_in_at ?? null,
      permissions: ensurePermissionShape(null),
    };

    return NextResponse.json({ user: responsePayload }, { status: 201 });
  } catch (error) {
    console.error("Failed to create Supabase user:", error);
    const message =
      error instanceof Error ? error.message : "Unexpected Supabase error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
