import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import ServiceRequest from "@/models/ServiceRequest";
import { requireAdmin } from "@/lib/middleware/requireAdmin";
import { maskPayload } from "@/lib/services/schemas";
import type { AddonType } from "@/types/catalog";

/**
 * GET /api/admin/services — the work queue.
 *
 * Default sort is oldest first, not newest. A support queue sorted newest
 * first buries the request that has been waiting three weeks under today's
 * arrivals, which is exactly the one that needs attention.
 *
 * Payloads come back masked. The queue view never needs a customer's server
 * password, and a list endpoint that decrypts every row is a much bigger
 * exposure than a single detail view that does it deliberately.
 */
export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const type = searchParams.get("type");
    const page = Math.max(1, Number(searchParams.get("page") ?? 1));
    const limit = Math.min(50, Number(searchParams.get("limit") ?? 25));

    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    if (type) filter.type = type;
    // "waiting on customer" — paid, queued, no details supplied yet.
    if (searchParams.get("awaitingDetails") === "true") {
      filter.payloadSubmittedAt = { $exists: false };
    }

    const [docs, total, counts] = await Promise.all([
      ServiceRequest.find(filter)
        .sort({ createdAt: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate("user", "name email")
        .populate("product", "title slug")
        .populate("order", "orderNumber")
        .lean(),
      ServiceRequest.countDocuments(filter),
      ServiceRequest.aggregate([
        { $group: { _id: "$status", n: { $sum: 1 } } },
      ]),
    ]);

    const requests = (docs as unknown as {
      type: AddonType;
      payload: Record<string, unknown>;
    }[]).map((doc) => ({
      ...doc,
      payload: maskPayload(doc.type, doc.payload ?? {}),
    }));

    return NextResponse.json({
      requests: JSON.parse(JSON.stringify(requests)),
      counts: Object.fromEntries(
        (counts as { _id: string; n: number }[]).map((c) => [c._id, c.n])
      ),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("GET /api/admin/services failed:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
