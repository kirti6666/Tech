import type { IAppointment } from "@/models/Appointment";
import { APPOINTMENT_TOPICS, formatAppointmentDate } from "@/lib/appointments";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function emailShell(content: string): string {
  return `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:600px;margin:0 auto;padding:28px;color:#152033;background:#ffffff">${content}</div>`;
}

export function customerAppointmentEmail(appointment: IAppointment): string {
  const when = formatAppointmentDate(new Date(appointment.startAt));
  const topic = APPOINTMENT_TOPICS[appointment.topic];
  return emailShell(`
    <p style="margin:0 0 8px;color:#6d28d9;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase">Appointment confirmed</p>
    <h1 style="margin:0 0 16px;font-size:25px">Your TechBro consultation is booked</h1>
    <p style="margin:0 0 20px;color:#4b5563;line-height:1.6">Hi ${escapeHtml(appointment.name)}, your ${escapeHtml(topic.toLowerCase())} is confirmed.</p>
    <div style="border:1px solid #e6e0f5;border-radius:14px;padding:18px;background:#faf9ff">
      <p style="margin:0 0 8px"><strong>Date and time:</strong><br>${escapeHtml(when)}</p>
      <p style="margin:0"><strong>Duration:</strong> 30 minutes</p>
    </div>
    <p style="margin:22px 0"><a href="${escapeHtml(appointment.meetingUrl)}" style="display:inline-block;border-radius:10px;background:#6d28d9;color:#fff;padding:12px 20px;text-decoration:none;font-weight:700">Join Google Meet</a></p>
    <p style="margin:0;color:#6b7280;font-size:13px;line-height:1.6">The calendar file attached to this email contains the same meeting link. Please join a few minutes early.</p>
  `);
}

export function adminAppointmentEmail(appointment: IAppointment): string {
  const when = formatAppointmentDate(new Date(appointment.startAt));
  const topic = APPOINTMENT_TOPICS[appointment.topic];
  const adminUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? ""}/admin/appointments`;
  return emailShell(`
    <p style="margin:0 0 8px;color:#6d28d9;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase">New appointment</p>
    <h1 style="margin:0 0 16px;font-size:25px">${escapeHtml(topic)}</h1>
    <div style="border:1px solid #e6e0f5;border-radius:14px;padding:18px;background:#faf9ff;line-height:1.65">
      <strong>${escapeHtml(appointment.name)}</strong><br>
      <a href="mailto:${escapeHtml(appointment.email)}">${escapeHtml(appointment.email)}</a>${appointment.phone ? `<br>${escapeHtml(appointment.phone)}` : ""}${appointment.company ? `<br>${escapeHtml(appointment.company)}` : ""}
      <p style="margin:12px 0 0"><strong>When:</strong> ${escapeHtml(when)}</p>
      ${appointment.notes ? `<p style="margin:12px 0 0"><strong>Notes:</strong><br>${escapeHtml(appointment.notes)}</p>` : ""}
    </div>
    <p style="margin:22px 0"><a href="${escapeHtml(appointment.meetingUrl)}" style="display:inline-block;border-radius:10px;background:#6d28d9;color:#fff;padding:12px 20px;text-decoration:none;font-weight:700">Join Google Meet</a></p>
    ${adminUrl ? `<p style="margin:0"><a href="${escapeHtml(adminUrl)}">Open appointment dashboard</a></p>` : ""}
  `);
}

export function appointmentCalendar(appointment: IAppointment): string {
  const stamp = (date: Date) => date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  const clean = (value: string) => value.replace(/([,;\\])/g, "\\$1").replace(/\n/g, "\\n");
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//TechBro//Appointments//EN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${clean(String(appointment._id))}@techbro`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(new Date(appointment.startAt))}`,
    `DTEND:${stamp(new Date(appointment.endAt))}`,
    `SUMMARY:${clean(`TechBro - ${APPOINTMENT_TOPICS[appointment.topic]}`)}`,
    `DESCRIPTION:${clean(`Join the meeting: ${appointment.meetingUrl}`)}`,
    `URL:${clean(appointment.meetingUrl)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

export function cancellationEmail(appointment: IAppointment): string {
  return emailShell(`
    <p style="margin:0 0 8px;color:#6d28d9;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase">Appointment cancelled</p>
    <h1 style="margin:0 0 16px;font-size:24px">Your TechBro consultation was cancelled</h1>
    <p style="margin:0 0 16px;color:#4b5563;line-height:1.6">The appointment scheduled for ${escapeHtml(formatAppointmentDate(new Date(appointment.startAt)))} is no longer active.</p>
    ${appointment.cancellationReason ? `<p style="margin:0;color:#4b5563"><strong>Reason:</strong> ${escapeHtml(appointment.cancellationReason)}</p>` : ""}
  `);
}
