/**
 * app/api/health/metrics/route.ts
 *
 * Health Metrics CRUD API
 * GET: Retrieve all metrics for current user (with optional date range)
 * POST: Create a new metric
 */

import { NextRequest, NextResponse } from "next/server";
import { getD1Binding, queryAll, execute } from "@/db/client";

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
 * GET /api/health/metrics
 * Returns all metrics for the authenticated user
 * Query params: ?from=ms&to=ms (optional date range filter)
 */
export async function GET(req: NextRequest) {
  try {
    const user_id = req.headers.get("x-user-id") || "dev-user";

    if (!user_id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const db = getD1Binding((global as any).ENV);

    let query = "SELECT * FROM health_metrics WHERE user_id = ?";
    const params: any[] = [user_id];

    if (from) {
      query += " AND date >= ?";
      params.push(parseInt(from));
    }
    if (to) {
      query += " AND date <= ?";
      params.push(parseInt(to));
    }

    query += " ORDER BY date DESC";

    const metrics = await queryAll<HealthMetric>(db, query, params);

    return NextResponse.json({ data: metrics });
  } catch (error) {
    console.error("[GET /api/health/metrics]", error);
    return NextResponse.json(
      { error: "Failed to fetch metrics" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/health/metrics
 * Create a new metric
 * Body: { date: number, weight?: number, bg_fasting?: number, bg_post?: number, notes?: string (ENC) }
 */
export async function POST(req: NextRequest) {
  try {
    const user_id = req.headers.get("x-user-id") || "dev-user";

    if (!user_id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { date, weight, bg_fasting, bg_post, notes } = body;

    if (!date) {
      return NextResponse.json({ error: "Date is required" }, { status: 400 });
    }

    const db = getD1Binding((global as any).ENV);
    const id = crypto.randomUUID();
    const now = Date.now();

    await execute(
      db,
      `INSERT INTO health_metrics (id, user_id, date, weight, bg_fasting, bg_post, notes, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        user_id,
        date,
        weight || null,
        bg_fasting || null,
        bg_post || null,
        notes || null,
        now,
      ]
    );

    const metric = await queryAll<HealthMetric>(
      db,
      "SELECT * FROM health_metrics WHERE id = ?",
      [id]
    );

    return NextResponse.json({ data: metric[0] }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/health/metrics]", error);
    return NextResponse.json(
      { error: "Failed to create metric" },
      { status: 500 }
    );
  }
}
