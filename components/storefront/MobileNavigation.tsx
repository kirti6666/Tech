"use client";

import Link from "next/link";
import { ChevronDown, Facebook, Instagram, Linkedin, Menu, Search, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { LogoutButton } from "./LogoutButton";
import { CartLink } from "./CartLink";
import { BrandWordmark } from "@/components/BrandWordmark";
import type { SiteSettingsData } from "@/lib/site-settings";
import { RESOURCE_LINKS } from "./resourceLinks";

interface MobileNavigationProps {
  links: { href: string; label: string }[];
  isAuthenticated: boolean;
  accountHref: string;
  accountLabel: string;
  social: SiteSettingsData["social"];
}

export function MobileNavigation({ links, isAuthenticated, accountHref, accountLabel, social }: MobileNavigationProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [resourcesOpen, setResourcesOpen] = useState(false);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    window.addEventListener("keydown", handleEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  const socials = [
    { href: social.instagram, label: "Instagram", Icon: Instagram },
    { href: social.facebook, label: "Facebook", Icon: Facebook },
    { href: social.linkedin, label: "LinkedIn", Icon: Linkedin },
  ].filter((item) => item.href.trim());

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const query = search.trim();
    setOpen(false);
    router.push(query ? `/shop?q=${encodeURIComponent(query)}` : "/shop");
  }

  return (
    <div className="justify-self-start lg:hidden">
      <button type="button" onClick={() => setOpen(true)} className="grid h-10 w-10 place-items-center rounded-lg text-ink" aria-label="Open navigation menu" aria-expanded={open}>
        <Menu className="h-[22px] w-[22px]" aria-hidden="true" />
      </button>

      {open && createPortal(
        <div className="fixed inset-0 z-[95] overflow-y-auto bg-[#fbfaf7]" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) setOpen(false); }}>
          <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
            <div className="absolute inset-x-0 top-0 h-56 bg-gradient-to-b from-white to-transparent" />
            <div className="absolute -bottom-44 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-slate-200/35 blur-[110px]" />
          </div>

          <div className="relative mx-auto flex min-h-[100svh] w-full max-w-xl flex-col px-5 pb-6 pt-3 sm:px-8">
            <div className="grid grid-cols-[2.75rem_1fr_2.75rem] items-center pb-5">
              <button type="button" onClick={() => setOpen(false)} className="grid h-10 w-10 place-items-center rounded-lg text-ink" aria-label="Close navigation menu">
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
              <div className="justify-self-center"><BrandWordmark tagline /></div>
              <div className="justify-self-end"><CartLink variant="icon" /></div>
            </div>

            <form onSubmit={submitSearch} role="search" className="relative">
              <Search className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-faint" aria-hidden="true" />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search products"
                aria-label="Search products"
                className="h-14 w-full rounded-full border-0 bg-[#ebecef] pl-14 pr-5 text-base text-ink outline-none ring-1 ring-transparent transition placeholder:text-ink-ghost focus:bg-white focus:ring-accent/30"
              />
            </form>

            <nav className="py-8" aria-label="Mobile navigation">
              <div className="space-y-1">
                {links.map((link) => (
                  <div key={link.href}>
                    <Link href={link.href} onClick={() => setOpen(false)} className="block rounded-xl px-1 py-3.5 text-lg font-medium text-ink">{link.label}</Link>
                    {link.href === "/shop" && <div className="border-y border-slate-200/80 py-1">
                      <button type="button" onClick={() => setResourcesOpen((current) => !current)} aria-expanded={resourcesOpen} className="flex w-full items-center justify-between rounded-xl px-1 py-3.5 text-left text-lg font-medium text-ink">
                        Resources <ChevronDown className={`h-4 w-4 transition-transform ${resourcesOpen ? "rotate-180" : ""}`} aria-hidden="true" />
                      </button>
                      {resourcesOpen && <div className="mb-2 overflow-hidden rounded-xl bg-white p-1 ring-1 ring-slate-200">
                        {RESOURCE_LINKS.map(({ href, label }) => <Link key={href} href={href} onClick={() => setOpen(false)} className="block rounded-lg px-4 py-2.5 text-sm font-medium text-ink">{label}</Link>)}
                      </div>}
                    </div>}
                  </div>
                ))}
                {isAuthenticated && <Link href={accountHref} onClick={() => setOpen(false)} className="block rounded-xl px-1 py-3.5 text-lg font-medium text-ink">{accountLabel}</Link>}
              </div>
            </nav>

            <div className="mt-auto">
              {isAuthenticated ? (
                <div onClick={() => setOpen(false)}><LogoutButton className="h-12 w-full rounded-lg border-2 border-ink bg-transparent text-sm font-bold text-ink" /></div>
              ) : (
                <Link href="/login" onClick={() => setOpen(false)} className="flex h-12 w-full items-center justify-center rounded-lg border-2 border-ink bg-transparent text-sm font-bold text-ink">Log in</Link>
              )}
              <div className="mt-5 flex items-center justify-center gap-3 border-t border-slate-200/80 pt-5">
                <p className="mr-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-faint">Follow</p>
                <div className="flex gap-2">
                  {socials.length ? socials.map(({ href, label, Icon }) => (
                    <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label} className="grid h-9 w-9 place-items-center rounded-full bg-slate-50 text-accent-deep ring-1 ring-slate-200">
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </a>
                  )) : <span className="text-[10px] text-ink-ghost">Social links coming soon</span>}
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
