import Link from "next/link";
import { connectDB } from "@/lib/db";
import Order from "@/models/Order";
import Product from "@/models/Product";
import License from "@/models/License";
import ServiceRequest from "@/models/ServiceRequest";
import Enquiry from "@/models/Enquiry";
import { formatPrice } from "@/lib/price";

export const dynamic = "force-dynamic";

/**
 * Dashboard.
 *
 * Ordered by what needs a human, not by what looks impressive. Revenue is
 * pleasant to look at and requires nothing; a paid order with no licence
 * behind it is a customer who has been charged and received nothing, and it
 * belongs at the very top of the screen in a colour that means something.
 *
 * Every figure here is a live query. At this catalogue size that's cheaper
 * and far more honest than a cached rollup that can quietly go stale.
 */
export default async function AdminDashboard() {
  await connectDB();

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    revenueAgg,
    monthRevenueAgg,
    orderCount,
    productCount,
    licenseCount,
    undelivered,
    pendingServices,
    awaitingDetails,
    newEnquiries,
    recentOrders,
    unpublishable,
  ] = await Promise.all([
    Order.aggregate([
      { $match: { paymentStatus: "paid" } },
      { $group: { _id: null, total: { $sum: "$total" } } },
    ]),
    Order.aggregate([
      { $match: { paymentStatus: "paid", paidAt: { $gte: monthStart } } },
      { $group: { _id: null, total: { $sum: "$total" } } },
    ]),
    Order.countDocuments({ paymentStatus: "paid" }),
    Product.countDocuments({ status: "published" }),
    License.countDocuments({ status: "active" }),
    // The alert that matters: paid, but delivery never completed.
    Order.find({ paymentStatus: "paid", deliveredAt: { $exists: false } })
      .select("orderNumber total createdAt billing.email")
      .sort({ createdAt: -1 })
      .limit(5)
      .lean(),
    ServiceRequest.countDocuments({ status: { $in: ["pending", "in_progress"] } }),
    ServiceRequest.countDocuments({
      status: "pending",
      payloadSubmittedAt: { $exists: false },
    }),
    Enquiry.countDocuments({ status: "new" }),
    Order.find({ paymentStatus: "paid" })
      .select("orderNumber total paidAt billing.name items")
      .sort({ paidAt: -1 })
      .limit(8)
      .lean(),
    // Published products with no source file are the next delivery failure
    // waiting to happen — someone can buy one right now.
    Product.countDocuments({
      status: "published",
      $or: [{ sourceFileKey: { $exists: false } }, { sourceFileKey: "" }],
    }),
  ]);

  const revenue = revenueAgg[0]?.total ?? 0;
  const monthRevenue = monthRevenueAgg[0]?.total ?? 0;

  return (
    <div>
      <header className="mb-8">
        <p className="label">Overview</p>
        <h1 className="mt-1 font-display text-4xl font-light tracking-tight text-ink">
          Dashboard
        </h1>
      </header>

      {(undelivered.length > 0 || unpublishable > 0) && (
        <div className="mb-8 space-y-3">
          {undelivered.length > 0 && (
            <Alert
              tone="danger"
              title={`${undelivered.length} paid order${undelivered.length === 1 ? "" : "s"} with no licence issued`}
              body="These customers have been charged and have received nothing. Check the payment webhook logs, then reissue."
            >
              <ul className="mt-3 space-y-1">
                {(undelivered as unknown as { orderNumber: string; billing?: { email?: string } }[]).map(
                  (order) => (
                    <li key={order.orderNumber} className="text-sm">
                      <Link
                        href={`/admin/orders?q=${order.orderNumber}`}
                        className="font-medium text-accent-deep hover:underline"
                      >
                        {order.orderNumber}
                      </Link>
                      <span className="ml-2 text-ink-faint">
                        {order.billing?.email}
                      </span>
                    </li>
                  )
                )}
              </ul>
            </Alert>
          )}

          {unpublishable > 0 && (
            <Alert
              tone="warn"
              title={`${unpublishable} published product${unpublishable === 1 ? " has" : "s have"} no source file`}
              body="Anyone can buy these right now and the download will fail. Upload the archive or move them back to draft."
            />
          )}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Revenue this month" value={formatPrice(monthRevenue)} />
        <Metric label="Revenue all time" value={formatPrice(revenue)} muted />
        <Metric label="Paid orders" value={String(orderCount)} muted />
        <Metric label="Active licences" value={String(licenseCount)} muted />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <QueueCard
          href="/admin/services"
          label="Service requests open"
          value={pendingServices}
          note={
            awaitingDetails > 0
              ? `${awaitingDetails} waiting on the customer`
              : "All have details submitted"
          }
        />
        <QueueCard
          href="/admin/enquiries"
          label="New enquiries"
          value={newEnquiries}
          note="Unread leads"
        />
        <QueueCard
          href="/admin/products"
          label="Published products"
          value={productCount}
          note="Live in the catalogue"
        />
      </div>

      <section className="card mt-8">
        <div className="panel-head flex items-center justify-between">
          <h2 className="text-sm font-semibold text-ink">Recent orders</h2>
          <Link
            href="/admin/orders"
            className="text-xs font-medium text-accent-deep hover:underline"
          >
            View all
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-ink-faint">
            No paid orders yet.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-rule-soft text-left">
                <th className="px-5 py-2.5 text-xs font-medium uppercase tracking-[0.06em] text-ink-faint">
                  Order
                </th>
                <th className="px-5 py-2.5 text-xs font-medium uppercase tracking-[0.06em] text-ink-faint">
                  Customer
                </th>
                <th className="px-5 py-2.5 text-right text-xs font-medium uppercase tracking-[0.06em] text-ink-faint">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {(recentOrders as unknown as {
                _id: string;
                orderNumber: string;
                total: number;
                billing?: { name?: string };
              }[]).map((order) => (
                <tr
                  key={String(order._id)}
                  className="border-b border-rule-soft last:border-0"
                >
                  <td className="px-5 py-3 font-medium text-ink">
                    {order.orderNumber}
                  </td>
                  <td className="px-5 py-3 text-ink-soft">
                    {order.billing?.name ?? "—"}
                  </td>
                  <td className="px-5 py-3 text-right tabular text-ink">
                    {formatPrice(order.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

function Metric({
  label,
  value,
  muted,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div
      className={
        muted
          ? "card p-5"
          : "rounded-xl bg-lavender-soft p-5 ring-1 ring-rule-lavender"
      }
    >
      <p className="label-muted">{label}</p>
      <p className="mt-1.5 font-display text-3xl font-light tabular text-ink">
        {value}
      </p>
    </div>
  );
}

function QueueCard({
  href,
  label,
  value,
  note,
}: {
  href: string;
  label: string;
  value: number;
  note: string;
}) {
  return (
    <Link href={href} className="card-interactive block p-5">
      <p className="label-muted">{label}</p>
      <p className="mt-1.5 font-display text-3xl font-light tabular text-ink">
        {value}
      </p>
      <p className="mt-1 text-xs text-ink-faint">{note}</p>
    </Link>
  );
}

function Alert({
  tone,
  title,
  body,
  children,
}: {
  tone: "danger" | "warn";
  title: string;
  body: string;
  children?: React.ReactNode;
}) {
  const styles =
    tone === "danger"
      ? "bg-red-50 ring-red-200"
      : "bg-amber-50 ring-amber-200";

  return (
    <div className={`rounded-xl p-5 ring-1 ${styles}`}>
      <p className="text-sm font-semibold text-ink">{title}</p>
      <p className="mt-1 text-sm leading-relaxed text-ink-soft">{body}</p>
      {children}
    </div>
  );
}
