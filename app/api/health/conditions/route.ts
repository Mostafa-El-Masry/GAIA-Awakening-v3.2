/**
 * app/api/health/conditions/route.ts
 *
 * Health Conditions CRUD API
 * GET: Retrieve all conditions for current user
 * POST: Create a new condition (with encrypted fields)
 */

import { NextRequest, NextResponse } from "next/server";
import { getD1Binding, queryAll, execute } from "@/db/client";

interface HealthCondition {
  id: string;
  user_id: string;
  name: string; // encrypted
  notes: string; // encrypted
  created_at: number;
}

/**
 * GET /api/health/conditions
 * Returns all conditions for the authenticated user
 */
export async function GET(req: NextRequest) {
  try {
    // TODO: Extract user_id from auth context (Week 6)
    const user_id = req.headers.get("x-user-id") || "dev-user";

    if (!user_id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = getD1Binding((global as any).ENV);
    const conditions = await queryAll<HealthCondition>(
      db,
      "SELECT * FROM health_conditions WHERE user_id = ? ORDER BY created_at DESC",
      [user_id]
    );

    return NextResponse.json({ data: conditions });
  } catch (error) {
    console.error("[GET /api/health/conditions]", error);
    return NextResponse.json(
      { error: "Failed to fetch conditions" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/health/conditions
 * Create a new condition
 * Body: { name: string (ENC), notes?: string (ENC) }
 */
export async function POST(req: NextRequest) {
  try {
    // TODO: Extract user_id from auth context (Week 6)
    const user_id = req.headers.get("x-user-id") || "dev-user";

    if (!user_id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, notes } = body;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const db = getD1Binding((global as any).ENV);
    const id = crypto.randomUUID();
    const now = Date.now();

    await execute(
      db,
      `INSERT INTO health_conditions (id, user_id, name, notes, created_at)
       VALUES (?, ?, ?, ?, ?)`,
      [id, user_id, name, notes || null, now]
    );

    const condition = await queryAll<HealthCondition>(
      db,
      "SELECT * FROM health_conditions WHERE id = ?",
      [id]
    );

    return NextResponse.json({ data: condition[0] }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/health/conditions]", error);
    return NextResponse.json(
      { error: "Failed to create condition" },
      { status: 500 }
    );
  }
}
