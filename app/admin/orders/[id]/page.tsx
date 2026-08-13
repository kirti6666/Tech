import Link from "next/link";
import { notFound } from "next/navigation";
import { connectDB } from "@/lib/db";
import Order from "@/models/Order";
import License from "@/models/License";
import ServiceRequest from "@/models/ServiceRequest";
import DownloadLog from "@/models/DownloadLog";
import { formatPrice } from "@/lib/price";
import { OrderActions } from "@/components/admin/OrderActions";

export const dynamic = "force-dynamic";

/**
 * Everything about one order on one screen: what was bought, what was
 * charged, which licences it granted, how often they've been downloaded,
 * and what service work it created.
 *
 * The download log is here rather than on a separate page because it's the
 * evidence you reach for in exactly one situation — a refund request that
 * arrives after the archive has been pulled four times — and you want it in
 * front of you while deciding.
 */

export default async function AdminOrderDetailPage({
  params,
}: {
  params: { id: string };
}) {
  await connectDB();

  const doc = await Order.findById(params.id).populate("user", "name email").lean();
  if (!doc) notFound();

  const [licenseDocs, serviceDocs] = await Promise.all([
    License.find({ order: params.id }).populate("product", "title slug").lean(),
    ServiceRequest.find({ order: params.id }).lean(),
  ]);

  const downloadDocs = await DownloadLog.find({
    license: { $in: (licenseDocs as { _id: unknown }[]).map((l) => l._id) },
  })
    .sort({ createdAt: -1 })
    .limit(25)
    .lean();

  const order = JSON.parse(JSON.stringify(doc)) as {
    _id: string;
    orderNumber: string;
    createdAt: string;
    paidAt?: string;
    deliveredAt?: string;
    refundedAt?: string;
    refundReason?: string;
    paymentStatus: string;
    gateway?: string;
    razorpayPaymentId?: string;
    subtotal: number;
    discount: number;
    couponCode?: string;
    taxTotal: number;
    total: number;
    billing: Record<string, string>;
    items: { title: string; price: number }[];
    addons: { label: string; price: number }[];
  };

  const licenses = JSON.parse(JSON.stringify(licenseDocs)) as {
    _id: string;
    key: string;
    status: string;
    downloadCount: number;
    downloadLimit: number;
    revokedReason?: string;
    product?: { title: string };
  }[];

  const services = JSON.parse(JSON.stringify(serviceDocs)) as {
    _id: string;
    type: string;
    status: string;
  }[];

  const downloads = JSON.parse(JSON.stringify(downloadDocs)) as {
    _id: string;
    outcome: string;
    ip?: string;
    createdAt: string;
  }[];

  const undelivered = order.paymentStatus === "paid" && !order.deliveredAt;

  return (
    <div>
      <Link
        href="/admin/orders"
        className="text-sm font-medium text-accent-deep hover:underline"
      >
        ← Orders
      </Link>

      <header className="mb-6 mt-3 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label">Order</p>
          <h1 className="mt-1 font-display text-4xl font-light tracking-tight text-ink">
            {order.orderNumber}
          </h1>
          <p className="mt-1 text-sm text-ink-faint">
            Placed{" "}
            {new Date(order.createdAt).toLocaleString("en-IN", {
              dateStyle: "medium",
              timeStyle: "short",
            })}
            {order.gateway ? ` · ${order.gateway}` : ""}
          </p>
        </div>

        <OrderActions
          orderId={order._id}
          refunded={order.paymentStatus === "refunded"}
          paid={order.paymentStatus === "paid"}
        />
      </header>

      {undelivered && (
        <div className="mb-5 rounded-xl bg-red-50 px-5 py-4 ring-1 ring-red-200">
          <p className="text-sm font-medium text-red-800">
            Paid, but no licence was issued
          </p>
          <p className="mt-1 text-sm text-red-700">
            Delivery didn&apos;t complete. Check the webhook logs — the payment
            confirmation is what mints licences, so this order needs
            investigating before the customer chases it.
          </p>
        </div>
      )}

      {order.refundedAt && (
        <div className="mb-5 rounded-xl bg-paper-alt px-5 py-4">
          <p className="text-sm font-medium text-ink">
            Refunded{" "}
            {new Date(order.refundedAt).toLocaleDateString("en-IN", {
              dateStyle: "medium",
            } as Intl.DateTimeFormatOptions)}
          </p>
          {order.refundReason && (
            <p className="mt-1 text-sm text-ink-soft">{order.refundReason}</p>
          )}
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-5">
          <section className="card overflow-hidden">
            <div className="panel-head">
              <h2 className="text-sm font-medium text-ink">Items</h2>
            </div>
            <div className="divide-y divide-rule-soft">
              {order.items.map((item) => (
                <Row key={item.title} label={item.title} value={formatPrice(item.price)} />
              ))}
              {order.addons.map((addon) => (
                <Row
                  key={addon.label}
                  label={addon.label}
                  value={formatPrice(addon.price)}
                  muted
                />
              ))}
            </div>
            <div className="space-y-1 border-t border-rule-soft px-5 py-4 text-sm">
              <Line label="Subtotal" value={formatPrice(order.subtotal)} />
              {order.discount > 0 && (
                <Line
                  label={`Discount${order.couponCode ? ` (${order.couponCode})` : ""}`}
                  value={`− ${formatPrice(order.discount)}`}
                />
              )}
              <Line label="GST" value={formatPrice(order.taxTotal)} />
              <div className="flex justify-between border-t border-rule-soft pt-2 text-base">
                <span className="font-medium text-ink">Total</span>
                <span className="font-medium tabular text-ink">
                  {formatPrice(order.total)}
                </span>
              </div>
            </div>
          </section>

          <section className="card overflow-hidden">
            <div className="panel-head">
              <h2 className="text-sm font-medium text-ink">
                Licences ({licenses.length})
              </h2>
            </div>
            {licenses.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-ink-faint">
                No licences issued for this order.
              </p>
            ) : (
              <ul className="divide-y divide-rule-soft">
                {licenses.map((license) => (
                  <li
                    key={license._id}
                    className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-ink">
                        {license.product?.title ?? "Product removed"}
                      </p>
                      <p className="mt-0.5 font-mono text-sm tracking-wide text-accent-deep">
                        {license.key}
                      </p>
                      {license.revokedReason && (
                        <p className="mt-1 text-xs text-ink-faint">
                          Revoked: {license.revokedReason}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs tabular text-ink-faint">
                        {license.downloadCount}/{license.downloadLimit} downloads
                      </span>
                      <span
                        className={
                          license.status === "active" ? "chip" : "chip-neutral"
                        }
                      >
                        {license.status === "active" ? "Active" : "Revoked"}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {downloads.length > 0 && (
            <section className="card overflow-hidden">
              <div className="panel-head">
                <h2 className="text-sm font-medium text-ink">Download history</h2>
              </div>
              <ul className="divide-y divide-rule-soft text-sm">
                {downloads.map((entry) => (
                  <li
                    key={entry._id}
                    className="flex items-center justify-between px-5 py-2.5"
                  >
                    <span
                      className={
                        entry.outcome === "issued" ? "text-ink-soft" : "text-red-700"
                      }
                    >
                      {entry.outcome === "issued" ? "Downloaded" : entry.outcome.replace("denied_", "Denied — ")}
                    </span>
                    <span className="text-xs tabular text-ink-faint">
                      {new Date(entry.createdAt).toLocaleString("en-IN", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                      {entry.ip ? ` · ${entry.ip}` : ""}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <aside className="space-y-5">
          <section className="card overflow-hidden">
            <div className="panel-head">
              <h2 className="text-sm font-medium text-ink">Billing</h2>
            </div>
            <dl className="space-y-2 px-5 py-4 text-sm">
              <Field label="Name" value={order.billing.name} />
              <Field label="Email" value={order.billing.email} />
              <Field label="Phone" value={order.billing.phone} />
              <Field
                label="Address"
                value={[
                  order.billing.addressLine1,
                  order.billing.addressLine2,
                  order.billing.city,
                  order.billing.state,
                  order.billing.pincode,
                  order.billing.country,
                ]
                  .filter(Boolean)
                  .join(", ")}
              />
              {order.billing.gstin && (
                <Field label="GSTIN" value={order.billing.gstin} />
              )}
            </dl>
          </section>

          {services.length > 0 && (
            <section className="card overflow-hidden">
              <div className="panel-head">
                <h2 className="text-sm font-medium text-ink">Services</h2>
              </div>
              <ul className="divide-y divide-rule-soft">
                {services.map((service) => (
                  <li key={service._id} className="px-5 py-3">
                    <Link
                      href={`/admin/services/${service._id}`}
                      className="text-sm font-medium text-ink hover:text-accent-deep"
                    >
                      {service.type}
                    </Link>
                    <p className="mt-0.5 text-xs text-ink-faint">
                      {service.status.replace("_", " ")}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  muted,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className="flex items-center justify-between px-5 py-3 text-sm">
      <span className={muted ? "text-ink-soft" : "text-ink"}>{label}</span>
      <span className="tabular text-ink">{value}</span>
    </div>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-ink-soft">
      <span>{label}</span>
      <span className="tabular">{value}</span>
    </div>
  );
}

function Field({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div>
      <dt className="text-xs uppercase tracking-[0.06em] text-ink-faint">
        {label}
      </dt>
      <dd className="text-ink">{value}</dd>
    </div>
  );
}
