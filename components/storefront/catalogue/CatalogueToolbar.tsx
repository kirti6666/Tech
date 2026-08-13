"use client";

import { useState, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { ArrowUpDown, Search, SlidersHorizontal, X } from "lucide-react";
import { PLATFORM_LABELS, SORT_OPTIONS } from "@/types/catalog";
import type { CatalogueParams } from "@/lib/catalogue";
import { formatPrice } from "@/lib/price";

interface CatalogueToolbarProps {
  params: CatalogueParams;
  total: number;
  labels: { industries: Record<string, string>; technologies: Record<string, string> };
  locked?: { industry?: boolean; tech?: boolean };
  onOpenFilters?: () => void;
}

export function CatalogueToolbar({ params, total, labels, locked, onOpenFilters }: CatalogueToolbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [query, setQuery] = useState(params.q ?? "");

  function commit(mutate: (next: URLSearchParams) => void) {
    const next = new URLSearchParams(searchParams.toString());
    mutate(next);
    next.delete("page");
    const qs = next.toString();
    startTransition(() => router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
  }
  function submitSearch(event: React.FormEvent) {
    event.preventDefault();
    commit((next) => query.trim() ? next.set("q", query.trim()) : next.delete("q"));
  }
  function removeFromList(key: "tech" | "platform", value: string) {
    commit((next) => {
      const remaining = (next.get(key) ?? "").split(",").filter((item) => item && item !== value);
      remaining.length ? next.set(key, remaining.join(",")) : next.delete(key);
    });
  }
  function removeKeys(...keys: string[]) { commit((next) => keys.forEach((key) => next.delete(key))); }

  const chips: { key: string; label: string; onRemove: () => void }[] = [];
  if (params.q) chips.push({ key: "q", label: `“${params.q}”`, onRemove: () => { setQuery(""); removeKeys("q"); } });
  if (params.industry && !locked?.industry) chips.push({ key: "industry", label: labels.industries[params.industry] ?? params.industry, onRemove: () => removeKeys("industry") });
  if (!locked?.tech) for (const slug of params.tech) chips.push({ key: `tech-${slug}`, label: labels.technologies[slug] ?? slug, onRemove: () => removeFromList("tech", slug) });
  for (const platform of params.platform) chips.push({ key: `platform-${platform}`, label: PLATFORM_LABELS[platform], onRemove: () => removeFromList("platform", platform) });
  if (params.minPrice !== undefined || params.maxPrice !== undefined) {
    const from = params.minPrice !== undefined ? formatPrice(params.minPrice) : "Any";
    const to = params.maxPrice !== undefined ? formatPrice(params.maxPrice) : "Any";
    chips.push({ key: "price", label: `${from} – ${to}`, onRemove: () => removeKeys("min", "max") });
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="rounded-xl border border-rule bg-white p-2 shadow-card sm:rounded-2xl sm:p-3">
        <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:gap-2.5">
          <form onSubmit={submitSearch} className="col-span-2 flex min-w-0 flex-1 items-center rounded-xl border border-rule bg-paper-alt/50 focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/10">
            <Search className="ml-2.5 h-4 w-4 shrink-0 text-accent-deep sm:ml-3" aria-hidden="true" />
            <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search products" aria-label="Search products" className="min-w-0 flex-1 border-0 bg-transparent px-1.5 py-2.5 text-[13px] text-ink outline-none placeholder:text-ink-faint sm:px-2.5 sm:py-3 sm:text-sm" />
            <button type="submit" aria-label="Search products" className="mr-1 shrink-0 rounded-lg bg-ink px-3 py-1.5 text-xs font-bold text-white transition hover:bg-accent-deep sm:px-4 sm:py-2 sm:text-sm"><span className="sm:hidden">Go</span><span className="hidden sm:inline">Search</span></button>
          </form>
          {onOpenFilters && <button type="button" onClick={onOpenFilters} className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl border border-accent/30 bg-accent-mist px-3 text-xs font-bold text-accent-deep sm:min-h-11 sm:gap-2 sm:px-4 sm:text-sm lg:hidden"><SlidersHorizontal size={15} /> Filters{chips.length ? ` (${chips.length})` : ""}</button>}
          <label className="flex min-h-10 min-w-0 items-center gap-1.5 rounded-xl border border-rule bg-white px-2.5 sm:min-h-11 sm:gap-2 sm:px-3">
            <ArrowUpDown size={15} className="text-ink-faint" aria-hidden="true" /><span className="sr-only">Sort products</span>
            <select value={params.sort} onChange={(event) => commit((next) => event.target.value === "newest" ? next.delete("sort") : next.set("sort", event.target.value))} className="min-w-0 w-full border-0 bg-transparent py-2 text-xs font-semibold text-ink outline-none sm:text-sm">
              {SORT_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
        </div>
      </div>

      <div className="flex min-h-7 flex-wrap items-center gap-1.5 border-b border-rule pb-2 sm:min-h-9 sm:gap-2 sm:pb-3">
        <p className="text-label font-medium uppercase tracking-[0.06em] text-ink-faint tabular" aria-live="polite">{isPending ? "Updating…" : `${total} ${total === 1 ? "product" : "products"}`}</p>
        {chips.map((chip) => <button key={chip.key} type="button" onClick={chip.onRemove} className="inline-flex items-center gap-1.5 rounded-full border border-accent/20 bg-accent-mist px-3 py-1.5 text-xs font-semibold text-accent-deep transition hover:border-accent">{chip.label}<X size={13} aria-hidden="true" /><span className="sr-only">Remove filter</span></button>)}
      </div>
    </div>
  );
}
