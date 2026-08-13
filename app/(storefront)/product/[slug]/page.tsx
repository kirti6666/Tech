import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BadgeCheck, Check, Code2, ExternalLink, LifeBuoy, ShieldCheck, Zap } from "lucide-react";
import { connectDB } from "@/lib/db";
import { getServerUser } from "@/lib/middleware/getServerUser";
import Product from "@/models/Product";
import Review from "@/models/Review";
import License from "@/models/License";
import "@/models/User";
import { PLATFORM_LABELS, type Platform, type ProductPackage, type TechCategory } from "@/types/catalog";
import { formatPrice } from "@/lib/price";
import { DemoPanel } from "@/components/storefront/product/DemoPanel";
import { StackTable } from "@/components/storefront/product/StackTable";
import { PurchasePanel } from "@/components/storefront/product/PurchasePanel";
import { ReviewSection, type PublicReview } from "@/components/storefront/product/ReviewSection";
import { ProductCard } from "@/components/storefront/ProductCard";
import type { CatalogueProduct } from "@/lib/catalogue";

export const dynamic = "force-dynamic";

interface DetailProduct {
  _id: string; title: string; slug: string; shortDescription: string; description: string;
  images: string[]; thumbnail?: string; platform: Platform; price: number; discountPrice?: number;
  packages: ProductPackage[]; features: string[]; included: string[];
  demo: { webUrl?: string; adminUrl?: string; adminUser?: string; adminPass?: string };
  requirements: { server?: string; language?: string; database?: string };
  documentationUrl?: string;
  industry: { _id: string; name: string; slug: string } | null;
  techStack: { _id: string; name: string; slug: string; category: TechCategory }[];
  seo?: { metaTitle?: string; metaDescription?: string; ogImage?: string };
}

async function getProduct(slug: string): Promise<DetailProduct | null> {
  await connectDB();
  const doc = await Product.findOne({ slug, status: "published" })
    .select("title slug shortDescription description images thumbnail platform price discountPrice packages features included demo requirements documentationUrl industry techStack seo")
    .populate("industry", "name slug")
    .populate("techStack", "name slug category displayOrder")
    .lean();
  return doc ? JSON.parse(JSON.stringify(doc)) as DetailProduct : null;
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const product = await getProduct(params.slug);
  if (!product) return { title: "Product not found | TechBro" };
  const title = product.seo?.metaTitle || `${product.title} — source code | TechBro`;
  const description = product.seo?.metaDescription || product.shortDescription;
  const image = product.seo?.ogImage || product.thumbnail || product.images?.[0];
  return { title, description, alternates: { canonical: `/product/${product.slug}` }, openGraph: { title, description, type: "website", images: image ? [image] : undefined } };
}

