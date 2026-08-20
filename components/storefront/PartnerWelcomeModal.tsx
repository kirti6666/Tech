"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  BadgePercent,
  Blocks,
  Check,
  Code2,
  IndianRupee,
  Rocket,
  ShieldCheck,
  Smartphone,
  X,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { BrandWordmark } from "@/components/BrandWordmark";

const DISMISSED_KEY = "techbro_partner_modal_dismissed_at";
const DISMISS_FOR_MS = 7 * 24 * 60 * 60 * 1000;
const OPEN_DELAY_MS = 3500;

export function PartnerWelcomeModal() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (pathname.startsWith("/admin") || pathname === "/partner-program") return;
    const dismissedAt = Number(window.localStorage.getItem(DISMISSED_KEY) || 0);
    if (Date.now() - dismissedAt < DISMISS_FOR_MS) return;
    const timer = window.setTimeout(() => setOpen(true), OPEN_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeModal();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  function closeModal() {
    window.localStorage.setItem(DISMISSED_KEY, String(Date.now()));
    setOpen(false);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] overflow-y-auto bg-[#eef3fb]" role="presentation">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="partner-modal-title"
        aria-describedby="partner-modal-description"
        className="relative isolate flex min-h-[100svh] flex-col overflow-hidden"
      >
        <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,rgba(255,255,255,0.98)_0%,rgba(236,243,255,0.92)_42%,rgba(224,229,255,0.78)_72%,rgba(244,247,252,0.96)_100%)]" />
          <div className="absolute -left-32 top-24 h-80 w-80 rounded-full bg-blue-300/20 blur-[90px]" />
          <div className="absolute -right-32 top-1/3 h-96 w-96 rounded-full bg-violet-300/20 blur-[100px]" />
          <div className="absolute inset-0 opacity-[0.18] [background-image:linear-gradient(#9db3d3_1px,transparent_1px),linear-gradient(90deg,#9db3d3_1px,transparent_1px)] [background-size:56px_56px] [mask-image:linear-gradient(to_bottom,black,transparent_85%)]" />
        </div>

        <header className="relative z-20 flex h-16 shrink-0 items-center justify-between border-b border-white/70 bg-white/55 px-5 shadow-[0_1px_0_rgba(255,255,255,0.85)] backdrop-blur-2xl sm:h-20 sm:px-8 lg:px-12">
          <BrandWordmark tagline className="origin-left scale-[0.82] sm:scale-100" />
          <button
            type="button"
            onClick={closeModal}
            aria-label="Close partner programme"
            className="group inline-flex h-10 items-center gap-2 rounded-full bg-white/65 px-3 text-sm font-semibold text-ink-soft shadow-[0_8px_30px_-18px_rgba(7,26,61,0.45)] ring-1 ring-white/90 backdrop-blur-xl transition hover:bg-white hover:text-ink sm:h-11 sm:px-4"
          >
            <span className="hidden sm:inline">Continue browsing</span>
            <X className="h-5 w-5 transition-transform group-hover:rotate-90" aria-hidden="true" />
          </button>
        </header>

        <div className="relative mx-auto flex w-full max-w-[92rem] flex-1 flex-col items-center justify-center px-4 py-8 sm:px-8 sm:py-10 lg:px-12">
          <div className="pointer-events-none absolute inset-0 block" aria-hidden="true">
            {[
              { icon: Code2, className: "left-[1%] top-[10%] -rotate-12 md:left-[7%] md:top-[14%]", tone: "bg-slate-950 text-white" },
              { icon: Blocks, className: "right-[1%] top-[15%] rotate-12 md:right-[9%]", tone: "bg-blue-600 text-white" },
              { icon: Smartphone, className: "left-[1%] top-[45%] rotate-6 md:bottom-[17%] md:left-[10%] md:top-auto", tone: "bg-white/75 text-accent-deep" },
              { icon: Rocket, className: "right-[1%] top-[51%] -rotate-6 md:bottom-[14%] md:right-[11%] md:top-auto", tone: "bg-violet-600 text-white" },
            ].map((item, index) => (
              <div key={index} className={`absolute z-20 ${item.className} grid h-11 w-11 place-items-center rounded-xl ${item.tone} shadow-[0_24px_60px_-25px_rgba(7,26,61,0.6)] ring-1 ring-white/70 backdrop-blur-xl md:h-20 md:w-20 lg:h-24 lg:w-24`}>
                <item.icon className="h-5 w-5 md:h-8 md:w-8 lg:h-10 lg:w-10" strokeWidth={1.7} />
              </div>
            ))}
          </div>

          <div className="relative z-10 w-full max-w-[21rem] rounded-[10px] border border-white/85 bg-white/58 px-4 pb-5 pt-7 text-center shadow-[0_35px_100px_-45px_rgba(7,26,61,0.5)] backdrop-blur-2xl sm:max-w-2xl sm:px-10 sm:pb-9 sm:pt-10 lg:max-w-[46rem] lg:px-14 lg:pb-10">
            <div className="absolute left-1/2 top-0 grid h-14 w-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-2xl bg-white/80 text-accent-deep shadow-[0_16px_40px_-20px_rgba(7,26,61,0.6)] ring-1 ring-white backdrop-blur-xl sm:h-16 sm:w-16">
              <BadgePercent className="h-7 w-7 sm:h-8 sm:w-8" strokeWidth={1.8} aria-hidden="true" />
            </div>

            <p className="mt-2 text-[10px] font-extrabold uppercase tracking-[0.2em] text-accent-deep sm:text-xs">TechBro Partner Programme</p>
            <h2 id="partner-modal-title" className="mx-auto mt-3 max-w-xl font-display text-[1.75rem] font-extrabold leading-[1.08] tracking-[-0.04em] text-ink sm:text-5xl">
              Recommend great software. <span className="text-accent">Earn up to 30%.</span>
            </h2>
            <p id="partner-modal-description" className="mx-auto mt-4 max-w-lg text-sm leading-6 text-ink-soft sm:text-base sm:leading-7">
              Connect businesses with ready-to-launch TechBro products and receive your agreed share after every verified sale.
            </p>

            <div className="mx-auto mt-5 grid max-w-xl grid-cols-3 divide-x divide-white/80 overflow-hidden rounded-2xl bg-white/45 text-center ring-1 ring-white/90 sm:mt-6">
              {[
                { icon: Check, title: "Free to join" },
                { icon: IndianRupee, title: "Up to 30%" },
                { icon: ShieldCheck, title: "Clear tracking" },
              ].map((item) => (
                <div key={item.title} className="flex min-w-0 flex-col items-center gap-1.5 px-1.5 py-3 sm:flex-row sm:justify-center sm:gap-2 sm:px-3 sm:py-3.5">
                  <item.icon className="h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
                  <span className="text-[10px] font-bold leading-tight text-ink sm:text-xs">{item.title}</span>
                </div>
              ))}
            </div>

            <Link href="/partner-program" onClick={closeModal} className="btn-primary mt-5 h-[3.25rem] w-full text-[14px] font-bold sm:mt-6 sm:text-[15px]">
              Register as a partner <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
            </Link>
            <button type="button" onClick={closeModal} className="mt-3 text-xs font-semibold text-ink-faint transition hover:text-accent-deep">
              No thanks, continue exploring
            </button>
          </div>

          <div className="relative z-10 mt-6 grid w-full max-w-3xl grid-cols-3 gap-2 sm:mt-8 sm:gap-5" aria-label="Partner programme benefits">
            {[
              { icon: Check, title: "Curated products", text: "Easy to recommend" },
              { icon: ShieldCheck, title: "Verified sales", text: "Transparent process" },
              { icon: Rocket, title: "Fast onboarding", text: "Start in a few steps" },
            ].map((item) => (
              <div key={item.title} className="flex min-w-0 flex-col items-center text-center sm:flex-row sm:justify-center sm:gap-3 sm:text-left">
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/55 text-accent-deep ring-1 ring-white/90 backdrop-blur-md sm:h-9 sm:w-9">
                  <item.icon className="h-4 w-4" aria-hidden="true" />
                </div>
                <div className="mt-1.5 min-w-0 sm:mt-0">
                  <p className="truncate text-[10px] font-bold text-ink sm:text-xs">{item.title}</p>
                  <p className="hidden text-[10px] text-ink-faint sm:block">{item.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
