/**
 * app/api/health/meds/route.ts
 *
 * Health Medications CRUD API
 * GET: Retrieve all medications for current user
 * POST: Create a new medication (with encrypted fields)
 */

import { NextRequest, NextResponse } from "next/server";
import { getD1Binding, queryAll, execute } from "@/db/client";

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
 * GET /api/health/meds
 * Returns all medications for the authenticated user
 */
export async function GET(req: NextRequest) {
  try {
    const user_id = req.headers.get("x-user-id") || "dev-user";

    if (!user_id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = getD1Binding((global as any).ENV);
    const meds = await queryAll<HealthMed>(
      db,
      "SELECT * FROM health_meds WHERE user_id = ? ORDER BY created_at DESC",
      [user_id]
    );

    return NextResponse.json({ data: meds });
  } catch (error) {
    console.error("[GET /api/health/meds]", error);
    return NextResponse.json(
      { error: "Failed to fetch medications" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/health/meds
 * Create a new medication
 * Body: { name: string (ENC), dose: string (ENC), unit?: string, schedule?: string (ENC) }
 */
export async function POST(req: NextRequest) {
  try {
    const user_id = req.headers.get("x-user-id") || "dev-user";

    if (!user_id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, dose, unit, schedule } = body;

    if (!name || !dose) {
      return NextResponse.json(
        { error: "Name and dose are required" },
        { status: 400 }
      );
    }

    const db = getD1Binding((global as any).ENV);
    const id = crypto.randomUUID();
    const now = Date.now();

    await execute(
      db,
      `INSERT INTO health_meds (id, user_id, name, dose, unit, schedule, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, user_id, name, dose, unit || null, schedule || null, now]
    );

    const med = await queryAll<HealthMed>(
      db,
      "SELECT * FROM health_meds WHERE id = ?",
      [id]
    );

    return NextResponse.json({ data: med[0] }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/health/meds]", error);
    return NextResponse.json(
      { error: "Failed to create medication" },
      { status: 500 }
    );
  }
}
