import type { Metadata } from "next";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  Atom,
  Banknote,
  Bot,
  Braces,
  Building2,
  CalendarCheck,
  Check,
  Clock3,
  Crown,
  GraduationCap,
  HeartPulse,
  Info,
  Code2,
  MonitorSmartphone,
  PanelsTopLeft,
  Rocket,
  Search,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Smartphone,
  Star,
  Store,
  Triangle,
  UtensilsCrossed,
  Zap,
  LayoutDashboard,
} from "lucide-react";
import { connectDB } from "@/lib/db";
import { formatPrice } from "@/lib/price";
import {
  parseCatalogueParams,
  queryCatalogue,
  type CatalogueProduct,
} from "@/lib/catalogue";
import { HomeCatalogueSearch } from "@/components/storefront/HomeCatalogueSearch";
import { HomeHeroSlider } from "@/components/storefront/HomeHeroSlider";
import { TrustedCompaniesMarquee } from "@/components/storefront/TrustedCompaniesMarquee";
import { getSiteSettings } from "@/lib/site-settings";
import Testimonial from "@/models/Testimonial";
import { SampleTestimonials, type PublicTestimonial } from "@/components/storefront/SampleTestimonials";
import { BlogCard } from "@/components/storefront/BlogCard";
import { getPublishedBlogPosts } from "@/lib/blog-posts";
import Industry from "@/models/Industry";
import Technology from "@/models/Technology";

export const revalidate = 900;

export const metadata: Metadata = {
  title: "Ready-made websites, apps and software | TechBro",
  description:
    "Explore ready-made websites, apps and business software with complete source code, customization and launch support.",
  alternates: { canonical: "/" },
};

