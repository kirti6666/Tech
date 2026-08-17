import type { Metadata } from "next";
import { CalendarCheck2, MailCheck, Video } from "lucide-react";
import { AppointmentForm } from "@/components/storefront/AppointmentForm";
import { QuickCallForm } from "@/components/storefront/QuickCallForm";

export const metadata: Metadata = {
  title: "Book a call",
  description: "Request a quick callback or schedule a 30-minute Google Meet with the TechBro team.",
  alternates: { canonical: "/book-consultation" },
};

export default function BookConsultationPage() {
  return (
    <main className="mx-auto max-w-5xl px-3 py-3 sm:px-6 sm:py-8">
      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,.82fr)_minmax(0,1.25fr)] lg:gap-8">
        <section className="overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-br from-white via-blue-50/45 to-[#fff9e8] p-4 text-center shadow-card sm:rounded-3xl sm:p-6 lg:sticky lg:top-24">
          <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-3 py-1 font-sans text-[10px] font-bold uppercase tracking-[0.16em] text-[#0b2a59]">Schedule a Google Meet</span>
          <h1 className="mx-auto mt-3 max-w-xl font-brand text-[2rem] font-bold leading-[1.03] tracking-[-0.025em] text-[#061a3a] sm:text-[2.7rem]">Let’s discuss what you want to build.</h1>
          <p className="mx-auto mt-3 max-w-lg font-sans text-sm font-normal leading-6 text-ink-soft sm:text-base">Choose a time within the next seven days, or request a quick phone discussion below.</p>
          <div className="mt-4 grid grid-cols-3 gap-2 sm:mt-6 lg:grid-cols-1">
            {[
              { icon: CalendarCheck2, title: "Within 7 days", text: "Live availability" },
              { icon: MailCheck, title: "Instant confirmation", text: "Both sides receive details" },
              { icon: Video, title: "Google Meet", text: "Private link and calendar file" },
            ].map(({ icon: Icon, title, text }) => (
              <div key={title} className="flex min-w-0 flex-col items-center justify-center gap-1.5 rounded-xl border border-blue-100 bg-white/90 px-1.5 py-3 text-center shadow-sm transition hover:-translate-y-0.5 hover:shadow-card sm:px-3 lg:flex-row lg:justify-start lg:gap-3 lg:p-3 lg:text-left">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-blue-50 text-[#0b2a59] ring-1 ring-blue-100 lg:h-9 lg:w-9"><Icon size={17} /></span>
                <span className="min-w-0 font-sans"><strong className="block text-[10px] font-bold leading-tight tracking-[-0.01em] text-[#061a3a] sm:text-sm">{title}</strong><span className="hidden text-xs font-normal text-ink-soft lg:block">{text}</span></span>
              </div>
            ))}
          </div>
        </section>

        <div id="book-appointment" className="scroll-mt-24"><AppointmentForm /></div>
      </div>
      <div className="mt-4 sm:mt-7"><QuickCallForm /></div>
    </main>
  );
}
