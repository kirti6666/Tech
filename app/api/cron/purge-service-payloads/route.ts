import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import {
  purgeExpiredCredentials,
  findStaleCredentialRequests,
} from "@/lib/services/purgeCredentials";

export const dynamic = "force-dynamic";

/**
 * GET /api/cron/purge-service-payloads — daily retention sweep.
 *
 * Schedule in vercel.json:
 *
 *   { "crons": [{ "path": "/api/cron/purge-service-payloads", "schedule": "0 3 * * *" }] }
 *
 * Guarded by a shared secret rather than left open. It's destructive, and an
 * unauthenticated endpoint that deletes fields is an obvious thing to poke
 * at. Vercel Cron sends `Authorization: Bearer $CRON_SECRET` automatically
 * when CRON_SECRET is set.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    console.error("[cron] CRON_SECRET is not set — refusing to run.");
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }
  if (req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();

    const summary = await purgeExpiredCredentials();
    const stale = await findStaleCredentialRequests();

    if (stale.length) {
      // Not purged automatically — the customer may still be waiting on
      // work. But live credentials sitting against a request nobody has
      // touched in two months needs a human decision, so make noise.
      console.warn(
        `[cron] ${stale.length} service request(s) still hold credentials after 60 days with no delivery.`
      );
    }

    return NextResponse.json({
      ok: true,
      ...summary,
      staleWithCredentials: stale.length,
    });
  } catch (error) {
    console.error("[cron] purge failed:", error);
    return NextResponse.json({ error: "Purge failed" }, { status: 500 });
  }
}