const INDUSTRY_FALLBACK: {
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

const PLATFORM_FALLBACK: {
  name: string;
  type: string;
  href: string;
  icon: LucideIcon;
}[] = [
  { name: "WordPress", type: "CMS", href: "/shop?tech=wordpress", icon: PanelsTopLeft },
  { name: "Shopify", type: "Commerce", href: "/shop?tech=shopify", icon: Store },
  { name: "WooCommerce", type: "Commerce", href: "/shop?tech=woocommerce", icon: ShoppingCart },
  { name: "Next.js", type: "Framework", href: "/shop?tech=next-js", icon: Triangle },
  { name: "React", type: "Frontend", href: "/shop?tech=react", icon: Atom },
  { name: "Laravel", type: "Backend", href: "/shop?tech=laravel", icon: Braces },
  { name: "Flutter", type: "Mobile", href: "/shop?tech=flutter", icon: Smartphone },
  { name: "Custom Dev", type: "Tailored", href: "/shop?platform=web_app", icon: Code2 },
];

const INDUSTRY_ICONS: Record<string, LucideIcon> = {
  "ai": Bot,
  "ai-ml": Bot,
  healthcare: HeartPulse,
  retail: ShoppingBag,
  "e-commerce": ShoppingBag,
  education: GraduationCap,
  edtech: GraduationCap,
  fintech: Banknote,
  "real-estate": Building2,
  food: UtensilsCrossed,
  "food-restaurant": UtensilsCrossed,
};

const TECHNOLOGY_ICONS: Record<string, LucideIcon> = {
  wordpress: PanelsTopLeft,
  shopify: Store,
  woocommerce: ShoppingCart,
  "next-js": Triangle,
  nextjs: Triangle,
  react: Atom,
  laravel: Braces,
  flutter: Smartphone,
};

const TECHNOLOGY_LABELS: Record<string, string> = {
  frontend: "Frontend",
  backend: "Backend",
  database: "Database",
  mobile: "Mobile",
  devops: "DevOps",
  other: "Technology",
};

const LAUNCH_STEPS = [
  { day: "Day 1", title: "Choose", body: "Pick a product or share your idea." },
  { day: "Days 2–4", title: "Customize", body: "We add your brand, content and features." },
  { day: "Days 5–6", title: "Review", body: "Test every screen and approve the build." },
  { day: "Day 7", title: "Go live", body: "We deploy and hand over your source code." },
];

const LAUNCH_OUTCOMES: { label: string; before: string; after: string; icon: LucideIcon }[] = [
  { label: "Time to launch", before: "Long custom build", after: "7-day target", icon: Clock3 },
  { label: "Customer bookings", before: "Calls & sheets", after: "Online booking", icon: CalendarCheck },
  { label: "Daily operations", before: "Multiple tools", after: "One dashboard", icon: LayoutDashboard },
];

const TRUST_SIGNALS: { value: string; label: string; icon: LucideIcon }[] = [
  { value: "7 days", label: "Target launch window", icon: Rocket },
  { value: "Full", label: "Source-code handover", icon: ShieldCheck },
  { value: "₹0", label: "Monthly platform fees", icon: Banknote },
  { value: "Real only", label: "Verified buyer reviews", icon: Star },
];

const PRICE_INCLUDED = [
  "Full source code",
  "Brand and content setup",
  "Deployment assistance",
  "7-day launch support",
  "Documentation handover",
];

const PRICE_SEPARATE = [
  "Domain and hosting renewals",
  "Features outside your package",
  "Unlisted third-party tools",
  "Ongoing post-launch work",
];

const HOME_FAQS = [
  {
    question: "Do I own the source code after purchase?",
    answer: "Yes. You receive the complete source code, documentation and the licence rights described on the product page. You can customise it and operate it under your own brand.",
  },
  {
    question: "What if a product does not fully match my business?",
    answer: "Choose the closest starting product and tell us what must change. We confirm the customisation scope, price and delivery target before work begins.",
  },
  {
    question: "Is the 7-day launch target guaranteed for every project?",
    answer: "The 7-day target applies to eligible ready-made products with an agreed scope. Larger custom features or external integrations receive a separate written timeline.",
  },
  {
    question: "Are there monthly TechBro platform fees?",
    answer: "No. Product licences are one-time purchases. Your own hosting, domain and any third-party services are separate recurring costs.",
  },
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
  let testimonials: PublicTestimonial[] = [];
  let exploreIndustries = INDUSTRY_FALLBACK;
  let explorePlatforms = PLATFORM_FALLBACK;
  const [settings, blogPosts] = await Promise.all([
    getSiteSettings(),
    getPublishedBlogPosts().then((posts) => posts.slice(0, 3)),
  ]);

  try {
    await connectDB();
    const [catalogue, testimonialDocs, industryDocs, technologyDocs] = await Promise.all([
      queryCatalogue(parseCatalogueParams({ sort: "newest" })),
      Testimonial.find({ scope: "home", status: "published" }).select("name avatar role rating comment").sort({ displayOrder: 1, createdAt: -1 }).limit(3).lean(),
      Industry.find({ isActive: true }).select("name slug").sort({ displayOrder: 1, name: 1 }).lean(),
      Technology.find({ isActive: true }).select("name slug category").sort({ displayOrder: 1, name: 1 }).lean(),
    ]);
    products = catalogue.products.slice(0, 10);
    testimonials = JSON.parse(JSON.stringify(testimonialDocs)) as PublicTestimonial[];

    if (industryDocs.length) {
      exploreIndustries = industryDocs.map((industry) => ({
        name: industry.name,
        href: `/industry/${industry.slug}`,
        icon: INDUSTRY_ICONS[industry.slug] ?? Building2,
      }));
    }

    if (technologyDocs.length) {
      explorePlatforms = technologyDocs.map((technology) => ({
        name: technology.name,
        type: TECHNOLOGY_LABELS[technology.category] ?? "Technology",
        href: `/technology/${technology.slug}`,
        icon: TECHNOLOGY_ICONS[technology.slug] ?? Code2,
      }));
    }
  } catch {
    // Keep the marketing page available during a temporary catalogue outage.
    // Product rows populate automatically when MongoDB recovers.
  }

  const featuredProducts = products.length > 0 ? products : FEATURED_FALLBACK;

  return (
    <main className="home-page overflow-hidden bg-white">
      <section className="relative isolate overflow-hidden border-b border-blue-100 px-4 pb-8 pt-4 text-center sm:px-6 sm:pb-10 sm:pt-6 lg:pb-20 lg:pt-20">
        <div className="pointer-events-none absolute inset-0 -z-20 bg-[linear-gradient(to_bottom,#ffffff_0%,#ffffff_56%,#eff6ff_100%)]" />
        <div className="pointer-events-none absolute inset-0 -z-10 opacity-40 [background-image:linear-gradient(to_right,#dbeafe_1px,transparent_1px),linear-gradient(to_bottom,#dbeafe_1px,transparent_1px)] [background-size:36px_36px] [mask-image:linear-gradient(to_bottom,black,transparent_78%)]" />
        <div className="relative mx-auto max-w-5xl">
          <div className="overflow-hidden rounded-[10px] bg-white shadow-card ring-1 ring-blue-100 lg:hidden">
            <HomeHeroSlider slides={settings.home.banners} />
          </div>
          <div className="hidden lg:block">
            <p className="label">Websites · Apps · Business software</p>
            <h1 className="mx-auto mt-4 max-w-5xl font-display text-[2.45rem] font-extrabold leading-[1.02] tracking-[-0.05em] text-ink sm:mt-5 sm:text-6xl lg:text-[4.15rem]">Build smarter. Launch faster.<span className="block bg-gradient-to-r from-accent-deep via-blue-600 to-blue-400 bg-clip-text text-transparent">Own it completely.</span></h1>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-ink-soft sm:mt-5 sm:text-lg sm:leading-8">Start with proven software, shape it around your business and launch with complete source-code ownership.</p>
          </div>
          <div className="mt-4 flex flex-row items-center justify-center gap-2.5 sm:mt-5 sm:gap-3 lg:mt-7"><Link href="/shop" className="btn-primary min-h-12 rounded-xl px-4 text-xs sm:px-8 sm:text-sm">Explore products <ArrowRight className="ml-1.5 h-4 w-4" /></Link><Link href="/contact?type=custom" className="btn-secondary min-h-12 rounded-xl bg-white/90 px-4 text-xs backdrop-blur sm:px-8 sm:text-sm">Build custom web</Link><Link href="#catalogue-search" aria-label="Search the product catalogue" title="Search products" className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-rule bg-white/90 text-accent-deep shadow-card backdrop-blur transition hover:-translate-y-0.5 hover:border-accent hover:shadow-lift focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"><Search className="h-5 w-5" /></Link></div>
          <div className="mx-auto mt-7 grid max-w-3xl grid-cols-3 overflow-hidden rounded-2xl bg-white/90 shadow-card ring-1 ring-blue-100 backdrop-blur sm:mt-10">{[{ icon: Zap, title: "Launch faster", detail: "Ready-made foundation" },{ icon: ShieldCheck, title: "Own the code", detail: "Complete handover" },{ icon: Rocket, title: "Grow freely", detail: "No platform lock-in" }].map((benefit, index) => { const Icon = benefit.icon; return <div key={benefit.title} className={`px-2 py-4 sm:px-6 sm:py-5 ${index > 0 ? "border-l border-blue-100" : ""}`}><Icon className="mx-auto h-5 w-5 text-accent-deep sm:h-6 sm:w-6" /><p className="mt-2 text-[11px] font-extrabold text-ink sm:text-sm">{benefit.title}</p><p className="mt-0.5 hidden text-xs text-ink-faint sm:block">{benefit.detail}</p></div>; })}</div>
        </div>
      </section>

      <TrustedCompaniesMarquee companies={settings.home.trustedBrands} />

      <section id="catalogue-search" className="scroll-mt-24 border-b border-rule-soft bg-accent-mist/35" aria-label="Search the product catalogue"><div className="mx-auto max-w-shell px-4 py-10 sm:px-6 sm:py-14"><div className="text-center"><p className="label">Find your starting point</p><h2 className="mt-2 font-brand text-2xl font-black tracking-[-0.025em] text-ink sm:text-3xl">What do you want to build?</h2><p className="mx-auto mb-5 mt-2 max-w-xl text-sm text-ink-soft">Search the complete catalogue or narrow it by industry, platform and budget.</p><HomeCatalogueSearch /></div></div></section>

      <section className="border-y border-rule-soft bg-accent-mist/35" aria-labelledby="featured-heading"><div className="mx-auto max-w-shell px-4 py-14 sm:px-6 sm:py-20"><div className="mb-7 flex items-end justify-between gap-4"><div><p className="label">Ready to launch</p><h2 id="featured-heading" className="mt-1 font-brand text-3xl font-black tracking-[-0.03em] text-ink sm:text-4xl">Featured products</h2></div><Link href="/shop" className="inline-flex shrink-0 items-center gap-1 text-sm font-bold text-accent-deep hover:underline">View all <ArrowRight className="h-4 w-4" /></Link></div><div className="hide-scrollbar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 sm:-mx-6 sm:gap-5 sm:px-6">{featuredProducts.map((product) => { const image = product.thumbnail || product.images?.[0]; return <Link key={product._id} href={`/product/${product.slug}`} className="group min-w-[15.5rem] max-w-[15.5rem] snap-start overflow-hidden rounded-3xl bg-white/90 shadow-card ring-1 ring-white/80 backdrop-blur-sm transition-all duration-500 ease-out hover:-translate-y-1 hover:shadow-lift sm:min-w-[17.5rem] sm:max-w-[17.5rem]"><div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-blue-50 via-white to-accent-wash">{image ? <img src={image} alt="" className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.035]" /> : <div className="grid h-full place-items-center"><MonitorSmartphone className="h-16 w-16 text-accent/80" /></div>}<span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-bold text-accent-deep shadow-sm backdrop-blur">{product.industry?.name ?? "Software"}</span></div><div className="p-4"><h3 className="line-clamp-1 text-base font-bold text-ink">{product.title}</h3><p className="mt-1.5 min-h-10 text-sm leading-5 text-ink-soft">{shortSummary(product.shortDescription)}</p><div className="mt-4 flex items-baseline gap-2"><span className="font-display text-xl font-extrabold text-ink tabular">{formatPrice(product.effectivePrice)}</span>{product.discountPrice && product.discountPrice < product.price ? <span className="text-xs text-ink-faint line-through tabular">{formatPrice(product.price)}</span> : null}</div></div></Link>; })}</div><p className="mt-1 text-xs text-ink-faint">Swipe or scroll to explore more products.</p></div></section>

      <section className="bg-white py-14 sm:py-16" aria-labelledby="industries-heading"><div className="mx-auto max-w-shell px-4 sm:px-6"><div className="mb-7 flex items-end justify-between gap-4"><div><p className="label">Solutions for your sector</p><h2 id="industries-heading" className="mt-1 font-brand text-3xl font-black tracking-[-0.03em] text-ink sm:text-4xl">Explore by Industry</h2></div><Link href="/shop" className="inline-flex shrink-0 items-center gap-1 text-sm font-bold text-accent-deep hover:underline">View all <ArrowRight className="h-4 w-4" /></Link></div><div className="hide-scrollbar flex snap-x snap-mandatory gap-2 overflow-x-auto px-px pb-2 sm:gap-3">{exploreIndustries.map((industry) => { const Icon = industry.icon; return <Link key={industry.name} href={industry.href} className="group min-w-[calc((100%_-_1.5rem)/4)] flex-1 snap-start rounded-xl bg-white px-1 py-3 text-center shadow-card ring-1 ring-rule-soft transition hover:-translate-y-1 hover:shadow-lift sm:min-w-[7.5rem] sm:rounded-2xl sm:px-3 sm:py-5"><span className="mx-auto grid h-8 w-8 place-items-center rounded-lg bg-accent-cta text-white shadow-accent sm:h-11 sm:w-11 sm:rounded-xl"><Icon className="h-4 w-4 sm:h-5 sm:w-5" /></span><span className="mt-2 block text-[9px] font-bold leading-tight text-ink sm:mt-3 sm:text-sm">{industry.name}</span></Link>; })}</div><p className="mt-2 text-xs text-ink-faint sm:hidden">Swipe to explore industries.</p><div className="mb-7 mt-12 flex items-end justify-between gap-4 sm:mt-14"><div><p className="label">Built on the tools you trust</p><h2 id="platforms-heading" className="mt-1 font-brand text-3xl font-black tracking-[-0.03em] text-ink sm:text-4xl">Explore by Platform</h2></div><Link href="/shop" className="inline-flex shrink-0 items-center gap-1 text-sm font-bold text-accent-deep hover:underline">View all <ArrowRight className="h-4 w-4" /></Link></div><div className="hide-scrollbar flex snap-x snap-mandatory gap-2 overflow-x-auto px-px pb-2 sm:gap-3" aria-labelledby="platforms-heading">{explorePlatforms.map((platform) => { const Icon = platform.icon; return <Link key={platform.name} href={platform.href} className="group flex min-h-24 min-w-[calc((100%_-_1.5rem)/4)] flex-1 snap-start flex-col items-center justify-center rounded-xl border border-[#d8e3f0] bg-gradient-to-b from-white to-[#edf3fa] px-1 py-2.5 text-center transition hover:-translate-y-1 hover:border-[#9eb7d5] hover:shadow-lift sm:min-h-32 sm:min-w-[7.5rem] sm:rounded-2xl sm:px-2 sm:py-4"><span className="grid h-8 w-8 place-items-center rounded-lg bg-[#0d2f64] text-white shadow-sm transition group-hover:bg-[#071a3d] sm:h-11 sm:w-11 sm:rounded-xl"><Icon className="h-3.5 w-3.5 sm:h-5 sm:w-5" /></span><strong className="mt-2 block text-[9px] leading-tight text-ink sm:mt-3 sm:text-sm">{platform.name}</strong><span className="mt-1 hidden text-[10px] font-semibold uppercase tracking-[0.08em] text-accent-deep/65 sm:block">{platform.type}</span></Link>; })}</div><p className="mt-2 text-xs text-ink-faint sm:hidden">Swipe to explore platforms.</p></div></section>

      <section className="mx-auto max-w-shell px-4 py-12 sm:px-6 sm:py-16">
        <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-[#071a3d] via-[#0d2a5e] to-[#123b78] px-5 py-7 text-white shadow-lift ring-1 ring-blue-900/20 sm:px-8 sm:py-9 lg:px-10">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-accent-deep shadow-card">
              <Rocket className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-blue-200 sm:text-xs">Our 7-day launch promise</p>
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
                <p className="mt-0.5 text-[9px] font-medium text-blue-200 sm:text-[11px]">{step.day}</p>
              </li>
            ))}
          </ol>

          <div className="mt-6 flex flex-col gap-5 border-t border-white/15 pt-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="max-w-2xl text-xs leading-relaxed text-white/75 sm:text-sm">
                Choose a product, share your branding, approve the build and we deploy it. If the agreed launch is not delivered in seven days, your setup fee is refunded.
              </p>
              <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-[11px] font-medium text-white sm:text-xs">
                {["Source-code ownership", "Brand customization", "Launch support"].map((item) => (
                  <li key={item} className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-blue-300" />{item}</li>
                ))}
              </ul>
            </div>
            <Link href="/shop" className="inline-flex min-h-10 shrink-0 items-center justify-center self-start rounded-lg bg-white px-5 text-xs font-extrabold text-accent-deep shadow-card transition hover:bg-blue-50 lg:self-center">
              Explore <ArrowRight className="ml-1.5 h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="border-y border-rule-soft bg-accent-mist/35 py-14 sm:py-20" aria-labelledby="best-sellers-heading">
        <div className="mx-auto max-w-shell px-4 sm:px-6">
          <div className="mb-7 flex items-end justify-between gap-4">
            <div>
              <p className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-[0.16em] text-accent-deep"><Crown className="h-4 w-4" aria-hidden="true" /> Customer favourites</p>
              <h2 id="best-sellers-heading" className="mt-1 font-brand text-3xl font-black tracking-[-0.03em] text-ink sm:text-4xl">Best sellers</h2>
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
                  <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-blue-50 via-white to-accent-wash">
                    {image ? (
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

      <section className="bg-white px-4 py-14 sm:px-6 sm:py-20" aria-labelledby="launch-outcome-heading">
        <div className="mx-auto max-w-shell">
          <div className="text-center">
            <p className="label">A simpler way to launch</p>
            <h2 id="launch-outcome-heading" className="mt-2 font-brand text-3xl font-black tracking-[-0.03em] text-ink sm:text-4xl">
              From scattered tools to one live system
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-ink-soft sm:text-base">
              We customise a proven product for your brand, test it with you and prepare it for launch in as little as 7 days.
            </p>
          </div>

          <div className="mt-8 overflow-hidden rounded-[10px] bg-white shadow-lift ring-1 ring-slate-200 sm:mt-10 lg:grid lg:grid-cols-[0.9fr_1.1fr]">
            <div className="p-6 text-center sm:p-8 lg:p-10">
              <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-accent-deep">Example transformation</p>
              <h3 className="mt-2 font-display text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
                Move your business online—without starting from zero.
              </h3>

              <div className="mt-7 grid grid-cols-2 overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex min-w-0 flex-col items-center justify-center bg-[#eaf2ff] p-4 text-center sm:p-6">
                  <p className="font-display text-sm font-extrabold uppercase tracking-[0.14em] text-[#49617f]">Before</p>
                  <ul className="mt-4 w-full space-y-3 text-xs font-semibold leading-relaxed text-[#40506a] sm:text-sm">
                    {["Manual bookings", "Scattered business data", "No branded system"].map((item) => (
                      <li key={item} className="flex min-h-9 items-center justify-center rounded-lg bg-white/70 px-1.5 shadow-sm ring-1 ring-blue-200/80">{item}</li>
                    ))}
                  </ul>
                </div>

                <div className="flex min-w-0 flex-col items-center justify-center border-l border-[#9eb7d5] bg-gradient-to-br from-[#123b78] to-[#071a3d] p-4 text-center sm:p-6">
                  <p className="font-display text-sm font-black uppercase tracking-[0.12em] text-white">With TechBro</p>
                  <ul className="mt-4 w-full space-y-3 text-xs font-bold leading-relaxed text-white sm:text-sm">
                    {["Online bookings", "One central dashboard", "Branded and launch-ready"].map((item) => (
                      <li key={item} className="flex min-h-9 items-center justify-center rounded-lg bg-white/10 px-1.5 shadow-sm ring-1 ring-white/20">{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <div className="relative overflow-hidden bg-[#071a3d] p-6 text-white sm:p-8 lg:p-10">
              <div className="pointer-events-none absolute right-0 top-0 h-48 w-48 rounded-full bg-blue-500/10 blur-3xl" />
              <p className="relative text-[10px] font-extrabold uppercase tracking-[0.16em] text-blue-200">Clear, measurable change</p>
              <h3 className="relative mt-2 font-display text-2xl font-extrabold tracking-tight sm:text-3xl">What improves after launch</h3>

              <dl className="relative mt-6 space-y-3">
                {LAUNCH_OUTCOMES.map((metric) => {
                  const Icon = metric.icon;
                  return (
                    <div key={metric.label} className="grid grid-cols-[2.5rem_minmax(0,1fr)] items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.06] p-4 sm:grid-cols-[2.5rem_minmax(0,1fr)_auto]">
                      <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-400/15 text-blue-200"><Icon className="h-[18px] w-[18px]" aria-hidden="true" /></span>
                      <div className="min-w-0">
                        <dt className="text-xs font-semibold text-white/60">{metric.label}</dt>
                        <dd className="mt-1 text-sm font-bold text-white sm:hidden">{metric.after}</dd>
                      </div>
                      <dd className="col-start-2 flex items-center gap-2 text-xs sm:col-auto sm:text-sm"><span className="text-white/40">{metric.before}</span><ArrowRight className="h-3.5 w-3.5 shrink-0 text-blue-300" /><span className="hidden font-bold text-white sm:inline">{metric.after}</span></dd>
                    </div>
                  );
                })}
              </dl>

              <div className="relative mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link href="/shop" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-extrabold text-accent-deep transition hover:-translate-y-0.5 hover:bg-blue-50 hover:shadow-lg">
                  Explore ready-made products <ArrowRight className="h-4 w-4" />
                </Link>
                <p className="text-[10px] leading-relaxed text-white/45">The 7-day target depends on the selected product and agreed customisation.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white px-4 pb-8 pt-0 sm:px-6 sm:pb-10" aria-labelledby="trust-heading">
        <div className="relative mx-auto max-w-shell overflow-hidden rounded-[10px] bg-[#071a3d] px-5 py-8 text-center shadow-[0_24px_70px_-36px_rgba(7,26,61,0.75)] ring-1 ring-[#071a3d] sm:px-10 sm:py-11 lg:px-12">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />

          <div className="relative">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-blue-200 sm:text-xs">Why choose TechBro</p>
          <h2 id="trust-heading" className="mx-auto mt-2 max-w-3xl font-display text-2xl font-extrabold tracking-[-0.035em] text-white sm:text-4xl">
            Know exactly what you get before you buy
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-slate-300 sm:text-base">
            Clear ownership, transparent costs and an honest review policy—without hidden platform lock-ins.
          </p>

          <div className="mt-7 grid grid-cols-2 gap-2.5 sm:mt-9 sm:gap-3 lg:grid-cols-4">
            {TRUST_SIGNALS.map((signal, index) => {
              const Icon = signal.icon;
              return (
                <article key={signal.label} className="group flex min-h-28 flex-col rounded-xl bg-white p-3.5 text-left shadow-sm ring-1 ring-white/10 transition hover:-translate-y-0.5 hover:shadow-card sm:min-h-36 sm:p-5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[9px] font-bold tracking-[0.12em] text-slate-400">0{index + 1}</span>
                    <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#edf3fa] text-[#0d2f64] sm:h-9 sm:w-9"><Icon className="h-4 w-4" aria-hidden="true" /></span>
                  </div>
                  <div className="mt-auto pt-3">
                    <p className="font-display text-lg font-extrabold tracking-tight text-[#071a3d] sm:text-2xl">{signal.value}</p>
                    <p className="mt-0.5 text-[10px] font-medium leading-4 text-slate-500 sm:text-xs">{signal.label}</p>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="mt-3 flex flex-col items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3.5 text-xs leading-relaxed text-slate-300 sm:mt-4 sm:flex-row sm:px-6 sm:py-4 sm:text-sm">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/10 text-blue-100 ring-1 ring-white/10">
              <ShieldCheck className="h-[18px] w-[18px]" aria-hidden="true" />
            </span>
            <p><span className="font-extrabold text-white">Our review promise:</span>{" "}
            We publish feedback only from completed, verified purchases—never created testimonials or inflated customer numbers.</p>
          </div>
          </div>
        </div>
      </section>

      <section className="bg-paper-alt px-4 pb-14 pt-8 sm:px-6 sm:pb-20 sm:pt-10" aria-labelledby="price-coverage-heading">
        <div className="mx-auto max-w-5xl text-center">
          <p className="label">No surprises</p>
          <h2 id="price-coverage-heading" className="mx-auto mt-2 max-w-3xl font-brand text-3xl font-black tracking-[-0.03em] text-ink sm:text-4xl">
            Know what your product price covers
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-ink-soft sm:text-base">
            Your selected package defines the complete scope. Any optional or recurring costs are confirmed before work begins.
          </p>

          <div className="mt-8 grid grid-cols-2 items-stretch gap-3 text-left sm:mt-10 sm:gap-5">
            <article className="relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-blue-50 p-4 shadow-card sm:rounded-3xl sm:p-7">
              <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-blue-200/35 blur-2xl" />
              <div className="relative flex flex-col items-center text-center sm:flex-row sm:text-left">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100 sm:h-11 sm:w-11">
                  <Check className="h-5 w-5" strokeWidth={2.5} aria-hidden="true" />
                </span>
                <div className="mt-2 sm:ml-3 sm:mt-0">
                  <h3 className="font-display text-base font-extrabold text-ink sm:text-xl">Included</h3>
                  <p className="hidden text-xs text-ink-soft sm:block">Covered by your package</p>
                </div>
              </div>
              <ul className="relative mt-4 space-y-2.5 sm:mt-6 sm:space-y-3">
                {PRICE_INCLUDED.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-[11px] font-semibold leading-4 text-ink sm:text-sm sm:leading-5">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600 sm:h-4 sm:w-4" aria-hidden="true" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>

            <article className="relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-blue-50 p-4 shadow-card sm:rounded-3xl sm:p-7">
              <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-slate-200/70 blur-2xl" />
              <div className="relative flex flex-col items-center text-center sm:flex-row sm:text-left">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-amber-50 text-amber-600 ring-1 ring-amber-200 sm:h-11 sm:w-11">
                  <Info className="h-5 w-5" strokeWidth={2.25} aria-hidden="true" />
                </span>
                <div className="mt-2 sm:ml-3 sm:mt-0">
                  <h3 className="font-display text-base font-extrabold text-ink sm:text-xl">Separate</h3>
                  <p className="hidden text-xs text-ink-soft sm:block">Only when you need them</p>
                </div>
              </div>
              <ul className="relative mt-4 space-y-2.5 sm:mt-6 sm:space-y-3">
                {PRICE_SEPARATE.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-[11px] leading-4 text-ink-soft sm:text-sm sm:leading-5">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" aria-hidden="true" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>
          </div>

          <p className="mx-auto mt-5 max-w-2xl text-xs leading-relaxed text-ink-faint sm:text-sm">
            The exact inclusions for each product and package are shown on its product page and confirmed in writing before checkout.
          </p>
        </div>
      </section>

      <section className="bg-white px-4 py-10 sm:px-6 sm:py-14 lg:py-16" aria-labelledby="home-blog-heading">
        <div className="mx-auto max-w-shell">
          <div className="flex items-end justify-between gap-5">
            <div>
              <p className="label">Ideas for your next launch</p>
              <h2 id="home-blog-heading" className="mt-1.5 font-brand text-[1.75rem] font-black leading-tight tracking-[-0.035em] text-ink sm:text-4xl">Latest from the blog</h2>
            </div>
            <Link href="/blog" className="group inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full border border-rule bg-white px-3 text-xs font-bold text-ink shadow-sm transition hover:border-blue-200 hover:text-accent sm:px-4 sm:text-sm">
              View all <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>

          <div className="mt-5 grid gap-3 sm:mt-7 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
            {blogPosts.map((post) => <BlogCard key={post._id} post={post} />)}
          </div>
        </div>
      </section>

      <section className="bg-paper-alt px-4 pb-10 pt-8 sm:px-6 sm:py-16" aria-labelledby="home-faq-heading">
        <div className="mx-auto grid max-w-shell gap-8 lg:grid-cols-[0.7fr_1.3fr] lg:items-start lg:gap-14">
          <div className="text-center lg:sticky lg:top-28 lg:text-left">
            <p className="label">Common questions</p>
            <h2 id="home-faq-heading" className="mt-2 font-brand text-3xl font-black tracking-[-0.03em] text-ink sm:text-4xl">Before you get started</h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-ink-soft sm:text-base lg:mx-0">Clear answers about ownership, customisation, timelines and ongoing costs.</p>
            <Link href="/book-consultation" className="btn-secondary mt-5 min-h-11 px-5">Book a free call</Link>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card sm:rounded-3xl">
            {HOME_FAQS.map((item, index) => (
              <details key={item.question} open={index === 0} className="group border-b border-slate-200 last:border-0">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-4 text-left text-sm font-bold text-ink marker:content-none sm:px-6 sm:py-5 sm:text-base">
                  <span>{item.question}</span>
                  <span className="relative grid h-8 w-8 shrink-0 place-items-center rounded-full bg-slate-100 text-ink-soft" aria-hidden="true">
                    <span className="absolute h-0.5 w-3 bg-current" />
                    <span className="absolute h-3 w-0.5 bg-current transition-transform group-open:scale-y-0" />
                  </span>
                </summary>
                <p className="px-4 pb-5 pr-14 text-sm leading-relaxed text-ink-soft sm:px-6 sm:pb-6 sm:pr-16">{item.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white px-4 py-8 sm:px-6 sm:py-12" aria-labelledby="recommendation-heading">
        <div className="relative mx-auto max-w-shell overflow-hidden rounded-[10px] border border-blue-100 bg-gradient-to-br from-white via-blue-50 to-blue-100 px-5 py-9 text-center shadow-lift sm:px-10 sm:py-12">
          <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-blue-300/20 blur-3xl" />
          <p className="label">Free product guidance</p>
          <h2 id="recommendation-heading" className="relative mx-auto mt-2 max-w-2xl font-brand text-3xl font-black tracking-[-0.03em] text-ink sm:text-4xl">Not sure which product fits your business?</h2>
          <p className="relative mx-auto mt-3 max-w-xl text-sm leading-relaxed text-ink-soft sm:text-base">Book a free 15-minute call. We’ll understand your workflow and recommend the closest starting point—without sales pressure.</p>
          <div className="relative mx-auto mt-6 grid max-w-md grid-cols-2 gap-3">
            <Link href="/book-consultation" className="inline-flex min-h-12 items-center justify-center rounded-xl bg-accent px-3 text-xs font-extrabold text-white shadow-[0_12px_30px_rgba(18,59,120,0.25)] transition hover:-translate-y-0.5 hover:bg-accent-hover sm:text-sm">Book a free call</Link>
            <Link href="/shop" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-blue-200 bg-white px-3 text-xs font-extrabold text-accent-deep transition hover:-translate-y-0.5 hover:border-blue-300 sm:text-sm">Browse catalogue</Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-shell px-4 py-10 text-center sm:px-6 sm:py-14" aria-labelledby="reviews-heading">
        <p className="label">Customer reviews</p>
        <h2 id="reviews-heading" className="mt-1 font-brand text-3xl font-black tracking-[-0.03em] text-ink sm:text-4xl">What the experience can feel like</h2>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-ink-soft">Temporary examples are clearly labelled below. Verified buyer reviews will replace them as purchases are completed.</p>
        <div className="mt-7 text-left">
          {testimonials.length ? <SampleTestimonials testimonials={testimonials} /> : <div className="mx-auto max-w-md rounded-2xl border border-dashed border-rule bg-white p-6 text-sm text-ink-soft">No sample testimonials have been added in the admin panel yet.</div>}
        </div>
      </section>
    </main>
  );
}
