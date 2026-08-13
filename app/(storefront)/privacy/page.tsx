import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, Clause } from "@/components/storefront/LegalPage";

export const metadata: Metadata = {
  title: "Privacy policy | TechBro",
  description:
    "What personal data TechBro collects, why, how long it is kept, and how to have it deleted.",
  alternates: { canonical: "/privacy" },
};

/**
 * DRAFT — have a lawyer review before launch.
 *
 * Written against what the application actually does rather than from a
 * template. Three things here are real commitments the code already
 * implements, and they should not be softened into vagueness:
 *
 *  - download logs are retained (Phase 4, DownloadLog is append-only)
 *  - deployment credentials are encrypted and deleted (Phase 5 purge job)
 *  - card details never reach our servers (Razorpay/Stripe hosted checkout)
 *
 * If any of those stop being true, this page has to change the same day.
 */
export default function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Privacy policy"
      updated="12 August 2026"
      intro="We collect what we need to sell you software and support it afterwards, and not much else. This page says exactly what that is."
    >
      <Clause title="What we collect">
        <p>
          <strong className="font-medium text-ink">When you buy:</strong> name,
          email, phone, billing address, and GSTIN if you supply one. Indian tax
          law requires the billing state on the invoice, which is why it is not
          optional.
        </p>
        <p>
          <strong className="font-medium text-ink">When you download:</strong>{" "}
          the time, your IP address and browser, against your licence. This is
          an anti-piracy record and it is deliberately permanent.
        </p>
        <p>
          <strong className="font-medium text-ink">
            When you buy a deployment:
          </strong>{" "}
          the hosting credentials you send us. These are encrypted before
          storage and deleted seven days after the work is handed over.
        </p>
        <p>
          <strong className="font-medium text-ink">When you contact us:</strong>{" "}
          your name, email, message and the IP address it came from, used to
          reply and to filter spam.
        </p>
      </Clause>

      <Clause title="What we never see">
        <p>
          Card numbers, UPI IDs and bank details. Payments run through Razorpay
          and Stripe on their own infrastructure — those details never reach our
          servers, and we could not retrieve them if we wanted to.
        </p>
      </Clause>

      <Clause title="How long we keep it">
        <ul className="ml-5 list-disc space-y-1.5">
          <li>
            <strong className="font-medium text-ink">Invoices and order records</strong> — 8
            years, as required under Indian tax law. These cannot be deleted on
            request.
          </li>
          <li>
            <strong className="font-medium text-ink">Download logs</strong> — kept
            indefinitely, tied to the licence rather than to you personally.
          </li>
          <li>
            <strong className="font-medium text-ink">Hosting credentials</strong> — 7
            days after service delivery, then permanently deleted.
          </li>
          <li>
            <strong className="font-medium text-ink">Enquiries</strong> — 3 years, then
            deleted.
          </li>
          <li>
            <strong className="font-medium text-ink">Your account</strong> — until you
            ask us to close it.
          </li>
        </ul>
      </Clause>

      <Clause title="Who else sees it">
        <p>
          Razorpay and Stripe (payment processing), our email provider
          (transactional email), our hosting and storage providers, and Google
          Analytics for aggregate traffic figures. We do not sell personal data,
          and we do not share it for advertising.
        </p>
      </Clause>

      <Clause title="Your rights">
        <p>
          Ask us and we will tell you what we hold, correct anything wrong, or
          delete what we are not legally required to keep. Tax records are the
          exception, and we will say so plainly rather than quietly ignoring
          that part of a request.
        </p>
        <p>
          Write to us through the{" "}
          <Link href="/contact" className="text-accent-deep hover:underline">
            contact form
          </Link>
          . We respond within 30 days.
        </p>
      </Clause>

      <Clause title="Cookies">
        <p>
          A session cookie to keep you signed in, and Google Analytics for
          traffic measurement. No advertising or cross-site tracking cookies.
          Your cart is stored in your own browser and never sent to us until you
          check out.
        </p>
      </Clause>
    </LegalPage>
  );
}
