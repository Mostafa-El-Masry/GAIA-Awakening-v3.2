/**
 * app/api/health/conditions/[id]/route.ts
 *
 * Health Conditions individual CRUD
 * GET: Retrieve a specific condition
 * PUT: Update a condition
 * DELETE: Delete a condition
 */

import { NextRequest, NextResponse } from "next/server";
import { getD1Binding, queryOne, execute } from "@/db/client";

interface HealthCondition {
  id: string;
  user_id: string;
  name: string; // encrypted
  notes: string; // encrypted
  created_at: number;
}

/**
 * GET /api/health/conditions/[id]
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user_id = req.headers.get("x-user-id") || "dev-user";
    const { id } = await params;

    if (!user_id || !id) {
      return NextResponse.json(
        { error: "Unauthorized or missing id" },
        { status: 400 }
      );
    }

    const db = getD1Binding((global as any).ENV);
    const condition = await queryOne<HealthCondition>(
      db,
      "SELECT * FROM health_conditions WHERE id = ? AND user_id = ?",
      [id, user_id]
    );

    if (!condition) {
      return NextResponse.json(
        { error: "Condition not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: condition });
  } catch (error) {
    console.error("[GET /api/health/conditions/[id]]", error);
    return NextResponse.json(
      { error: "Failed to fetch condition" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/health/conditions/[id]
 * Update a condition
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user_id = req.headers.get("x-user-id") || "dev-user";
    const { id } = await params;

    if (!user_id || !id) {
      return NextResponse.json(
        { error: "Unauthorized or missing id" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { name, notes } = body;

    const db = getD1Binding((global as any).ENV);

    // Verify ownership
    const existing = await queryOne(
      db,
      "SELECT * FROM health_conditions WHERE id = ? AND user_id = ?",
      [id, user_id]
    );

    if (!existing) {
      return NextResponse.json(
        { error: "Condition not found" },
        { status: 404 }
      );
    }

    // Update only provided fields
    let updates: string[] = [];
    let values: any[] = [];

    if (name !== undefined) {
      updates.push("name = ?");
      values.push(name);
    }
    if (notes !== undefined) {
      updates.push("notes = ?");
      values.push(notes);
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 }
      );
    }

    values.push(id, user_id);

    await execute(
      db,
      `UPDATE health_conditions SET ${updates.join(
        ", "
      )} WHERE id = ? AND user_id = ?`,
      values
    );

    const updated = await queryOne<HealthCondition>(
      db,
      "SELECT * FROM health_conditions WHERE id = ?",
      [id]
    );

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error("[PUT /api/health/conditions/[id]]", error);
    return NextResponse.json(
      { error: "Failed to update condition" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/health/conditions/[id]
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user_id = req.headers.get("x-user-id") || "dev-user";
    const { id } = await params;

    if (!user_id || !id) {
      return NextResponse.json(
        { error: "Unauthorized or missing id" },
        { status: 400 }
      );
    }

    const db = getD1Binding((global as any).ENV);

    // Verify ownership
    const existing = await queryOne(
      db,
      "SELECT * FROM health_conditions WHERE id = ? AND user_id = ?",
      [id, user_id]
    );

    if (!existing) {
      return NextResponse.json(
        { error: "Condition not found" },
        { status: 404 }
      );
    }

    await execute(
      db,
      "DELETE FROM health_conditions WHERE id = ? AND user_id = ?",
      [id, user_id]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/health/conditions/[id]]", error);
    return NextResponse.json(
      { error: "Failed to delete condition" },
      { status: 500 }
    );
  }
}
