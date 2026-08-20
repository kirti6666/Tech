import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAdmin } from "@/lib/middleware/requireAdmin";
import { freeResourceSchema } from "@/lib/validations/free-resource";
import FreeResource from "@/models/FreeResource";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  if (!(await requireAdmin(req))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    await connectDB();
    const parsed = freeResourceSchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || "Please check the form" }, { status: 400 });
    const existing = await FreeResource.findById(params.id);
    if (!existing) return NextResponse.json({ error: "Resource not found" }, { status: 404 });
    const nextSlug = parsed.data.slug || existing.slug;
    const slugTaken = await FreeResource.exists({ slug: nextSlug, _id: { $ne: params.id } });
    if (slugTaken) return NextResponse.json({ error: "That URL slug is already in use" }, { status: 409 });
    Object.assign(existing, parsed.data, { slug: nextSlug });
    await existing.save();
    return NextResponse.json({ resource: existing });
  } catch (error) {
    console.error("PATCH /api/admin/freebies/[id] failed:", error);
    return NextResponse.json({ error: "Could not save this resource" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  if (!(await requireAdmin(req))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await connectDB();
  const deleted = await FreeResource.findByIdAndDelete(params.id);
  if (!deleted) return NextResponse.json({ error: "Resource not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
