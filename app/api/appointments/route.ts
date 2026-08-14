import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { checkRateLimit } from "@/lib/rateLimit";
import { isEmailConfigured, sendEmail } from "@/lib/email";
import { createGoogleMeetSpace, isGoogleMeetConfigured } from "@/lib/googleMeet";
import Appointment from "@/models/Appointment";
import {
  APPOINTMENT_TOPICS,
  appointmentEnd,
  appointmentStart,
  formatAppointmentDate,
  isBookableDate,
  isValidSlotTime,
  type AppointmentTopic,
} from "@/lib/appointments";
import {
  adminAppointmentEmail,
  appointmentCalendar,
  customerAppointmentEmail,
} from "@/lib/appointments/email";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const limit = await checkRateLimit(`appointment:${ip}`, 5, 60 * 60);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many booking attempts. Please try again in an hour." },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();
    if (String(body.company_website ?? "").trim()) {
      return NextResponse.json({ ok: true });
    }

    const name = String(body.name ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase();
    const phone = String(body.phone ?? "").trim();
    const company = String(body.company ?? "").trim();
    const notes = String(body.notes ?? "").trim();
    const date = String(body.date ?? "").trim();
    const time = String(body.time ?? "").trim();
    const topic = String(body.topic ?? "") as AppointmentTopic;
    const errors: Record<string, string> = {};

    if (!name) errors.name = "Enter your name.";
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      errors.email = "Enter a valid email address.";
    }
    if (!phone) errors.phone = "Enter a phone number.";
    if (!(topic in APPOINTMENT_TOPICS)) errors.topic = "Choose a consultation type.";
    if (!isBookableDate(date)) errors.date = "Choose a weekday within the next 30 days.";
    if (!isValidSlotTime(time)) errors.time = "Choose an available time.";
    if (notes.length > 2000) errors.notes = "Keep the notes under 2,000 characters.";

    if (Object.keys(errors).length) {
      return NextResponse.json(
        { error: "Check the highlighted booking details.", fields: errors },
        { status: 400 }
      );
    }

    const adminEmail = process.env.APPOINTMENT_ADMIN_EMAIL ?? process.env.ADMIN_NOTIFICATION_EMAIL;
    if (!isEmailConfigured() || !adminEmail || !isGoogleMeetConfigured()) {
      return NextResponse.json(
        { error: "Online booking is being configured. Please contact us on WhatsApp for now." },
        { status: 503 }
      );
    }

    await connectDB();
    const startAt = appointmentStart(date, time);
    const endAt = appointmentEnd(startAt);
    let appointment;
    try {
      appointment = await Appointment.create({
        name: name.slice(0, 120),
        email,
        phone: phone.slice(0, 30),
        company: company.slice(0, 120) || undefined,
        topic,
        notes: notes || undefined,
        startAt,
        endAt,
        meetingUrl: "https://meet.google.com/pending",
        status: "confirmed",
        blocksSlot: true,
        ip,
      });
    } catch (error: unknown) {
      if ((error as { code?: number }).code === 11000) {
        return NextResponse.json(
          { error: "That time was just booked. Please choose another slot.", fields: { time: "No longer available." } },
          { status: 409 }
        );
      }
      throw error;
    }

    try {
      const meetSpace = await createGoogleMeetSpace();
      appointment.meetingUrl = meetSpace.meetingUri;
      appointment.googleMeetSpaceName = meetSpace.name;
      await appointment.save();
    } catch (error) {
      await Appointment.deleteOne({ _id: appointment._id }).catch(() => undefined);
      console.error("Google Meet space creation failed:", error);
      return NextResponse.json(
        { error: "A Google Meet link could not be created. Please try again." },
        { status: 502 }
      );
    }

    const calendar = appointmentCalendar(appointment);
    const attachment = [{
      filename: "techbro-consultation.ics",
      content: calendar,
      contentType: "text/calendar; charset=utf-8; method=PUBLISH",
    }];
    const [customerSent, adminSent] = await Promise.all([
      sendEmail({
        to: email,
        subject: `Appointment confirmed - ${formatAppointmentDate(startAt)}`,
        html: customerAppointmentEmail(appointment),
        attachments: attachment,
      }),
      sendEmail({
        to: adminEmail,
        subject: `New consultation - ${name} - ${formatAppointmentDate(startAt)}`,
        html: adminAppointmentEmail(appointment),
        attachments: attachment,
      }),
    ]);

    const now = new Date();
    if (customerSent) appointment.customerEmailSentAt = now;
    if (adminSent) appointment.adminEmailSentAt = now;
    await appointment.save();

    return NextResponse.json(
      {
        ok: true,
        appointment: {
          id: appointment._id,
          startAt: appointment.startAt,
          meetingUrl: appointment.meetingUrl,
          emailDelivered: customerSent,
        },
        warning: !customerSent || !adminSent
          ? "The appointment is saved, but one confirmation email could not be delivered. The meeting details are shown below."
          : undefined,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/appointments failed:", error);
    return NextResponse.json(
      { error: "Could not book the appointment. Please try again." },
      { status: 500 }
    );
  }
}
