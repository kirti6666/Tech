import { connectDB } from "@/lib/db";
import Product from "@/models/Product";
import Review from "@/models/Review";
import Testimonial from "@/models/Testimonial";
import "@/models/User";
import { ReviewManager } from "@/components/admin/ReviewManager";

export const dynamic = "force-dynamic";

export default async function AdminReviewsPage() {
  await connectDB();
  const [samples, verifiedReviews, products] = await Promise.all([
    Testimonial.find({}).populate("product", "title slug").sort({ scope: 1, displayOrder: 1, createdAt: -1 }).lean(),
    Review.find({}).populate("user", "name email avatar").populate("product", "title slug").sort({ createdAt: -1 }).lean(),
    Product.find({}).select("title slug").sort({ title: 1 }).lean(),
  ]);

  return (
    <div>
      <header className="mb-6">
        <p className="label">Content and moderation</p>
        <h1 className="mt-2 font-display text-4xl font-light tracking-tight text-ink">Reviews & testimonials</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-soft">Manage clearly labelled sample testimonials and moderate verified buyer reviews without rewriting customer feedback.</p>
      </header>
      <ReviewManager
        initialSamples={JSON.parse(JSON.stringify(samples))}
        verifiedReviews={JSON.parse(JSON.stringify(verifiedReviews))}
        products={JSON.parse(JSON.stringify(products))}
      />
    </div>
  );
}
