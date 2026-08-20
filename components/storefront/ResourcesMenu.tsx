"use client";

import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { RESOURCE_LINKS } from "./resourceLinks";

export function ResourcesMenu() {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function close(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setOpen(false);
    }
    function escape(event: KeyboardEvent) { if (event.key === "Escape") setOpen(false); }
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("mousedown", close); document.removeEventListener("keydown", escape); };
  }, [open]);

  return <div ref={menuRef} className="relative">
    <button type="button" onClick={() => setOpen((current) => !current)} aria-expanded={open} aria-haspopup="menu" className="inline-flex items-center gap-1 py-2">
      Resources <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden="true" />
    </button>
    {open && <div role="menu" className="absolute left-1/2 top-[calc(100%+.55rem)] w-40 -translate-x-1/2 overflow-hidden rounded-xl border border-rule bg-white p-1.5 shadow-lift">
      {RESOURCE_LINKS.map(({ href, label }) => <Link key={href} role="menuitem" href={href} onClick={() => setOpen(false)} className="block rounded-lg px-3 py-2.5 text-sm font-semibold text-ink">
        {label}
      </Link>)}
    </div>}
  </div>;
}
