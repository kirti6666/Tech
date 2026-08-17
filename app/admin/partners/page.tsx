import Link from "next/link";
import { connectDB } from "@/lib/db";
import PartnerLead from "@/models/PartnerLead";
import { PartnerLeadCard } from "@/components/admin/PartnerLeadCard";

export const dynamic = "force-dynamic";

interface PartnerRow {
  _id: string;
  name?: string;
  email: string;
  phone?: string;
  city?: string;
  occupation?: string;
  partnershipType?: string;
  experience?: string;
  message?: string;
  status: "new" | "contacted" | "approved" | "declined";
  createdAt: string;
}

export default async function AdminPartnersPage({ searchParams }: { searchParams: { status?: string } }) {
  await connectDB();
  const filter: Record<string, unknown> = searchParams.status ? { status: searchParams.status } : { status: { $in: ["new", "contacted"] } };
  const docs = await PartnerLead.find(filter).sort({ createdAt: -1 }).limit(100).lean();
  const leads = JSON.parse(JSON.stringify(docs)) as PartnerRow[];
  const tabs = [{ key: "", label: "Open" }, { key: "new", label: "New" }, { key: "contacted", label: "Contacted" }, { key: "approved", label: "Approved" }, { key: "declined", label: "Declined" }];

  return (
    <div>
      <header className="mb-6"><p className="label">Partner programme</p><h1 className="mt-1 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">Partner registrations</h1><p className="mt-2 text-sm text-ink-soft">Review people who want to bring clients or sell TechBro products.</p></header>
      <div className="mb-4 flex flex-wrap gap-2">
        {tabs.map((tab) => <Link key={tab.label} href={tab.key ? `/admin/partners?status=${tab.key}` : "/admin/partners"} className={(searchParams.status ?? "") === tab.key ? "chip" : "chip-neutral"}>{tab.label}</Link>)}
      </div>
      <div className="space-y-3">
        {leads.map((lead) => <PartnerLeadCard key={lead._id} lead={lead} />)}
        {leads.length === 0 && <div className="card px-5 py-14 text-center"><p className="text-sm text-ink-faint">No partner registrations in this view.</p></div>}
      </div>
    </div>
  );
}
