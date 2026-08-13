import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { connectDB } from "@/lib/db";
import ServiceRequest from "@/models/ServiceRequest";
import { getServerUser } from "@/lib/middleware/getServerUser";
import { SERVICE_FORMS } from "@/lib/services/schemas";
import { ServiceIntakeForm } from "@/components/storefront/account/ServiceIntakeForm";
import type { AddonType, ServiceStatus } from "@/types/catalog";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Service details | TechBro",
  robots: { index: false, follow: false },
};

const SERVICE_TITLES: Record<AddonType, string> = {
  rebranding: "Rebranding",
  deployment: "Deployment & setup",
  maintenance: "Maintenance",
};

const STATUS_STEPS: { key: ServiceStatus; label: string }[] = [
  { key: "pending", label: "Pending" },
  { key: "in_progress", label: "In progress" },
  { key: "delivered", label: "Delivered" },
];

export default async function ServiceRequestPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await getServerUser();
  if (!user) redirect(`/login?next=/account/services/${params.id}`);

  await connectDB();

  const doc = await ServiceRequest.findOne({ _id: params.id, user: user.id })
    .populate("product", "title slug")
    .populate("order", "orderNumber")
    .lean();

  if (!doc) notFound();

  const request = JSON.parse(JSON.stringify(doc)) as {
    _id: string;
    type: AddonType;
    status: ServiceStatus;
    payload: Record<string, unknown>;
    payloadSubmittedAt?: string;
    product?: { title: string; slug: string };
    order?: { orderNumber: string };
  };

  const definition = SERVICE_FORMS[request.type];

  // Non-secret values are pre-filled so an update doesn't mean retyping
  // everything. Secret fields deliberately come back empty — the server
  // never returns them, and a blank box that says "leave blank to keep" is
  // honest about that.
  const initialValues: Record<string, string> = {};
  for (const field of definition.fields) {
    if (field.secret) continue;
    const value = request.payload?.[field.name];
    if (typeof value === "string") initialValues[field.name] = value;
  }

  const currentStep = STATUS_STEPS.findIndex((s) => s.key === request.status);

  return (
    <main className="mx-auto max-w-2xl px-5 py-10 sm:px-6">
      <nav aria-label="Breadcrumb" className="mb-6 label-muted">
        <Link href="/account/purchases" className="hover:text-accent-deep">
          Purchases
        </Link>
      </nav>

      <header className="mb-8">
        <p className="label-muted">
          {request.order?.orderNumber}
          {request.product ? ` · ${request.product.title}` : ""}
        </p>
        <h1 className="mt-1.5 font-display text-3xl font-bold tracking-tight text-ink">
          {SERVICE_TITLES[request.type]}
        </h1>
      </header>

      <ol className="mb-8 flex border border-rule">
        {STATUS_STEPS.map((step, index) => {
          const done = index <= currentStep;
          return (
            <li
              key={step.key}
              aria-current={index === currentStep ? "step" : undefined}
              className={`flex-1 border-r border-rule px-3 py-2 last:border-r-0 ${
                done ? "bg-paper-alt" : ""
              }`}
            >
              <span className="label-muted">{`0${index + 1}`}</span>
              <span
                className={`mt-0.5 block text-sm ${
                  index === currentStep
                    ? "font-medium text-accent-deep"
                    : done
                      ? "text-ink"
                      : "text-ink-faint"
                }`}
              >
                {step.label}
              </span>
            </li>
          );
        })}
      </ol>

      {request.status === "delivered" ? (
        <p className="rounded-lg bg-paper-alt px-4 py-3 text-sm leading-relaxed text-ink-soft">
          This work has been delivered. If something needs changing,{" "}
          <Link href="/contact" className="text-accent-deep underline underline-offset-2">
            get in touch
          </Link>
          .
        </p>
      ) : (
        <ServiceIntakeForm
          requestId={request._id}
          intro={definition.intro}
          fields={definition.fields}
          initialValues={initialValues}
          alreadySubmitted={Boolean(request.payloadSubmittedAt)}
        />
      )}
    </main>
  );
}
