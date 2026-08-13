import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Product from "@/models/Product";
import { requireAdmin } from "@/lib/middleware/requireAdmin";
import { logAdminAction, getClientIp } from "@/lib/middleware/logAdminAction";
import { recountTaxonomy } from "@/lib/recountTaxonomy";
import { validateProduct, type ProductInput } from "@/lib/validateProduct";

/**
 * GET  /api/admin/products — list, including drafts
 * POST /api/admin/products — create
 *
 * Unlike the public route this returns the private fields, because the admin
 * form needs to show which source archive is attached and what the
 * provenance record says.
 *
 * Slugs are generated once on create and never regenerated from the title.
 * A slug change silently 404s every link anyone has ever shared and throws
 * away the page's search ranking — if it has to change, that is a deliberate
 * act with a redirect behind it, not a side effect of fixing a typo.
 */

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const q = searchParams.get("q");
    const page = Math.max(1, Number(searchParams.get("page") ?? 1));
    const limit = Math.min(100, Number(searchParams.get("limit") ?? 25));

    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    if (q) filter.title = { $regex: q, $options: "i" };

    const [products, total] = await Promise.all([
      Product.find(filter)
        .sort({ updatedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate("industry", "name slug")
        .populate("techStack", "name slug category")
        .lean(),
      Product.countDocuments(filter),
    ]);

    return NextResponse.json({
      products,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("GET /api/admin/products failed:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    await connectDB();

    const input = (await req.json()) as ProductInput;
    const errors = validateProduct(input, { partial: false });
    if (Object.keys(errors).length) {
      return NextResponse.json(
        { error: "Please check the highlighted fields", fields: errors },
        { status: 400 }
      );
    }

    let slug = slugify(input.title!);
    if (await Product.exists({ slug })) {
      slug = `${slug}-${Date.now().toString(36).slice(-4)}`;
    }

    // New products always start as drafts, whatever the client asked for.
    // Publishing needs the source file and the provenance paperwork, and
    // neither exists at the moment of creation.
    const product = await Product.create({ ...input, slug, status: "draft" });

    await logAdminAction({
      adminId: admin.id,
      action: "PRODUCT_CREATE",
      targetType: "Product",
      targetId: product._id.toString(),
      ipAddress: getClientIp(req),
    });

    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    console.error("POST /api/admin/products failed:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
