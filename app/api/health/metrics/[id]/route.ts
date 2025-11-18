/**
 * app/api/health/metrics/[id]/route.ts
 *
 * Health Metrics individual CRUD
 * GET: Retrieve a specific metric
 * PUT: Update a metric
 * DELETE: Delete a metric
 */

import { NextRequest, NextResponse } from "next/server";
import { getD1Binding, queryOne, execute } from "@/db/client";

interface HealthMetric {
  id: string;
  user_id: string;
  date: number; // epoch
  weight: number;
  bg_fasting: number;
  bg_post: number;
  notes: string; // encrypted
  created_at: number;
}

/**
 * GET /api/health/metrics/[id]
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
    const metric = await queryOne<HealthMetric>(
      db,
      "SELECT * FROM health_metrics WHERE id = ? AND user_id = ?",
      [id, user_id]
    );

    if (!metric) {
      return NextResponse.json({ error: "Metric not found" }, { status: 404 });
    }

    return NextResponse.json({ data: metric });
  } catch (error) {
    console.error("[GET /api/health/metrics/[id]]", error);
    return NextResponse.json(
      { error: "Failed to fetch metric" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/health/metrics/[id]
 * Update a metric
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
    const { date, weight, bg_fasting, bg_post, notes } = body;

    const db = getD1Binding((global as any).ENV);

    // Verify ownership
    const existing = await queryOne(
      db,
      "SELECT * FROM health_metrics WHERE id = ? AND user_id = ?",
      [id, user_id]
    );

    if (!existing) {
      return NextResponse.json({ error: "Metric not found" }, { status: 404 });
    }

    // Update only provided fields
    let updates: string[] = [];
    let values: any[] = [];

    if (date !== undefined) {
      updates.push("date = ?");
      values.push(date);
    }
    if (weight !== undefined) {
      updates.push("weight = ?");
      values.push(weight);
    }
    if (bg_fasting !== undefined) {
      updates.push("bg_fasting = ?");
      values.push(bg_fasting);
    }
    if (bg_post !== undefined) {
      updates.push("bg_post = ?");
      values.push(bg_post);
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
      `UPDATE health_metrics SET ${updates.join(
        ", "
      )} WHERE id = ? AND user_id = ?`,
      values
    );

    const updated = await queryOne<HealthMetric>(
      db,
      "SELECT * FROM health_metrics WHERE id = ?",
      [id]
    );

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error("[PUT /api/health/metrics/[id]]", error);
    return NextResponse.json(
      { error: "Failed to update metric" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/health/metrics/[id]
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
      "SELECT * FROM health_metrics WHERE id = ? AND user_id = ?",
      [id, user_id]
    );

    if (!existing) {
      return NextResponse.json({ error: "Metric not found" }, { status: 404 });
    }

    await execute(
      db,
      "DELETE FROM health_metrics WHERE id = ? AND user_id = ?",
      [id, user_id]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/health/metrics/[id]]", error);
    return NextResponse.json(
      { error: "Failed to delete metric" },
      { status: 500 }
    );
  }
}
