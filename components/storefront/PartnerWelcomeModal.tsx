"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, BadgePercent, Check, ShieldCheck, X } from "lucide-react";
import { usePathname } from "next/navigation";

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
    <div className="fixed inset-0 z-[70] grid place-items-center overflow-y-auto bg-accent-deep/65 p-3 backdrop-blur-[5px] sm:p-6" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) closeModal(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="partner-modal-title" aria-describedby="partner-modal-description" className="relative my-auto w-full max-w-lg overflow-hidden rounded-[1.75rem] bg-white shadow-[0_28px_90px_rgba(3,14,36,0.38)] ring-1 ring-white/30">
        <div className="h-1.5 bg-gradient-to-r from-accent-deep via-blue-500 to-accent" />
        <button type="button" onClick={closeModal} aria-label="Close partner registration" className="absolute right-3 top-4 grid h-9 w-9 place-items-center rounded-full bg-paper-alt text-ink-soft ring-1 ring-rule transition hover:bg-accent-wash hover:text-accent-deep sm:right-4">
          <X className="h-4.5 w-4.5" aria-hidden="true" />
        </button>
        <div className="px-5 pb-7 pt-7 text-center sm:px-9 sm:pb-9 sm:pt-9">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-accent-mist text-accent-deep shadow-card ring-1 ring-rule">
            <BadgePercent className="h-7 w-7" strokeWidth={2.2} aria-hidden="true" />
          </div>
          <p className="mt-5 text-[11px] font-extrabold uppercase tracking-[0.16em] text-accent-deep">TechBro Partner Programme</p>
          <h2 id="partner-modal-title" className="mx-auto mt-2 max-w-md font-sans text-[1.75rem] font-extrabold leading-tight tracking-tight text-ink sm:text-4xl">
            Register yourself as a partner and get <span className="text-accent">30% off</span>
          </h2>
          <p id="partner-modal-description" className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-ink-soft sm:text-[15px]">
            Bring clients, recommend TechBro products and earn your agreed share on successful sales.
          </p>
          <div className="mx-auto mt-5 flex max-w-sm flex-wrap justify-center gap-x-4 gap-y-2 text-xs font-semibold text-ink-soft">
            <span className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-accent" />Free to apply</span>
            <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-accent" />Transparent rewards</span>
          </div>
          <Link href="/partner-program" onClick={closeModal} className="btn-primary mt-6 h-12 w-full text-sm font-bold">
            Register as a partner <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
          </Link>
          <p className="mt-4 text-[10px] leading-relaxed text-ink-faint sm:text-[11px]">Complete the short application so our team can understand how you want to work with TechBro.</p>
        </div>
      </section>
    </div>
  );
}
