import type { Metadata } from "next";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  Banknote,
  Bot,
  Building2,
  Check,
  Crown,
  GraduationCap,
  HeartPulse,
  MonitorSmartphone,
  Rocket,
  ShieldCheck,
  ShoppingBag,
  Star,
  UtensilsCrossed,
  Zap,
} from "lucide-react";
import { connectDB } from "@/lib/db";
import { formatPrice } from "@/lib/price";
import {
  parseCatalogueParams,
  queryCatalogue,
  type CatalogueProduct,
} from "@/lib/catalogue";
import { HomeCatalogueSearch } from "@/components/storefront/HomeCatalogueSearch";

export const revalidate = 900;

export const metadata: Metadata = {
  title: "Ready-made websites, apps and software | TechBro",
  description:
    "Explore ready-made websites, apps and business software with complete source code, customization and launch support.",
  alternates: { canonical: "/" },
};

const EXPLORE_INDUSTRIES: {
  name: string;
  href: string;
  icon: LucideIcon;
}[] = [
  { name: "AI", href: "/technology/ai-ml", icon: Bot },
  { name: "Healthcare", href: "/industry/healthcare", icon: HeartPulse },
  { name: "Retail", href: "/industry/e-commerce", icon: ShoppingBag },
  { name: "Education", href: "/industry/edtech", icon: GraduationCap },
  { name: "FinTech", href: "/industry/fintech", icon: Banknote },
  { name: "Real Estate", href: "/industry/real-estate", icon: Building2 },
  { name: "Food", href: "/industry/food-restaurant", icon: UtensilsCrossed },
];

const LAUNCH_STEPS = [
  { day: "Day 1", title: "Choose", body: "Pick a product or share your idea." },
  { day: "Days 2–4", title: "Customize", body: "We add your brand, content and features." },
  { day: "Days 5–6", title: "Review", body: "Test every screen and approve the build." },
  { day: "Day 7", title: "Go live", body: "We deploy and hand over your source code." },
];

const FEATURED_FALLBACK: CatalogueProduct[] = [
  {
    _id: "featured-course",
    title: "Online Course Platform",
    slug: "online-course-platform",
    shortDescription: "Multi-instructor courses, quizzes, certificates and revenue sharing.",
    images: [],
    platform: "web_app",
    price: 74999,
    discountPrice: 59999,
    effectivePrice: 59999,
    industry: { _id: "education", name: "Education", slug: "edtech" },
    techStack: [],
    createdAt: "",
  },
  {
    _id: "featured-clinic",
    title: "Clinic & Appointment System",
    slug: "clinic-appointment-management-system",
    shortDescription: "Patient bookings, records, prescriptions and billing app.",
    images: [],
    platform: "web_app",
    price: 89999,
    effectivePrice: 89999,
    industry: { _id: "healthcare", name: "Healthcare", slug: "healthcare" },
    techStack: [],
    createdAt: "",
  },
  {
    _id: "featured-food",
    title: "Food Ordering & Delivery",
    slug: "food-ordering-delivery-platform",
    shortDescription: "Customer, restaurant and delivery apps with tracking.",
    images: [],
    platform: "web_app",
    price: 119999,
    discountPrice: 99999,
    effectivePrice: 99999,
    industry: { _id: "food", name: "Food", slug: "food-restaurant" },
    techStack: [],
    createdAt: "",
  },
  {
    _id: "featured-property",
    title: "Property Listing Portal",
    slug: "property-listing-brokerage-portal",
    shortDescription: "Property search, agent profiles and enquiry management.",
    images: [],
    platform: "web",
    price: 64999,
    effectivePrice: 64999,
    industry: { _id: "real-estate", name: "Real Estate", slug: "real-estate" },
    techStack: [],
    createdAt: "",
  },
  {
    _id: "featured-marketplace",
    title: "Multi-Vendor Marketplace",
    slug: "multi-vendor-e-commerce-marketplace",
    shortDescription: "Vendor stores, commissions, payouts and unified checkout.",
    images: [],
    platform: "web_app",
    price: 139999,
    effectivePrice: 139999,
    industry: { _id: "retail", name: "Retail", slug: "e-commerce" },
    techStack: [],
    createdAt: "",
  },
  {
    _id: "featured-fintech",
    title: "Loan Management System",
    slug: "digital-lending-loan-management-system",
    shortDescription: "Loan applications, EMI schedules and borrower portal.",
    images: [],
    platform: "web",
    price: 149999,
    effectivePrice: 149999,
    industry: { _id: "fintech", name: "Fintech", slug: "fintech" },
    techStack: [],
    createdAt: "",
  },
];

