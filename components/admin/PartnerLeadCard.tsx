"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface PartnerLead {
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

const ACTIONS: Record<string, { value: PartnerLead["status"]; label: string }[]> = {
  new: [{ value: "contacted", label: "Mark contacted" }, { value: "approved", label: "Approve" }, { value: "declined", label: "Decline" }],
  contacted: [{ value: "approved", label: "Approve" }, { value: "declined", label: "Decline" }],
  approved: [{ value: "declined", label: "Decline" }],
  declined: [{ value: "new", label: "Reopen" }],
};

export function PartnerLeadCard({ lead }: { lead: PartnerLead }) {
  const router = useRouter();
  const [status, setStatus] = useState(lead.status);
  const [busy, setBusy] = useState(false);

  async function update(next: PartnerLead["status"]) {
    const previous = status;
    setStatus(next);
    setBusy(true);
    try {
      const response = await fetch(`/api/admin/partners/${lead._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!response.ok) setStatus(previous);
      else router.refresh();
    } catch {
      setStatus(previous);
    } finally {
      setBusy(false);
    }
  }

  const partnership = lead.partnershipType === "both" ? "Clients + product sales" : lead.partnershipType === "sell_products" ? "Product sales" : "Client referrals";

  return (
    <article className="card px-4 py-4 sm:px-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2"><h2 className="font-bold text-ink">{lead.name || "Partner applicant"}</h2><span className="chip">{partnership}</span></div>
          <p className="mt-1 text-sm text-ink-soft"><a href={`mailto:${lead.email}`} className="hover:text-accent-deep">{lead.email}</a>{lead.phone && <> · {lead.phone}</>}{lead.city && <> · {lead.city}</>}</p>
          {lead.occupation && <p className="mt-1 text-xs text-ink-faint">{lead.occupation}</p>}
        </div>
        <time className="text-xs text-ink-faint">{new Date(lead.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</time>
      </div>
      {lead.message && <p className="mt-3 whitespace-pre-wrap rounded-lg bg-paper-alt px-3 py-2.5 text-sm leading-6 text-ink-soft">{lead.message}</p>}
      {lead.experience && <p className="mt-2 text-sm text-ink-soft"><strong className="text-ink">Experience/network:</strong> {lead.experience}</p>}
      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-rule-soft pt-3">
        <span className="chip-neutral capitalize">{status}</span>
        {ACTIONS[status]?.map((action) => <button key={action.value} type="button" disabled={busy} onClick={() => update(action.value)} className="text-xs font-semibold text-accent-deep hover:underline disabled:opacity-50">{action.label}</button>)}
        <a href={`mailto:${lead.email}?subject=${encodeURIComponent("Your TechBro partner application")}`} className="ml-auto text-xs font-semibold text-accent-deep hover:underline">Reply by email</a>
      </div>
    </article>
  );
}
