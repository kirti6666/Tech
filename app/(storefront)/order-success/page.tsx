import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Order received | TechBro",
  robots: { index: false, follow: false },
};

/**
 * Post-payment landing page.
 *
 * Carefully worded: it says the payment was submitted, not that the order is
 * confirmed. Confirmation happens in the gateway webhook, which may land a
 * second or two after the browser gets here — so a page that announces
 * "order complete" would be lying about a third of the time, and lying in
 * the direction that generates support tickets when the email is slower than
 * expected.
 *
 * No order details are shown, because this page is reachable by anyone with
 * the URL. The real record lives behind a login on the purchases page.
 */
export default function OrderSuccessPage({
  searchParams,
}: {
  searchParams: { order?: string };
}) {
  return (
    <main className="mx-auto max-w-xl px-5 py-24 text-center sm:px-6">
      <p className="label">Payment submitted</p>
      <h1 className="mt-3 font-display text-4xl font-light tracking-tight text-ink sm:text-5xl">
        Thank you — we&apos;re processing it
      </h1>

      {searchParams.order && (
        <p className="mt-4 text-sm text-ink-faint">
          Order reference{" "}
          <span className="font-mono text-ink">{searchParams.order}</span>
        </p>
      )}

      <p className="mx-auto mt-6 max-w-md text-base leading-relaxed text-ink-soft">
        Your licence key and download link are emailed as soon as the payment
        clears with our provider — usually within a minute. Your GST invoice
        comes with it.
      </p>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/account/purchases" className="btn-primary">
          Go to your purchases
        </Link>
        <Link href="/shop" className="btn-secondary">
          Keep browsing
        </Link>
      </div>

      <p className="mx-auto mt-10 max-w-md text-sm leading-relaxed text-ink-faint">
        Nothing after a few minutes? Check your spam folder, then{" "}
        <Link href="/contact" className="text-accent-deep hover:underline">
          contact us
        </Link>{" "}
        with the reference above and we&apos;ll sort it out.
      </p>
    </main>
  );
}
