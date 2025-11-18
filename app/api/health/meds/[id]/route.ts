/**
 * app/api/health/meds/[id]/route.ts
 *
 * Health Medications individual CRUD
 * GET: Retrieve a specific medication
 * PUT: Update a medication
 * DELETE: Delete a medication
 */

import { NextRequest, NextResponse } from "next/server";
import { getD1Binding, queryOne, execute } from "@/db/client";

interface HealthMed {
  id: string;
  user_id: string;
  name: string; // encrypted
  dose: string; // encrypted
  unit: string; // encrypted or plaintext
  schedule: string; // encrypted (JSON)
  created_at: number;
}

/**
 * GET /api/health/meds/[id]
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
    const med = await queryOne<HealthMed>(
      db,
      "SELECT * FROM health_meds WHERE id = ? AND user_id = ?",
      [id, user_id]
    );

    if (!med) {
      return NextResponse.json(
        { error: "Medication not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: med });
  } catch (error) {
    console.error("[GET /api/health/meds/[id]]", error);
    return NextResponse.json(
      { error: "Failed to fetch medication" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/health/meds/[id]
 * Update a medication
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
    const { name, dose, unit, schedule } = body;

    const db = getD1Binding((global as any).ENV);

    // Verify ownership
    const existing = await queryOne(
      db,
      "SELECT * FROM health_meds WHERE id = ? AND user_id = ?",
      [id, user_id]
    );

    if (!existing) {
      return NextResponse.json(
        { error: "Medication not found" },
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
    if (dose !== undefined) {
      updates.push("dose = ?");
      values.push(dose);
    }
    if (unit !== undefined) {
      updates.push("unit = ?");
      values.push(unit);
    }
    if (schedule !== undefined) {
      updates.push("schedule = ?");
      values.push(schedule);
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
      `UPDATE health_meds SET ${updates.join(
        ", "
      )} WHERE id = ? AND user_id = ?`,
      values
    );

    const updated = await queryOne<HealthMed>(
      db,
      "SELECT * FROM health_meds WHERE id = ?",
      [id]
    );

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error("[PUT /api/health/meds/[id]]", error);
    return NextResponse.json(
      { error: "Failed to update medication" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/health/meds/[id]
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
      "SELECT * FROM health_meds WHERE id = ? AND user_id = ?",
      [id, user_id]
    );

    if (!existing) {
      return NextResponse.json(
        { error: "Medication not found" },
        { status: 404 }
      );
    }

    await execute(db, "DELETE FROM health_meds WHERE id = ? AND user_id = ?", [
      id,
      user_id,
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/health/meds/[id]]", error);
    return NextResponse.json(
      { error: "Failed to delete medication" },
      { status: 500 }
    );
  }
}
