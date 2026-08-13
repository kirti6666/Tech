import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Order from "@/models/Order";
import License from "@/models/License";
import Invoice from "@/models/Invoice";
import ServiceRequest from "@/models/ServiceRequest";
import Product from "@/models/Product";
import { createUploadUrl, isStorageConfigured } from "@/lib/storage";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * GET /api/cron/backup — daily export of the records you cannot recreate.
 *
 * READ THIS BEFORE RELYING ON IT.
 *
 * This is NOT a database backup. It cannot be: `mongodump` isn't available
 * in a serverless runtime, and a function with a 60-second ceiling can't
 * stream a growing database anyway. Your actual backup is your provider's —
 * MongoDB Atlas takes continuous snapshots on M10 and above, and on the
 * free tier it takes none at all. If you are on the free tier in
 * production, this endpoint is not the answer; upgrading is.
 *
 * What this DOES do is export the handful of collections whose loss would
 * be unrecoverable rather than merely painful: orders, licences, invoices
 * and service requests. Products can be re-uploaded. Users can re-register.
 * You cannot reconstruct who bought what, which licence keys you issued, or
 * what a tax invoice said — and Indian tax law requires you to keep the
 * last one for eight years.
 *
 * Written to the private bucket as dated JSON. Restoring means reading the
 * file, not clicking a button — deliberately manual, because an automated
 * restore path is a way to overwrite good data with old data at 3am.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    console.error("[cron/backup] CRON_SECRET is not set — refusing to run.");
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }
  if (req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isStorageConfigured()) {
    return NextResponse.json(
      { error: "Object storage is not configured" },
      { status: 503 }
    );
  }

  try {
    await connectDB();

    const [orders, licenses, invoices, services, productCount] = await Promise.all([
      Order.find({}).lean(),
      License.find({}).lean(),
      Invoice.find({}).lean(),
      // Credentials are excluded. A backup is a copy that lives longer and
      // is watched less closely than the database — copying customers'
      // server passwords into it would undo the whole retention design in
      // lib/services/purgeCredentials.ts.
      ServiceRequest.find({}).select("-payload").lean(),
      Product.countDocuments({}),
    ]);

    const stamp = new Date().toISOString().slice(0, 10);
    const key = `backups/${stamp}/records.json`;

    const payload = JSON.stringify({
      exportedAt: new Date().toISOString(),
      note: "Business records export. Not a full database backup — see the provider snapshot.",
      counts: {
        orders: orders.length,
        licenses: licenses.length,
        invoices: invoices.length,
        serviceRequests: services.length,
        products: productCount,
      },
      orders,
      licenses,
      invoices,
      serviceRequests: services,
    });

    // Signed PUT rather than an SDK upload so this uses the same storage
    // path as everything else and needs no extra permissions.
    const uploadUrl = await createUploadUrl(key, "application/json");
    const response = await fetch(uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: payload,
    });

    if (!response.ok) {
      throw new Error(`Upload failed with ${response.status}`);
    }

    const sizeMb = (payload.length / 1_048_576).toFixed(1);
    console.log(`[cron/backup] wrote ${key} (${sizeMb} MB)`);

    // A backup nobody checks is a backup that silently stopped working three
    // months ago. Non-2xx makes the cron show as failed so it's visible.
    return NextResponse.json({
      ok: true,
      key,
      sizeMb: Number(sizeMb),
      counts: {
        orders: orders.length,
        licenses: licenses.length,
        invoices: invoices.length,
        serviceRequests: services.length,
      },
    });
  } catch (error) {
    console.error("[cron/backup] failed:", error);
    return NextResponse.json({ error: "Backup failed" }, { status: 500 });
  }
}
