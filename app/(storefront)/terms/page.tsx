import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, Clause } from "@/components/storefront/LegalPage";

export const metadata: Metadata = {
  title: "Terms & conditions | TechBro",
  description:
    "The terms that apply to using the TechBro website and buying software through it.",
  alternates: { canonical: "/terms" },
};

/** DRAFT — have a lawyer review before launch. */
export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Terms & conditions"
      updated="12 August 2026"
      intro="These terms cover using this website and buying through it. What you may do with the code you buy is covered separately in the licence agreement."
    >
      <Clause title="Who we are">
        <p>
          TechBro is operated by Geoloide Private Limited, registered in India.
          References to &ldquo;we&rdquo; and &ldquo;us&rdquo; mean that company.
        </p>
      </Clause>

      <Clause title="Your account">
        <p>
          You are responsible for keeping your password and licence keys
          confidential. Downloads are authorised by your signed-in session, so
          anyone with access to your account can retrieve the products you have
          bought. Tell us immediately if you think your account has been
          compromised.
        </p>
        <p>
          One account per person or organisation. Accounts created to
          circumvent licensing terms will be closed without refund.
        </p>
      </Clause>

      <Clause title="Pricing and payment">
        <p>
          Prices are shown excluding GST, which is added at checkout and shown
          before you pay. We may change prices at any time; the price you paid
          is the price on your invoice and is not affected by later changes.
        </p>
        <p>
          Orders are confirmed when payment clears with our payment provider,
          not when your browser returns from the payment page. If a payment is
          taken but no confirmation arrives, contact us with the payment
          reference.
        </p>
      </Clause>

      <Clause title="Delivery">
        <p>
          Products are delivered digitally: a licence key by email and a
          download from your account, normally within minutes of payment
          clearing. Download links are generated on demand and expire after 15
          minutes, and each licence has a download limit shown on your
          purchases page. Ask and we will raise it.
        </p>
      </Clause>

      <Clause title="Demos">
        <p>
          Demo environments are shared, reset periodically, and provided so you
          can evaluate a product. Do not enter real personal or business data
          into a demo, and do not use demo credentials for anything other than
          evaluation.
        </p>
      </Clause>

      <Clause title="Acceptable use">
        <p>
          Do not attempt to access source files you have not bought, probe or
          disrupt the site, scrape the catalogue, or use the contact forms to
          send bulk or automated messages. We may suspend accounts that do.
        </p>
      </Clause>

      <Clause title="Liability">
        <p>
          Our total liability for any claim is limited to what you paid for the
          product in question. We are not liable for lost profits, lost data,
          or business interruption arising from the use of a product.
        </p>
        <p>
          Nothing here limits liability that cannot be limited under Indian law.
        </p>
      </Clause>

      <Clause title="Changes">
        <p>
          We may update these terms. The version that applies to your order is
          the one published when the order was placed, which is why every legal
          page carries a date.
        </p>
      </Clause>

      <Clause title="Governing law">
        <p>
          Indian law applies, and the courts of Pune, Maharashtra have exclusive
          jurisdiction. See also our{" "}
          <Link href="/licence" className="text-accent-deep hover:underline">
            licence agreement
          </Link>{" "}
          and{" "}
          <Link href="/refund-policy" className="text-accent-deep hover:underline">
            refund policy
          </Link>
          .
        </p>
      </Clause>
    </LegalPage>
  );
}
