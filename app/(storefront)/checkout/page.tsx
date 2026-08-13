import type { Metadata } from "next";
import Script from "next/script";
import { CheckoutClient } from "@/components/storefront/checkout/CheckoutClient";

export const metadata: Metadata = {
  title: "Checkout | TechBro",
  robots: { index: false, follow: false },
};

/**
 * Server shell only. Everything below needs the cart, which lives in the
 * browser, so the work happens in CheckoutClient.
 *
 * The Razorpay script is loaded with `lazyOnload` rather than `beforeInteractive`
 * — nothing on the page needs it until the buyer presses Pay, and blocking
 * hydration on a third-party script slows down the step before it.
 */
export default function CheckoutPage() {
  return (
    <main className="mx-auto max-w-shell px-4 py-8 sm:px-6 sm:py-12">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

      <header className="mb-8 border-b border-rule-soft pb-7">
        <p className="label">Secure checkout</p>
        <div className="mt-2 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-ink sm:text-4xl">Complete your purchase</h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink-soft">Review your product, enter invoice details and pay securely. Your licence is delivered after payment confirmation.</p>
          </div>
          <ol className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-ink-faint" aria-label="Checkout steps">
            <li className="rounded-full bg-accent-deep px-3 py-1.5 text-white">1 Review</li><li aria-hidden>→</li>
            <li className="rounded-full bg-paper-alt px-3 py-1.5">2 Billing</li><li aria-hidden>→</li>
            <li className="rounded-full bg-paper-alt px-3 py-1.5">3 Pay</li>
          </ol>
        </div>
      </header>

      <CheckoutClient />
    </main>
  );
}
