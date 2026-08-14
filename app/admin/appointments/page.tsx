import Link from "next/link";
import { connectDB } from "@/lib/db";
import Appointment from "@/models/Appointment";
import { AppointmentCard } from "@/components/admin/AppointmentCard";

export const dynamic = "force-dynamic";

export default async function AdminAppointmentsPage({ searchParams }: { searchParams: { view?: string } }) {
  await connectDB();
  const now = new Date();
  const view = searchParams.view ?? "upcoming";
  const filter = view === "cancelled"
    ? { status: "cancelled" }
    : view === "past"
      ? { $or: [{ startAt: { $lt: now } }, { status: "completed" }] }
      : { status: "confirmed", startAt: { $gte: now } };

  const docs = await Appointment.find(filter).sort({ startAt: view === "past" ? -1 : 1 }).limit(150).lean();
  const appointments = JSON.parse(JSON.stringify(docs));

  return (
    <div>
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div><p className="label">Schedule</p><h1 className="mt-1 font-display text-4xl font-light tracking-tight text-ink">Appointments</h1></div>
        <Link href="/book-consultation" className="btn-secondary">Open booking page</Link>
      </header>

      <nav className="mb-4 flex gap-2">
        {[{ value: "upcoming", label: "Upcoming" }, { value: "past", label: "Past" }, { value: "cancelled", label: "Cancelled" }].map((item) => (
          <Link key={item.value} href={item.value === "upcoming" ? "/admin/appointments" : `/admin/appointments?view=${item.value}`} className={view === item.value ? "chip" : "chip-neutral"}>{item.label}</Link>
        ))}
      </nav>

      <div className="space-y-3">
        {appointments.map((appointment: Parameters<typeof AppointmentCard>[0]["appointment"]) => <AppointmentCard key={appointment._id} appointment={appointment} />)}
        {appointments.length === 0 && <div className="card px-5 py-14 text-center text-sm text-ink-faint">No appointments in this view.</div>}
      </div>
    </div>
  );
}
