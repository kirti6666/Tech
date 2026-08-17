import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import PartnerLead from "@/models/PartnerLead";
import { requireAdmin } from "@/lib/middleware/requireAdmin";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    const body = await req.json();
    if (!["new", "contacted", "approved", "declined"].includes(body.status)) {
      return NextResponse.json({ error: "Unknown status" }, { status: 400 });
    }
    await connectDB();
    const lead = await PartnerLead.findByIdAndUpdate(params.id, { status: body.status }, { new: true });
    if (!lead) return NextResponse.json({ error: "Partner registration not found" }, { status: 404 });
    return NextResponse.json({ ok: true, status: lead.status });
  } catch (error) {
    console.error("PATCH /api/admin/partners failed:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
