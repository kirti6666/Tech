import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Appointment from "@/models/Appointment";
import {
  appointmentStart,
  availableSlots,
  isBookableDate,
} from "@/lib/appointments";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get("date") ?? "";
  if (!isBookableDate(date)) {
    return NextResponse.json(
      { error: "Choose a date within the next 7 days.", slots: [] },
      { status: 400 }
    );
  }

  try {
    await connectDB();
    const dayStart = appointmentStart(date, "00:00");
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60_000);
    const booked = await Appointment.find({
      blocksSlot: true,
      startAt: { $gte: dayStart, $lt: dayEnd },
    })
      .select("startAt")
      .lean();

    return NextResponse.json({
      date,
      timezone: "Asia/Kolkata",
      slots: availableSlots(date, booked.map((item) => new Date(item.startAt))),
    });
  } catch (error) {
    console.error("GET /api/appointments/availability failed:", error);
    return NextResponse.json(
      { error: "Could not load appointment times.", slots: [] },
      { status: 500 }
    );
  }
}
