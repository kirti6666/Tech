import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Product from "@/models/Product";
import License from "@/models/License";
import { requireAdmin } from "@/lib/middleware/requireAdmin";
import { logAdminAction, getClientIp } from "@/lib/middleware/logAdminAction";
import { recountTaxonomy } from "@/lib/recountTaxonomy";
import { validateProduct, type ProductInput } from "@/lib/validateProduct";

/**
 * GET    /api/admin/products/[id]
 * PATCH  /api/admin/products/[id]
 * DELETE /api/admin/products/[id]
 *
 * Publishing is blocked when a product was not built in-house and has no
 * right-to-resell document. The schema hook
 *      from Phase 1 rejects it anyway; catching it here means a useful
 *      message instead of a raw validation error.
 *
 * Deleting is refused outright once a licence exists. Someone paid for that
 * product and their licence points at it. Unpublish instead — it leaves the catalogue and
 * every existing customer keeps working.
 */

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await connectDB();

  const product = await Product.findById(params.id)
    .populate("industry", "name slug")
    .populate("techStack", "name slug category")
    .lean();

  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  const licenseCount = await License.countDocuments({ product: params.id });
  return NextResponse.json({ product, licenseCount });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    await connectDB();

    const product = await Product.findById(params.id);
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const input = (await req.json()) as ProductInput;
    const errors = validateProduct(input, { partial: true });
    if (Object.keys(errors).length) {
      return NextResponse.json(
        { error: "Please check the highlighted fields", fields: errors },
        { status: 400 }
      );
    }

    if (input.slug && input.slug !== product.slug) {
      const slugTaken = await Product.exists({ slug: input.slug, _id: { $ne: product._id } });
      if (slugTaken) {
        return NextResponse.json({ error: "Please check the highlighted fields", fields: { slug: "That URL slug is already used by another product" } }, { status: 400 });
      }
    }

    const goingLive = input.status === "published" && product.status !== "published";

    if (goingLive) {
      const provenance = input.provenance ?? product.provenance;
      const doc = input.provenanceDocKey ?? product.provenanceDocKey;
      if (provenance !== "in_house" && !doc) {
        return NextResponse.json(
          {
            error:
              "Attach the right-to-resell documentation before publishing anything not built in-house.",
            fields: { provenanceDocKey: "Documentation required" },
          },
          { status: 400 }
        );
      }
    }

    // Slug is deliberately not derived from the title on update. Changing it
    // 404s every shared link and discards the page's ranking.
    const { ...rest } = input;
    Object.assign(product, rest);
    await product.save();

    // Facet counts drive the browse tiles and the filter numbers, so they
    // have to move the moment a product enters or leaves the catalogue.
    if (input.status !== undefined || input.industry || input.techStack) {
      await recountTaxonomy();
    }

    await logAdminAction({
      adminId: admin.id,
      action: "PRODUCT_UPDATE",
      targetType: "Product",
      targetId: params.id,
      changes: { status: input.status },
      ipAddress: getClientIp(req),
    });

    return NextResponse.json({ product });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Something went wrong";
    console.error("PATCH /api/admin/products/[id] failed:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    await connectDB();

    const licenseCount = await License.countDocuments({ product: params.id });
    if (licenseCount > 0) {
      return NextResponse.json(
        {
          error: `${licenseCount} customer${licenseCount === 1 ? " has" : "s have"} bought this. Unpublish it instead — deleting would break their downloads.`,
        },
        { status: 409 }
      );
    }

    await Product.deleteOne({ _id: params.id });
    await recountTaxonomy();

    await logAdminAction({
      adminId: admin.id,
      action: "PRODUCT_DELETE",
      targetType: "Product",
      targetId: params.id,
      ipAddress: getClientIp(req),
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/admin/products/[id] failed:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
