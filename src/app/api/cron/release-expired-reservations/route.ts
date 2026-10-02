/**
 * GET/POST /api/cron/release-expired-reservations
 * Scheduled Cron Handler
 * 
 * Periodically invokes public.release_expired_stock_reservations() in the database
 * to release inventory held by expired, abandoned checkout sessions.
 * 
 * Security:
 * - Requires Authorization: Bearer <CRON_SECRET> header when CRON_SECRET is configured.
 * - Utilizes createServiceRoleClient() to execute with appropriate database privileges.
 */

import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/utils/supabase/server";

async function handleCleanup(req: NextRequest) {
  // Validate authorization token if CRON_SECRET is configured
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: "Unauthorized: Invalid or missing authorization token" },
        { status: 401 }
      );
    }
  }

  try {
    const supabase = createServiceRoleClient();
    const { data, error } = await supabase.rpc("release_expired_stock_reservations");

    if (error) {
      console.error("[Cron:ReleaseExpiredReservations] Database RPC error:", error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Expired stock reservations successfully released",
      data,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[Cron:ReleaseExpiredReservations] Execution failed:", message);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  return handleCleanup(req);
}

export async function POST(req: NextRequest) {
  return handleCleanup(req);
}
