import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/db";
import { requireAdmin } from "@/lib/middleware/requireAdmin";
import { getClientIp, logAdminAction } from "@/lib/middleware/logAdminAction";
import Testimonial from "@/models/Testimonial";
import Product from "@/models/Product";

function readInput(value: unknown) {
  const input = (value ?? {}) as Record<string, unknown>;
  const scope = input.scope === "product" ? "product" : "home";
  const product = typeof input.product === "string" ? input.product : undefined;
  const name = typeof input.name === "string" ? input.name.trim() : "";
  const avatar = typeof input.avatar === "string" ? input.avatar.trim() : "";
  const role = typeof input.role === "string" ? input.role.trim() : "";
  const comment = typeof input.comment === "string" ? input.comment.trim() : "";
  const rating = Math.max(1, Math.min(5, Number(input.rating) || 5));
  const displayOrder = Number(input.displayOrder) || 0;
  const status = input.status === "hidden" ? "hidden" : "published";

  if (!name) return { error: "A display name is required." } as const;
  if (!comment) return { error: "Review text is required." } as const;
  if (scope === "product" && (!product || !mongoose.isValidObjectId(product))) {
    return { error: "Choose a product for a product-page testimonial." } as const;
  }

  return { data: { scope, product: scope === "product" ? product : undefined, name, avatar, role, comment, rating, displayOrder, status, isSample: true } } as const;
}

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await connectDB();
  const [testimonials, products] = await Promise.all([
    Testimonial.find({}).populate("product", "title slug").sort({ scope: 1, displayOrder: 1, createdAt: -1 }).lean(),
    Product.find({}).select("title slug status").sort({ title: 1 }).lean(),
  ]);
  return NextResponse.json({ testimonials, products });
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const parsed = readInput(await req.json());
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });

  await connectDB();
  const testimonial = await Testimonial.create(parsed.data);
  revalidatePath("/");
  if (testimonial.product) {
    const product = await Product.findById(testimonial.product).select("slug").lean() as { slug?: string } | null;
    if (product?.slug) revalidatePath(`/product/${product.slug}`);
  }
  await logAdminAction({ adminId: admin.id, action: "REVIEW_MODERATE", targetType: "Review", targetId: testimonial._id.toString(), changes: { action: "sample_create" }, ipAddress: getClientIp(req) });
  return NextResponse.json({ testimonial }, { status: 201 });
}
