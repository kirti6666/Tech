import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/db";
import License from "@/models/License";
import ServiceRequest from "@/models/ServiceRequest";
import { getServerUser } from "@/lib/middleware/getServerUser";
import { DownloadButton } from "@/components/storefront/account/DownloadButton";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Your purchases | TechBro",
  robots: { index: false, follow: false },
};

/**
 * The page the delivery email points at.
 *
 * Licence-first, not order-first. An order is an accounting object; what the
 * customer came here for is "the thing I bought and how do I get it", and
 * that is the licence. Orders and invoices live on their own page.
 */

interface LicenseRow {
  _id: string;
  key: string;
  status: "active" | "revoked";
  downloadCount: number;
  downloadLimit: number;
  createdAt: string;
  product: { _id: string; title: string; slug: string; documentationUrl?: string } | null;
  order: { _id: string; orderNumber: string } | null;
}

interface ServiceRow {
  _id: string;
  type: string;
  status: string;
  payloadSubmittedAt?: string;
  order: { orderNumber: string } | null;
}

const SERVICE_LABELS: Record<string, string> = {
  rebranding: "Rebranding",
  deployment: "Deployment & setup",
  maintenance: "Maintenance",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  in_progress: "In progress",
  delivered: "Delivered",
};

export default async function PurchasesPage() {
  const user = await getServerUser();
  if (!user) redirect("/login?next=/account/purchases");

  await connectDB();

  const [licenseDocs, serviceDocs] = await Promise.all([
    License.find({ user: user.id })
      .sort({ createdAt: -1 })
      .populate("product", "title slug documentationUrl")
      .populate("order", "orderNumber")
      .lean(),
    ServiceRequest.find({ user: user.id })
      .sort({ createdAt: -1 })
      .populate("order", "orderNumber")
      .lean(),
  ]);

  const licenses = JSON.parse(JSON.stringify(licenseDocs)) as LicenseRow[];
  const services = JSON.parse(JSON.stringify(serviceDocs)) as ServiceRow[];

  return (
    <main className="mx-auto max-w-4xl px-5 py-10 sm:px-6">
      <header className="mb-8">
        <p className="label-muted">Your account</p>
        <h1 className="mt-1.5 font-display text-3xl font-bold tracking-tight text-ink">
          Purchases
        </h1>
      </header>

      {licenses.length === 0 ? (
        <div className="rounded-xl border border-dashed border-rule-lavender bg-paper-alt px-6 py-16 text-center">
          <p className="font-display text-lg font-semibold text-ink">
            Nothing here yet
          </p>
          <p className="mt-2 text-sm text-ink-soft">
            Anything you buy shows up here with its licence key and download.
          </p>
          <Link
            href="/shop"
            className="mt-5 inline-block btn-primary"
          >
            Browse the catalogue
          </Link>
        </div>
      ) : (
        <ul className="space-y-4">
          {licenses.map((license) => (
            <li key={license._id} className="border border-rule">
              <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-rule bg-paper-alt px-4 py-2">
                <span className="label-muted">
                  {license.order?.orderNumber ?? "Order"}
                </span>
                {license.status === "revoked" && (
                  <span className="text-label font-medium uppercase tracking-[0.06em] text-ink-faint">
                    Revoked
                  </span>
                )}
              </div>

              <div className="grid gap-5 p-4 sm:grid-cols-[1fr_auto]">
                <div className="min-w-0">
                  <h2 className="font-display text-lg font-semibold text-ink">
                    {license.product ? (
                      <Link
                        href={`/product/${license.product.slug}`}
                        className="hover:text-accent-deep"
                      >
                        {license.product.title}
                      </Link>
                    ) : (
                      "Product unavailable"
                    )}
                  </h2>

                  <dl className="mt-3 space-y-1.5">
                    <div className="flex flex-wrap items-baseline gap-x-3">
                      <dt className="label-muted">Licence key</dt>
                      <dd className="font-mono text-sm tracking-wide text-ink">
                        {license.key}
                      </dd>
                    </div>
                    <div className="flex flex-wrap items-baseline gap-x-3">
                      <dt className="label-muted">Downloads used</dt>
                      <dd className="tabular text-sm text-ink-soft tabular">
                        {license.downloadCount} of {license.downloadLimit}
                      </dd>
                    </div>
                  </dl>

                  {license.product?.documentationUrl && (
                    <a
                      href={license.product.documentationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-block text-sm text-accent-deep underline underline-offset-2"
                    >
                      Read the documentation
                    </a>
                  )}
                </div>

                <div className="sm:text-right">
                  <DownloadButton
                    licenseKey={license.key}
                    remaining={Math.max(
                      0,
                      license.downloadLimit - license.downloadCount
                    )}
                    revoked={license.status === "revoked"}
                  />
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {services.length > 0 && (
        <section className="mt-12">
          <h2 className="label-muted border-b border-rule pb-2">Services</h2>
          <ul className="mt-4 space-y-2">
            {services.map((service) => (
              <li
                key={service._id}
                className="flex flex-wrap items-center justify-between gap-3 border border-rule px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-ink">
                    {SERVICE_LABELS[service.type] ?? service.type}
                  </p>
                  <p className="text-xs text-ink-faint">
                    {service.order?.orderNumber}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="chip">
                    {STATUS_LABELS[service.status] ?? service.status}
                  </span>
                  {/* The form is the blocker on pending work — say so, and
                      link straight to it rather than making them hunt. */}
                  {service.status === "pending" && !service.payloadSubmittedAt && (
                    <Link
                      href={`/account/services/${service._id}`}
                      className="text-label font-medium uppercase tracking-[0.06em] text-accent-deep hover:underline"
                    >
                      Send us the details
                    </Link>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
