"use client";

import { MessageCircle } from "lucide-react";
import { usePathname } from "next/navigation";

/**
 * A small, standard WhatsApp contact affordance. The phone number is kept in
 * an environment variable so deployments can change it without touching UI
 * code. It is intentionally hidden in the admin panel and when unconfigured.
 */
export function WhatsAppButton() {
  const pathname = usePathname();
  const number = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "").replace(/\D/g, "");
  const message =
    process.env.NEXT_PUBLIC_WHATSAPP_MESSAGE ??
    "Hi TechBro, I would like to know more about your software products.";

  if (!number || pathname.startsWith("/admin")) return null;

  const href = `https://wa.me/${number}?text=${encodeURIComponent(message)}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with TechBro on WhatsApp"
      className="group fixed bottom-5 right-4 z-40 inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#25D366] px-3.5 text-white shadow-[0_10px_30px_rgba(21,94,54,0.28)] ring-1 ring-black/5 transition hover:-translate-y-0.5 hover:bg-[#20bd5a] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#128C7E] focus-visible:ring-offset-2 sm:bottom-6 sm:right-6 sm:h-13 sm:px-4"
    >
      <MessageCircle size={22} strokeWidth={2.2} aria-hidden="true" />
      <span className="hidden text-sm font-bold sm:inline">WhatsApp</span>
    </a>
  );
}
