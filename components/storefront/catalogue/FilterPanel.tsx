"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { PLATFORMS, PLATFORM_LABELS, TECH_CATEGORY_LABELS } from "@/types/catalog";
import type { TechCategory } from "@/types/catalog";
import type { CatalogueParams } from "@/lib/catalogue";

interface TaxonomyItem {
  _id: string;
  name: string;
  slug: string;
  productCount: number;
}

interface TechItem extends TaxonomyItem {
  category: TechCategory;
}

interface FilterPanelProps {
  industries: TaxonomyItem[];
  technologies: TechItem[];
  params: CatalogueParams;
  /** Set on the SEO landing pages, where that facet comes from the route. */
  locked?: { industry?: boolean; tech?: boolean };
}

/**
 * All filter state lives in the URL, never in component state.
 *
 * That is the whole design: a filtered catalogue is a shareable link, the
 * back button steps through filter changes, and the server component
 * re-renders from searchParams with no client-side data fetching. The only
 * local state here is the price inputs, which are uncommitted until Apply —
 * pushing a route on every keystroke of "50000" would fire five navigations
 * and four of them for prices the buyer never meant.
 */
export function FilterPanel({
  industries,
  technologies,
  params,
  locked,
}: FilterPanelProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [minPrice, setMinPrice] = useState(params.minPrice?.toString() ?? "");
  const [maxPrice, setMaxPrice] = useState(params.maxPrice?.toString() ?? "");

  const techByCategory = useMemo(() => {
    const groups = new Map<TechCategory, TechItem[]>();
    for (const tech of technologies) {
      const list = groups.get(tech.category) ?? [];
      list.push(tech);
      groups.set(tech.category, list);
    }
    return groups;
  }, [technologies]);

  function commit(mutate: (next: URLSearchParams) => void) {
    const next = new URLSearchParams(searchParams.toString());
    mutate(next);
    // Any filter change invalidates the current page number.
    next.delete("page");
    const qs = next.toString();
    startTransition(() => {
      router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    });
  }

  function toggleInList(key: "tech" | "platform", value: string) {
    commit((next) => {
      const current = (next.get(key) ?? "").split(",").filter(Boolean);
      const updated = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      if (updated.length) next.set(key, updated.join(","));
      else next.delete(key);
    });
  }

  function setSingle(key: string, value: string) {
    commit((next) => {
      if (value) next.set(key, value);
      else next.delete(key);
    });
  }

  function applyPrice() {
    commit((next) => {
      if (minPrice.trim()) next.set("min", minPrice.trim());
      else next.delete("min");
      if (maxPrice.trim()) next.set("max", maxPrice.trim());
      else next.delete("max");
    });
  }

  function clearAll() {
    setMinPrice("");
    setMaxPrice("");
    commit((next) => {
      for (const key of ["q", "industry", "tech", "platform", "min", "max"]) {
        next.delete(key);
      }
    });
  }

  return (
    <div
      id="catalogue-filters"
      className={`overflow-hidden rounded-2xl border border-rule bg-white shadow-card ${isPending ? "pointer-events-none opacity-60 transition-opacity" : ""}`}
      aria-busy={isPending}
    >
      <div className="flex items-center justify-between border-b border-rule bg-paper-alt/70 px-4 py-3.5">
        <div><h2 className="font-display text-base font-bold text-ink">Filter products</h2><p className="mt-0.5 text-[11px] text-ink-faint">Refine the catalogue</p></div>
        <button
          type="button"
          onClick={clearAll}
          className="rounded-lg px-2 py-1 text-xs font-bold text-accent-deep hover:bg-accent-mist"
        >
          Clear all
        </button>
      </div>

      <div className="divide-y divide-rule-soft px-4">
      {!locked?.industry && (
        <Section title="Industry">
          <ul className="space-y-1">
            <li>
              <FacetButton
                selected={!params.industry}
                onClick={() => setSingle("industry", "")}
                label="All industries"
              />
            </li>
            {industries.map((industry) => (
              <li key={industry._id}>
                <FacetButton
                  selected={params.industry === industry.slug}
                  onClick={() =>
                    setSingle(
                      "industry",
                      params.industry === industry.slug ? "" : industry.slug
                    )
                  }
                  label={industry.name}
                  count={industry.productCount}
                />
              </li>
            ))}
          </ul>
        </Section>
      )}

      <Section title="Platform">
        <ul className="space-y-1.5">
          {PLATFORMS.map((platform) => (
            <li key={platform}>
              <CheckboxRow
                checked={params.platform.includes(platform)}
                onChange={() => toggleInList("platform", platform)}
                label={PLATFORM_LABELS[platform]}
              />
            </li>
          ))}
        </ul>
      </Section>

      {!locked?.tech && (
        <Section title="Technology">
          <div className="space-y-4">
            {Array.from(techByCategory.entries()).map(([category, items]) => (
              <div key={category}>
                <p className="label-muted mb-1.5">
                  {TECH_CATEGORY_LABELS[category]}
                </p>
                <ul className="space-y-1.5">
                  {items.map((tech) => (
                    <li key={tech._id}>
                      <CheckboxRow
                        checked={params.tech.includes(tech.slug)}
                        onChange={() => toggleInList("tech", tech.slug)}
                        label={tech.name}
                        count={tech.productCount}
                      />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Section>
      )}

      <Section title="Price">
        <div className="flex items-center gap-2">
          <input
            type="number"
            inputMode="numeric"
            min={0}
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && applyPrice()}
            placeholder="Min"
            aria-label="Minimum price in rupees"
            className="min-w-0 w-full rounded-lg border border-rule bg-paper px-2.5 py-2 tabular text-sm outline-none placeholder:text-ink-faint focus:border-accent focus:ring-2 focus:ring-accent/10"
          />
          <span aria-hidden className="text-ink-faint">
            –
          </span>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && applyPrice()}
            placeholder="Max"
            aria-label="Maximum price in rupees"
            className="min-w-0 w-full rounded-lg border border-rule bg-paper px-2.5 py-2 tabular text-sm outline-none placeholder:text-ink-faint focus:border-accent focus:ring-2 focus:ring-accent/10"
          />
        </div>
        <button
          type="button"
          onClick={applyPrice}
          className="btn-primary mt-3 w-full rounded-lg"
        >
          Apply
        </button>
      </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <details open className="group py-1">
      <summary className="flex cursor-pointer list-none items-center justify-between py-3 text-sm font-bold text-ink marker:hidden">
        {title}
        <span className="text-xs text-ink-faint transition group-open:rotate-180" aria-hidden>⌄</span>
      </summary>
      <div className="pb-4">{children}</div>
    </details>
  );
}

function FacetButton({
  selected,
  onClick,
  label,
  count,
}: {
  selected: boolean;
  onClick: () => void;
  label: string;
  count?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition ${
        selected ? "bg-accent-mist font-bold text-accent-deep" : "text-ink-soft hover:bg-paper-alt hover:text-ink"
      }`}
    >
      <span>{label}</span>
      {count !== undefined && (
        <span className="tabular text-xs text-ink-faint tabular">{count}</span>
      )}
    </button>
  );
}

function CheckboxRow({
  checked,
  onChange,
  label,
  count,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
  count?: number;
}) {
  return (
    <label className={`flex cursor-pointer items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-sm transition ${checked ? "bg-accent-mist font-semibold text-accent-deep" : "text-ink-soft hover:bg-paper-alt hover:text-ink"}`}>
      <span className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={checked}
          onChange={onChange}
          className="h-4 w-4 shrink-0 rounded accent-accent-deep"
        />
        {label}
      </span>
      {count !== undefined && (
        <span className="tabular text-xs text-ink-faint tabular">{count}</span>
      )}
    </label>
  );
}
