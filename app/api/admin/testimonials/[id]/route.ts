import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/db";
import { requireAdmin } from "@/lib/middleware/requireAdmin";
import { getClientIp, logAdminAction } from "@/lib/middleware/logAdminAction";
import Testimonial from "@/models/Testimonial";
import Product from "@/models/Product";

function clean(value: unknown) {
  const input = (value ?? {}) as Record<string, unknown>;
  const update: Record<string, unknown> = {};
  if (input.name !== undefined) update.name = String(input.name).trim();
  if (input.avatar !== undefined) update.avatar = String(input.avatar).trim();
  if (input.role !== undefined) update.role = String(input.role).trim();
  if (input.comment !== undefined) update.comment = String(input.comment).trim();
  if (input.rating !== undefined) update.rating = Math.max(1, Math.min(5, Number(input.rating) || 5));
  if (input.displayOrder !== undefined) update.displayOrder = Number(input.displayOrder) || 0;
  if (input.status !== undefined) update.status = input.status === "hidden" ? "hidden" : "published";
  if (input.scope !== undefined) update.scope = input.scope === "product" ? "product" : "home";
  if (input.product !== undefined) update.product = input.product && mongoose.isValidObjectId(String(input.product)) ? String(input.product) : undefined;
  return update;
}

async function refreshProduct(productId: unknown) {
  if (!productId) return;
  const product = await Product.findById(productId).select("slug").lean() as { slug?: string } | null;
  if (product?.slug) revalidatePath(`/product/${product.slug}`);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!mongoose.isValidObjectId(params.id)) return NextResponse.json({ error: "Invalid testimonial." }, { status: 400 });

  await connectDB();
  const testimonial = await Testimonial.findById(params.id);
  if (!testimonial) return NextResponse.json({ error: "Testimonial not found." }, { status: 404 });
  const previousProduct = testimonial.product;
  Object.assign(testimonial, clean(await req.json()));
  if (!testimonial.name?.trim() || !testimonial.comment?.trim()) return NextResponse.json({ error: "Name and review text are required." }, { status: 400 });
  if (testimonial.scope === "product" && !testimonial.product) return NextResponse.json({ error: "Choose a product." }, { status: 400 });
  if (testimonial.scope === "home") testimonial.product = undefined;
  await testimonial.save();
  revalidatePath("/");
  await Promise.all([refreshProduct(previousProduct), refreshProduct(testimonial.product)]);
  await logAdminAction({ adminId: admin.id, action: "REVIEW_MODERATE", targetType: "Review", targetId: params.id, changes: { action: "sample_update" }, ipAddress: getClientIp(req) });
  return NextResponse.json({ testimonial });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!mongoose.isValidObjectId(params.id)) return NextResponse.json({ error: "Invalid testimonial." }, { status: 400 });

  await connectDB();
  const testimonial = await Testimonial.findByIdAndDelete(params.id);
  if (!testimonial) return NextResponse.json({ error: "Testimonial not found." }, { status: 404 });
  revalidatePath("/");
  await refreshProduct(testimonial.product);
  await logAdminAction({ adminId: admin.id, action: "REVIEW_MODERATE", targetType: "Review", targetId: params.id, changes: { action: "sample_delete" }, ipAddress: getClientIp(req) });
  return NextResponse.json({ ok: true });
}
