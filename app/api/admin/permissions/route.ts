import { NextResponse } from "next/server";

import {
  PERMISSION_STORAGE_KEY,
  ensurePermissionShape,
  type PermissionSet,
} from "@/config/permissions";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";

type UpdatePayload = {
  userId?: string;
  permissions?: Partial<PermissionSet> | null;
};

export async function PUT(request: Request) {
  const adminClient = createSupabaseAdminClient();

  if (!adminClient) {
    return NextResponse.json(
      {
        error:
          "Supabase service-role credentials are not configured. Set SUPABASE_SERVICE_ROLE_KEY in your environment.",
      },
      { status: 503 }
    );
  }

  let payload: UpdatePayload;
  try {
    payload = (await request.json()) as UpdatePayload;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON payload." },
      { status: 400 }
    );
  }

  const userId = payload.userId?.trim();
  if (!userId) {
    return NextResponse.json({ error: "userId is required." }, { status: 400 });
  }

  const shaped = ensurePermissionShape(payload.permissions ?? null);

  const { error } = await adminClient.from("user_storage").upsert(
    [
      {
        user_id: userId,
        key: PERMISSION_STORAGE_KEY,
        value: JSON.stringify(shaped),
      },
    ],
    { onConflict: "user_id,key" }
  );

  if (error) {
    console.error("Failed to update permissions:", error);
    return NextResponse.json(
      { error: error.message ?? "Unable to update permissions." },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, permissions: shaped });
}
