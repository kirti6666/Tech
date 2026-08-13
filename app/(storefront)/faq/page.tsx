import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Frequently asked questions | TechBro",
  description:
    "What you receive, what the licence allows, how delivery works, refunds, GST invoicing and support for ready-made software bought from TechBro.",
  alternates: { canonical: "/faq" },
};

/**
 * FAQ, with FAQPage structured data.
 *
 * The questions are the ones that actually block a purchase — licence
 * scope, what happens after you download, whether an agency can use one
 * licence twice — rather than the reassuring softballs a marketing page
 * would pick. A FAQ that avoids the awkward questions just moves them into
 * your support inbox.
 *
 * Answers stay in sync with the linked policy pages. If you edit one, edit
 * the other; contradicting yourself here is worse than not having the page.
 */

const FAQS: { q: string; a: React.ReactNode; plain: string }[] = [
  {
    q: "What exactly do I receive?",
    a: (
      <>
        The complete source code, the database schema with sample data, an
        installation guide and technical documentation. Everything listed under
        &ldquo;What you receive&rdquo; on the product page, delivered as a
        download from your account plus a licence key by email.
      </>
    ),
    plain:
      "The complete source code, database schema with sample data, installation guide and technical documentation, delivered as a download plus a licence key by email.",
  },
  {
    q: "Can I try it before buying?",
    a: (
      <>
        Yes. Every product page has a live demo, and most include admin
        credentials so you can see the back end rather than just the customer
        view. We would rather you spent an hour in the demo than bought
        something that turns out to be wrong for you.
      </>
    ),
    plain:
      "Yes. Every product page has a live demo, and most include admin credentials so you can see the back end as well as the customer view.",
  },
  {
    q: "Do I have to pay anything monthly?",
    a: (
      <>
        No. It is a one-time purchase and the licence is perpetual. You will pay
        for your own hosting and any third-party services the product needs —
        those are listed in the requirements on each product page.
      </>
    ),
    plain:
      "No. It is a one-time purchase with a perpetual licence. You pay only for your own hosting and any third-party services the product requires.",
  },
  {
    q: "I run an agency. Can I use one licence for several clients?",
    a: (
      <>
        No — one licence covers one end product. You can absolutely build for a
        client and hand the finished application over, but a second client
        project needs a second licence. If you expect to build the same product
        repeatedly, talk to us about a multi-project licence; it costs less than
        buying separately.{" "}
        <Link href="/licence" className="text-accent-deep hover:underline">
          Full licence terms
        </Link>
        .
      </>
    ),
    plain:
      "No. One licence covers one end product. You can build for a client and hand over the finished application, but a second client project needs a second licence. Multi-project licences are available.",
  },
  {
    q: "Can I modify the code and remove your branding?",
    a: (
      <>
        Yes, freely. Change anything you like and ship it under your own brand.
        What you cannot do is resell or republish the source code itself.
      </>
    ),
    plain:
      "Yes. You can modify anything and ship it under your own brand. You cannot resell or republish the source code itself.",
  },
  {
    q: "Can I get a refund?",
    a: (
      <>
        Before you download the source, yes — full refund within 7 days, no
        reason needed. After you download, the purchase is generally final,
        because you now hold a permanent copy. We still refund if the product
        does not match its description or the archive is broken and we
        can&apos;t fix it.{" "}
        <Link href="/refund-policy" className="text-accent-deep hover:underline">
          Full refund policy
        </Link>
        .
      </>
    ),
    plain:
      "Before downloading, a full refund within 7 days for any reason. After downloading, the purchase is generally final, though we refund if the product does not match its description or the archive is broken.",
  },
  {
    q: "Will I get a GST invoice?",
    a: (
      <>
        Yes, automatically with every order. Add your GSTIN at checkout to claim
        input tax credit. Buyers outside India are billed without GST as an
        export of services.
      </>
    ),
    plain:
      "Yes, automatically with every order. Add your GSTIN at checkout to claim input tax credit. Buyers outside India are billed without GST as an export of services.",
  },
  {
    q: "What support is included?",
    a: (
      <>
        30 days of installation support — getting the product running as
        documented. That does not cover custom development or changes you have
        made yourself. If you want ongoing help, add a maintenance plan at
        checkout.
      </>
    ),
    plain:
      "30 days of installation support to get the product running as documented. It does not cover custom development or your own modifications. Maintenance plans are available at checkout.",
  },
  {
    q: "Can you install it for me?",
    a: (
      <>
        Yes — add deployment at checkout and we install it on your server, point
        your domain at it and fit the SSL certificate. We ask for temporary
        hosting credentials, store them encrypted, and delete them a week after
        handover.
      </>
    ),
    plain:
      "Yes. Add deployment at checkout and we install it on your server, configure your domain and fit the SSL certificate.",
  },
  {
    q: "What if I need something that isn't in the catalogue?",
    a: (
      <>
        We build to order, and you own that code on the same terms.{" "}
        <Link
          href="/contact?type=custom"
          className="text-accent-deep hover:underline"
        >
          Tell us what you need
        </Link>
        .
      </>
    ),
    plain:
      "We build to order, and you own that code on the same terms. Get in touch through the contact form.",
  },
];

export default function FaqPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.plain },
    })),
  };

  return (
    <main className="mx-auto max-w-2xl px-5 py-16 sm:px-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <header className="mb-12">
        <p className="label">Help</p>
        <h1 className="mt-2 font-display text-4xl font-light tracking-tight text-ink sm:text-5xl">
          Questions people actually ask
        </h1>
      </header>

      <dl className="space-y-8">
        {FAQS.map((item) => (
          <div key={item.q} className="border-b border-rule-soft pb-8 last:border-0">
            <dt className="font-display text-2xl font-normal text-ink">
              {item.q}
            </dt>
            <dd className="mt-3 text-[15px] leading-relaxed text-ink-soft">
              {item.a}
            </dd>
          </div>
        ))}
      </dl>

      <div className="mt-12 rounded-2xl bg-lavender-soft px-7 py-8 text-center">
        <p className="font-display text-2xl font-normal text-ink">
          Still not sure?
        </p>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink-soft">
          Ask before you buy — we would rather answer a question than process a
          refund.
        </p>
        <Link href="/contact" className="btn-primary mt-5">
          Ask us
        </Link>
      </div>
    </main>
  );
}
