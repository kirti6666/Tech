import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAdmin } from "@/lib/middleware/requireAdmin";
import { freeResourceSchema } from "@/lib/validations/free-resource";
import { slugify } from "@/lib/slugify";
import FreeResource from "@/models/FreeResource";

export async function GET(req: NextRequest) {
  if (!(await requireAdmin(req))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await connectDB();
  const resources = await FreeResource.find({}).sort({ updatedAt: -1 }).lean();
  return NextResponse.json({ resources });
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin(req))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    await connectDB();
    const parsed = freeResourceSchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || "Please check the form" }, { status: 400 });
    let slug = parsed.data.slug || slugify(parsed.data.title);
    if (await FreeResource.exists({ slug })) slug = `${slug}-${Date.now().toString(36).slice(-4)}`;
    const resource = await FreeResource.create({ ...parsed.data, slug });
    return NextResponse.json({ resource }, { status: 201 });
  } catch (error) {
    console.error("POST /api/admin/freebies failed:", error);
    return NextResponse.json({ error: "Could not create this resource" }, { status: 500 });
  }
}
