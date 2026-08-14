"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, Mail, Video } from "lucide-react";
import { APPOINTMENT_TOPICS, formatAppointmentDate, type AppointmentTopic } from "@/lib/appointments";
import type { AppointmentStatus } from "@/models/Appointment";

interface AppointmentRow {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  topic: AppointmentTopic;
  notes?: string;
  startAt: string;
  meetingUrl: string;
  status: AppointmentStatus;
  customerEmailSentAt?: string;
  adminEmailSentAt?: string;
  cancellationReason?: string;
}

export function AppointmentCard({ appointment }: { appointment: AppointmentRow }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function act(action: "complete" | "cancel" | "resend") {
    let reason = "";
    if (action === "cancel") {
      reason = window.prompt("Optional cancellation reason") ?? "";
      if (reason.length > 500) {
        setMessage("Keep the cancellation reason under 500 characters.");
        return;
      }
    }

    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/admin/appointments/${appointment._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reason }),
      });
      const data = await response.json();
      if (!response.ok) {
        setMessage(data.error ?? "Could not update the appointment.");
        return;
      }
      setMessage(action === "resend" ? "Confirmation emails sent." : "Appointment updated.");
      router.refresh();
    } catch {
      setMessage("Could not reach the server.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className="card overflow-hidden">
      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:justify-between sm:p-5">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-display text-lg font-bold text-ink">{appointment.name}</h2>
            <span className={appointment.status === "confirmed" ? "chip" : "chip-neutral"}>{appointment.status}</span>
          </div>
          <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-ink"><CalendarDays size={15} className="text-accent-deep" />{formatAppointmentDate(new Date(appointment.startAt))}</p>
          <p className="mt-1 text-sm text-ink-soft">{APPOINTMENT_TOPICS[appointment.topic]}</p>
          <p className="mt-2 text-xs text-ink-faint">
            <a href={`mailto:${appointment.email}`} className="hover:text-accent-deep">{appointment.email}</a>
            {appointment.phone ? ` · ${appointment.phone}` : ""}
            {appointment.company ? ` · ${appointment.company}` : ""}
          </p>
          {appointment.notes && <p className="mt-3 whitespace-pre-wrap rounded-lg bg-paper-alt p-3 text-sm leading-relaxed text-ink-soft">{appointment.notes}</p>}
          {appointment.cancellationReason && <p className="mt-2 text-xs text-ink-faint">Reason: {appointment.cancellationReason}</p>}
        </div>
        <a href={appointment.meetingUrl} target="_blank" rel="noopener noreferrer" className="btn-primary shrink-0"><Video size={16} /> Join Google Meet</a>
      </div>

      <div className="flex flex-wrap items-center gap-3 border-t border-rule-soft bg-paper-alt/50 px-4 py-3 text-xs sm:px-5">
        <span className="flex items-center gap-1 text-ink-faint"><Mail size={13} /> Customer {appointment.customerEmailSentAt ? "emailed" : "not emailed"}</span>
        <span className="text-ink-faint">Team {appointment.adminEmailSentAt ? "emailed" : "not emailed"}</span>
        {appointment.status === "confirmed" && <>
          <button type="button" disabled={busy} onClick={() => act("complete")} className="font-bold text-save disabled:opacity-50">Mark completed</button>
          <button type="button" disabled={busy} onClick={() => act("cancel")} className="font-bold text-accent-deep disabled:opacity-50">Cancel</button>
        </>}
        <button type="button" disabled={busy} onClick={() => act("resend")} className="ml-auto font-bold text-accent-deep disabled:opacity-50">Resend email</button>
        {message && <span className="w-full text-ink-soft">{message}</span>}
      </div>
    </article>
  );
}
