"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { LogoutButton } from "./LogoutButton";

interface MobileNavigationProps {
  links: { href: string; label: string }[];
  isAuthenticated: boolean;
  accountHref: string;
  accountLabel: string;
}

export function MobileNavigation({ links, isAuthenticated, accountHref, accountLabel }: MobileNavigationProps) {
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const pathname = usePathname();

  function closeMenu() {
    if (detailsRef.current) detailsRef.current.open = false;
  }

  useEffect(() => {
    if (detailsRef.current) detailsRef.current.open = false;
  }, [pathname]);

  useEffect(() => {
    function handleOutsideTap(event: PointerEvent) {
      const menu = detailsRef.current;
      if (menu?.open && !menu.contains(event.target as Node)) {
        menu.open = false;
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") closeMenu();
    }

    document.addEventListener("pointerdown", handleOutsideTap);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("pointerdown", handleOutsideTap);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <details ref={detailsRef} className="group relative justify-self-start lg:hidden">
      <summary className="grid h-10 w-10 cursor-pointer list-none place-items-center rounded-lg text-ink transition hover:bg-accent-mist [&::-webkit-details-marker]:hidden" aria-label="Open navigation menu">
        <Menu className="h-[22px] w-[22px]" aria-hidden="true" />
      </summary>
      <nav className="absolute left-0 top-12 w-56 rounded-xl bg-white p-2 shadow-lift ring-1 ring-rule" aria-label="Mobile navigation">
        {links.map((link) => (
          <Link key={link.href} href={link.href} onClick={closeMenu} className="block rounded-lg px-4 py-3 text-sm font-semibold text-ink hover:bg-accent-mist">
            {link.label}
          </Link>
        ))}
        {isAuthenticated ? (
          <>
            <Link href={accountHref} onClick={closeMenu} className="block rounded-lg px-4 py-3 text-sm font-semibold text-ink hover:bg-accent-mist">{accountLabel}</Link>
            <div className="px-4 py-2" onClick={closeMenu}><LogoutButton /></div>
          </>
        ) : (
          <Link href="/login" onClick={closeMenu} className="mt-1 block rounded-lg bg-accent-cta px-4 py-3 text-center text-sm font-semibold text-white">Login</Link>
        )}
      </nav>
    </details>
  );
}
