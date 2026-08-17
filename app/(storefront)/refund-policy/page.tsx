import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, Clause } from "@/components/storefront/LegalPage";

export const metadata: Metadata = {
  title: "Refund policy | TechBro",
  description:
    "When a refund is available on a digital software purchase, how to request one, and what happens to your licence and access afterwards.",
  alternates: { canonical: "/refund-policy" },
};

/**
 * DRAFT — have a lawyer review before launch.
 *
 * This is the document that makes the revocation machinery in the app
 * meaningful. Two things it does that a generic template does not:
 *
 * 1. It states plainly that downloading the source code ends refund
 *    eligibility. Anything vaguer is unenforceable for a product the buyer
 *    keeps a permanent copy of, and pretending otherwise invites disputes
 *    you cannot win.
 * 2. It spells out the buyer's deletion obligation on refund, which is the
 *    only lever you have once a file has left your servers.
 *
 * The download-state condition is checkable in the admin panel — the order
 * detail page shows the download log — so this policy can actually be
 * applied consistently rather than case by case.
 */
export default function RefundPolicyPage() {
  return (
    <LegalPage
      eyebrow="Policy"
      title="Refund policy"
      updated="12 August 2026"
      intro="Software delivered as source code can't be returned once it has been handed over. This policy explains when a refund is still fair and what happens to your licence when one is issued."
    >
      <Clause title="Before source-code handover">
        <p>
          If the source code has not yet been delivered to you, you may request a
          full refund within <strong className="font-medium text-ink">7 days</strong>{" "}
          of purchase, for any reason. We&apos;ll cancel the licence and refund
          the full amount including GST.
        </p>
        <p>
          This is why every product has a live demo with admin credentials. We
          would much rather you spent an hour in the demo than bought something
          that turns out to be wrong for you.
        </p>
      </Clause>

      <Clause title="After source-code handover">
        <p>
          Once the source code has been delivered, the purchase is
          generally final. You hold a permanent copy of the product, and there
          is no way for us to take that back.
        </p>
        <p>We will still consider a refund after delivery where:</p>
        <ul className="ml-5 list-disc space-y-1.5">
          <li>
            the product does not substantially match what the product page
            described, and we cannot correct it within 14 days;
          </li>
          <li>
            the delivered source code is incomplete, corrupted, or won&apos;t install
            following the supplied guide, and we cannot fix it within 14 days;
          </li>
          <li>you were charged twice for the same order.</li>
        </ul>
        <p>
          &ldquo;It didn&apos;t suit our requirements&rdquo; is not covered
          after download. Neither is a change of mind, a change of budget, or
          discovering that a feature you assumed was included was not listed on
          the product page.
        </p>
      </Clause>

      <Clause title="Services bought as add-ons">
        <p>
          Rebranding, deployment and maintenance are refundable in full until
          work starts — that is, while the request still shows as{" "}
          <em>Pending</em> in your account. Once a request moves to{" "}
          <em>In progress</em>, refunds are pro-rated against the work already
          done.
        </p>
        <p>
          If you paid for a service and we haven&apos;t started it within 30
          days of receiving the details we asked for, you can cancel that part
          of the order for a full refund, whatever the product refund position
          is.
        </p>
      </Clause>

      <Clause title="What happens when a refund is issued">
        <p>When we refund an order, all of the following take effect:</p>
        <ul className="ml-5 list-disc space-y-1.5">
          <li>your licence key is revoked and will no longer authorise downloads;</li>
          <li>
            any repository access granted for the product is removed, including
            invitations you have not yet accepted;
          </li>
          <li>undelivered service work is cancelled.</li>
        </ul>
        <p>
          You are required to permanently delete every copy of the source code,
          database schema and documentation in your possession, including
          copies held by contractors or on any server where you deployed it.
          Continuing to use the product after a refund is a breach of the{" "}
          <Link href="/licence" className="text-accent-deep hover:underline">
            licence agreement
          </Link>{" "}
          and of copyright.
        </p>
      </Clause>

      <Clause title="How to request one">
        <p>
          Email us from the address on the order, or use the{" "}
          <Link href="/contact" className="text-accent-deep hover:underline">
            contact form
          </Link>
          , with your order number and what went wrong. We aim to respond
          within one working day and to resolve refund requests within five.
        </p>
        <p>
          Approved refunds go back to the original payment method. Razorpay and
          Stripe typically take 5–10 working days to settle, which is outside
          our control.
        </p>
      </Clause>

      <Clause title="Chargebacks">
        <p>
          Please talk to us before raising a chargeback. A chargeback on a
          delivered digital product freezes the dispute for weeks and we will
          contest it with the download log and delivery records. Almost every
          case we have seen is faster to resolve by email.
        </p>
      </Clause>
    </LegalPage>
  );
}
