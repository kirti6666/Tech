import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About us | TechBro",
  description:
    "TechBro is operated by Geoloide Private Limited. We build and sell production-ready software with complete source code.",
  alternates: { canonical: "/about" },
};

/**
 * About page.
 *
 * Deliberately short and free of claims we cannot back: no invented client
 * count, no logo wall, no "trusted by thousands". The compliance notes rule
 * out fabricated testimonials and client logos, and an About page is where
 * that temptation is strongest. Company registration details are the
 * credibility here, because they are checkable.
 *
 * PLACEHOLDERS: replace CIN, GSTIN, address and phone with the real
 * registered values before launch. An About page with a wrong CIN is worse
 * than one with none.
 */
export default function AboutPage() {
  return (
    <main className="mx-auto max-w-2xl px-5 py-16 sm:px-6">
      <header className="mb-10">
        <p className="label">About</p>
        <h1 className="mt-2 font-display text-4xl font-light tracking-tight text-ink sm:text-5xl">
          Software worth owning
        </h1>
      </header>

      <div className="space-y-5 text-[15px] leading-relaxed text-ink-soft">
        <p>
          Most businesses that need software face the same two bad options:
          rent a SaaS product that almost fits and never own anything, or
          commission a custom build that costs six figures and takes eight
          months.
        </p>
        <p>
          TechBro exists for the gap between them. We build production-ready
          applications for common business problems — clinic management,
          course platforms, delivery tracking, lending systems — and sell them
          with the complete source code. You buy once, we rebrand it, and you
          own it outright.
        </p>
        <p>
          That means you can host it where you like, hire anyone to maintain
          it, change whatever you want, and never receive another licence
          invoice. It also means we have to be honest about what each product
          does, because you will read the code.
        </p>
        <p>
          Where a product was not built in-house, we hold documented resale
          rights for it. Where a product needs work to fit your business, we
          will tell you that before you buy rather than after.
        </p>
      </div>

      <section className="mt-12 card px-6 py-6">
        <h2 className="font-display text-2xl font-normal text-ink">
          Company details
        </h2>
        <dl className="mt-4 space-y-2.5 text-sm">
          {[
            ["Registered name", "Geoloide Private Limited"],
            ["Trading as", "TechBro"],
            ["CIN", "U62099MH2024PTC000000"],
            ["GSTIN", "27AAAAA0000A1Z5"],
            ["Registered office", "Pune, Maharashtra, India"],
            ["Email", "hello@techbro.in"],
          ].map(([label, value]) => (
            <div key={label} className="grid grid-cols-[9rem_1fr] gap-3">
              <dt className="text-xs uppercase tracking-[0.06em] text-ink-faint">
                {label}
              </dt>
              <dd className="text-ink">{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link href="/shop" className="btn-primary">
          Browse the catalogue
        </Link>
        <Link href="/contact" className="btn-secondary">
          Talk to us
        </Link>
      </div>
    </main>
  );
}
