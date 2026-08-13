import Link from "next/link";
import { connectDB } from "@/lib/db";
import Order from "@/models/Order";
import { formatPrice } from "@/lib/price";

export const dynamic = "force-dynamic";

/**
 * Order list.
 *
 * Sorted newest first — unlike the service queue, which sorts oldest first.
 * The difference is deliberate: orders are a record you scan, service
 * requests are a queue you work. Sorting a queue newest-first buries the
 * one that has been waiting longest.
 *
 * The undelivered flag is the important column. An order that took money
 * but issued no licence is invisible everywhere else in the system, and the
 * customer finds out before you do.
 */

interface Row {
  _id: string;
  orderNumber: string;
  total: number;
  paymentStatus: string;
  orderStatus: string;
  deliveredAt?: string;
  createdAt: string;
  billing?: { name: string; email: string; state?: string; country?: string };
  items: { title: string }[];
  licenses: string[];
}

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  await connectDB();

  const filter: Record<string, unknown> = {};
  if (searchParams.status === "paid") filter.paymentStatus = "paid";
  if (searchParams.status === "pending") filter.paymentStatus = "pending";
  if (searchParams.status === "refunded") filter.paymentStatus = "refunded";
  if (searchParams.status === "undelivered") {
    filter.paymentStatus = "paid";
    filter.deliveredAt = { $exists: false };
  }

  const [docs, undeliveredCount] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).limit(100).lean(),
    Order.countDocuments({ paymentStatus: "paid", deliveredAt: { $exists: false } }),
  ]);

  const orders = JSON.parse(JSON.stringify(docs)) as Row[];

  const TABS = [
    { key: undefined, label: "All" },
    { key: "paid", label: "Paid" },
    { key: "pending", label: "Unpaid" },
    { key: "refunded", label: "Refunded" },
    { key: "undelivered", label: "Not delivered" },
  ];

  return (
    <div>
      <header className="mb-6">
        <p className="label">Commerce</p>
        <h1 className="mt-1 font-display text-4xl font-light tracking-tight text-ink">
          Orders
        </h1>
      </header>

      {undeliveredCount > 0 && (
        <div className="mb-5 rounded-xl bg-red-50 px-5 py-4 ring-1 ring-red-200">
          <p className="text-sm font-medium text-red-800">
            {undeliveredCount} paid{" "}
            {undeliveredCount === 1 ? "order has" : "orders have"} no licence
            issued
          </p>
          <p className="mt-1 text-sm text-red-700">
            Payment cleared but delivery didn&apos;t complete. These customers
            have paid and received nothing.
          </p>
          <Link
            href="/admin/orders?status=undelivered"
            className="mt-2 inline-block text-sm font-medium text-red-800 underline underline-offset-2"
          >
            Show them
          </Link>
        </div>
      )}

      <div className="mb-4 flex flex-wrap gap-2">
        {TABS.map((tab) => {
          const active = searchParams.status === tab.key;
          return (
            <Link
              key={tab.label}
              href={tab.key ? `/admin/orders?status=${tab.key}` : "/admin/orders"}
              className={active ? "chip" : "chip-neutral"}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-paper-alt text-left">
              <Th>Order</Th>
              <Th>Customer</Th>
              <Th>Status</Th>
              <Th align="right">Total</Th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => {
              const undelivered =
                order.paymentStatus === "paid" && !order.deliveredAt;

              return (
                <tr key={order._id} className="border-t border-rule-soft">
                  <td className="px-5 py-3">
                    <Link
                      href={`/admin/orders/${order._id}`}
                      className="font-medium text-ink hover:text-accent-deep"
                    >
                      {order.orderNumber}
                    </Link>
                    <p className="mt-0.5 text-xs text-ink-faint">
                      {new Date(order.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}{" "}
                      · {order.items.map((i) => i.title).join(", ")}
                    </p>
                    {undelivered && (
                      <p className="mt-1 text-xs font-medium text-red-700">
                        Paid but no licence issued
                      </p>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <p className="text-ink">{order.billing?.name}</p>
                    <p className="text-xs text-ink-faint">
                      {order.billing?.state || order.billing?.country}
                    </p>
                  </td>
                  <td className="px-5 py-3">
                    <PaymentPill status={order.paymentStatus} />
                  </td>
                  <td className="px-5 py-3 text-right tabular text-ink">
                    {formatPrice(order.total)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {orders.length === 0 && (
          <p className="px-5 py-12 text-center text-sm text-ink-faint">
            No orders match this filter.
          </p>
        )}
      </div>
    </div>
  );
}

function Th({
  children,
  align,
}: {
  children: React.ReactNode;
  align?: "right";
}) {
  return (
    <th
      className={`px-5 py-3 text-xs font-medium uppercase tracking-[0.06em] text-ink-faint ${
        align === "right" ? "text-right" : ""
      }`}
    >
      {children}
    </th>
  );
}

function PaymentPill({ status }: { status: string }) {
  if (status === "paid") {
    return (
      <span className="inline-flex rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800">
        Paid
      </span>
    );
  }
  if (status === "refunded") {
    return (
      <span className="inline-flex rounded-md bg-red-50 px-2.5 py-1 text-xs font-medium text-red-800">
        Refunded
      </span>
    );
  }
  return <span className="chip-neutral">Unpaid</span>;
}
