import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/db";
import { requireAdmin } from "@/lib/middleware/requireAdmin";
import { getClientIp, logAdminAction } from "@/lib/middleware/logAdminAction";
import Review from "@/models/Review";
import Product from "@/models/Product";

async function refresh(review: { product?: unknown }) {
  if (!review.product) return;
  const product = await Product.findById(review.product).select("slug").lean() as { slug?: string } | null;
  if (product?.slug) revalidatePath(`/product/${product.slug}`);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!mongoose.isValidObjectId(params.id)) return NextResponse.json({ error: "Invalid review." }, { status: 400 });
  const input = (await req.json()) as { status?: string; avatar?: string };
  await connectDB();
  const update: { status?: "published" | "hidden"; avatar?: string } = {};
  if (input.status !== undefined) update.status = input.status === "hidden" ? "hidden" : "published";
  if (input.avatar !== undefined) update.avatar = String(input.avatar).trim();
  const review = await Review.findByIdAndUpdate(params.id, update, { new: true });
  if (!review) return NextResponse.json({ error: "Review not found." }, { status: 404 });
  await refresh(review);
  await logAdminAction({ adminId: admin.id, action: "REVIEW_MODERATE", targetType: "Review", targetId: params.id, changes: update, ipAddress: getClientIp(req) });
  return NextResponse.json({ review });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!mongoose.isValidObjectId(params.id)) return NextResponse.json({ error: "Invalid review." }, { status: 400 });
  await connectDB();
  const review = await Review.findByIdAndDelete(params.id);
  if (!review) return NextResponse.json({ error: "Review not found." }, { status: 404 });
  await refresh(review);
  await logAdminAction({ adminId: admin.id, action: "REVIEW_MODERATE", targetType: "Review", targetId: params.id, changes: { action: "delete" }, ipAddress: getClientIp(req) });
  return NextResponse.json({ ok: true });
}
