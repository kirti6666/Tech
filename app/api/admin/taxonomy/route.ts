import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Industry from "@/models/Industry";
import Technology from "@/models/Technology";
import Product from "@/models/Product";
import { requireAdmin } from "@/lib/middleware/requireAdmin";
import { logAdminAction, getClientIp } from "@/lib/middleware/logAdminAction";
import { recountTaxonomy } from "@/lib/recountTaxonomy";
import { TECH_CATEGORIES } from "@/types/catalog";

/**
 * One route for both taxonomies, keyed on ?kind=industry|technology.
 *
 * They differ by one field — technologies have a layer category — so two
 * near-identical route files would just be two places to fix the same bug.
 *
 * Slugs are fixed after creation, same reasoning as products: /industry/
 * fintech and /technology/react are indexed URLs, and renaming one throws
 * away whatever ranking it had.
 */

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function modelFor(kind: string | null) {
  return kind === "technology" ? Technology : Industry;
}

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await connectDB();

  const [industries, technologies] = await Promise.all([
    Industry.find({}).sort({ displayOrder: 1, name: 1 }).lean(),
    Technology.find({}).sort({ category: 1, displayOrder: 1, name: 1 }).lean(),
  ]);

  return NextResponse.json({ industries, technologies });
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    await connectDB();

    const kind = req.nextUrl.searchParams.get("kind");
    const Model = modelFor(kind);
    const body = await req.json();

    const name = String(body.name ?? "").trim();
    if (!name) {
      return NextResponse.json(
        { error: "A name is required", fields: { name: "Required" } },
        { status: 400 }
      );
    }

    if (kind === "technology" && !TECH_CATEGORIES.includes(body.category)) {
      return NextResponse.json(
        { error: "Choose a layer", fields: { category: "Required" } },
        { status: 400 }
      );
    }

    const slug = slugify(name);
    if (await Model.exists({ slug })) {
      return NextResponse.json(
        { error: `"${name}" already exists`, fields: { name: "Already used" } },
        { status: 409 }
      );
    }

    const doc = await Model.create({
      name,
      slug,
      description: body.description,
      icon: body.icon,
      logo: body.logo,
      category: kind === "technology" ? body.category : undefined,
      displayOrder: Number(body.displayOrder) || 0,
      isActive: body.isActive !== false,
    });

    await logAdminAction({
      adminId: admin.id,
      action: "CATEGORY_CREATE",
      targetType: kind === "technology" ? "Technology" : "Industry",
      targetId: doc._id.toString(),
      ipAddress: getClientIp(req),
    });

    return NextResponse.json({ item: doc }, { status: 201 });
  } catch (error) {
    console.error("POST /api/admin/taxonomy failed:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    await connectDB();

    const kind = req.nextUrl.searchParams.get("kind");
    const Model = modelFor(kind);
    const body = await req.json();

    if (!body.id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    // Slug intentionally not in this list.
    const update: Record<string, unknown> = {};
    for (const key of [
      "name",
      "description",
      "icon",
      "logo",
      "category",
      "displayOrder",
      "isActive",
    ]) {
      if (body[key] !== undefined) update[key] = body[key];
    }

    const doc = await Model.findByIdAndUpdate(body.id, { $set: update }, { new: true });
    if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Deactivating hides the tag from the filters, which changes what the
    // facet counts should say.
    if (update.isActive !== undefined) await recountTaxonomy();

    await logAdminAction({
      adminId: admin.id,
      action: "CATEGORY_UPDATE",
      targetType: kind === "technology" ? "Technology" : "Industry",
      targetId: String(body.id),
      ipAddress: getClientIp(req),
    });

    return NextResponse.json({ item: doc });
  } catch (error) {
    console.error("PATCH /api/admin/taxonomy failed:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    await connectDB();

    const kind = req.nextUrl.searchParams.get("kind");
    const id = req.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    // A product must always have an industry, so deleting one that's in use
    // would leave products unrenderable. Technologies are optional, but
    // deleting one silently strips it from every product's spec table —
    // which is the kind of change you want to have chosen, not triggered.
    const inUse =
      kind === "technology"
        ? await Product.countDocuments({ techStack: id })
        : await Product.countDocuments({ industry: id });

    if (inUse > 0) {
      return NextResponse.json(
        {
          error: `${inUse} product${inUse === 1 ? " uses" : "s use"} this. Deactivate it instead — it disappears from the filters without touching them.`,
        },
        { status: 409 }
      );
    }

    await modelFor(kind).deleteOne({ _id: id });

    await logAdminAction({
      adminId: admin.id,
      action: "CATEGORY_DELETE",
      targetType: kind === "technology" ? "Technology" : "Industry",
      targetId: id,
      ipAddress: getClientIp(req),
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/admin/taxonomy failed:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
