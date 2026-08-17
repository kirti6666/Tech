import Link from "next/link";
import { connectDB } from "@/lib/db";
import Enquiry from "@/models/Enquiry";
import { EnquiryCard } from "@/components/admin/EnquiryCard";

export const dynamic = "force-dynamic";

interface CareerSubmissionRow {
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

export default async function AdminCareerSubmissionsPage({ searchParams }: { searchParams: { status?: string } }) {
  await connectDB();

  const filter: Record<string, unknown> = {
    $or: [
      { requestType: "career_application" },
      { requestType: "innovation_submission" },
      { requestType: { $exists: false }, message: /^Product \/ innovation:/ },
    ],
  };
  filter.status = searchParams.status || { $in: ["new", "contacted"] };

  const docs = await Enquiry.find(filter).sort({ createdAt: -1 }).limit(100).lean();
  const submissions = JSON.parse(JSON.stringify(docs)) as CareerSubmissionRow[];
  const tabs = [
    { key: "", label: "Open" },
    { key: "new", label: "New" },
    { key: "contacted", label: "Contacted" },
    { key: "converted", label: "Accepted" },
    { key: "closed", label: "Closed" },
  ];

  return (
    <div>
      <header className="mb-6">
        <p className="label">Talent and creator applications</p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">Career submissions</h1>
        <p className="mt-2 text-sm text-ink-soft">Review job applications and earlier creator submissions received through the Career page.</p>
      </header>

      <div className="mb-4 flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <Link key={tab.label} href={tab.key ? `/admin/career-submissions?status=${tab.key}` : "/admin/career-submissions"} className={(searchParams.status ?? "") === tab.key ? "chip" : "chip-neutral"}>{tab.label}</Link>
        ))}
      </div>

      <div className="space-y-3">
        {submissions.map((submission) => <EnquiryCard key={submission._id} enquiry={submission} budgetLabel={submission.budget} />)}
        {submissions.length === 0 && <div className="card px-5 py-14 text-center"><p className="text-sm text-ink-faint">No Career submissions in this view.</p></div>}
      </div>
    </div>
  );
}
