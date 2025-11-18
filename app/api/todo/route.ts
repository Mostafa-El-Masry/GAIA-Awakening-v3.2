// app/api/todo/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// Single-user baseline: we derive a user_id from env or default constant.
// Later, replace with Supabase Auth user id.
const USER_ID = process.env.TODO_USER_ID || "00000000-0000-0000-0000-000000000001";

export async function GET() {
  const supabase = supabaseAdmin();
  const { data: tasks, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("user_id", USER_ID)
    .order("created_at", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  // Also pull statuses
  const { data: statuses, error: err2 } = await supabase
    .from("task_day_status")
    .select("*")
    .in("task_id", (tasks || []).map(t => t.id));
  if (err2) return NextResponse.json({ error: err2.message }, { status: 500 });
  return NextResponse.json({ tasks: tasks || [], statuses: statuses || [] });
}

export async function POST(req: Request) {
  const supabase = supabaseAdmin();
  const body = await req.json();
  const payload = {
    user_id: USER_ID,
    category: body.category,
    title: body.title,
    note: body.note ?? null,
    priority: body.priority ?? 2,
    pinned: !!body.pinned,
    due_date: body.due_date ?? null,
    repeat: body.repeat ?? "none",
  };
  const { data, error } = await supabase.from("tasks").insert(payload).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ task: data });
}

export async function PATCH(req: Request) {
  const supabase = supabaseAdmin();
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const patch = await req.json();
  const { data, error } = await supabase
    .from("tasks")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", USER_ID)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ task: data });
}

export async function DELETE(req: Request) {
  const supabase = supabaseAdmin();
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const { error } = await supabase.from("tasks").delete().eq("id", id).eq("user_id", USER_ID);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
