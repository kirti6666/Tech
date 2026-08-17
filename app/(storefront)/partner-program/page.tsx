import type { Metadata } from "next";
import Link from "next/link";
import { ArrowDown, BadgeIndianRupee, CheckCircle2, Handshake, ShieldCheck, UsersRound } from "lucide-react";
import { PartnerRegistrationForm } from "@/components/storefront/PartnerRegistrationForm";

export const metadata: Metadata = {
  title: "Register as a Partner",
  description: "Join the TechBro partner programme, refer clients or sell digital products and earn an agreed share on successful sales.",
  alternates: { canonical: "/partner-program" },
};

export default function PartnerProgramPage() {
  const steps = [
    { number: "01", icon: UsersRound, title: "Apply", text: "Tell us about your reach and experience." },
    { number: "02", icon: ShieldCheck, title: "Get verified", text: "We review your application and fit." },
    { number: "03", icon: BadgeIndianRupee, title: "Earn", text: "Receive your share on successful sales." },
  ];

  return (
    <main>
      <section className="border-b border-blue-100 bg-gradient-to-br from-white via-blue-50/70 to-amber-50/40">
        <div className="mx-auto grid max-w-6xl gap-5 px-4 py-5 text-center sm:px-6 sm:py-8 lg:grid-cols-[1.05fr_.95fr] lg:items-center lg:gap-8 lg:py-10">
          <div className="flex flex-col items-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.16em] text-accent-deep"><Handshake size={13} /> TechBro Partner Programme</span>
            <h1 className="mt-3 max-w-2xl font-display text-[1.9rem] font-black leading-[1.05] tracking-[-0.045em] text-ink sm:text-4xl lg:text-[2.85rem]">Grow your network. <span className="text-accent">Earn with TechBro.</span></h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-ink-soft sm:text-base">Bring the right digital solutions to businesses and earn your agreed partner share when a sale is completed.</p>
            <Link href="#partner-application" className="btn-primary mt-4 hidden w-fit sm:inline-flex">Register as a partner <ArrowDown size={16} /></Link>
          </div>

          <div className="hidden overflow-hidden rounded-2xl bg-[#061a3a] p-4 text-left text-white shadow-lift sm:block">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-blue-300">A clear partner journey</p>
            <ol className="mt-4 grid gap-2.5 lg:grid-cols-3">
              {steps.map(({ number, icon: Icon, title, text }) => (
                <li key={number} className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <div className="flex items-center justify-between"><span className="text-[10px] font-bold text-blue-300">{number}</span><Icon size={17} className="text-blue-200" /></div>
                  <strong className="mt-4 block font-display text-sm font-extrabold tracking-tight">{title}</strong><p className="mt-1 text-xs leading-5 text-blue-100/65">{text}</p>
                </li>
              ))}
            </ol>
            <p className="mt-4 flex items-center gap-2 text-xs text-blue-100/70"><ShieldCheck size={15} /> No joining fee. Applications are reviewed privately.</p>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl justify-center gap-5 px-3 py-4 sm:px-6 sm:py-7 lg:grid-cols-[.65fr_1.35fr] lg:items-start lg:py-10">
        <aside className="order-2 overflow-hidden rounded-2xl border border-blue-100 bg-white lg:order-1 lg:sticky lg:top-24">
          <div className="border-b border-blue-100 bg-blue-50/70 p-3.5 sm:p-4"><p className="label-muted">Built for meaningful referrals</p><h2 className="mt-1 font-display text-xl font-black tracking-[-0.025em] text-ink">Why partner with us?</h2></div>
          <ul className="divide-y divide-rule-soft px-3.5 sm:px-4">
            {[
              "Ready-made websites, apps and business software",
              "Support choosing the right solution for each client",
              "Clear referral tracking and agreed rewards",
              "No joining fee or monthly target",
            ].map((item) => <li key={item} className="flex gap-2.5 py-3 text-sm leading-5 text-ink-soft"><CheckCircle2 size={16} className="mt-0.5 shrink-0 text-accent-deep" /><span>{item}</span></li>)}
          </ul>
          <div className="m-3.5 rounded-xl border border-blue-100 bg-blue-50/60 p-3 sm:m-4"><p className="text-xs font-bold text-accent-deep">How earnings work</p><p className="mt-1 text-xs leading-5 text-ink-soft">Your share is confirmed before you begin and is paid after the customer&apos;s successful purchase.</p></div>
        </aside>
        <div id="partner-application" className="order-1 scroll-mt-24 lg:order-2"><PartnerRegistrationForm /></div>
      </section>
    </main>
  );
}
