import Link from "next/link";
import { connectDB } from "@/lib/db";
import ServiceRequest from "@/models/ServiceRequest";
import type { AddonType, ServiceStatus } from "@/types/catalog";

export const dynamic = "force-dynamic";

/**
 * The work queue. Oldest first, deliberately — a queue sorted newest-first
 * buries the request that has been waiting three weeks under this morning's
 * arrivals, and that's the one that needs attention.
 *
 * Two states matter more than the status field and are called out
 * separately: "waiting on the customer" (paid, no intake details yet) and
 * "waiting on us" (details in, nobody has picked it up). Conflating them
 * into one "pending" bucket is how a request sits for a month with each
 * side assuming the other is holding it.
 */

const TYPE_LABELS: Record<AddonType, string> = {
  rebranding: "Rebranding",
  deployment: "Deployment",
  maintenance: "Maintenance",
};

const STATUS_LABELS: Record<ServiceStatus, string> = {
  pending: "Pending",
  in_progress: "In progress",
  delivered: "Delivered",
};

export default async function AdminServicesPage({
  searchParams,
}: {
  searchParams: { status?: string; type?: string };
}) {
  await connectDB();

  const filter: Record<string, unknown> = {};
  if (searchParams.status && searchParams.status !== "open") {
    filter.status = searchParams.status;
  } else if (searchParams.status === "open" || !searchParams.status) {
    filter.status = { $in: ["pending", "in_progress"] };
  }
  if (searchParams.type) filter.type = searchParams.type;

  const docs = await ServiceRequest.find(filter)
    .sort({ createdAt: 1 })
    .limit(100)
    .populate("user", "name email")
    .populate("product", "title")
    .populate("order", "orderNumber")
    .lean();

  const requests = JSON.parse(JSON.stringify(docs)) as {
    _id: string;
    type: AddonType;
    status: ServiceStatus;
    createdAt: string;
    payloadSubmittedAt?: string;
    payloadPurgedAt?: string;
    user?: { name: string; email: string };
    product?: { title: string };
    order?: { orderNumber: string };
  }[];

  const TABS = [
    { key: "open", label: "Open" },
    { key: "pending", label: "Pending" },
    { key: "in_progress", label: "In progress" },
    { key: "delivered", label: "Delivered" },
  ];

  return (
    <div>
      <header className="mb-6">
        <p className="label">Operations</p>
        <h1 className="mt-1 font-display text-4xl font-light tracking-tight text-ink">
          Service queue
        </h1>
      </header>

      <div className="mb-4 flex flex-wrap gap-2">
        {TABS.map((tab) => (
          <Link
            key={tab.key}
            href={`/admin/services?status=${tab.key}`}
            className={
              (searchParams.status ?? "open") === tab.key ? "chip" : "chip-neutral"
            }
          >
            {tab.label}
          </Link>
        ))}
      </div>

      <div className="space-y-3">
        {requests.map((request) => {
          const waitingOnCustomer =
            request.status === "pending" && !request.payloadSubmittedAt;
          const daysOld = Math.floor(
            (Date.now() - new Date(request.createdAt).getTime()) / 86_400_000
          );

          return (
            <Link
              key={request._id}
              href={`/admin/services/${request._id}`}
              className="card-interactive block px-5 py-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium text-ink">
                      {TYPE_LABELS[request.type]}
                    </span>
                    {request.product && (
                      <span className="text-sm text-ink-faint">
                        · {request.product.title}
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-sm text-ink-soft">
                    {request.user?.name}{" "}
                    <span className="text-ink-faint">
                      · {request.order?.orderNumber}
                    </span>
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {waitingOnCustomer ? (
                    <span className="inline-flex rounded-md bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800">
                      Waiting on customer
                    </span>
                  ) : request.status !== "delivered" ? (
                    <span className="inline-flex rounded-md bg-accent-wash px-2.5 py-1 text-xs font-medium text-accent-deep">
                      Ready to work
                    </span>
                  ) : null}

                  <span className="chip-neutral">
                    {STATUS_LABELS[request.status]}
                  </span>

                  <span
                    className={`text-xs tabular ${
                      daysOld > 14 && request.status !== "delivered"
                        ? "font-medium text-red-700"
                        : "text-ink-faint"
                    }`}
                  >
                    {daysOld === 0 ? "today" : `${daysOld}d`}
                  </span>
                </div>
              </div>
            </Link>
          );
        })}

        {requests.length === 0 && (
          <div className="card px-5 py-14 text-center">
            <p className="text-sm text-ink-faint">Nothing in this queue.</p>
          </div>
        )}
      </div>
    </div>
  );
}
