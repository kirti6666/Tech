import type { Metadata } from "next";
import { Suspense } from "react";
import { ContactForm } from "@/components/storefront/ContactForm";

export const metadata: Metadata = {
  title: "Contact us | TechBro",
  description:
    "Questions about a product, or something you need built from scratch. We reply within one working day.",
  alternates: { canonical: "/contact" },
};

/**
 * The form reads ?type=custom to decide whether to ask about budget, which
 * means useSearchParams, which means a Suspense boundary — without one,
 * Next.js opts the whole route out of static rendering.
 */
export default function ContactPage() {
  return (
    <main className="mx-auto max-w-2xl px-5 py-10 sm:px-6">
      <header className="mb-8">
        <p className="label-muted">Contact</p>
        <h1 className="mt-1.5 font-display text-3xl font-bold tracking-tight text-ink">
          Talk to us
        </h1>
        <p className="mt-3 text-base leading-relaxed text-ink-soft">
          Questions about a product before you buy, help with one you already
          own, or something that needs building from scratch — all of it comes
          to the same place.
        </p>
      </header>

      <Suspense fallback={<div className="h-96" />}>
        <ContactForm />
      </Suspense>
    </main>
  );
}
