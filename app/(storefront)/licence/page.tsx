import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, Clause } from "@/components/storefront/LegalPage";

export const metadata: Metadata = {
  title: "Licence agreement | TechBro",
  description:
    "What you may and may not do with source code purchased from TechBro — deployment rights, modification, resale restrictions and ownership.",
  alternates: { canonical: "/licence" },
};

/**
 * DRAFT — have a lawyer review before launch. This is the most
 * consequential document on the site.
 *
 * The central decision it encodes: one licence permits one end product.
 * A buyer may modify and deploy freely, and may build for a client, but may
 * not resell the source itself or use one purchase across an unlimited
 * number of client projects.
 *
 * That boundary is the entire business model. Get it wrong in the permissive
 * direction and one agency purchase substitutes for fifty; get it wrong in
 * the restrictive direction and agencies — your best customers — can't buy
 * at all. It is written here in plain terms rather than legalese precisely
 * because a buyer who doesn't understand it will breach it by accident.
 */
export default function LicencePage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Licence agreement"
      updated="12 August 2026"
      intro="This sets out what you can do with source code bought from TechBro. It applies from the moment payment clears, and a separate licence is granted for each product you buy."
    >
      <Clause title="What you get">
        <p>
          A perpetual, worldwide, non-exclusive licence to use, modify and
          deploy the product for{" "}
          <strong className="font-medium text-ink">one end product</strong> — a
          single application, running under one brand, for one business.
        </p>
        <p>
          &ldquo;Perpetual&rdquo; means what it says. There is no renewal, no
          expiry and no recurring fee. If we go out of business tomorrow, the
          copy you hold keeps working.
        </p>
      </Clause>

      <Clause title="What you may do">
        <ul className="ml-5 list-disc space-y-1.5">
          <li>Modify the source code however you like, including removing our branding.</li>
          <li>Deploy it on any hosting you choose, including staging and test environments.</li>
          <li>
            Have employees or contractors work on it, provided they use it only
            for your end product.
          </li>
          <li>
            Build it for a client and hand the finished application over — the
            end product belongs to them.
          </li>
          <li>Charge your own users to access the application you build with it.</li>
          <li>Keep using it after any support period ends.</li>
        </ul>
      </Clause>

      <Clause title="What you may not do">
        <ul className="ml-5 list-disc space-y-1.5">
          <li>
            Resell, redistribute, sublicense or publish the source code, in
            whole or in substantial part — including on a public repository,
            marketplace, or template site.
          </li>
          <li>
            Use one licence across multiple unrelated end products. If you build
            the same product for a second client, that needs a second licence.
          </li>
          <li>
            Share your licence key or download access with anyone outside your
            organisation.
          </li>
          <li>
            Sell the product as a competing template, starter kit or boilerplate.
          </li>
          <li>
            Remove copyright notices identifying third-party components included
            in the product.
          </li>
        </ul>
        <p>
          The short version: you are buying the right to build{" "}
          <em>a thing</em> with this code, not the right to sell the code.
        </p>
      </Clause>

      <Clause title="Building for clients">
        <p>
          Agencies and freelancers are welcome. One licence covers one client
          project. When you hand the finished application to a client, they
          receive the end product and may use, modify and host it — but they do
          not inherit the right to reuse the source for further projects.
        </p>
        <p>
          If you expect to build the same product repeatedly, contact us about a
          multi-project licence rather than buying once and hoping. It is
          cheaper than the alternative and considerably less awkward.
        </p>
      </Clause>

      <Clause title="Third-party components">
        <p>
          Products include open-source libraries under their own licences —
          MIT, Apache 2.0 and similar. Those licences continue to apply to
          those components and are listed in the documentation supplied with
          each product. Nothing here overrides them.
        </p>
        <p>
          Where a product requires a paid third-party service or API key, that
          is stated in the requirements on the product page and is your
          responsibility to obtain.
        </p>
      </Clause>

      <Clause title="Ownership">
        <p>
          We retain copyright in the original source code. You own the
          modifications you make and the end product you build. This is a
          licence, not a transfer of ownership — the distinction matters if you
          later want exclusive rights, which we can discuss separately.
        </p>
      </Clause>

      <Clause title="Support and warranties">
        <p>
          Products are supplied as-is. Installation support is included for 30
          days from purchase and covers getting the product running as
          documented — not custom development, not modifications you have made,
          and not third-party services.
        </p>
        <p>
          We do not warrant that a product is fit for a particular regulatory
          purpose. If you are deploying into a regulated context — handling
          patient data, processing payments, storing financial records — you
          are responsible for the compliance assessment.
        </p>
      </Clause>

      <Clause title="Termination">
        <p>
          This licence ends if you breach it, or if your order is refunded
          under our{" "}
          <Link href="/refund-policy" className="text-accent-deep hover:underline">
            refund policy
          </Link>
          . On termination you must delete all copies of the source code,
          including any deployed instances and any copies held by contractors.
        </p>
      </Clause>

      <Clause title="Governing law">
        <p>
          This agreement is governed by the laws of India, and the courts of
          Pune, Maharashtra have exclusive jurisdiction. TechBro is operated by
          Geoloide Private Limited.
        </p>
      </Clause>
    </LegalPage>
  );
}
