import Link from "next/link";
import { connectDB } from "@/lib/db";
import Enquiry from "@/models/Enquiry";
import { EnquiryCard } from "@/components/admin/EnquiryCard";

export const dynamic = "force-dynamic";

/**
 * Enquiry inbox.
 *
 * Rendered as cards rather than a table because the message is the content
 * — a table row truncates the one thing you need to read to decide what to
 * do, and every enquiry then costs a click to open.
 *
 * Custom-work leads and support questions share the list but are visually
 * distinct: one is revenue, the other is a customer who needs help, and
 * they get answered by different people.
 */

interface Row {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  message: string;
  source: "contact" | "custom_work";
  budget?: string;
  status: "new" | "contacted" | "converted" | "closed";
  adminNotes?: string;
  createdAt: string;
}

const BUDGET_LABELS: Record<string, string> = {
  "under-1L": "Under ₹1 lakh",
  "1-3L": "₹1–3 lakh",
  "3-10L": "₹3–10 lakh",
  "over-10L": "Over ₹10 lakh",
};

export default async function AdminEnquiriesPage({
  searchParams,
}: {
  searchParams: { status?: string; source?: string };
}) {
  await connectDB();

  const filter: Record<string, unknown> = {};
  if (searchParams.status) filter.status = searchParams.status;
  else filter.status = { $in: ["new", "contacted"] };
  if (searchParams.source) filter.source = searchParams.source;

  const docs = await Enquiry.find(filter).sort({ createdAt: -1 }).limit(100).lean();
  const enquiries = JSON.parse(JSON.stringify(docs)) as Row[];

  const TABS = [
    { key: undefined, label: "Open" },
    { key: "new", label: "New" },
    { key: "contacted", label: "Contacted" },
    { key: "converted", label: "Converted" },
    { key: "closed", label: "Closed" },
  ];

  return (
    <div>
      <header className="mb-6">
        <p className="label">Pipeline</p>
        <h1 className="mt-1 font-display text-4xl font-light tracking-tight text-ink">
          Enquiries
        </h1>
      </header>

      <div className="mb-4 flex flex-wrap gap-2">
        {TABS.map((tab) => (
          <Link
            key={tab.label}
            href={tab.key ? `/admin/enquiries?status=${tab.key}` : "/admin/enquiries"}
            className={searchParams.status === tab.key ? "chip" : "chip-neutral"}
          >
            {tab.label}
          </Link>
        ))}
        <span className="mx-1 w-px bg-rule" aria-hidden />
        <Link
          href="/admin/enquiries?source=custom_work"
          className={
            searchParams.source === "custom_work" ? "chip" : "chip-neutral"
          }
        >
          Custom work only
        </Link>
      </div>

      <div className="space-y-3">
        {enquiries.map((enquiry) => (
          <EnquiryCard
            key={enquiry._id}
            enquiry={enquiry}
            budgetLabel={
              enquiry.budget ? BUDGET_LABELS[enquiry.budget] ?? enquiry.budget : undefined
            }
          />
        ))}

        {enquiries.length === 0 && (
          <div className="card px-5 py-14 text-center">
            <p className="text-sm text-ink-faint">Nothing here right now.</p>
          </div>
        )}
      </div>
    </div>
  );
}
