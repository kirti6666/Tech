import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAuth } from "@/lib/middleware/requireAuth";
import { reviewSchema } from "@/lib/validations/review";
import Product from "@/models/Product";
import License from "@/models/License";
import Review from "@/models/Review";

export async function POST(req: NextRequest) {
  const user = await requireAuth(req);
  if (!user) return NextResponse.json({ error: "Sign in to review this product." }, { status: 401 });

  try {
    const parsed = reviewSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid review." }, { status: 400 });
    }
    await connectDB();
    const [product, licence] = await Promise.all([
      Product.exists({ _id: parsed.data.product, status: "published" }),
      License.exists({ user: user.id, product: parsed.data.product, status: "active" }),
    ]);
    if (!product) return NextResponse.json({ error: "Product not found." }, { status: 404 });
    if (!licence) {
      return NextResponse.json({ error: "Reviews are available to verified buyers after purchase." }, { status: 403 });
    }
    const review = await Review.findOneAndUpdate(
      { product: parsed.data.product, user: user.id },
      { rating: parsed.data.rating, comment: parsed.data.comment, verifiedPurchase: true, status: "published" },
      { upsert: true, new: true, runValidators: true }
    ).lean();
    return NextResponse.json({ review });
  } catch (error) {
    console.error("POST /api/reviews failed:", error);
    return NextResponse.json({ error: "Could not save your review." }, { status: 500 });
  }
}