function shortSummary(value: string) {
  const words = value.trim().split(/\s+/).filter(Boolean);
  return `${words.slice(0, 7).join(" ")}${words.length > 7 ? "…" : ""}`;
}

export default async function HomePage() {
  let products: CatalogueProduct[] = [];

  try {
    await connectDB();
    const catalogue = await queryCatalogue(parseCatalogueParams({ sort: "newest" }));
    products = catalogue.products.slice(0, 10);
  } catch {
    // Keep the marketing page available during a temporary catalogue outage.
    // Product rows populate automatically when MongoDB recovers.
  }

  const featuredProducts = products.length > 0 ? products : FEATURED_FALLBACK;

  return (
    <main className="overflow-hidden bg-white">
      <section className="relative isolate overflow-hidden border-b border-violet-100 px-4 pb-12 pt-12 text-center sm:px-6 sm:pb-16 sm:pt-16 lg:pb-20 lg:pt-20">
        <div className="pointer-events-none absolute inset-0 -z-20 bg-[linear-gradient(to_bottom,#ffffff_0%,#ffffff_56%,#f5f3ff_100%)]" />
        <div className="pointer-events-none absolute inset-0 -z-10 opacity-45 [background-image:linear-gradient(to_right,#ede9fe_1px,transparent_1px),linear-gradient(to_bottom,#ede9fe_1px,transparent_1px)] [background-size:36px_36px] [mask-image:linear-gradient(to_bottom,black,transparent_78%)]" />
        <div className="pointer-events-none absolute -left-20 top-16 -z-10 h-52 w-52 rounded-full bg-violet-200/50 blur-3xl sm:left-[10%]" />
        <div className="pointer-events-none absolute -right-24 top-8 -z-10 h-56 w-56 rounded-full bg-indigo-200/40 blur-3xl sm:right-[10%]" />
        <div className="relative mx-auto max-w-5xl">
          <p className="label">Websites · Apps · Business software</p>
          <h1 className="mx-auto mt-5 max-w-5xl font-display text-[2.7rem] font-extrabold leading-[1.02] tracking-[-0.05em] text-ink sm:text-6xl lg:text-[4.15rem]">
            Build smarter. Launch faster.
            <span className="block bg-gradient-to-r from-accent-deep via-accent to-indigo-500 bg-clip-text text-transparent">
              Own it completely.
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-sm leading-6 text-ink-soft sm:text-lg sm:leading-8">
            Start with proven software, shape it around your business and launch with complete source-code ownership.
          </p>
          <div className="mt-7 flex flex-row items-center justify-center gap-2.5 sm:gap-3">
            <Link href="/shop" className="btn-primary min-h-12 rounded-xl px-4 text-xs sm:px-8 sm:text-sm">
              Explore products
              <ArrowRight className="ml-1.5 h-4 w-4" aria-hidden="true" />
            </Link>
            <Link href="/contact?type=custom" className="btn-secondary min-h-12 rounded-xl bg-white/90 px-4 text-xs backdrop-blur sm:px-8 sm:text-sm">
              Build custom web
            </Link>
          </div>
          <div className="mx-auto mt-9 grid max-w-3xl grid-cols-3 overflow-hidden rounded-2xl bg-white/85 shadow-card ring-1 ring-violet-100 backdrop-blur sm:mt-11">
            {[
              { icon: Zap, title: "Launch faster", detail: "Ready-made foundation" },
              { icon: ShieldCheck, title: "Own the code", detail: "Complete handover" },
              { icon: Rocket, title: "Grow freely", detail: "No platform lock-in" },
            ].map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <div key={benefit.title} className={`px-2 py-4 sm:px-6 sm:py-5 ${index > 0 ? "border-l border-violet-100" : ""}`}>
                  <Icon className="mx-auto h-5 w-5 text-accent-deep sm:h-6 sm:w-6" aria-hidden="true" />
                  <p className="mt-2 text-[11px] font-extrabold text-ink sm:text-sm">{benefit.title}</p>
                  <p className="mt-0.5 hidden text-xs text-ink-faint sm:block">{benefit.detail}</p>
                </div>
              );
            })}
          </div>
        </div>

      </section>

      <section className="border-y border-rule-soft bg-accent-mist/35" aria-labelledby="featured-heading">
        <div className="mx-auto max-w-shell px-4 py-14 sm:px-6 sm:py-20">
          <div className="mb-12 text-center sm:mb-14">
            <p className="label">Find your starting point</p>
            <h2 className="mt-2 font-display text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">What do you want to build?</h2>
            <p className="mx-auto mb-5 mt-2 max-w-xl text-sm text-ink-soft">Search the complete catalogue or narrow it by industry, platform and budget.</p>
            <HomeCatalogueSearch />
          </div>
          <div className="mb-7 flex items-end justify-between gap-4">
            <div>
              <p className="label">Ready to launch</p>
              <h2 id="featured-heading" className="mt-1 font-display text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">Featured</h2>
            </div>
            <Link href="/shop" className="inline-flex shrink-0 items-center gap-1 text-sm font-bold text-accent-deep hover:underline">
              View all <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>

          <div className="hide-scrollbar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 sm:-mx-6 sm:gap-5 sm:px-6">
            {featuredProducts.map((product) => {
              const image = product.thumbnail || product.images?.[0];
              return (
                <Link
                  key={product._id}
                  href={`/product/${product.slug}`}
                  className="group min-w-[15.5rem] max-w-[15.5rem] snap-start overflow-hidden rounded-2xl bg-white shadow-card ring-1 ring-rule-soft transition hover:-translate-y-1 hover:shadow-lift sm:min-w-[17.5rem] sm:max-w-[17.5rem]"
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-violet-50 to-indigo-100">
                    {image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={image} alt="" className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]" />
                    ) : (
                      <div className="grid h-full place-items-center">
                        <MonitorSmartphone className="h-16 w-16 text-accent/80" aria-hidden="true" />
                      </div>
                    )}
                    <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-bold text-accent-deep shadow-sm backdrop-blur">
                      {product.industry?.name ?? "Software"}
                    </span>
                  </div>
                  <div className="p-4">
                    <h3 className="line-clamp-1 text-base font-bold text-ink">{product.title}</h3>
                    <p className="mt-1.5 min-h-10 text-sm leading-5 text-ink-soft">{shortSummary(product.shortDescription)}</p>
                    <div className="mt-4 flex items-baseline gap-2">
                      <span className="font-display text-xl font-extrabold text-ink tabular">{formatPrice(product.effectivePrice)}</span>
                      {product.discountPrice && product.discountPrice < product.price ? (
                        <span className="text-xs text-ink-faint line-through tabular">{formatPrice(product.price)}</span>
                      ) : null}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
          <p className="mt-1 text-xs text-ink-faint">Swipe or scroll to explore more products.</p>
        </div>
      </section>

      <section className="bg-accent-mist/60 py-14 sm:py-16" aria-labelledby="industries-heading">
        <div className="mx-auto max-w-shell px-4 sm:px-6">
          <div className="mb-7 flex items-end justify-between gap-4">
            <div>
              <p className="label">Solutions for your sector</p>
              <h2 id="industries-heading" className="mt-1 font-display text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">Explore by Industry</h2>
            </div>
            <Link href="/shop" className="inline-flex shrink-0 items-center gap-1 text-sm font-bold text-accent-deep hover:underline">
              View all <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
          <div className="rounded-3xl bg-gradient-to-br from-indigo-50 to-violet-100/70 p-3 sm:p-5">
            <div className="grid grid-cols-4 gap-2 sm:gap-3 lg:grid-cols-7">
              {EXPLORE_INDUSTRIES.map((industry) => {
              const Icon = industry.icon;
              return (
                <Link key={industry.name} href={industry.href} className="group min-w-0 rounded-2xl bg-white px-1.5 py-4 text-center shadow-card ring-1 ring-rule-soft transition hover:-translate-y-1 hover:shadow-lift sm:px-3 sm:py-5">
                  <span className="mx-auto grid h-11 w-11 place-items-center rounded-xl bg-accent-cta text-white shadow-accent sm:h-12 sm:w-12"><Icon className="h-5 w-5 sm:h-6 sm:w-6" /></span>
                  <span className="mt-3 block text-[11px] font-bold leading-tight text-ink sm:text-sm">{industry.name}</span>
                </Link>
              );
            })}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-shell px-4 py-12 sm:px-6 sm:py-16">
        <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-[#24104f] via-[#4c1d95] to-[#6d28d9] px-5 py-7 text-white shadow-lift sm:px-8 sm:py-9 lg:px-10">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-accent-deep shadow-card">
              <Rocket className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-violet-200 sm:text-xs">Our 7-day launch promise</p>
              <h2 className="mt-0.5 font-display text-xl font-extrabold tracking-tight sm:text-3xl">Idea to live website in 7 days.</h2>
            </div>
          </div>

          <ol className="relative mt-6 grid grid-cols-4 gap-1 sm:gap-3" aria-label="Seven-day launch process">
            <span className="absolute left-[12.5%] right-[12.5%] top-4 h-px bg-white/30" aria-hidden="true" />
            {LAUNCH_STEPS.map((step, index) => (
              <li key={step.day} className="relative z-10 text-center">
                <span className="mx-auto grid h-8 w-8 place-items-center rounded-full bg-white text-[11px] font-extrabold text-accent-deep shadow-card ring-4 ring-[#51209a] sm:h-9 sm:w-9 sm:text-xs">
                  {index + 1}
                </span>
                <h3 className="mt-2 text-[11px] font-bold sm:text-sm">{step.title}</h3>
                <p className="mt-0.5 text-[9px] font-medium text-violet-200 sm:text-[11px]">{step.day}</p>
              </li>
            ))}
          </ol>

          <div className="mt-6 flex flex-col gap-5 border-t border-white/15 pt-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="max-w-2xl text-xs leading-relaxed text-violet-100 sm:text-sm">
                Choose a product, share your branding, approve the build and we deploy it. If the agreed launch is not delivered in seven days, your setup fee is refunded.
              </p>
              <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-[11px] font-medium text-white sm:text-xs">
                {["Source-code ownership", "Brand customization", "Launch support"].map((item) => (
                  <li key={item} className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-violet-200" />{item}</li>
                ))}
              </ul>
            </div>
            <Link href="/shop" className="inline-flex min-h-10 shrink-0 items-center justify-center self-start rounded-lg bg-white px-5 text-xs font-bold text-accent-deep transition hover:bg-violet-50 lg:self-center">
              Explore <ArrowRight className="ml-1.5 h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="border-y border-rule-soft bg-gradient-to-b from-white to-amber-50/40 py-14 sm:py-20" aria-labelledby="best-sellers-heading">
        <div className="mx-auto max-w-shell px-4 sm:px-6">
          <div className="mb-7 flex items-end justify-between gap-4">
            <div>
              <p className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-[0.16em] text-amber-600"><Crown className="h-4 w-4" aria-hidden="true" /> Customer favourites</p>
              <h2 id="best-sellers-heading" className="mt-1 font-display text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">Best sellers</h2>
              <p className="mt-2 max-w-xl text-sm text-ink-soft">Popular ready-made products chosen for fast customization and launch.</p>
            </div>
            <Link href="/shop?sort=newest" className="inline-flex shrink-0 items-center gap-1 text-sm font-bold text-accent-deep hover:underline">View all <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
          </div>

          <div className="hide-scrollbar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-5 sm:-mx-6 sm:gap-5 sm:px-6">
            {featuredProducts.slice(0, 8).map((product, index) => {
              const image = product.thumbnail || product.images?.[0];
              return (
                <Link key={`best-${product._id}`} href={`/product/${product.slug}`} className="group relative min-w-[15.5rem] max-w-[15.5rem] snap-start overflow-hidden rounded-2xl bg-white shadow-card ring-1 ring-rule-soft transition hover:-translate-y-1 hover:shadow-lift sm:min-w-[17.5rem] sm:max-w-[17.5rem]">
                  <span className="absolute left-3 top-3 z-10 grid h-8 min-w-8 place-items-center rounded-full bg-ink px-2 text-xs font-extrabold text-white shadow-lg">#{index + 1}</span>
                  <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-amber-50 via-violet-50 to-indigo-100">
                    {image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={image} alt="" className="h-full w-full object-cover object-top transition duration-300 group-hover:scale-[1.03]" />
                    ) : (
                      <div className="grid h-full place-items-center"><MonitorSmartphone className="h-16 w-16 text-accent/75" aria-hidden="true" /></div>
                    )}
                    <span className="absolute bottom-3 right-3 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-bold text-accent-deep shadow-sm backdrop-blur">{product.industry?.name ?? "Software"}</span>
                  </div>
                  <div className="p-4">
                    <h3 className="line-clamp-1 text-base font-bold text-ink">{product.title}</h3>
                    <p className="mt-1.5 min-h-10 text-sm leading-5 text-ink-soft">{shortSummary(product.shortDescription)}</p>
                    <div className="mt-4 flex items-center justify-between gap-3">
                      <div className="flex items-baseline gap-2"><span className="font-display text-xl font-extrabold text-ink tabular">{formatPrice(product.effectivePrice)}</span>{product.discountPrice && product.discountPrice < product.price ? <span className="text-xs text-ink-faint line-through tabular">{formatPrice(product.price)}</span> : null}</div>
                      <ArrowRight className="h-4 w-4 text-accent-deep transition group-hover:translate-x-1" aria-hidden="true" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
          <p className="text-xs text-ink-faint">Swipe or scroll horizontally to see every bestseller.</p>
        </div>
      </section>

      <section className="mx-auto max-w-shell px-4 py-10 text-center sm:px-6 sm:py-14" aria-labelledby="reviews-heading">
        <p className="label">Customer reviews</p>
        <h2 id="reviews-heading" className="mt-1 font-display text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">Reviews you can trust</h2>
        <div className="mx-auto mt-7 max-w-md rounded-2xl bg-white p-6 text-left shadow-card ring-1 ring-rule-soft">
          <div className="flex gap-1 text-ink-ghost" aria-hidden="true">
            {[0, 1, 2, 3, 4].map((star) => <Star key={star} className="h-4 w-4" />)}
          </div>
          <p className="mt-4 text-sm font-bold text-ink">No verified reviews yet</p>
          <p className="mt-1 text-sm leading-relaxed text-ink-soft">
            Reviews from completed purchases will appear here. We do not publish made-up testimonials.
          </p>
        </div>
      </section>
    </main>
  );
}
