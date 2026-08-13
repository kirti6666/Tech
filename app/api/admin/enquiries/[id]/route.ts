import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Enquiry from "@/models/Enquiry";
import { requireAdmin } from "@/lib/middleware/requireAdmin";

/**
 * PATCH /api/admin/enquiries/[id] — move a lead along the pipeline.
 *
 * No DELETE. An enquiry someone decided not to pursue is still a record of
 * a person who contacted you, and "closed" carries that honestly where a
 * deletion pretends it never happened. It also keeps the data-deletion
 * story simple: if someone asks you to erase their enquiry, that's a
 * deliberate act, not a routine button.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    await connectDB();

    const body = await req.json();
    const update: Record<string, unknown> = {};

    if (body.status) {
      if (!["new", "contacted", "converted", "closed"].includes(body.status)) {
        return NextResponse.json({ error: "Unknown status" }, { status: 400 });
      }
      update.status = body.status;
    }
    if (typeof body.adminNotes === "string") {
      update.adminNotes = body.adminNotes.slice(0, 5000);
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }

    const enquiry = await Enquiry.findByIdAndUpdate(params.id, update, {
      new: true,
    });
    if (!enquiry) {
      return NextResponse.json({ error: "Enquiry not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, status: enquiry.status });
  } catch (error) {
    console.error("PATCH /api/admin/enquiries failed:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
