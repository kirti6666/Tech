import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAdmin } from "@/lib/middleware/requireAdmin";
import { sendEmail } from "@/lib/email";
import Appointment from "@/models/Appointment";
import { formatAppointmentDate } from "@/lib/appointments";
import {
  adminAppointmentEmail,
  appointmentCalendar,
  cancellationEmail,
  customerAppointmentEmail,
} from "@/lib/appointments/email";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    await connectDB();
    const body = await req.json();
    const action = String(body.action ?? "");
    const appointment = await Appointment.findById(params.id);
    if (!appointment) return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
    const adminEmail = process.env.APPOINTMENT_ADMIN_EMAIL ?? process.env.ADMIN_NOTIFICATION_EMAIL;

    if (action === "complete") {
      appointment.status = "completed";
      appointment.blocksSlot = false;
      await appointment.save();
      return NextResponse.json({ ok: true, status: appointment.status });
    }

    if (action === "cancel") {
      appointment.status = "cancelled";
      appointment.blocksSlot = false;
      appointment.cancellationReason = String(body.reason ?? "").trim().slice(0, 500) || undefined;
      await appointment.save();
      await Promise.all([
        sendEmail({ to: appointment.email, subject: "Your TechBro appointment was cancelled", html: cancellationEmail(appointment) }),
        ...(adminEmail ? [sendEmail({ to: adminEmail, subject: `Appointment cancelled - ${appointment.name}`, html: cancellationEmail(appointment) })] : []),
      ]);
      return NextResponse.json({ ok: true, status: appointment.status });
    }

    if (action === "resend") {
      if (!adminEmail) return NextResponse.json({ error: "Appointment admin email is not configured." }, { status: 503 });
      const attachment = [{ filename: "techbro-consultation.ics", content: appointmentCalendar(appointment), contentType: "text/calendar; charset=utf-8; method=PUBLISH" }];
      const [customerSent, adminSent] = await Promise.all([
        sendEmail({ to: appointment.email, subject: `Appointment details - ${formatAppointmentDate(appointment.startAt)}`, html: customerAppointmentEmail(appointment), attachments: attachment }),
        sendEmail({ to: adminEmail, subject: `Appointment details - ${appointment.name}`, html: adminAppointmentEmail(appointment), attachments: attachment }),
      ]);
      const now = new Date();
      if (customerSent) appointment.customerEmailSentAt = now;
      if (adminSent) appointment.adminEmailSentAt = now;
      await appointment.save();
      if (!customerSent || !adminSent) return NextResponse.json({ error: "One or more emails could not be delivered." }, { status: 502 });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error("PATCH /api/admin/appointments failed:", error);
    return NextResponse.json({ error: "Could not update the appointment." }, { status: 500 });
  }
}
