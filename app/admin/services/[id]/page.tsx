import Link from "next/link";
import { notFound } from "next/navigation";
import { connectDB } from "@/lib/db";
import ServiceRequest from "@/models/ServiceRequest";
import { SERVICE_FORMS, maskPayload, hasSecrets } from "@/lib/services/schemas";
import { ServiceWorkspace } from "@/components/admin/ServiceWorkspace";
import type { AddonType, ServiceStatus } from "@/types/catalog";

export const dynamic = "force-dynamic";

const TYPE_LABELS: Record<AddonType, string> = {
  rebranding: "Rebranding",
  deployment: "Deployment & setup",
  maintenance: "Maintenance",
};

/**
 * Server-renders the request with credentials masked. The plaintext version
 * is only ever fetched by an explicit action in the client component — this
 * page never puts a decrypted password into HTML, so it can't leak through
 * a cached response or a screenshot of the page source.
 */
export default async function AdminServiceDetailPage({
  params,
}: {
  params: { id: string };
}) {
  await connectDB();

  const doc = await ServiceRequest.findById(params.id)
    .populate("user", "name email")
    .populate("product", "title slug")
    .populate("order", "orderNumber total")
    .lean();

  if (!doc) notFound();

  const request = JSON.parse(JSON.stringify(doc)) as {
    _id: string;
    type: AddonType;
    status: ServiceStatus;
    payload: Record<string, unknown>;
    payloadSubmittedAt?: string;
    payloadPurgedAt?: string;
    adminNotes?: string;
    createdAt: string;
    history: { status: string; at: string; note?: string }[];
    user?: { name: string; email: string };
    product?: { title: string };
    order?: { _id: string; orderNumber: string };
  };

  const definition = SERVICE_FORMS[request.type];
  const rawPayload = (doc as unknown as { payload: Record<string, unknown> }).payload ?? {};

  return (
    <div>
      <Link
        href="/admin/services"
        className="text-sm font-medium text-accent-deep hover:underline"
      >
        ← Service queue
      </Link>

      <header className="mb-6 mt-3">
        <p className="label">{request.order?.orderNumber}</p>
        <h1 className="mt-1 font-display text-4xl font-light tracking-tight text-ink">
          {TYPE_LABELS[request.type]}
        </h1>
        <p className="mt-1 text-sm text-ink-faint">
          {request.user?.name} · {request.user?.email}
          {request.product ? ` · ${request.product.title}` : ""}
        </p>
      </header>

      {!request.payloadSubmittedAt && (
        <div className="mb-5 rounded-xl bg-amber-50 px-5 py-4 ring-1 ring-amber-200">
          <p className="text-sm font-medium text-amber-900">
            The customer hasn&apos;t sent their details yet
          </p>
          <p className="mt-1 text-sm text-amber-800">
            They&apos;ve paid, so the obligation stands — but there&apos;s
            nothing to work from until they fill in the intake form. Worth a
            nudge if it&apos;s been a while.
          </p>
        </div>
      )}

      <ServiceWorkspace
        requestId={request._id}
        fields={definition.fields}
        initialPayload={maskPayload(request.type, rawPayload)}
        initialStatus={request.status}
        initialNotes={request.adminNotes ?? ""}
        hasCredentials={hasSecrets(rawPayload)}
        credentialsPurged={Boolean(request.payloadPurgedAt)}
      />

      {request.history?.length > 0 && (
        <section className="card mt-5 overflow-hidden">
          <div className="panel-head">
            <h2 className="text-sm font-medium text-ink">History</h2>
          </div>
          <ul className="divide-y divide-rule-soft text-sm">
            {request.history.map((entry, index) => (
              <li key={index} className="flex justify-between gap-4 px-5 py-2.5">
                <span className="text-ink">
                  {entry.status.replace("_", " ")}
                  {entry.note && (
                    <span className="text-ink-faint"> — {entry.note}</span>
                  )}
                </span>
                <span className="shrink-0 text-xs tabular text-ink-faint">
                  {new Date(entry.at).toLocaleDateString("en-IN", {
                    dateStyle: "medium",
                  } as Intl.DateTimeFormatOptions)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
