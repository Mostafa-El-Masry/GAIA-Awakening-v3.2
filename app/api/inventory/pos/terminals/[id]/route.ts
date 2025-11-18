import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getSupabaseClient } from "@/lib/supabase-server";

interface POSTerminal {
  id: string;
  user_id: string;
  terminal_num: number;
  location_id: string;
  terminal_name: string | null;
  is_active: boolean;
  last_online: string | null;
  created_at: string;
  updated_at: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("pos_terminals")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: "Terminal not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error("GET /api/inventory/pos/terminals/[id]:", error);
    return NextResponse.json(
      { error: "Failed to fetch terminal" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const supabase = getSupabaseClient();

    // Verify ownership
    const { data: existing, error: fetchError } = await supabase
      .from("pos_terminals")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json(
        { error: "Terminal not found" },
        { status: 404 }
      );
    }

    const { terminal_name, is_active, last_online } = body;

    const updates: Record<string, any> = {};

    if (terminal_name !== undefined) {
      updates.terminal_name = terminal_name;
    }
    if (is_active !== undefined) {
      updates.is_active = is_active;
    }
    if (last_online !== undefined) {
      updates.last_online = last_online;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("pos_terminals")
      .update(updates)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (error: any) {
    console.error("PUT /api/inventory/pos/terminals/[id]:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update terminal" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const supabase = getSupabaseClient();

    // Verify ownership
    const { data: existing, error: fetchError } = await supabase
      .from("pos_terminals")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json(
        { error: "Terminal not found" },
        { status: 404 }
      );
    }

    // Soft delete
    const { error } = await supabase
      .from("pos_terminals")
      .update({ is_active: false })
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE /api/inventory/pos/terminals/[id]:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete terminal" },
      { status: 500 }
    );
  }
}
