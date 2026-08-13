"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * One enquiry, with its status controls inline.
 *
 * Marking a lead contacted shouldn't cost a page load — the whole job here
 * is working down a list, and a full navigation per row makes an inbox of
 * twenty feel like an afternoon. The row updates optimistically and only
 * refreshes the server data when the status change would move it out of the
 * current filter.
 */

interface Enquiry {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  message: string;
  source: "contact" | "custom_work";
  status: "new" | "contacted" | "converted" | "closed";
  adminNotes?: string;
  createdAt: string;
}

const NEXT_STATUS: Record<string, { value: string; label: string }[]> = {
  new: [
    { value: "contacted", label: "Mark contacted" },
    { value: "closed", label: "Close" },
  ],
  contacted: [
    { value: "converted", label: "Mark converted" },
    { value: "closed", label: "Close" },
  ],
  converted: [{ value: "closed", label: "Close" }],
  closed: [{ value: "new", label: "Reopen" }],
};

export function EnquiryCard({
  enquiry,
  budgetLabel,
}: {
  enquiry: Enquiry;
  budgetLabel?: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(enquiry.status);
  const [busy, setBusy] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const isLead = enquiry.source === "custom_work";
  const long = enquiry.message.length > 320;
  const shown = expanded || !long
    ? enquiry.message
    : `${enquiry.message.slice(0, 320)}…`;

  async function update(next: string) {
    setBusy(true);
    const previous = status;
    setStatus(next as Enquiry["status"]);

    try {
      const response = await fetch(`/api/admin/enquiries/${enquiry._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!response.ok) {
        setStatus(previous);
        return;
      }
      router.refresh();
    } catch {
      setStatus(previous);
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className="card px-5 py-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-sm font-medium text-ink">{enquiry.name}</h2>
            {isLead && <span className="chip">Custom work</span>}
            {budgetLabel && <span className="chip-neutral">{budgetLabel}</span>}
          </div>
          <p className="mt-0.5 text-sm text-ink-soft">
            <a
              href={`mailto:${enquiry.email}`}
              className="hover:text-accent-deep"
            >
              {enquiry.email}
            </a>
            {enquiry.phone && (
              <span className="text-ink-faint"> · {enquiry.phone}</span>
            )}
            {enquiry.company && (
              <span className="text-ink-faint"> · {enquiry.company}</span>
            )}
          </p>
        </div>

        <span className="shrink-0 text-xs tabular text-ink-faint">
          {new Date(enquiry.createdAt).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
          })}
        </span>
      </div>

      <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-ink-soft">
        {shown}
      </p>
      {long && (
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="mt-1 text-xs font-medium text-accent-deep hover:underline"
        >
          {expanded ? "Show less" : "Read all"}
        </button>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-rule-soft pt-3">
        <span className="chip-neutral">{status}</span>
        {NEXT_STATUS[status]?.map((action) => (
          <button
            key={action.value}
            type="button"
            onClick={() => update(action.value)}
            disabled={busy}
            className="text-xs font-medium text-accent-deep hover:underline disabled:opacity-50"
          >
            {action.label}
          </button>
        ))}
        <a
          href={`mailto:${enquiry.email}?subject=${encodeURIComponent("Re: your enquiry — TechBro")}`}
          className="ml-auto text-xs font-medium text-accent-deep hover:underline"
        >
          Reply by email
        </a>
      </div>
    </article>
  );
}
