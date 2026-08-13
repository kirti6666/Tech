"use client";

import { useRef, useState } from "react";
import { ChevronDown, Search, SlidersHorizontal, X } from "lucide-react";

const INDUSTRIES = [
  ["fintech", "FinTech"],
  ["edtech", "Education"],
  ["healthcare", "Healthcare"],
  ["e-commerce", "Retail & E-commerce"],
  ["real-estate", "Real Estate"],
  ["food-restaurant", "Food & Restaurant"],
  ["hr-recruitment", "HR & Recruitment"],
] as const;

export function HomeCatalogueSearch() {
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  function resetFilters() {
    const form = formRef.current;
    if (!form) return;
    for (const name of ["industry", "platform", "min", "max", "sort"]) {
      const field = form.elements.namedItem(name) as HTMLInputElement | HTMLSelectElement | null;
      if (field) field.value = name === "sort" ? "newest" : "";
    }
  }

  return (
    <form ref={formRef} action="/shop" method="get" className="relative mx-auto max-w-4xl">
      <div className="flex items-center gap-2 rounded-2xl border border-violet-200 bg-white p-2 shadow-[0_16px_45px_rgba(76,29,149,0.12)] sm:p-2.5">
        <Search className="ml-2 h-5 w-5 shrink-0 text-accent-deep" aria-hidden="true" />
        <input name="q" type="search" placeholder="Search websites, apps or business software" aria-label="Search products" className="min-w-0 flex-1 border-0 bg-transparent px-1 py-2.5 text-sm text-ink outline-none placeholder:text-ink-faint sm:text-base" />
        <button type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} className={`hidden min-h-11 items-center gap-2 rounded-xl border px-4 text-sm font-bold transition sm:inline-flex ${open ? "border-accent bg-accent-mist text-accent-deep" : "border-rule bg-white text-ink hover:border-accent"}`}>
          <SlidersHorizontal size={17} /> Filters <ChevronDown size={15} className={open ? "rotate-180 transition" : "transition"} />
        </button>
        <button type="submit" className="btn-primary min-h-11 rounded-xl px-4 sm:px-6">Search</button>
      </div>

      <button type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} className="mx-auto mt-2 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold text-accent-deep sm:hidden"><SlidersHorizontal size={14} /> Refine search</button>

      {open && (
        <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-30 rounded-2xl border border-rule bg-white p-4 text-left shadow-[0_22px_60px_rgba(31,38,78,0.18)] sm:p-5">
          <div className="flex items-center justify-between border-b border-rule-soft pb-3">
            <div><p className="text-sm font-bold text-ink">Refine your search</p><p className="mt-0.5 text-xs text-ink-faint">Choose only what matters to you.</p></div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close filters" className="grid h-9 w-9 place-items-center rounded-full text-ink-soft hover:bg-paper-alt"><X size={18} /></button>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <label className="block"><span className="label-muted">Industry</span><select name="industry" className="field mt-1.5"><option value="">All industries</option>{INDUSTRIES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
            <label className="block"><span className="label-muted">Platform</span><select name="platform" className="field mt-1.5"><option value="">Any platform</option><option value="web">Web</option><option value="android">Android</option><option value="ios">iOS</option><option value="web_app">Web + App</option></select></label>
            <label className="block"><span className="label-muted">Minimum price</span><input name="min" type="number" min="0" placeholder="₹0" className="field mt-1.5" /></label>
            <label className="block"><span className="label-muted">Maximum price</span><input name="max" type="number" min="0" placeholder="Any price" className="field mt-1.5" /></label>
          </div>
          <input type="hidden" name="sort" value="newest" />
          <div className="mt-5 flex items-center justify-end gap-3 border-t border-rule-soft pt-4"><button type="button" onClick={resetFilters} className="btn-quiet">Clear filters</button><button type="submit" className="btn-primary rounded-xl px-6">View matching products</button></div>
        </div>
      )}
    </form>
  );
}