export default async function ProductDetailPage({ params }: { params: { slug: string } }) {
  const product = await getProduct(params.slug);
  if (!product) notFound();
  const user = await getServerUser();
  const [reviewDocs, canReview, relatedDocs] = await Promise.all([
    Review.find({ product: product._id, status: "published" }).select("rating comment verifiedPurchase createdAt user").populate("user", "name").sort({ createdAt: -1 }).lean(),
    user ? License.exists({ user: user.id, product: product._id, status: "active" }) : null,
    product.industry ? Product.aggregate([
      { $match: { status: "published", industry: product.industry._id, slug: { $ne: product.slug } } },
      { $sample: { size: 3 } },
      { $addFields: { effectivePrice: { $cond: [{ $gt: [{ $ifNull: ["$discountPrice", 0] }, 0] }, "$discountPrice", "$price"] } } },
      { $lookup: { from: "industries", localField: "industry", foreignField: "_id", as: "industry", pipeline: [{ $project: { name: 1, slug: 1 } }] } },
      { $lookup: { from: "technologies", localField: "techStack", foreignField: "_id", as: "techStack", pipeline: [{ $project: { name: 1, slug: 1, category: 1 } }] } },
      { $unwind: { path: "$industry", preserveNullAndEmptyArrays: true } },
      { $project: { title: 1, slug: 1, shortDescription: 1, images: 1, thumbnail: 1, platform: 1, price: 1, discountPrice: 1, effectivePrice: 1, industry: 1, techStack: 1, createdAt: 1 } },
    ]) : [],
  ]);
  const reviews = JSON.parse(JSON.stringify(reviewDocs)) as PublicReview[];
  const average = reviews.length ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : 0;
  const related = JSON.parse(JSON.stringify(relatedDocs)) as CatalogueProduct[];
  const startingPrice = product.packages?.length ? Math.min(...product.packages.map((item) => item.price)) : (product.discountPrice && product.discountPrice < product.price ? product.discountPrice : product.price);
  const jsonLd = {
    "@context": "https://schema.org", "@type": "Product", name: product.title,
    description: product.shortDescription, category: product.industry?.name,
    brand: { "@type": "Brand", name: "TechBro" },
    offers: { "@type": "AggregateOffer", lowPrice: startingPrice, highPrice: Math.max(startingPrice, ...(product.packages ?? []).map((item) => item.price)), priceCurrency: "INR", offerCount: Math.max(1, product.packages?.length ?? 0), availability: "https://schema.org/InStock", url: `/product/${product.slug}` },
    ...(reviews.length ? { aggregateRating: { "@type": "AggregateRating", ratingValue: average, reviewCount: reviews.length } } : {}),
  };

  return (
    <main className="mx-auto max-w-shell px-5 py-7 sm:px-6 sm:py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <nav aria-label="Breadcrumb" className="mb-7 flex flex-wrap gap-1.5 label-muted">
        <Link href="/shop" className="hover:text-accent-deep">Shop</Link><span>/</span>
        {product.industry && <><Link href={`/industry/${product.industry.slug}`} className="hover:text-accent-deep">{product.industry.name}</Link><span>/</span></>}
        <span className="text-ink-soft">{product.title}</span>
      </nav>

      <div className="grid items-start gap-9 lg:grid-cols-[minmax(0,1fr)_25rem] xl:gap-12">
        <div className="min-w-0">
          <header className="rounded-3xl bg-gradient-to-br from-accent-mist via-white to-sky-50 p-6 sm:p-9">
            <div className="grid items-start gap-7 md:grid-cols-[minmax(0,1fr)_19.5rem] lg:grid-cols-[minmax(0,1fr)_17.5rem] xl:grid-cols-[minmax(0,1fr)_20.5rem]">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2"><span className="chip-neutral">{PLATFORM_LABELS[product.platform]}</span>{product.industry && <Link href={`/industry/${product.industry.slug}`} className="chip-link">{product.industry.name}</Link>}</div>
                <h1 className="mt-5 max-w-3xl font-display text-4xl font-bold leading-[1.08] tracking-tight text-ink sm:text-5xl">{product.title}</h1>
                <p className="mt-4 max-w-2xl text-base leading-relaxed text-ink-soft sm:text-lg">{product.shortDescription}</p>
                <div className="mt-5 flex flex-wrap items-center gap-4 text-sm">
                  <a href="#reviews" className="flex items-center gap-2 font-semibold text-ink"><span className="text-amber-500">★★★★★</span><span>{reviews.length ? `${average.toFixed(1)} (${reviews.length})` : "New product"}</span></a>
                  <span className="flex items-center gap-1.5 text-save"><BadgeCheck size={17} /> Verified buyer reviews</span>
                </div>
              </div>

              <div className="order-first overflow-hidden rounded-2xl border border-black/10 bg-white p-2 shadow-[0_16px_40px_rgba(40,51,94,0.16)] md:order-none">
                <div className="mb-2 flex items-center gap-1.5 px-1 pt-0.5" aria-hidden="true">
                  <span className="h-2 w-2 rounded-full bg-red-400" />
                  <span className="h-2 w-2 rounded-full bg-amber-400" />
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  <span className="ml-1 h-2 flex-1 rounded-full bg-rule-soft" />
                </div>
                <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-gradient-to-br from-accent via-violet-500 to-sky-400">
                  {product.thumbnail || product.images?.[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={product.thumbnail || product.images[0]} alt={`${product.title} cover`} className="h-full w-full object-cover object-top" />
                  ) : (
                    <div className="flex h-full flex-col justify-between p-5 text-white">
                      <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/20 font-display text-xl font-bold backdrop-blur-sm">{product.title.charAt(0)}</span>
                      <div><span className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/70">TechBro product</span><p className="mt-1 line-clamp-2 font-display text-lg font-bold leading-tight">{product.title}</p></div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="mt-7 grid gap-3 sm:grid-cols-3">
              {[{ icon: Code2, title: "Editable source", text: "Own and customize the code" }, { icon: Zap, title: "Fast launch", text: "Deploy with included docs" }, { icon: LifeBuoy, title: "Setup support", text: "Help when you need it" }].map(({ icon: Icon, title, text }) => <div key={title} className="rounded-xl border border-white/80 bg-white/80 p-3.5"><Icon size={18} className="text-accent-deep" /><strong className="mt-2 block text-sm text-ink">{title}</strong><span className="text-xs text-ink-soft">{text}</span></div>)}
            </div>
          </header>

          <div className="mt-8"><DemoPanel demo={product.demo ?? {}} /></div>

          {product.features?.length > 0 && <section id="features" className="mt-10 scroll-mt-24">
            <p className="label-muted">What you can build</p><h2 className="mt-2 font-display text-3xl font-bold text-ink">Everything included in the product</h2>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">{product.features.map((feature) => <div key={feature} className="flex gap-3 rounded-xl border border-rule bg-white p-4"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-save/10"><Check size={15} className="text-save" /></span><span className="text-sm font-medium leading-relaxed text-ink">{feature}</span></div>)}</div>
          </section>}

          {product.description && <section className="mt-10"><p className="label-muted">Product overview</p><h2 className="mt-2 font-display text-3xl font-bold text-ink">About this website</h2><div className="mt-5 space-y-4 text-[15px] leading-7 text-ink-soft">{product.description.split("\n\n").map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div></section>}

          <section className="mt-10 rounded-2xl border border-rule bg-paper-alt/50 p-5 sm:p-6"><h2 className="font-display text-xl font-bold text-ink">Your purchase includes</h2><ul className="mt-4 grid gap-2.5 sm:grid-cols-2">{product.included.map((item) => <li key={item} className="flex gap-2 text-sm text-ink-soft"><ShieldCheck size={16} className="mt-0.5 shrink-0 text-accent-deep" />{item}</li>)}</ul></section>
          <div className="mt-10"><StackTable techStack={product.techStack ?? []} requirements={product.requirements} /></div>
          {product.documentationUrl && <a href={product.documentationUrl} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-accent-deep hover:underline">Read technical documentation <ExternalLink size={15} /></a>}
        </div>

        <aside><PurchasePanel productId={product._id} title={product.title} slug={product.slug} image={product.thumbnail || product.images?.[0]} price={product.price} discountPrice={product.discountPrice} packages={product.packages ?? []} included={product.included ?? []} /></aside>
      </div>

      <div className="mt-14"><ReviewSection productId={product._id} reviews={reviews} average={average} signedIn={Boolean(user)} canReview={Boolean(canReview)} /></div>
      {related.length > 0 && <section className="mt-16"><div className="flex items-end justify-between gap-4 border-b border-rule pb-3"><div><p className="label-muted">Keep exploring</p><h2 className="mt-1 font-display text-2xl font-bold text-ink">More {product.industry?.name} products</h2></div><Link href="/shop" className="text-sm font-bold text-accent-deep">View all →</Link></div><div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{related.map((item) => <ProductCard key={item._id} product={item} />)}</div></section>}
      <p className="sr-only">{product.title} packages start at {formatPrice(startingPrice)} plus GST.</p>
    </main>
  );
}
