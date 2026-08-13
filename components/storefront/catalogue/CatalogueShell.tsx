"use client";

import { useState } from "react";
import { FilterPanel } from "./FilterPanel";
import { CatalogueToolbar } from "./CatalogueToolbar";
import type { CatalogueParams } from "@/lib/catalogue";
import type { TechCategory } from "@/types/catalog";
import { SlidersHorizontal, X } from "lucide-react";

interface TaxonomyItem {
  _id: string;
  name: string;
  slug: string;
  productCount: number;
}

/**
 * Holds the one piece of genuinely local UI state on the catalogue: whether
 * the mobile filter drawer is open. Everything else is in the URL.
 *
 * On desktop the panel is a static left rail; below lg it becomes a drawer
 * so the grid gets the full width on a phone. Same component both times —
 * a second mobile-only copy of the filters is how the two drift apart.
 */
export function CatalogueShell({
  industries,
  technologies,
  params,
  total,
  labels,
  locked,
  children,
}: {
  industries: TaxonomyItem[];
  technologies: (TaxonomyItem & { category: TechCategory })[];
  params: CatalogueParams;
  total: number;
  labels: { industries: Record<string, string>; technologies: Record<string, string> };
  locked?: { industry?: boolean; tech?: boolean };
  children: React.ReactNode;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const panel = (
    <FilterPanel
      industries={industries}
      technologies={technologies}
      params={params}
      locked={locked}
    />
  );

  return (
    <div className="grid gap-4 sm:gap-8 lg:grid-cols-[17rem_1fr]">
      <aside className="hidden lg:block">
        <div className="sticky top-6">{panel}</div>
      </aside>

      <div className="min-w-0">
        <CatalogueToolbar
          params={params}
          total={total}
          labels={labels}
          locked={locked}
          onOpenFilters={() => setDrawerOpen(true)}
        />
        <div className="mt-4 sm:mt-6">{children}</div>
      </div>

      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <button
            type="button"
            aria-label="Dismiss filter panel"
            onClick={() => setDrawerOpen(false)}
            className="absolute inset-0 bg-ink/50 backdrop-blur-[2px]"
          />
          <div className="absolute inset-y-0 right-0 flex w-[92%] max-w-md flex-col bg-paper shadow-2xl">
            <header className="flex items-center justify-between border-b border-rule bg-white px-4 py-3 sm:px-5 sm:py-4">
              <div className="flex items-center gap-2.5 sm:gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-accent-mist text-accent-deep sm:h-10 sm:w-10"><SlidersHorizontal size={18} /></span><div><h2 className="font-display text-base font-bold text-ink sm:text-lg">Find the right product</h2><p className="text-[11px] text-ink-faint sm:text-xs">Category, stack and budget</p></div></div>
              <button type="button" onClick={() => setDrawerOpen(false)} aria-label="Close filters" className="grid h-10 w-10 place-items-center rounded-full text-ink-soft hover:bg-paper-alt"><X size={20} /></button>
            </header>
            <div className="min-h-0 flex-1 overflow-y-auto bg-paper-alt/40 p-4">{panel}</div>
            <footer className="border-t border-rule bg-white p-4">
              <button type="button" onClick={() => setDrawerOpen(false)} className="btn-primary w-full rounded-xl py-3">Show {total} {total === 1 ? "product" : "products"}</button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}
