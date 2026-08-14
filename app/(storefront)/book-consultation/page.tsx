import type { Metadata } from "next";
import { CalendarCheck2, MailCheck, Video } from "lucide-react";
import { AppointmentForm } from "@/components/storefront/AppointmentForm";

export const metadata: Metadata = {
  title: "Book a consultation",
  description: "Book a 30-minute video consultation with the TechBro team.",
  alternates: { canonical: "/book-consultation" },
};

export default function BookConsultationPage() {
  return (
    <main className="mx-auto max-w-5xl px-3 py-3 sm:px-6 sm:py-10">
      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,.9fr)_minmax(0,1.25fr)] lg:gap-10">
        <section className="lg:sticky lg:top-24">
          <p className="label">Book a consultation</p>
          <h1 className="mt-1.5 font-display text-2xl font-bold leading-tight tracking-tight text-ink sm:mt-2 sm:text-4xl">Let’s discuss what you want to build.</h1>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft sm:mt-3 sm:text-base">Pick a convenient time for a focused product, project or technical consultation.</p>
          <div className="mt-3 grid grid-cols-3 gap-2 sm:mt-5 lg:grid-cols-1">
            {[
              { icon: CalendarCheck2, title: "Pick a time", text: "Weekday slots shown live" },
              { icon: MailCheck, title: "Instant confirmation", text: "Both sides receive details" },
              { icon: Video, title: "Google Meet", text: "Private link and calendar file" },
            ].map(({ icon: Icon, title, text }) => (
              <div key={title} className="flex min-w-0 flex-col items-center gap-1 rounded-xl border border-rule bg-white px-1.5 py-2 text-center sm:px-3 lg:flex-row lg:gap-3 lg:p-3 lg:text-left">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-accent-mist text-accent-deep lg:h-9 lg:w-9"><Icon size={17} /></span>
                <span className="min-w-0"><strong className="block text-[11px] leading-tight text-ink sm:text-sm">{title}</strong><span className="hidden text-xs text-ink-soft lg:block">{text}</span></span>
              </div>
            ))}
          </div>
        </section>

        <AppointmentForm />
      </div>
    </main>
  );
}
